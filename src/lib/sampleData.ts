import type { InvoiceData } from './types';

export function getSampleInvoiceData(): InvoiceData {
  return {
    business: {
      name: 'Your Business Name',
      email: 'hello@yourbusiness.com',
      phone: '+1 234 567 8900',
      address: { street: '123 Business Street', city: 'City', postalCode: '', country: '' },
      logoUrl: undefined
    },
    client: {
      name: 'Recipient Name',
      email: 'client@email.com',
      phone: undefined,
      address: { street: 'Client Company', city: '', postalCode: '', country: '' }
    },
    invoice: {
      number: 'INV-000001',
      issueDate: '01 Jan 2026',
      dueDate: '31 Jan 2026'
    },
    items: [
      {
        description: 'Service Item One',
        quantity: 1,
        unitPrice: 1000,
        total: 1000
      },
      {
        description: 'Service Item Two',
        quantity: 2,
        unitPrice: 500,
        total: 1000
      }
    ],
    totals: {
      subtotal: 2000,
      tax: 0,
      total: 2000
    },
    notes: 'Thank you for your business!',
    currency: 'ZAR'
  };
}

export const TEMPLATE_METADATA = {
  'invoice-minimal': {
    key: 'invoice-minimal',
    name: 'Minimal',
    description: 'Clean and simple design with clear typography',
    planTier: 'free',
    category: 'general',
    comingSoon: false
  },
  'invoice-modern': {
    key: 'invoice-modern',
    name: 'Modern',
    description: 'Bold and colorful with gradient accents',
    planTier: 'free',
    category: 'general',
    comingSoon: false
  },
  freelance: {
    key: 'freelance',
    name: 'Freelance',
    description: 'Perfect for independent contractors and freelancers',
    planTier: 'premium',
    category: 'industry',
    comingSoon: true
  },
  consulting: {
    key: 'consulting',
    name: 'Consulting',
    description: 'Professional template for consulting businesses',
    planTier: 'premium',
    category: 'industry',
    comingSoon: true
  },
  construction: {
    key: 'construction',
    name: 'Construction',
    description: 'Tailored for construction and contracting work',
    planTier: 'premium',
    category: 'industry',
    comingSoon: true
  },
  logistics: {
    key: 'logistics',
    name: 'Logistics',
    description: 'Optimized for shipping and logistics companies',
    planTier: 'premium',
    category: 'industry',
    comingSoon: true
  }
} as const;

export type TemplateKey = keyof typeof TEMPLATE_METADATA;
