import { ModernInvoice } from './invoice/Modern';
import { MinimalInvoice } from './invoice/Minimal';
import { ProfessionalInvoice } from './invoice/Professional';
import type { InvoiceData } from '../lib/types';

export interface TemplateDefinition {
  key: string;
  name: string;
  documentType: string;
  planTier: 'free' | 'pro';
  previewImageUrl?: string;
  component: React.ComponentType<{ data: InvoiceData }>;
}

export const templates: TemplateDefinition[] = [
  {
    key: 'invoice-modern',
    name: 'Modern',
    documentType: 'Invoice',
    planTier: 'free',
    component: ModernInvoice,
  },
  {
    key: 'invoice-minimal',
    name: 'Minimal',
    documentType: 'Invoice',
    planTier: 'free',
    component: MinimalInvoice,
  },
  {
    key: 'invoice-professional',
    name: 'Professional',
    documentType: 'Invoice',
    planTier: 'pro',
    component: ProfessionalInvoice,
  },
];

export function getTemplate(key: string): TemplateDefinition | undefined {
  return templates.find(t => t.key === key);
}

export function getTemplatesByDocumentType(
  documentType: string,
  planTier: 'free' | 'pro'
): TemplateDefinition[] {
  return templates.filter(
    t => t.documentType === documentType && (planTier === 'pro' || t.planTier === 'free')
  );
}

export function getMockInvoiceData(): InvoiceData {
  return {
    business: {
      name: 'Acme Corporation',
      email: 'hello@acmecorp.com',
      phone: '+27 11 123 4567',
      address: {
        street: '123 Business Street',
        city: 'Sandton, Johannesburg',
        postalCode: '2196'
      },
      logoUrl: undefined,
    },
    client: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+27 82 345 6789',
      address: {
        street: '456 Client Avenue',
        city: 'Cape Town',
        postalCode: '8001'
      },
    },
    invoice: {
      number: 'INV-2024-001',
      issueDate: '2024-01-15',
      dueDate: '2024-02-15',
    },
    items: [
      {
        description: 'Web Development Services',
        quantity: 40,
        unitPrice: 500,
        total: 20000,
      },
      {
        description: 'UI/UX Design',
        quantity: 20,
        unitPrice: 600,
        total: 12000,
      },
      {
        description: 'Consulting Services',
        quantity: 10,
        unitPrice: 800,
        total: 8000,
      },
    ],
    totals: {
      subtotal: 40000,
      tax: 6000,
      total: 46000,
    },
    notes: 'Thank you for your business. Payment is due within 30 days.',
    paymentDetails: {
      bankName: 'FNB',
      accountNumber: '12345678',
      swiftCode: '250655'
    },
    footer: 'Thank you for your business!'
  };
}
