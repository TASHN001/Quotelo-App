import { useState, useEffect } from 'react';
import { FileText, Plus, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { isOverdue, calculateDocumentStatus } from '../lib/statusManager';
import { getCurrentDate } from '../lib/dateUtils';
import { ds, statusBadge } from '../lib/designSystem';
import type { Document } from '../lib/types';

type FilterType = 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'outstanding' | 'paid-this-month';

export function InvoicesList() {
  const { setCurrentScreen, authUser, formatCurrency, setSavedDocumentId } = useApp();
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
    setCurrentScreen('invoice-detail');
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
            {filteredDocuments.map((doc, idx) => (
              <button
                key={doc.id}
                onClick={() => handleInvoiceClick(doc.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 ${ds.transition} ${ds.press} ${
                  idx < filteredDocuments.length - 1 ? 'border-b border-[#f2f2f7]' : ''
                }`}
              >
                <div className="flex-1 text-left min-w-0">
                  <p className={`${ds.headline} text-black truncate`}>{doc.client_name}</p>
                  <p className={`${ds.footnote} text-[#8e8e93]`}>{doc.document_number} · {formatDate(doc.created_at)}</p>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-2">
                  <div>
                    <p className={`${ds.callout} ${ds.numeric} text-black`}>{formatCurrency(doc.total)}</p>
                    <span className={statusBadge(calculateDocumentStatus(doc) as 'draft' | 'sent' | 'paid' | 'overdue' | 'viewed')}>{calculateDocumentStatus(doc).charAt(0).toUpperCase() + calculateDocumentStatus(doc).slice(1)}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#c7c7cc] flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
