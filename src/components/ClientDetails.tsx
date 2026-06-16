import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, FileDown, Share2, CheckCircle, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { ClientForm } from './ClientForm';
import { ds, statusBadge } from '../lib/designSystem';
import { downloadBlob } from '../lib/shareUtils';
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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
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

  const handleDownloadStatement = async () => {
    if (!client || documents.length === 0) return;

    const d = window.document;
    const container = d.createElement('div');
    Object.assign(container.style, {
      position: 'fixed',
      left: '-9999px',
      top: '0',
      width: '700px',
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      padding: '48px',
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
    });

    // Header
    const header = d.createElement('div');
    Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid #f97316' });

    const headerLeft = d.createElement('div');
    const title = d.createElement('h1');
    title.textContent = 'Customer Statement';
    Object.assign(title.style, { fontSize: '28px', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' });
    const subtitle = d.createElement('p');
    subtitle.textContent = `Client: ${client.name}`;
    Object.assign(subtitle.style, { fontSize: '14px', color: '#6b7280', margin: '0' });
    headerLeft.appendChild(title);
    headerLeft.appendChild(subtitle);

    const headerRight = d.createElement('div');
    Object.assign(headerRight.style, { textAlign: 'right' });
    const dateEl = d.createElement('p');
    dateEl.textContent = `Generated: ${new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    Object.assign(dateEl.style, { fontSize: '13px', color: '#6b7280', margin: '0 0 4px' });
    if (client.email) {
      const emailEl = d.createElement('p');
      emailEl.textContent = client.email;
      Object.assign(emailEl.style, { fontSize: '13px', color: '#6b7280', margin: '0' });
      headerRight.appendChild(emailEl);
    }
    headerRight.appendChild(dateEl);

    header.appendChild(headerLeft);
    header.appendChild(headerRight);
    container.appendChild(header);

    // Summary row
    const summaryRow = d.createElement('div');
    Object.assign(summaryRow.style, { display: 'flex', gap: '16px', marginBottom: '28px' });

    const makeSummaryCard = (label: string, value: string, accent: string) => {
      const card = d.createElement('div');
      Object.assign(card.style, { flex: '1', background: '#f9fafb', borderRadius: '8px', padding: '16px', borderLeft: `4px solid ${accent}` });
      const cardLabel = d.createElement('p');
      cardLabel.textContent = label;
      Object.assign(cardLabel.style, { fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' });
      const cardValue = d.createElement('p');
      cardValue.textContent = value;
      Object.assign(cardValue.style, { fontSize: '18px', fontWeight: '700', color: '#1a1a1a', margin: '0' });
      card.appendChild(cardLabel);
      card.appendChild(cardValue);
      return card;
    };

    const currency = documents[0]?.currency || 'ZAR';
    const fmt = (v: number) => v.toLocaleString('en-ZA', { style: 'currency', currency });

    summaryRow.appendChild(makeSummaryCard('Total Invoiced', fmt(outstandingBalance + totalPaid), '#f97316'));
    summaryRow.appendChild(makeSummaryCard('Amount Paid', fmt(totalPaid), '#34c759'));
    summaryRow.appendChild(makeSummaryCard('Outstanding', fmt(outstandingBalance), '#ff3b30'));
    container.appendChild(summaryRow);

    // Table
    const table = d.createElement('table');
    Object.assign(table.style, { width: '100%', borderCollapse: 'collapse', fontSize: '13px' });

    const thead = d.createElement('thead');
    const headRow = d.createElement('tr');
    Object.assign(headRow.style, { backgroundColor: '#f97316' });
    ['#', 'Invoice', 'Issue Date', 'Due Date', 'Amount', 'Status'].forEach((label, i) => {
      const th = d.createElement('th');
      th.textContent = label;
      Object.assign(th.style, {
        padding: '10px 12px',
        textAlign: i >= 4 ? 'right' : 'left',
        fontWeight: '600',
        color: '#ffffff',
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      });
      if (i === 0) th.style.width = '40px';
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = d.createElement('tbody');
    documents.forEach((doc, idx) => {
      const tr = d.createElement('tr');
      Object.assign(tr.style, { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' });

      const statusLabel = doc.status.charAt(0).toUpperCase() + doc.status.slice(1);
      const statusColor = doc.status === 'paid' ? '#34c759' : doc.status === 'overdue' ? '#ff3b30' : '#f97316';

      const cells: [string, 'left' | 'right', boolean][] = [
        [`${idx + 1}`, 'left', false],
        [doc.document_number, 'left', false],
        [doc.issue_date, 'left', false],
        [doc.due_date, 'left', false],
        [fmt(doc.total), 'right', false],
        [statusLabel, 'right', true],
      ];

      cells.forEach(([val, align, isStatus]) => {
        const td = d.createElement('td');
        Object.assign(td.style, {
          padding: '10px 12px',
          borderBottom: '1px solid #f2f2f7',
          textAlign: align,
          color: isStatus ? statusColor : '#1a1a1a',
          fontWeight: isStatus ? '600' : '400',
        });
        td.textContent = val;
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    // Footer
    const footer = d.createElement('p');
    footer.textContent = 'Generated by Quotelo';
    Object.assign(footer.style, { marginTop: '32px', fontSize: '11px', color: '#9ca3af', textAlign: 'center' });
    container.appendChild(footer);

    d.body.appendChild(container);
    await new Promise(resolve => requestAnimationFrame(resolve));

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const blob = await html2pdf().set({
        margin: 10,
        filename: `Statement-${client.name}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(container).outputPdf('blob');
      downloadBlob(blob as Blob, `Statement-${client.name}.pdf`);
    } finally {
      d.body.removeChild(container);
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
          {documents.length > 0 && (
            <button
              onClick={handleDownloadStatement}
              className={`p-2 bg-white rounded-xl border border-[#e5e5ea] ${ds.transition} ${ds.press}`}
              title="Download Statement"
            >
              <FileDown className="w-4 h-4 text-[#3c3c43]" />
            </button>
          )}
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
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-[#007aff] flex items-center justify-center">
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
