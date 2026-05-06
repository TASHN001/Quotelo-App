import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { ClientForm } from './ClientForm';
import { ds, statusBadge } from '../lib/designSystem';
import type { Client, Document } from '../lib/types';

export function ClientDetails() {
  const { setCurrentScreen, authUser, selectedClientId, setSavedDocumentId, formatCurrency } = useApp();
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
