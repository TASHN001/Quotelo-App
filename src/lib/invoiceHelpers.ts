import type { InvoiceData, InvoiceDraft, Business, Address, Client } from './types';
import { getCurrentDate, formatDate as formatDateUtil, addDays as addDaysUtil } from './dateUtils';

function formatBusinessAddress(business: Business): Address | undefined {
  const address: Address = {};

  if (business.address_line1 || business.address_line2) {
    const parts = [business.address_line1, business.address_line2].filter(Boolean);
    address.street = parts.join(', ');
  }

  if (business.city) address.city = business.city;
  if (business.postal_code) address.postalCode = business.postal_code;
  if (business.country) address.country = business.country;

  return Object.keys(address).length > 0 ? address : undefined;
}

function parseClientAddress(addressString?: string): Address | undefined {
  if (!addressString) return undefined;

  // Try to parse structured address from billing_address field
  const addressParts = addressString.split(',').map(s => s.trim());

  if (addressParts.length === 1) {
    return { street: addressString };
  }

  // Attempt to structure: street, city, postal code, country
  const address: Address = {};

  if (addressParts.length >= 1) {
    address.street = addressParts[0];
  }
  if (addressParts.length >= 2) {
    address.city = addressParts[1];
  }
  if (addressParts.length >= 3) {
    address.postalCode = addressParts[2];
  }
  if (addressParts.length >= 4) {
    address.country = addressParts.slice(3).join(', ');
  }

  return address;
}


export function normalizeInvoiceDraft(
  draft: InvoiceDraft | null,
  business: Business | null,
  signatureDataUrl?: string,
  invoiceNumber?: string,
  selectedClient?: Client | null
): InvoiceData {
  const today = getCurrentDate();
  const issueDate = draft?.issueDate ? new Date(draft.issueDate) : today;
  const dueDate = draft?.dueDate ? new Date(draft.dueDate) : addDaysUtil(issueDate, 7);

  const items = (draft?.items || []).map(item => ({
    description: item.description || 'Item',
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice || 0,
    total: item.total || (item.quantity || 1) * (item.unitPrice || 0)
  }));

  const subtotal = draft?.subtotal || items.reduce((sum, item) => sum + item.total, 0);
  const tax = draft?.tax || 0;
  const total = draft?.total || subtotal + tax;

  const paymentDetails = business && (business.bank_name || business.bank_account_number || business.bank_swift_code)
    ? {
        bankName: business.bank_name,
        accountNumber: business.bank_account_number,
        swiftCode: business.bank_swift_code
      }
    : undefined;

  // Use selectedClient data if available, otherwise fall back to draft data
  const clientName = selectedClient?.name || draft?.client?.name || 'Client';
  const clientEmail = selectedClient?.email || draft?.client?.email || '';
  const clientPhone = selectedClient?.phone;
  const clientAddress = selectedClient?.billing_address;
  const clientTaxNumber = selectedClient?.tax_number;

  return {
    documentType: (draft?.documentType as 'Invoice' | 'Quote' | 'Receipt') || 'Invoice',
    business: {
      name: business?.business_name || 'Your Business',
      email: business?.email || '',
      phone: business?.phone,
      address: formatBusinessAddress(business || {} as Business),
      logoUrl: business?.logo_url,
      registrationNumber: business?.business_registration_number,
      taxNumber: business?.vat_tax_number || business?.tax_number,
      vatNumber: business?.vat_number,
      country: business?.country
    },
    client: {
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      address: parseClientAddress(clientAddress),
      taxNumber: clientTaxNumber
    },
    invoice: {
      number: invoiceNumber || 'DRAFT',
      issueDate: formatDateUtil(issueDate),
      dueDate: formatDateUtil(dueDate)
    },
    items,
    totals: {
      subtotal,
      tax,
      total
    },
    currency: selectedClient?.client_currency || business?.default_currency,
    notes: draft?.notes || undefined,
    paymentDetails,
    paymentInstructions: business?.payment_instructions,
    paymentTerms: {
      dueType: 'net_30',
      latePaymentNotice: 'Late payments may incur fees or result in service suspension.'
    },
    footer: 'Thank you for your business!',
    signatureDataUrl
  };
}

export function normalizeDocumentData(
  documentNumber: string,
  issueDate: string,
  dueDate: string,
  clientName: string,
  clientEmail: string,
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>,
  subtotal: number,
  tax: number,
  total: number,
  notes: string | undefined,
  business: Business | null,
  signatureDataUrl?: string,
  clientAddress?: string,
  clientPhone?: string,
  reference?: string,
  paymentDetails?: string,
  paymentTerms?: string,
  footerMessage?: string,
  currency?: string,
  documentType?: 'Invoice' | 'Quote' | 'Receipt',
  customLogoUrl?: string
): InvoiceData {
  let parsedPaymentDetails;
  try {
    parsedPaymentDetails = paymentDetails ? JSON.parse(paymentDetails) : undefined;
  } catch {
    parsedPaymentDetails = undefined;
  }

  if (!parsedPaymentDetails && business && (business.bank_name || business.bank_account_number || business.bank_swift_code)) {
    parsedPaymentDetails = {
      bankName: business.bank_name,
      accountNumber: business.bank_account_number,
      swiftCode: business.bank_swift_code
    };
  }

  let parsedPaymentTerms;
  try {
    parsedPaymentTerms = paymentTerms ? JSON.parse(paymentTerms) : undefined;
  } catch {
    parsedPaymentTerms = undefined;
  }

  return {
    documentType: documentType || 'Invoice',
    business: {
      name: business?.business_name || 'Your Business',
      email: business?.email || '',
      phone: business?.phone,
      address: formatBusinessAddress(business || {} as Business),
      logoUrl: customLogoUrl || business?.logo_url,
      registrationNumber: business?.business_registration_number,
      taxNumber: business?.vat_tax_number || business?.tax_number,
      vatNumber: business?.vat_number,
      country: business?.country
    },
    client: {
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      address: parseClientAddress(clientAddress)
    },
    invoice: {
      number: documentNumber,
      issueDate: formatDateUtil(issueDate),
      dueDate: formatDateUtil(dueDate),
      reference
    },
    items,
    totals: {
      subtotal,
      tax,
      total
    },
    currency: currency || business?.default_currency,
    notes,
    paymentDetails: parsedPaymentDetails,
    paymentInstructions: business?.payment_instructions,
    paymentTerms: parsedPaymentTerms || {
      dueType: 'net_30',
      latePaymentNotice: 'Late payments may incur fees or result in service suspension.'
    },
    footer: footerMessage || 'Thank you for your business!',
    signatureDataUrl
  };
}
