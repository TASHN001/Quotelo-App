import { CheckCircle2, Calendar, DollarSign, User, FileText, ArrowRight, Edit } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ds } from '../lib/designSystem';

export function InvoiceDataPreview() {
  const { invoiceDraft, setCurrentScreen, selectedClient, formatCurrency } = useApp();

  if (!invoiceDraft) {
    setCurrentScreen('home');
    return null;
  }

  const handleLooksGood = () => {
    setCurrentScreen('document-preview');
  };

  const handleMakeChanges = () => {
    setCurrentScreen('ai-generator');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100  flex flex-col pb-6">
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Invoice Created!</h1>
        <p className="text-gray-600 text-center text-sm">
          Review the details we extracted from your voice
        </p>
      </div>

      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {selectedClient && (
          <div className="bg-white rounded-2xl p-5 border-2 border-green-200 shadow-sm animate-slide-up">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Client</p>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 truncate">{selectedClient.name}</h3>
                {selectedClient.email && (
                  <p className="text-sm text-gray-600 truncate">{selectedClient.email}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {invoiceDraft.client && !selectedClient && (
          <div className="bg-white rounded-2xl p-5 border-2 border-green-200 shadow-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Client</p>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                {invoiceDraft.client.name && (
                  <h3 className="text-lg font-bold text-gray-900 truncate">{invoiceDraft.client.name}</h3>
                )}
                {invoiceDraft.client.email && (
                  <p className="text-sm text-gray-600 truncate">{invoiceDraft.client.email}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 border-2 border-green-200 shadow-sm animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Total Amount</p>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(invoiceDraft.total)}</h3>
              {invoiceDraft.tax > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Subtotal: {formatCurrency(invoiceDraft.subtotal)} + Tax: {formatCurrency(invoiceDraft.tax)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-green-200 shadow-sm animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Dates</p>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Issue Date</p>
                  <p className="text-base font-semibold text-gray-900">{invoiceDraft.issueDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="text-base font-semibold text-gray-900">{invoiceDraft.dueDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-green-200 shadow-sm animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Line Items</p>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-3">
                {invoiceDraft.items.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{item.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900 text-sm flex-shrink-0">{formatCurrency(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {invoiceDraft.notes && (
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-gray-700">{invoiceDraft.notes}</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-gray-200">
        <div className="flex gap-3">
          <button
            onClick={handleMakeChanges}
            className="flex-1 h-14 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all transform active:scale-95"
          >
            <Edit className="w-5 h-5" strokeWidth={2} />
            Make Changes
          </button>
          <button
            onClick={handleLooksGood}
            className={`flex-1 h-14 flex items-center justify-center gap-2 ${ds.btnPrimary} transform active:scale-95`}
          >
            Looks Good
            <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
