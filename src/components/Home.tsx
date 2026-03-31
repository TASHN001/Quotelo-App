import { useState, useEffect } from 'react';
import { Plus, Users, FileText, CreditCard, Home as HomeIcon, User, MoreVertical, Eye, Share2, Copy, CheckCircle, Mic, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSampleInvoiceData } from '../lib/sampleData';
import { ClientPickerModal } from './ClientPickerModal';
import { ReminderBanner } from './ReminderBanner';
import { SmartSuggestions } from './SmartSuggestions';
import { Client, Document } from '../lib/types';
import { db } from '../lib/database';
import { isOverdue as checkOverdue, calculateDocumentStatus, getStatusColor } from '../lib/statusManager';
import { getCurrentTimestamp, getCurrentDate } from '../lib/dateUtils';
import { designSystem as ds } from '../lib/designSystem';

type FilterType = 'all' | 'draft' | 'sent' | 'paid' | 'overdue';

export function Home() {
  const { userProfile, business, recentInvoices, isLoading, setCurrentScreen, setSavedDocumentId, setDraftDocumentData, t, formatCurrency, showToast, setSelectedClient } = useApp();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showSubtext, setShowSubtext] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSubtext(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const handleInvoiceClick = (invoiceId: string) => {
    setSavedDocumentId(invoiceId);
    setCurrentScreen('invoice-detail');
  };

  const handleTryExample = () => {
    const sampleData = getSampleInvoiceData();
    setDraftDocumentData(sampleData);
    setCurrentScreen('document-preview');
  };

  const handleShare = (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    showToast('Share functionality coming soon', 'info');
  };

  const handleDuplicate = async (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);

    const invoice = recentInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      showToast('Invoice not found', 'error');
      return;
    }

    const timestamp = getCurrentTimestamp().toString().slice(-6);
    const newDocNumber = `${invoice.invoiceNumber}-COPY-${timestamp}`;

    const result = await db.duplicateDocument(invoiceId, newDocNumber);

    if (result.success && result.document) {
      showToast(`Invoice duplicated as ${newDocNumber}`, 'success');
      window.location.reload();
    } else {
      showToast('Failed to duplicate invoice', 'error');
    }
  };

  const handleMarkAsPaid = async (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);

    const invoice = recentInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      showToast('Invoice not found', 'error');
      return;
    }

    const paidDate = getCurrentDate().toISOString();
    const updated = await db.updateDocumentStatus(invoiceId, 'paid', paidDate);

    if (updated) {
      showToast(`${formatCurrency(invoice.amount)} marked as paid`, 'success');
      window.location.reload();
    } else {
      showToast('Failed to mark invoice as paid', 'error');
    }
  };

  const handleCreateInvoice = () => {
    setShowClientPicker(true);
  };

  const handleClientSelected = (client: Client | null) => {
    if (client) {
      localStorage.setItem('quotelo_last_selected_client_id', client.id);
    }
    setSelectedClient(client);
    setCurrentScreen('ai-generator');
  };

  const handleAddClient = () => {
    setShowClientPicker(false);
    setCurrentScreen('clients');
  };

  const isInvoiceOverdue = (invoice: any) => {
    const doc: Document = {
      id: invoice.id,
      user_id: '',
      business_id: '',
      document_type: 'invoice',
      document_number: invoice.invoiceNumber,
      status: invoice.status,
      client_name: invoice.companyName,
      client_email: '',
      issue_date: invoice.date,
      due_date: invoice.date,
      subtotal: invoice.amount,
      tax_total: 0,
      total: invoice.amount,
      created_at: invoice.date
    };
    return checkOverdue(doc);
  };

  const filteredInvoices = recentInvoices.filter(invoice => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'overdue') return isInvoiceOverdue(invoice);
    return invoice.status.toLowerCase() === activeFilter;
  });

  if (isLoading) {
    return (
      <div className={`min-h-screen ${ds.surfaces.base.light} ${ds.surfaces.base.dark} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${ds.surfaces.base.light} ${ds.surfaces.base.dark} flex flex-col pb-24 ${ds.transition.base}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`${ds.typography.h2} text-gray-900 dark:text-white`}>
              {t('home.welcome')}, {userProfile.name}
            </h1>
          </div>
          {business?.logo_url ? (
            <div className={`w-12 h-12 rounded-full overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border-2 border-orange-500 flex items-center justify-center ${ds.elevation[2]}`}>
              <img src={business.logo_url} alt="Business logo" className="w-full h-full object-contain p-1" />
            </div>
          ) : (
            <div className={`w-12 h-12 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 rounded-full flex items-center justify-center ${ds.elevation[2]} shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]`}>
              <span className="text-white font-bold text-lg">
                {userProfile.name.charAt(0) || 'U'}
              </span>
            </div>
          )}
        </div>

        <div
          onClick={handleCreateInvoice}
          className={`bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 ${ds.radius.xl} p-8 mb-2 cursor-pointer hover:from-orange-450 hover:via-orange-550 hover:to-orange-650 active:from-orange-600 active:via-orange-600 active:to-orange-500 ${ds.transition.spring} relative overflow-hidden shadow-[0_8px_24px_rgba(249,115,22,0.3),0_4px_12px_rgba(249,115,22,0.2),inset_0_2px_0_rgba(255,255,255,0.3),inset_0_-2px_0_rgba(0,0,0,0.1)] hover:shadow-[0_12px_32px_rgba(249,115,22,0.35),0_6px_16px_rgba(249,115,22,0.25),inset_0_2px_0_rgba(255,255,255,0.3)] active:shadow-[0_4px_12px_rgba(249,115,22,0.25),inset_0_3px_6px_rgba(0,0,0,0.2)]`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-300/20 to-transparent pointer-events-none"></div>
          <div className="flex items-center justify-between gap-4 relative">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2 whitespace-nowrap">{t('home.createInvoice')}</h2>
              <p className={`text-orange-50 text-sm font-medium transition-opacity duration-300 ${showSubtext ? 'opacity-100' : 'opacity-0'}`}>
                Tap mic and speak your invoice. We handle the rest.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-200 rounded-full animate-ping opacity-25"></div>
                <div className={`relative w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_2px_8px_rgba(255,255,255,0.2)]`}>
                  <Mic className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div className={`w-14 h-14 bg-white/20 backdrop-blur-sm ${ds.radius.md} flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_2px_8px_rgba(255,255,255,0.2)]`}>
                <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setCurrentScreen('templates-list')}
          className={`w-full text-center py-3 mb-6 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 ${ds.transition.base} font-medium`}
        >
          Create from template
        </button>

        <SmartSuggestions />

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setCurrentScreen('clients')}
            className={`bg-gradient-to-b from-orange-50 via-white to-orange-50/50 dark:from-orange-900/30 dark:via-orange-900/20 dark:to-orange-900/30 ${ds.radius.lg} p-6 ${ds.card.shadow} ${ds.card.darkShadow} hover:shadow-[0_4px_16px_rgba(249,115,22,0.15),0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_4px_16px_rgba(249,115,22,0.25),0_2px_6px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] ${ds.transition.spring} text-left active:scale-[0.98] flex flex-col items-start`}
          >
            <div className={`w-12 h-12 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 ${ds.radius.md} flex items-center justify-center mb-3 shadow-[0_3px_8px_rgba(249,115,22,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] flex-shrink-0`}>
              <Users className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h3 className={`${ds.typography.h4} text-gray-900 dark:text-white`}>{t('home.clients')}</h3>
          </button>

          <button
            onClick={() => setCurrentScreen('templates-list')}
            className={`bg-gradient-to-b from-orange-50 via-white to-orange-50/50 dark:from-orange-900/30 dark:via-orange-900/20 dark:to-orange-900/30 ${ds.radius.lg} p-6 ${ds.card.shadow} ${ds.card.darkShadow} hover:shadow-[0_4px_16px_rgba(249,115,22,0.15),0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_4px_16px_rgba(249,115,22,0.25),0_2px_6px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] ${ds.transition.spring} text-left active:scale-[0.98] flex flex-col items-start`}
          >
            <div className={`w-12 h-12 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 ${ds.radius.md} flex items-center justify-center mb-3 shadow-[0_3px_8px_rgba(249,115,22,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] flex-shrink-0`}>
              <FileText className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h3 className={`${ds.typography.h4} text-gray-900 dark:text-white`}>{t('home.templates')}</h3>
          </button>

          <div className={`bg-gradient-to-b from-orange-50 via-white to-orange-50/50 dark:from-orange-900/30 dark:via-orange-900/20 dark:to-orange-900/30 ${ds.radius.lg} p-6 ${ds.card.shadow} ${ds.card.darkShadow} flex flex-col items-start`}>
            <div className={`w-12 h-12 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 ${ds.radius.md} flex items-center justify-center mb-3 shadow-[0_3px_8px_rgba(249,115,22,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] flex-shrink-0`}>
              <CreditCard className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h3 className={`${ds.typography.h4} text-gray-900 dark:text-white`}>Payments & Status</h3>
          </div>

          <button
            onClick={() => setCurrentScreen('dashboard')}
            className={`bg-gradient-to-b from-orange-50 via-white to-orange-50/50 dark:from-orange-900/30 dark:via-orange-900/20 dark:to-orange-900/30 ${ds.radius.lg} p-6 ${ds.card.shadow} ${ds.card.darkShadow} hover:shadow-[0_4px_16px_rgba(249,115,22,0.15),0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_4px_16px_rgba(249,115,22,0.25),0_2px_6px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] ${ds.transition.spring} text-left active:scale-[0.98] flex flex-col items-start`}
          >
            <div className={`w-12 h-12 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 ${ds.radius.md} flex items-center justify-center mb-3 shadow-[0_3px_8px_rgba(249,115,22,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] flex-shrink-0`}>
              <BarChart3 className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h3 className={`${ds.typography.h4} text-gray-900 dark:text-white`}>Dashboard</h3>
          </button>
        </div>

        <ReminderBanner />

        <div>
          <h3 className={`${ds.typography.h3} text-gray-900 dark:text-white mb-4`}>{t('home.recentInvoices')}</h3>

          {recentInvoices.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {(['all', 'draft', 'sent', 'paid', 'overdue'] as FilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-1.5 ${ds.radius.full} text-sm font-medium whitespace-nowrap ${ds.transition.spring} active:scale-95 ${
                    activeFilter === filter
                      ? 'bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 text-white shadow-[0_2px_8px_rgba(249,115,22,0.3),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.1)]'
                      : `bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-750 dark:to-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-500 dark:hover:border-orange-500 ${ds.elevation[1]}`
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          )}

          {recentInvoices.length === 0 ? (
            <div className={`${ds.card.base} ${ds.card.dark} border border-gray-200 dark:border-gray-700 ${ds.radius.lg} p-8 text-center ${ds.card.shadow} ${ds.card.darkShadow}`}>
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className={`${ds.typography.body} text-gray-900 dark:text-white font-semibold mb-2`}>Create your first invoice in 10 seconds.</p>
              <button
                onClick={handleTryExample}
                className={`mt-4 px-6 py-2 bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-700 dark:via-gray-750 dark:to-gray-700 border-2 border-orange-500 text-orange-500 dark:text-orange-400 ${ds.radius.md} font-semibold hover:from-orange-50 hover:via-orange-50 hover:to-orange-100 dark:hover:from-gray-600 dark:hover:via-gray-650 dark:hover:to-gray-600 ${ds.transition.spring} ${ds.elevation[1]} active:scale-95`}
              >
                Try an example
              </button>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className={`${ds.card.base} ${ds.card.dark} border border-gray-200 dark:border-gray-700 ${ds.radius.lg} p-8 text-center ${ds.card.shadow} ${ds.card.darkShadow}`}>
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className={`${ds.typography.body} text-gray-500 dark:text-gray-400`}>No {activeFilter !== 'all' ? activeFilter : ''} invoices found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="relative">
                  <button
                    onClick={() => handleInvoiceClick(invoice.id)}
                    className={`w-full ${ds.card.base} ${ds.card.dark} border border-gray-200 dark:border-gray-700 ${ds.radius.lg} p-4 flex items-center gap-4 ${ds.card.shadow} ${ds.card.darkShadow} hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.6),0_2px_6px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] ${ds.transition.spring} active:scale-[0.99]`}
                  >
                    <div className="text-left flex-1 min-w-0">
                      <h4 className={`${ds.typography.h4} text-gray-900 dark:text-white truncate`}>{invoice.companyName}</h4>
                      <p className={`${ds.typography.bodySmall} text-gray-500 dark:text-gray-400`}>{invoice.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`${ds.typography.numeric} font-bold text-gray-900 dark:text-white`}>{formatCurrency(invoice.amount)}</p>
                      <span className={`inline-block ${ds.typography.caption} px-3 py-1 ${ds.radius.full} mt-1 ${
                        isInvoiceOverdue(invoice)
                          ? `${ds.badge.error.bg} ${ds.badge.error.darkBg} ${ds.badge.error.text} ${ds.badge.error.darkText} ${ds.badge.error.shadow} ${ds.badge.error.darkShadow}`
                          : invoice.status === 'paid'
                          ? `${ds.badge.success.bg} ${ds.badge.success.darkBg} ${ds.badge.success.text} ${ds.badge.success.darkText} ${ds.badge.success.shadow} ${ds.badge.success.darkShadow}`
                          : invoice.status === 'sent'
                          ? `${ds.badge.info.bg} ${ds.badge.info.darkBg} ${ds.badge.info.text} ${ds.badge.info.darkText} ${ds.badge.info.shadow} ${ds.badge.info.darkShadow}`
                          : `${ds.badge.neutral.bg} ${ds.badge.neutral.darkBg} ${ds.badge.neutral.text} ${ds.badge.neutral.darkText} ${ds.badge.neutral.shadow} ${ds.badge.neutral.darkShadow}`
                      }`}>
                        {isInvoiceOverdue(invoice) ? 'Overdue' : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === invoice.id ? null : invoice.id);
                      }}
                      className={`p-2 hover:bg-gradient-to-b hover:from-gray-100 hover:to-gray-150 dark:hover:from-gray-700 dark:hover:to-gray-750 ${ds.radius.sm} ${ds.transition.base} flex-shrink-0 active:scale-95`}
                    >
                      <MoreVertical className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </button>
                  </button>

                  {activeMenuId === invoice.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setActiveMenuId(null)}
                      />
                      <div className={`absolute right-4 top-full mt-2 w-48 ${ds.floating.light} ${ds.floating.dark} border border-gray-200 dark:border-gray-700 ${ds.radius.md} ${ds.floating.shadow} ${ds.floating.darkShadow} z-20 overflow-hidden`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(null);
                            handleInvoiceClick(invoice.id);
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gradient-to-b hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-750 dark:hover:to-gray-800 ${ds.transition.base} text-gray-700 dark:text-gray-300`}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-medium">View</span>
                        </button>
                        <button
                          onClick={(e) => handleShare(invoice.id, e)}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gradient-to-b hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-750 dark:hover:to-gray-800 ${ds.transition.base} text-gray-700 dark:text-gray-300`}
                        >
                          <Share2 className="w-4 h-4" />
                          <span className="text-sm font-medium">Share</span>
                        </button>
                        <button
                          onClick={(e) => handleDuplicate(invoice.id, e)}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gradient-to-b hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-750 dark:hover:to-gray-800 ${ds.transition.base} text-gray-700 dark:text-gray-300`}
                        >
                          <Copy className="w-4 h-4" />
                          <span className="text-sm font-medium">Duplicate</span>
                        </button>
                        {invoice.status !== 'paid' && (
                          <button
                            onClick={(e) => handleMarkAsPaid(invoice.id, e)}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gradient-to-b hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-750 dark:hover:to-gray-800 ${ds.transition.base} text-gray-700 dark:text-gray-300`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Mark as paid</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`fixed bottom-0 left-0 right-0 ${ds.glass.light} ${ds.glass.dark} border-t border-gray-200 dark:border-gray-700 px-6 py-4 ${ds.glass.shadow} ${ds.glass.darkShadow}`}>
        <div className="flex items-center justify-around relative">
          <button
            onClick={() => setCurrentScreen('home')}
            className={`flex flex-col items-center gap-1 text-orange-500 ${ds.transition.base}`}
          >
            <HomeIcon className="w-6 h-6" strokeWidth={2} />
            <span className={`${ds.typography.caption}`}>{t('nav.home')}</span>
          </button>

          <div className="relative">
            <button
              onClick={handleCreateInvoice}
              className={`w-14 h-14 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 ${ds.radius.full} flex items-center justify-center shadow-[0_8px_24px_rgba(249,115,22,0.4),0_4px_12px_rgba(249,115,22,0.3),inset_0_2px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.1)] absolute -top-8 left-1/2 -translate-x-1/2 hover:shadow-[0_12px_32px_rgba(249,115,22,0.45),0_6px_16px_rgba(249,115,22,0.35),inset_0_2px_0_rgba(255,255,255,0.3)] active:shadow-[0_4px_12px_rgba(249,115,22,0.3),inset_0_3px_6px_rgba(0,0,0,0.2)] ${ds.transition.spring} active:scale-95`}
            >
              <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
            </button>
          </div>

          <button
            onClick={() => setCurrentScreen('profile')}
            className={`flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 ${ds.transition.base}`}
          >
            <User className="w-6 h-6" strokeWidth={2} />
            <span className={`${ds.typography.caption}`}>{t('nav.profile')}</span>
          </button>
        </div>
      </div>

      {showClientPicker && (
        <ClientPickerModal
          onClose={() => setShowClientPicker(false)}
          onSelectClient={handleClientSelected}
          onAddClient={handleAddClient}
          userId={localStorage.getItem('quotelo_user_id') || ''}
        />
      )}
    </div>
  );
}
