import type { Document, OverdueInvoice, UserReminderSettings, InvoiceReminder } from './types';
import { getOverdueDays, isOverdue } from './statusManager';

export function getOverdueInvoices(documents: Document[]): OverdueInvoice[] {
  return documents
    .filter(doc => isOverdue(doc))
    .map(doc => ({
      ...doc,
      overdueDays: getOverdueDays(doc.due_date)
    }))
    .sort((a, b) => b.overdueDays - a.overdueDays);
}

export function shouldSuggestReminder(
  document: Document,
  reminderSettings: UserReminderSettings | null,
  lastReminder: InvoiceReminder | null
): boolean {
  if (!isOverdue(document)) {
    return false;
  }

  const overdueDays = getOverdueDays(document.due_date);
  const reminderFrequency = reminderSettings?.reminder_frequency || 3;

  if (overdueDays < reminderFrequency) {
    return false;
  }

  if (!lastReminder) {
    return true;
  }

  const lastReminderDate = new Date(lastReminder.sent_at);
  const daysSinceReminder = Math.floor(
    (Date.now() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceReminder >= reminderFrequency;
}

export function getReminderType(overdueDays: number): InvoiceReminder['reminder_type'] {
  if (overdueDays >= 14) return 'overdue_14_days';
  if (overdueDays >= 7) return 'overdue_7_days';
  if (overdueDays >= 3) return 'overdue_3_days';
  return 'manual';
}

export function getInvoicesNeedingReminders(
  documents: Document[],
  reminderSettings: UserReminderSettings | null,
  reminders: InvoiceReminder[]
): OverdueInvoice[] {
  const overdueInvoices = getOverdueInvoices(documents);

  return overdueInvoices.filter(invoice => {
    const lastReminder = reminders
      .filter(r => r.document_id === invoice.id && !r.dismissed_at)
      .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())[0];

    return shouldSuggestReminder(invoice, reminderSettings, lastReminder || null);
  });
}

export function generateReminderMessage(
  invoiceNumber: string,
  clientName: string,
  amount: string,
  overdueDays: number,
  businessName?: string
): string {
  const greeting = `Hello ${clientName},`;
  const urgencyLevel = overdueDays >= 14 ? 'urgent' : overdueDays >= 7 ? 'important' : 'friendly';

  let body = '';

  if (urgencyLevel === 'urgent') {
    body = `This is an urgent reminder that Invoice ${invoiceNumber} for ${amount} is now ${overdueDays} days overdue.\n\nWe kindly request your immediate attention to this matter. If you have already made the payment, please disregard this message and accept our thanks.`;
  } else if (urgencyLevel === 'important') {
    body = `This is a reminder that Invoice ${invoiceNumber} for ${amount} is ${overdueDays} days overdue.\n\nWe would appreciate it if you could arrange payment at your earliest convenience. If you have any questions or concerns, please don't hesitate to reach out.`;
  } else {
    body = `I hope this message finds you well. I wanted to follow up regarding Invoice ${invoiceNumber} for ${amount}, which is ${overdueDays} days overdue.\n\nIf you've already sent the payment, please disregard this reminder. Otherwise, I'd appreciate it if you could process the payment soon.`;
  }

  const closing = businessName
    ? `\n\nBest regards,\n${businessName}`
    : '\n\nBest regards';

  return `${greeting}\n\n${body}${closing}`;
}

export function getDismissedReminders(reminders: InvoiceReminder[]): InvoiceReminder[] {
  return reminders.filter(r => r.dismissed_at !== null && r.dismissed_at !== undefined);
}

export function getActiveReminders(reminders: InvoiceReminder[]): InvoiceReminder[] {
  return reminders.filter(r => !r.dismissed_at);
}

export function groupRemindersByUrgency(invoices: OverdueInvoice[]): {
  critical: OverdueInvoice[];
  high: OverdueInvoice[];
  medium: OverdueInvoice[];
} {
  return {
    critical: invoices.filter(inv => inv.overdueDays >= 14),
    high: invoices.filter(inv => inv.overdueDays >= 7 && inv.overdueDays < 14),
    medium: invoices.filter(inv => inv.overdueDays >= 3 && inv.overdueDays < 7)
  };
}
