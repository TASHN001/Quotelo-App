import { useState, useEffect, useRef } from 'react';
import { Plus, FileText, Share2, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSampleInvoiceData } from '../lib/sampleData';
import { ClientPickerModal } from './ClientPickerModal';
import { ReminderBanner } from './ReminderBanner';
import { SmartSuggestions } from './SmartSuggestions';
import { Client, Document } from '../lib/types';
import { db } from '../lib/database';
import { isOverdue as checkOverdue } from '../lib/statusManager';
import { getCurrentDate } from '../lib/dateUtils';
import { ds, statusBadge } from '../lib/designSystem';

type FilterType = 'all' | 'draft' | 'sent' | 'paid' | 'overdue';

export function Home() {
  const { userProfile, recentInvoices, isLoading, setCurrentScreen, setPreviousScreen, setSavedDocumentId, setDraftDocumentData, setSelectedTemplateKey, formatCurrency, showToast, setSelectedClient } = useApp();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [swipeState, setSwipeState] = useState<{ id: string; dir: 'left' | 'right' } | null>(null);
  const touchStartX = useRef(0);
  const SWIPE_THRESHOLD = 50;
  const ACTION_W = 80;
  const [showClientPicker, setShowClientPicker] = useState(false);

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

  const unpaidTotal = recentInvoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const unpaidCount = recentInvoices.filter(inv => inv.status !== 'paid').length;

  const now = new Date();
  const paidThisMonth = recentInvoices
    .filter(inv => {
      if (inv.status !== 'paid') return false;
      const d = new Date(inv.date || '');
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, inv) => sum + inv.amount, 0);

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  const handleInvoiceClick = (invoiceId: string) => {
    setSavedDocumentId(invoiceId);
    setPreviousScreen('home');
    setCurrentScreen('invoice-detail');
  };

  const handleTryExample = () => {
    const sampleData = getSampleInvoiceData();
    setDraftDocumentData(sampleData);
    setSelectedTemplateKey('invoice-minimal');
    setCurrentScreen('document-preview');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (invoiceId: string, e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -SWIPE_THRESHOLD) setSwipeState({ id: invoiceId, dir: 'left' });
    else if (delta > SWIPE_THRESHOLD) setSwipeState({ id: invoiceId, dir: 'right' });
    else setSwipeState(null);
  };

  const handleShare = (invoiceId: string) => {
    setSwipeState(null);
    handleInvoiceClick(invoiceId);
  };

  const handleDuplicate = async (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const invoice = recentInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      showToast('Invoice not found', 'error');
      return;
    }

    const originalDoc = await db.getDocument(invoiceId);
    const newDocNumber = await db.getNextDocumentNumber(
      localStorage.getItem('quotelo_user_id') || '',
      originalDoc?.client_id ?? null
    );

    const result = await db.duplicateDocument(invoiceId, newDocNumber);

    if (result.success && result.document) {
      showToast(`Invoice duplicated as ${newDocNumber}`, 'success');
      window.location.reload();
    } else {
      showToast('Failed to duplicate invoice', 'error');
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    setSwipeState(null);
    const invoice = recentInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    const paidDate = getCurrentDate().toISOString();
    const updated = await db.updateDocumentStatus(invoiceId, 'paid', paidDate);
    if (updated) {
      showToast(`${formatCurrency(invoice.amount)} marked as paid`, 'success');
      window.location.reload();
    } else {
      showToast('Failed to mark invoice as paid', 'error');
    }
  };

  const handleMarkAsUnpaid = async (invoiceId: string) => {
    setSwipeState(null);
    const updated = await db.updateDocumentStatus(invoiceId, 'sent', null);
    if (updated) {
      showToast('Invoice marked as unpaid', 'success');
      window.location.reload();
    } else {
      showToast('Failed to update invoice', 'error');
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

  if (isLoading) {
    return (
      <div className={`min-h-screen ${ds.bg} flex items-center justify-center`}>
        <div className="w-10 h-10 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${ds.bg} flex flex-col pb-28`}>
      <div className="px-4 pt-14 pb-4">

        {/* Large Title header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className={`${ds.caption} text-[#8e8e93] mb-0.5`}>{getGreeting()}</p>
            <h1 className={`${ds.title1} text-black`}>{userProfile?.name || 'Welcome'}</h1>
          </div>
          <button
            onClick={handleCreateInvoice}
            className={`w-9 h-9 bg-[#f97316] rounded-full flex items-center justify-center ${ds.shadowOrange} ${ds.press} ${ds.transition} mb-1`}
          >
            <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className={`${ds.card} p-4`}>
            <p className={`${ds.caption} text-[#8e8e93] mb-1`}>UNPAID</p>
            <p className={`${ds.title2} text-black ${ds.numeric}`}>{formatCurrency(unpaidTotal)}</p>
            <p className={`${ds.footnote} text-[#f97316] font-bold mt-0.5`}>{unpaidCount} invoice{unpaidCount !== 1 ? 's' : ''}</p>
          </div>
          <div className={`${ds.card} p-4`}>
            <p className={`${ds.caption} text-[#8e8e93] mb-1`}>PAID</p>
            <p className={`${ds.title2} text-black ${ds.numeric}`}>{formatCurrency(paidThisMonth)}</p>
            <p className={`${ds.footnote} text-[#34c759] font-bold mt-0.5`}>This month</p>
          </div>
        </div>

        <SmartSuggestions />
        <ReminderBanner />

        {/* Quick Actions */}
        <div className="mb-4">
          <p className={`${ds.caption} text-[#8e8e93] mb-2`}>QUICK ACTIONS</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className={`${ds.card} p-4 text-left ${ds.transition} ${ds.press}`}
            >
              <p className={`${ds.headline} text-black mb-0.5`}>Dashboard</p>
              <p className={`${ds.footnote} text-[#8e8e93]`}>Overview & stats</p>
            </button>
            <button
              onClick={() => setCurrentScreen('templates-list')}
              className={`${ds.card} p-4 text-left ${ds.transition} ${ds.press}`}
            >
              <p className={`${ds.headline} text-black mb-0.5`}>Templates</p>
              <p className={`${ds.footnote} text-[#8e8e93]`}>Invoice styles</p>
            </button>
          </div>
        </div>

        {/* Recent invoices */}
        <div className="mb-4">
          <p className={`${ds.caption} text-[#8e8e93] mb-2`}>RECENT INVOICES</p>

          {recentInvoices.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap ${ds.transition} ${
                    activeFilter === f
                      ? 'bg-[#f97316] text-white'
                      : 'bg-[#e5e5ea] text-[#8e8e93]'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}

          {recentInvoices.length === 0 ? (
            <div className={`${ds.card} p-8 text-center`}>
              <FileText className="w-10 h-10 text-[#c7c7cc] mx-auto mb-3" />
              <p className={`${ds.headline} text-black mb-1`}>No invoices yet</p>
              <p className={`${ds.callout} text-[#8e8e93] mb-4`}>Create your first invoice in 10 seconds.</p>
              <button onClick={handleTryExample} className={`${ds.callout} text-[#f97316] font-semibold`}>
                Try an example
              </button>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className={`${ds.card} p-8 text-center`}>
              <p className={`${ds.callout} text-[#8e8e93]`}>No {activeFilter !== 'all' ? activeFilter : ''} invoices</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
              {swipeState && (
                <div className="fixed inset-0 z-10" onClick={() => setSwipeState(null)} />
              )}
              {filteredInvoices.map((invoice, idx) => {
                const isSwiped = swipeState?.id === invoice.id;
                const swipeDir = isSwiped ? swipeState!.dir : null;
                const isPaid = invoice.status === 'paid';
                return (
                  <div key={invoice.id} className={`relative overflow-hidden ${idx < filteredInvoices.length - 1 ? 'border-b border-[#f2f2f7]' : ''}`}>
                    {/* Left action panel — Share (revealed by swipe left) */}
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-[#007aff] flex flex-col items-center justify-center gap-1">
                      <button onClick={() => handleShare(invoice.id)} className="flex flex-col items-center gap-1">
                        <Share2 className="w-5 h-5 text-white" strokeWidth={2} />
                        <span className="text-white text-[11px] font-semibold">Share</span>
                      </button>
                    </div>
                    {/* Right action panel — Mark Paid/Unpaid (revealed by swipe right) */}
                    <div className={`absolute left-0 top-0 bottom-0 w-20 flex flex-col items-center justify-center gap-1 ${isPaid ? 'bg-[#ff9500]' : 'bg-[#34c759]'}`}>
                      <button
                        onClick={() => isPaid ? handleMarkAsUnpaid(invoice.id) : handleMarkAsPaid(invoice.id)}
                        className="flex flex-col items-center gap-1"
                      >
                        <CheckCircle className="w-5 h-5 text-white" strokeWidth={2} />
                        <span className="text-white text-[11px] font-semibold">{isPaid ? 'Unpaid' : 'Paid'}</span>
                      </button>
                    </div>
                    {/* Swipeable card */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => { if (!isSwiped) handleInvoiceClick(invoice.id); else setSwipeState(null); }}
                      onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !isSwiped) handleInvoiceClick(invoice.id); }}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={e => handleTouchEnd(invoice.id, e)}
                      className="relative z-10 w-full flex items-center gap-3 px-4 py-3 bg-white cursor-pointer"
                      style={{
                        transform: `translateX(${swipeDir === 'left' ? -ACTION_W : swipeDir === 'right' ? ACTION_W : 0}px)`,
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <div className="flex-1 text-left min-w-0">
                        <p className={`${ds.headline} text-black truncate`}>{invoice.companyName}</p>
                        <p className={`${ds.footnote} text-[#8e8e93]`}>{invoice.invoiceNumber} · {invoice.date}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`${ds.callout} ${ds.numeric} text-black`}>{formatCurrency(invoice.amount)}</p>
                        <span className={statusBadge(isInvoiceOverdue(invoice) ? 'overdue' : invoice.status)}>
                          {isInvoiceOverdue(invoice) ? 'Overdue' : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
