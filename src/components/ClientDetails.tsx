import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Phone, FileText, Plus, Home as HomeIcon, User, Edit, DollarSign, MapPin, FileCheck, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { ClientForm } from './ClientForm';
import { CURRENCIES, getCurrencyInfo } from '../lib/currency';
import type { Client, Document } from '../lib/types';
import type { Currency } from '../lib/currency';

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'sent':
        return 'bg-orange-100 text-orange-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading client...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <p className="text-gray-600 mb-4">Client not found</p>
        <button
          onClick={() => setCurrentScreen('clients')}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
        >
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">
      <div className="bg-white p-4 sm:p-6 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setCurrentScreen('clients')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">{client.name}</h1>
            <p className="text-xs sm:text-sm text-gray-600">Client details</p>
          </div>
          <button
            onClick={() => setIsEditFormOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <Edit className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Financial Summary</h2>
            <button
              onClick={() => setCurrentScreen('ai-generator')}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow flex items-center gap-2"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span>Create Invoice</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-red-500" strokeWidth={2} />
                <p className="text-xs text-gray-600 font-medium">Outstanding</p>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(outstandingBalance)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="w-5 h-5 text-green-500" strokeWidth={2} />
                <p className="text-xs text-gray-600 font-medium">Paid</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-3">
            {client.email && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{client.email}</p>
                </div>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{client.phone}</p>
                </div>
              </div>
            )}
            {client.billing_address && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Address</p>
                  <p className="font-medium text-gray-900 whitespace-pre-line">{client.billing_address}</p>
                </div>
              </div>
            )}
            {client.tax_number && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Tax Number</p>
                  <p className="font-medium text-gray-900">{client.tax_number}</p>
                </div>
              </div>
            )}
            {client.client_currency && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Invoice Currency</p>
                  <p className="font-medium text-gray-900">
                    {getCurrencyInfo(client.client_currency as Currency).code} - {getCurrencyInfo(client.client_currency as Currency).name}
                  </p>
                </div>
              </div>
            )}
            {!client.email && !client.phone && !client.billing_address && !client.tax_number && !client.client_currency && (
              <p className="text-gray-500 text-sm">No contact information available</p>
            )}
          </div>
        </div>

        {client.notes && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Notes</h2>
            <p className="text-gray-700 whitespace-pre-line">{client.notes}</p>
          </div>
        )}

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Invoices</h3>
          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleInvoiceClick(doc.id)}
                  className="w-full bg-gray-50 rounded-2xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <div className="text-left flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900">{doc.document_number}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(doc.issue_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-bold text-gray-900 mb-1">
                      {formatCurrency(doc.total)}
                    </p>
                    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(doc.status)}`}>
                      {doc.status.toUpperCase()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No invoices yet</p>
              <p className="text-sm text-gray-400">Create an invoice for this client to get started</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-around relative">
          <button
            onClick={() => setCurrentScreen('home')}
            className="flex flex-col items-center gap-1 text-gray-400"
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
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <User className="w-6 h-6" strokeWidth={2} />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
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
