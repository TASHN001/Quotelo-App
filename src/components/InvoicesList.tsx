import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Share2, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { isOverdue, calculateDocumentStatus } from '../lib/statusManager';
import { getCurrentDate } from '../lib/dateUtils';
import { ds, statusBadge } from '../lib/designSystem';
import type { Document } from '../lib/types';

type FilterType = 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'outstanding' | 'paid-this-month';

export function InvoicesList() {
  const { setCurrentScreen, setPreviousScreen, authUser, formatCurrency, setSavedDocumentId, showToast } = useApp();
  const [swipeState, setSwipeState] = useState<{ id: string; dir: 'left' | 'right' } | null>(null);
  const touchStartX = useRef(0);
  const SWIPE_THRESHOLD = 50;
  const ACTION_W = 80;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTitle, setFilterTitle] = useState('All Invoices');

  useEffect(() => {
    const savedFilter = localStorage.getItem('dashboard_invoice_filter') as FilterType | null;
    const clientName = localStorage.getItem('dashboard_client_name');

    if (savedFilter) {
      setActiveFilter(savedFilter);
      setFilterTitle(getFilterTitle(savedFilter));
    }

    if (clientName) {
      setSearchQuery(clientName);
    }

    loadDocuments();

    return () => {
      localStorage.removeItem('dashboard_invoice_filter');
      localStorage.removeItem('dashboard_client_id');
      localStorage.removeItem('dashboard_client_name');
    };
  }, [authUser]);

  useEffect(() => {
    applyFilters();
  }, [documents, activeFilter, searchQuery]);

  const getFilterTitle = (filter: FilterType): string => {
    switch (filter) {
      case 'all': return 'All Invoices';
      case 'draft': return 'Draft Invoices';
      case 'sent': return 'Sent Invoices';
      case 'paid': return 'Paid Invoices';
      case 'overdue': return 'Overdue Invoices';
      case 'outstanding': return 'Outstanding Invoices';
      case 'paid-this-month': return 'Paid This Month';
      default: return 'Invoices';
    }
  };

  const loadDocuments = async () => {
    if (!authUser) {
      setIsLoading(false);
      return;
    }

    const docs = await db.getUserDocuments(authUser.id);
    setDocuments(docs);
    setIsLoading(false);
  };

  const applyFilters = () => {
    const now = getCurrentDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let filtered = documents;

    switch (activeFilter) {
      case 'draft':
        filtered = documents.filter(doc => doc.status === 'draft');
        break;
      case 'sent':
        filtered = documents.filter(doc => doc.status === 'sent' && !isOverdue(doc));
        break;
      case 'paid':
        filtered = documents.filter(doc => doc.status === 'paid');
        break;
      case 'overdue':
        filtered = documents.filter(doc => isOverdue(doc));
        break;
      case 'outstanding':
        filtered = documents.filter(doc => doc.status === 'draft' || doc.status === 'sent');
        break;
      case 'paid-this-month':
        filtered = documents.filter(doc => {
          if (doc.status !== 'paid') return false;
          const paidDate = doc.paid_date ? new Date(doc.paid_date) : null;
          return paidDate && paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
        });
        break;
      default:
        filtered = documents;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(doc =>
        doc.client_name.toLowerCase().includes(query) ||
        doc.document_number.toLowerCase().includes(query)
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setFilterTitle(getFilterTitle(filter));
  };

  const handleInvoiceClick = (documentId: string) => {
    setSavedDocumentId(documentId);
    setPreviousScreen('invoices-list');
    setCurrentScreen('invoice-detail');
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (docId: string, e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -SWIPE_THRESHOLD) setSwipeState({ id: docId, dir: 'left' });
    else if (delta > SWIPE_THRESHOLD) setSwipeState({ id: docId, dir: 'right' });
    else setSwipeState(null);
  };
  const handleMouseDown = (e: React.MouseEvent) => { touchStartX.current = e.clientX; };
  const handleMouseUp = (docId: string, e: React.MouseEvent) => {
    const delta = e.clientX - touchStartX.current;
    if (delta < -SWIPE_THRESHOLD) setSwipeState({ id: docId, dir: 'left' });
    else if (delta > SWIPE_THRESHOLD) setSwipeState({ id: docId, dir: 'right' });
  };

  const handleShare = (docId: string) => { setSwipeState(null); setSavedDocumentId(docId); setPreviousScreen('invoices-list'); setCurrentScreen('invoice-detail'); };

  const handleMarkAsPaid = async (docId: string) => {
    setSwipeState(null);
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    const updated = await db.updateDocumentStatus(docId, 'paid', getCurrentDate().toISOString());
    if (updated) { showToast(`${formatCurrency(doc.total)} marked as paid`, 'success'); loadDocuments(); }
    else showToast('Failed to update invoice', 'error');
  };

  const handleMarkAsUnpaid = async (docId: string) => {
    setSwipeState(null);
    const updated = await db.updateDocumentStatus(docId, 'sent', undefined);
    if (updated) { showToast('Invoice marked as unpaid', 'success'); loadDocuments(); }
    else showToast('Failed to update invoice', 'error');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${ds.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8e8e93]">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${ds.bg} flex flex-col pb-28`}>
      <div className="px-4 pt-14 pb-4">

        <div className="flex items-end justify-between mb-5">
          <h1 className={`${ds.title1} text-black`}>Invoices</h1>
          <button
            onClick={() => setCurrentScreen('ai-generator')}
            className={`w-9 h-9 bg-[#f97316] rounded-full flex items-center justify-center ${ds.shadowOrange} ${ds.press} ${ds.transition} mb-1`}
          >
            <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map(f => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap ${ds.transition} ${
                activeFilter === f ? 'bg-[#f97316] text-white' : 'bg-[#e5e5ea] text-[#8e8e93]'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filteredDocuments.length === 0 ? (
          <div className={`${ds.card} p-10 text-center`}>
            <FileText className="w-10 h-10 text-[#c7c7cc] mx-auto mb-3" />
            <p className={`${ds.callout} text-[#8e8e93]`}>No {activeFilter !== 'all' ? activeFilter : ''} invoices</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {swipeState && <div className="fixed inset-0 z-10" onClick={() => setSwipeState(null)} />}
            {filteredDocuments.map((doc, idx) => {
              const isSwiped = swipeState?.id === doc.id;
              const swipeDir = isSwiped ? swipeState!.dir : null;
              const isPaid = calculateDocumentStatus(doc) === 'paid';
              const statusLabel = calculateDocumentStatus(doc);
              return (
                <div key={doc.id} className={`relative overflow-hidden ${idx < filteredDocuments.length - 1 ? 'border-b border-[#f2f2f7]' : ''}`}>
                  <div className="absolute right-0 top-0 bottom-0 w-20 bg-[#007aff] flex items-center justify-center z-20">
                    <button onClick={() => handleShare(doc.id)} className="flex flex-col items-center gap-1 w-full h-full justify-center">
                      <Share2 className="w-5 h-5 text-white" strokeWidth={2} />
                      <span className="text-white text-[11px] font-semibold">Share</span>
                    </button>
                  </div>
                  <div className={`absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center z-20 ${isPaid ? 'bg-[#ff9500]' : 'bg-[#34c759]'}`}>
                    <button onClick={() => isPaid ? handleMarkAsUnpaid(doc.id) : handleMarkAsPaid(doc.id)} className="flex flex-col items-center gap-1 w-full h-full justify-center">
                      <CheckCircle className="w-5 h-5 text-white" strokeWidth={2} />
                      <span className="text-white text-[11px] font-semibold">{isPaid ? 'Unpaid' : 'Paid'}</span>
                    </button>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { if (!isSwiped) handleInvoiceClick(doc.id); else setSwipeState(null); }}
                    onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !isSwiped) handleInvoiceClick(doc.id); }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={e => handleTouchEnd(doc.id, e)}
                    onMouseDown={handleMouseDown}
                    onMouseUp={e => handleMouseUp(doc.id, e)}
                    className="relative z-10 w-full flex items-center gap-3 px-4 py-3 bg-white cursor-pointer select-none"
                    style={{ transform: `translateX(${swipeDir === 'left' ? -ACTION_W : swipeDir === 'right' ? ACTION_W : 0}px)`, transition: 'transform 0.2s ease' }}
                  >
                    <div className="flex-1 text-left min-w-0">
                      <p className={`${ds.headline} text-black truncate`}>{doc.client_name}</p>
                      <p className={`${ds.footnote} text-[#8e8e93]`}>{doc.document_number} · {formatDate(doc.created_at)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`${ds.callout} ${ds.numeric} text-black`}>{formatCurrency(doc.total)}</p>
                      <span className={statusBadge(statusLabel as 'draft' | 'sent' | 'paid' | 'overdue' | 'viewed')}>{statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
