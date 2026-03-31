import { useState, useEffect } from 'react';
import { AlertCircle, X, MessageCircle, CheckCircle, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import type { Document, UserReminderSettings, InvoiceReminder, OverdueInvoice } from '../lib/types';
import { getOverdueInvoices, shouldSuggestReminder, generateReminderMessage, getReminderType } from '../lib/reminderSystem';
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
    <div className="mb-6">
      <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {overdueInvoices.length} {overdueInvoices.length === 1 ? 'Invoice' : 'Invoices'} Overdue
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total: {formatCurrency(totalAmount)}
                  {urgentCount > 0 && (
                    <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">
                      ({urgentCount} urgent)
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              {overdueInvoices.slice(0, 3).map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      onClick={() => handleViewInvoice(invoice.id)}
                      className="flex-1 cursor-pointer"
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {invoice.client_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
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
                        className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Send Reminder
                      </button>
                    )}
                    {invoice.client_email && !invoice.client_phone && (
                      <button
                        onClick={() => handleSendReminder(invoice, 'email')}
                        className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        Send Reminder
                      </button>
                    )}
                    <button
                      onClick={() => handleMarkAsPaid(invoice)}
                      className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Paid
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {overdueInvoices.length > 3 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
                +{overdueInvoices.length - 3} more overdue {overdueInvoices.length - 3 === 1 ? 'invoice' : 'invoices'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
