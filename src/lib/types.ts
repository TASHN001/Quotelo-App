export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  plan_tier: 'free' | 'pro';
  onboarding_complete: boolean;
  eula_accepted?: boolean;
  eula_accepted_at?: string;
  selected_template_key?: string;
  signature_data_url?: string;
  include_signature_automatically?: boolean;
  theme_preference?: 'light' | 'dark' | 'system';
  created_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  business_name: string;
  email: string;
  phone?: string;
  country?: string;
  country_code?: string;
  country_flag?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  tax_number?: string;
  vat_number?: string;
  business_registration_number?: string;
  vat_tax_number?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_swift_code?: string;
  payment_instructions?: string;
  logo_url?: string;
  signature_url?: string;
  default_currency: string;
  industry_group?: string;
  industry_type?: string;
  created_at: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  user_id: string;
  business_id?: string;
  name: string;
  email?: string;
  phone?: string;
  billing_address?: string;
  tax_number?: string;
  notes?: string;
  client_currency?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentTemplate {
  id: string;
  document_type: string;
  template_name: string;
  template_data: Record<string, any>;
  is_system: boolean;
  is_free: boolean;
  is_default: boolean;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  business_id: string;
  client_id?: string;
  document_type: string;
  document_number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_total: number;
  total: number;
  currency?: string;
  notes?: string;
  reference?: string;
  payment_details?: string;
  payment_terms?: string;
  footer_message?: string;
  template_key?: string;
  last_reminder_sent_at?: string;
  paid_date?: string;
  created_at: string;
  ship_to_name?: string;
  ship_to_address?: string;
  ship_to_phone?: string;
  show_ship_to?: boolean;
  po_number?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  discount_applied_before_tax?: boolean;
  tax_type?: 'percentage' | 'fixed';
  tax_rate?: number;
  global_tax?: boolean;
  partial_payments_total?: number;
  amount_due?: number;
  terms_conditions?: string;
  currency_display_format?: 'symbol_first' | 'code_first';
  custom_logo_url?: string;
  custom_signature_url?: string;
  last_auto_save?: string;
}

export interface DocumentLineItem {
  id: string;
  document_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
  sort_order?: number;
  is_archived?: boolean;
}

export interface SavedLineItem {
  id: string;
  user_id: string;
  name: string;
  default_quantity: number;
  default_unit_price: number;
  default_tax_rate: number;
  category?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  snapshot: DocumentSnapshot;
  created_at: string;
  created_by: string;
}

export interface DocumentSnapshot {
  document: Partial<Document>;
  line_items: DocumentLineItem[];
}

export interface ChatThread {
  id: string;
  user_id: string;
  document_type: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  role: 'system' | 'assistant' | 'user';
  content: string;
  created_at: string;
}

export interface Address {
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface PaymentDetails {
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  paymentLink?: string;
  instructions?: string;
}

export interface PaymentTerms {
  dueType?: 'on_receipt' | 'net_7' | 'net_14' | 'net_30' | 'custom';
  customDays?: number;
  latePaymentNotice?: string;
}

export interface InvoiceData {
  documentType?: 'Invoice' | 'Quote' | 'Receipt';
  business: {
    name: string;
    email: string;
    phone?: string;
    address?: Address;
    logoUrl?: string;
    registrationNumber?: string;
    taxNumber?: string;
    vatNumber?: string;
    country?: string;
  };
  client: {
    name: string;
    email: string;
    phone?: string;
    address?: Address;
    taxNumber?: string;
  };
  invoice: {
    number: string;
    issueDate: string;
    dueDate: string;
    reference?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    tax: number;
    total: number;
  };
  currency?: string;
  notes?: string;
  paymentDetails?: PaymentDetails;
  paymentInstructions?: string;
  paymentTerms?: PaymentTerms;
  footer?: string;
  signatureDataUrl?: string;
}

export interface InvoiceDraft {
  requestId: string;
  documentType: string;
  complete: boolean;
  followUpQuestion: string | null;
  client: {
    name: string | null;
    email: string | null;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
}

export interface InvoiceReminder {
  id: string;
  document_id: string;
  reminder_type: 'overdue_3_days' | 'overdue_7_days' | 'overdue_14_days' | 'manual';
  sent_at: string;
  dismissed_at?: string;
  created_at: string;
}

export interface UserReminderSettings {
  user_id: string;
  auto_followup_enabled: boolean;
  reminder_frequency: 3 | 7 | 14;
  email_reminders_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface OverdueInvoice extends Document {
  overdueDays: number;
  lastReminderType?: string;
}
