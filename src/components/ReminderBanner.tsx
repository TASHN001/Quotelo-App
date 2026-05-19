import { useState, useEffect } from 'react';
import { AlertCircle, X, MessageCircle, CheckCircle, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { ds } from '../lib/designSystem';
import type { Document, UserReminderSettings, InvoiceReminder, OverdueInvoice } from '../lib/types';
import { getOverdueInvoices, shouldSuggestReminder, generateReminderMessage, getReminderType, playReminderBeep } from '../lib/reminderSystem';
import { getOverdueDays } from '../lib/statusManager';
import { openWhatsApp } from '../lib/shareUtils';
import { getCurrentDate } from '../lib/dateUtils';

export function ReminderBanner() {
  const { authUser, business, formatCurrency, showToast, setSavedDocumentId, setCurrentScreen } = useApp();
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
  const [reminderSettings, setReminderSettings] = useState<UserReminderSettings | null>(null);
  const [reminders, setReminders] = useState<InvoiceReminder[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [authUser]);

  useEffect(() => {
    if (!isLoading && overdueInvoices.length > 0 && !dismissed) {
      playReminderBeep();
    }
  }, [isLoading, overdueInvoices.length, dismissed]);

  const loadData = async () => {
    if (!authUser) {
      setIsLoading(false);
      return;
    }

    const documents = await db.getUserDocuments(authUser.id);
    const settings = await db.getUserReminderSettings(authUser.id);
    const allReminders = await db.getUserReminders(authUser.id);

    const overdue = getOverdueInvoices(documents);
    const needingReminders = overdue.filter(invoice => {
      const invoiceReminders = allReminders.filter(r => r.document_id === invoice.id && !r.dismissed_at);
      const lastReminder = invoiceReminders.sort((a, b) =>
        new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
      )[0];

      return shouldSuggestReminder(invoice, settings, lastReminder || null);
    });

    setOverdueInvoices(needingReminders);
    setReminderSettings(settings);
    setReminders(allReminders);
    setIsLoading(false);
  };

  const handleSendReminder = async (invoice: OverdueInvoice, method: 'whatsapp' | 'email') => {
    const reminderMessage = generateReminderMessage(
      invoice.document_number,
      invoice.client_name,
      formatCurrency(invoice.total),
      invoice.overdueDays,
      business?.business_name
    );

    if (method === 'whatsapp') {
      const phoneNumber = invoice.client_phone;
      if (!phoneNumber) {
        showToast('Client phone number not available', 'error');
        return;
      }
      openWhatsApp(phoneNumber, reminderMessage);
    } else {
      showToast('Email reminders coming soon', 'info');
      return;
    }

    const reminderType = getReminderType(invoice.overdueDays);
    await db.createReminder(invoice.id, reminderType);

    showToast('Reminder sent successfully', 'success');
    loadData();
  };

  const handleMarkAsPaid = async (invoice: OverdueInvoice) => {
    const paidDate = getCurrentDate().toISOString();
    const updated = await db.updateDocumentStatus(invoice.id, 'paid', paidDate);

    if (updated) {
      showToast(`${formatCurrency(invoice.total)} marked as paid`, 'success');
      loadData();
    } else {
      showToast('Failed to mark invoice as paid', 'error');
    }
  };

  const handleViewInvoice = (invoiceId: string) => {
    setSavedDocumentId(invoiceId);
    setCurrentScreen('invoice-detail');
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (isLoading || dismissed || overdueInvoices.length === 0) {
    return null;
  }

  const urgentCount = overdueInvoices.filter(inv => inv.overdueDays >= 7).length;
  const totalAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-[#c2410c] flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className={`${ds.callout} text-[#c2410c] font-semibold`}>
              {overdueInvoices.length} {overdueInvoices.length === 1 ? 'Invoice' : 'Invoices'} Overdue
            </p>
            <p className={`${ds.footnote} text-[#c2410c] mt-0.5`}>
              Total: {formatCurrency(totalAmount)}
              {urgentCount > 0 && (
                <span className="ml-2 font-semibold">
                  ({urgentCount} urgent)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className={`p-1 rounded-lg ${ds.transition}`}
          >
            <X className="w-4 h-4 text-[#c2410c]" />
          </button>
        </div>

        <div className="space-y-3">
          {overdueInvoices.slice(0, 3).map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-xl p-3 border border-[#fed7aa]"
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  onClick={() => handleViewInvoice(invoice.id)}
                  className="flex-1 cursor-pointer"
                >
                  <p className={`${ds.callout} font-semibold text-black`}>
                    {invoice.client_name}
                  </p>
                  <p className={`${ds.footnote} text-[#8e8e93]`}>
                    Invoice {invoice.document_number} • {formatCurrency(invoice.total)}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  invoice.overdueDays >= 14
                    ? 'bg-red-600 text-white'
                    : invoice.overdueDays >= 7
                    ? 'bg-red-500 text-white'
                    : 'bg-orange-500 text-white'
                }`}>
                  {invoice.overdueDays}d overdue
                </span>
              </div>

              <div className="flex gap-2">
                {invoice.client_phone && (
                  <button
                    onClick={() => handleSendReminder(invoice, 'whatsapp')}
                    className="flex-1 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-150"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Send Reminder
                  </button>
                )}
                {invoice.client_email && !invoice.client_phone && (
                  <button
                    onClick={() => handleSendReminder(invoice, 'email')}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-150"
                  >
                    <Mail className="w-4 h-4" />
                    Send Reminder
                  </button>
                )}
                <button
                  onClick={() => handleMarkAsPaid(invoice)}
                  className="flex-1 px-3 py-2 bg-[#f2f2f7] text-black text-sm font-medium rounded-lg flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-150"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Paid
                </button>
              </div>
            </div>
          ))}
        </div>

        {overdueInvoices.length > 3 && (
          <p className={`${ds.footnote} text-[#c2410c] mt-3 text-center`}>
            +{overdueInvoices.length - 3} more overdue {overdueInvoices.length - 3 === 1 ? 'invoice' : 'invoices'}
          </p>
        )}
      </div>
    </div>
  );
}
