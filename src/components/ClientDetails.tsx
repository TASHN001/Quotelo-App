import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Share2, CheckCircle, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { ClientForm } from './ClientForm';
import { ds, statusBadge } from '../lib/designSystem';
import { getCurrentDate } from '../lib/dateUtils';
import { calculateDocumentStatus } from '../lib/statusManager';
import type { Client, Document } from '../lib/types';

export function ClientDetails() {
  const {
    setCurrentScreen, setPreviousScreen, authUser, selectedClientId,
    setSavedDocumentId, formatCurrency, setSelectedClient, showToast,
  } = useApp();
  const [client, setClient] = useState<Client | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [swipeState, setSwipeState] = useState<{ id: string; dir: 'left' | 'right' } | null>(null);
  const touchStartX = useRef(0);
  const SWIPE_THRESHOLD = 50;
  const ACTION_W = 80;

  useEffect(() => {
    loadClientData();
  }, [selectedClientId, authUser]);

  const loadClientData = async () => {
    if (!selectedClientId || !authUser) {
      setIsLoading(false);
      return;
    }
    const clientData = await db.getClient(selectedClientId);
    setClient(clientData);
    const docs = await db.getClientDocuments(selectedClientId, authUser.id);
    setDocuments(docs);
    setIsLoading(false);
  };

  const outstandingBalance = documents
    .filter(doc => doc.status !== 'paid')
    .reduce((sum, doc) => sum + doc.total, 0);

  const totalPaid = documents
    .filter(doc => doc.status === 'paid')
    .reduce((sum, doc) => sum + doc.total, 0);

  const handleInvoiceClick = (documentId: string) => {
    setSavedDocumentId(documentId);
    setPreviousScreen('client-detail');
    setCurrentScreen('invoice-detail');
  };

  const handleShare = (docId: string) => {
    setSwipeState(null);
    setSavedDocumentId(docId);
    setPreviousScreen('client-detail');
    setCurrentScreen('invoice-detail');
  };

  const handleMarkAsPaid = async (docId: string) => {
    setSwipeState(null);
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    const updated = await db.updateDocumentStatus(docId, 'paid', getCurrentDate().toISOString());
    if (updated) {
      showToast(`${formatCurrency(doc.total)} marked as paid`, 'success');
      loadClientData();
    } else {
      showToast('Failed to update invoice', 'error');
    }
  };

  const handleMarkAsUnpaid = async (docId: string) => {
    setSwipeState(null);
    const updated = await db.updateDocumentStatus(docId, 'sent', undefined);
    if (updated) {
      showToast('Invoice marked as unpaid', 'success');
      loadClientData();
    } else {
      showToast('Failed to update invoice', 'error');
    }
  };

  const handleCreateInvoice = () => {
    if (!client) return;
    setSelectedClient(client);
    setCurrentScreen('ai-generator');
  };

  const CLOSE_THRESHOLD = 10;
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (docId: string, e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    const currentDir = swipeState?.id === docId ? swipeState.dir : null;
    if (currentDir === 'left') {
      setSwipeState(delta > CLOSE_THRESHOLD ? null : { id: docId, dir: 'left' });
    } else if (currentDir === 'right') {
      setSwipeState(delta < -CLOSE_THRESHOLD ? null : { id: docId, dir: 'right' });
    } else {
      if (delta < -SWIPE_THRESHOLD) setSwipeState({ id: docId, dir: 'left' });
      else if (delta > SWIPE_THRESHOLD) setSwipeState({ id: docId, dir: 'right' });
      else setSwipeState(null);
    }
  };
  const handleMouseDown = (e: React.MouseEvent) => { touchStartX.current = e.clientX; };
  const handleMouseUp = (docId: string, e: React.MouseEvent) => {
    const delta = e.clientX - touchStartX.current;
    const currentDir = swipeState?.id === docId ? swipeState.dir : null;
    if (currentDir === 'left') {
      if (delta > CLOSE_THRESHOLD) setSwipeState(null);
    } else if (currentDir === 'right') {
      if (delta < -CLOSE_THRESHOLD) setSwipeState(null);
    } else {
      if (delta < -SWIPE_THRESHOLD) setSwipeState({ id: docId, dir: 'left' });
      else if (delta > SWIPE_THRESHOLD) setSwipeState({ id: docId, dir: 'right' });
    }
  };


  if (isLoading) {
    return (
      <div className={`min-h-screen ${ds.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8e8e93]">Loading client...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className={`min-h-screen ${ds.bg} flex flex-col items-center justify-center p-6`}>
        <p className="text-[#8e8e93] mb-4">Client not found</p>
        <button onClick={() => setCurrentScreen('clients')} className={ds.btnPrimary}>
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${ds.bg} pb-28`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => setCurrentScreen('clients')} className={ds.headerIconBtn}>
          <ChevronLeft className="w-4 h-4 text-[#3c3c43]" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className={`${ds.title2} text-black truncate`}>{client.name}</h1>
          {client.company_name && (
            <p className={`${ds.footnote} text-[#8e8e93]`}>{client.company_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditFormOpen(true)}
            className={`p-2 bg-white rounded-xl border border-[#e5e5ea] ${ds.transition} ${ds.press}`}
            title="Edit Client"
          >
            <Pencil className="w-4 h-4 text-[#3c3c43]" />
          </button>
          <button
            onClick={handleCreateInvoice}
            className={`px-3 py-2 bg-[#f97316] text-white rounded-xl ${ds.footnote} font-semibold ${ds.transition} ${ds.press} ${ds.shadowOrange}`}
          >
            + Invoice
          </button>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`${ds.card} p-4`}>
            <p className={`${ds.caption} text-[#8e8e93] mb-1`}>OUTSTANDING</p>
            <p className={`${ds.title2} text-black ${ds.numeric}`}>{formatCurrency(outstandingBalance)}</p>
          </div>
          <div className={`${ds.card} p-4`}>
            <p className={`${ds.caption} text-[#8e8e93] mb-1`}>PAID</p>
            <p className={`${ds.title2} text-black ${ds.numeric}`}>{formatCurrency(totalPaid)}</p>
          </div>
        </div>

        {/* Contact info */}
        <div>
          <p className={`${ds.caption} text-[#8e8e93] mb-2`}>CONTACT</p>
          <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {[
              { label: 'Email', value: client.email },
              { label: 'Phone', value: client.phone },
              { label: 'Address', value: client.billing_address },
            ].filter(row => row.value).map(({ label, value }, idx, arr) => (
              <div key={label} className={`flex items-center justify-between px-4 py-3 ${idx < arr.length - 1 ? 'border-b border-[#f2f2f7]' : ''}`}>
                <span className={`${ds.callout} text-[#8e8e93]`}>{label}</span>
                <span className={`${ds.callout} text-black font-medium text-right max-w-[60%] truncate`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice history with swipe actions */}
        {documents.length > 0 && (
          <div>
            <p className={`${ds.caption} text-[#8e8e93] mb-2`}>INVOICES</p>
            <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              {documents.map((doc, idx) => {
                const isSwiped = swipeState?.id === doc.id;
                const swipeDir = isSwiped ? swipeState!.dir : null;
                const isPaid = calculateDocumentStatus(doc) === 'paid';
                const statusLabel = calculateDocumentStatus(doc);
                return (
                  <div
                    key={doc.id}
                    className={`relative overflow-hidden ${idx < documents.length - 1 ? 'border-b border-[#f2f2f7]' : ''}`}
                  >
                    {/* Share panel */}
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-[#f97316] flex items-center justify-center">
                      <button
                        onClick={() => handleShare(doc.id)}
                        className="flex flex-col items-center gap-1 w-full h-full justify-center"
                      >
                        <Share2 className="w-5 h-5 text-white" strokeWidth={2} />
                        <span className="text-white text-[11px] font-semibold">Share</span>
                      </button>
                    </div>
                    {/* Paid/Unpaid panel */}
                    <div className={`absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center ${isPaid ? 'bg-[#ff9500]' : 'bg-[#34c759]'}`}>
                      <button
                        onClick={() => isPaid ? handleMarkAsUnpaid(doc.id) : handleMarkAsPaid(doc.id)}
                        className="flex flex-col items-center gap-1 w-full h-full justify-center"
                      >
                        <CheckCircle className="w-5 h-5 text-white" strokeWidth={2} />
                        <span className="text-white text-[11px] font-semibold">{isPaid ? 'Unpaid' : 'Paid'}</span>
                      </button>
                    </div>
                    {/* Swipeable card */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => { if (!isSwiped) handleInvoiceClick(doc.id); else setSwipeState(null); }}
                      onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !isSwiped) handleInvoiceClick(doc.id); }}
                      onTouchStart={e => { if (swipeState && swipeState.id !== doc.id) setSwipeState(null); handleTouchStart(e); }}
                      onTouchEnd={e => handleTouchEnd(doc.id, e)}
                      onMouseDown={handleMouseDown}
                      onMouseUp={e => handleMouseUp(doc.id, e)}
                      className="relative z-10 w-full flex items-center justify-between px-4 py-3 bg-white cursor-pointer select-none"
                      style={{
                        transform: `translateX(${swipeDir === 'left' ? -ACTION_W : swipeDir === 'right' ? ACTION_W : 0}px)`,
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <div className="text-left">
                        <p className={`${ds.callout} font-semibold text-black`}>{doc.document_number}</p>
                        <p className={`${ds.footnote} text-[#8e8e93]`}>{doc.issue_date}</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <p className={`${ds.callout} ${ds.numeric} text-black`}>{formatCurrency(doc.total)}</p>
                        <span className={statusBadge(statusLabel as 'draft' | 'sent' | 'paid' | 'overdue' | 'viewed')}>
                          {statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ClientForm
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        client={client}
        onSave={loadClientData}
      />
    </div>
  );
}
