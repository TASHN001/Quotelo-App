import { useState, useEffect } from 'react';
import { ArrowLeft, Search, FileText, Home as HomeIcon, User, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { isOverdue, calculateDocumentStatus } from '../lib/statusManager';
import { getCurrentDate } from '../lib/dateUtils';
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

  const getStatusBadge = (doc: Document) => {
    const status = calculateDocumentStatus(doc);

    switch (status) {
      case 'paid':
        return (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            Paid
          </span>
        );
      case 'sent':
        return (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            Sent
          </span>
        );
      case 'overdue':
        return (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            Overdue
          </span>
        );
      case 'draft':
        return (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            Draft
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            {status}
          </span>
        );
    }
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
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col pb-24">
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{filterTitle}</h1>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client or invoice number..."
            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'draft', 'sent', 'paid', 'overdue'] as FilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {filteredDocuments.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No invoices found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {searchQuery ? 'Try a different search term' : 'Create an invoice to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleInvoiceClick(doc.id)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">{doc.client_name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{doc.document_number}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(doc.created_at)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900 dark:text-white mb-1">{formatCurrency(doc.total)}</p>
                  {getStatusBadge(doc)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-around relative">
          <button
            onClick={() => setCurrentScreen('home')}
            className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500"
          >
            <HomeIcon className="w-6 h-6" strokeWidth={2} />
            <span className="text-xs font-medium">Home</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setCurrentScreen('ai-generator')}
              className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg absolute -top-8 left-1/2 -translate-x-1/2"
            >
              <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
            </button>
          </div>

          <button
            onClick={() => setCurrentScreen('profile')}
            className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500"
          >
            <User className="w-6 h-6" strokeWidth={2} />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
