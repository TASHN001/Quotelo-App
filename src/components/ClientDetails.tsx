import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { ClientForm } from './ClientForm';
import { ds, statusBadge } from '../lib/designSystem';
import { downloadBlob } from '../lib/shareUtils';
import type { Client, Document } from '../lib/types';

export function ClientDetails() {
  const { setCurrentScreen, authUser, selectedClientId, setSavedDocumentId, formatCurrency, setSelectedClient } = useApp();
  const [client, setClient] = useState<Client | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

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

    const balance = await db.getClientOutstandingBalance(selectedClientId, authUser.id);
    setOutstandingBalance(balance);

    const paid = docs
      .filter(doc => doc.status === 'paid')
      .reduce((sum, doc) => sum + doc.total, 0);
    setTotalPaid(paid);

    setIsLoading(false);
  };

  const handleInvoiceClick = (documentId: string) => {
    setSavedDocumentId(documentId);
    setCurrentScreen('invoice-detail');
  };

  const handleCreateInvoice = () => {
    if (!client) return;
    setSelectedClient(client);
    setCurrentScreen('ai-generator');
  };

  const handleDownloadStatement = async () => {
    if (!client || documents.length === 0) return;

    const d = window.document;
    const container = d.createElement('div');
    Object.assign(container.style, { position: 'fixed', left: '-9999px', top: '0', width: '700px', fontFamily: 'sans-serif', padding: '40px', backgroundColor: '#ffffff' });

    const h1 = d.createElement('h1');
    h1.textContent = 'Customer Statement';
    Object.assign(h1.style, { fontSize: '24px', fontWeight: '700', marginBottom: '4px' });
    container.appendChild(h1);

    const sub = d.createElement('p');
    sub.textContent = `Client: ${client.name}   •   Generated ${new Date().toLocaleDateString('en-ZA')}`;
    Object.assign(sub.style, { color: '#888', marginBottom: '24px' });
    container.appendChild(sub);

    const table = d.createElement('table');
    Object.assign(table.style, { width: '100%', borderCollapse: 'collapse' });

    const thead = d.createElement('thead');
    const headRow = d.createElement('tr');
    Object.assign(headRow.style, { background: '#f97316', color: 'white' });
    ['Invoice', 'Issued', 'Due', 'Amount', 'Status'].forEach((label, i) => {
      const th = d.createElement('th');
      th.textContent = label;
      Object.assign(th.style, { padding: '10px 12px', textAlign: i === 3 ? 'right' : 'left', fontWeight: '600' });
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = d.createElement('tbody');
    documents.forEach(doc => {
      const tr = d.createElement('tr');
      const cells: [string, 'left' | 'right'][] = [
        [doc.document_number, 'left'],
        [doc.issue_date, 'left'],
        [doc.due_date, 'left'],
        [doc.total.toLocaleString('en-ZA', { style: 'currency', currency: doc.currency || 'ZAR' }), 'right'],
        [doc.status, 'left'],
      ];
      cells.forEach(([val, align]) => {
        const td = d.createElement('td');
        td.textContent = val;
        Object.assign(td.style, { padding: '8px 12px', borderBottom: '1px solid #f2f2f7', textAlign: align });
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);

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
        <button
          onClick={() => setCurrentScreen('clients')}
          className={ds.btnPrimary}
        >
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${ds.bg} pb-28`}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => setCurrentScreen('clients')} className={ds.headerIconBtn}>
          <ChevronLeft className="w-4 h-4 text-[#3c3c43]" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className={`${ds.title2} text-black truncate`}>{client?.name || 'Client'}</h1>
          <p className={`${ds.footnote} text-[#8e8e93]`}>{client?.company_name}</p>
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
            onClick={handleCreateInvoice}
            className={`px-3 py-2 bg-[#f97316] text-white rounded-xl ${ds.footnote} font-semibold ${ds.transition} ${ds.press} ${ds.shadowOrange}`}
          >
            + Invoice
          </button>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* Contact info */}
        <div>
          <p className={`${ds.caption} text-[#8e8e93] mb-2`}>CONTACT</p>
          <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {[
              { label: 'Email',   value: client?.email },
              { label: 'Phone',   value: client?.phone },
              { label: 'Address', value: client?.billing_address },
            ].filter(row => row.value).map(({ label, value }, idx, arr) => (
              <div key={label} className={`flex items-center justify-between px-4 py-3 ${idx < arr.length - 1 ? 'border-b border-[#f2f2f7]' : ''}`}>
                <span className={`${ds.callout} text-[#8e8e93]`}>{label}</span>
                <span className={`${ds.callout} text-black font-medium text-right max-w-[60%] truncate`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice history */}
        {documents.length > 0 && (
          <div>
            <p className={`${ds.caption} text-[#8e8e93] mb-2`}>INVOICES</p>
            <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              {documents.map((doc, idx) => (
                <button
                  key={doc.id}
                  onClick={() => handleInvoiceClick(doc.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 ${ds.transition} ${ds.press} ${
                    idx < documents.length - 1 ? 'border-b border-[#f2f2f7]' : ''
                  }`}
                >
                  <div className="text-left">
                    <p className={`${ds.callout} font-semibold text-black`}>{doc.document_number}</p>
                    <p className={`${ds.footnote} text-[#8e8e93]`}>{doc.issue_date}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <p className={`${ds.callout} ${ds.numeric} text-black`}>{formatCurrency(doc.total)}</p>
                    <span className={statusBadge(doc.status as 'draft' | 'sent' | 'paid' | 'overdue' | 'viewed')}>{doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}</span>
                  </div>
                </button>
              ))}
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
