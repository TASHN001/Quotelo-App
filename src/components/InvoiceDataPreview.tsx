import { useState } from 'react';
import { CheckCircle2, Calendar, DollarSign, User, FileText, ArrowRight, Pencil, Check, X, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { ds } from '../lib/designSystem';
import { loadDocumentDefaults } from './TemplatePreview';

export function InvoiceDataPreview() {
  const {
    invoiceDraft, setInvoiceDraft, setCurrentScreen,
    selectedClient, formatCurrency,
    authUser, business, selectedTemplateKey,
    setSavedDocumentId, refreshDocuments, showToast,
    dbUserProfile, refreshProfile,
  } = useApp();

  // All useState calls MUST precede the early return to satisfy React hooks rules.
  // States are initialised from invoiceDraft (or safe fallbacks if null).
  const [editMode, setEditMode] = useState(false);
  const [clientName, setClientName] = useState(invoiceDraft?.client?.name || '');
  const [clientEmail, setClientEmail] = useState(invoiceDraft?.client?.email || '');
  const [issueDate, setIssueDate] = useState(invoiceDraft?.issueDate || '');
  const [dueDate, setDueDate] = useState(invoiceDraft?.dueDate || '');
  const [notes, setNotes] = useState(invoiceDraft?.notes || '');
  const [items, setItems] = useState(
    (invoiceDraft?.items || []).map(i => ({ ...i }))
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndContinue = async () => {
    if (!invoiceDraft || !authUser || !business) {
      showToast('Missing required data. Please try again.', 'error');
      return;
    }

    setIsSaving(true);

    const invoiceNumber = await db.getNextDocumentNumber(
      authUser.id,
      (invoiceDraft.documentType?.toLowerCase() || 'invoice') as 'invoice' | 'quote' | 'receipt'
    );
    const docDefaults = loadDocumentDefaults();

    const lineItems = invoiceDraft.items.map(item => ({
      name: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: 0,
      lineTotal: item.total,
    }));

    const result = await db.saveInvoiceWithLineItems(
      authUser.id,
      business.id,
      {
        documentType: (invoiceDraft.documentType?.toLowerCase() || 'invoice') as 'invoice' | 'quote' | 'receipt',
        documentNumber: invoiceNumber,
        status: 'sent',
        clientName: selectedClient?.name || invoiceDraft.client.name || 'Client',
        clientEmail: selectedClient?.email || invoiceDraft.client.email || '',
        clientPhone: selectedClient?.phone,
        clientAddress: selectedClient?.billing_address,
        issueDate: invoiceDraft.issueDate,
        dueDate: invoiceDraft.dueDate,
        subtotal: invoiceDraft.subtotal,
        taxTotal: invoiceDraft.tax,
        total: invoiceDraft.total,
        currency: selectedClient?.client_currency || business.default_currency,
        notes: invoiceDraft.notes || docDefaults.notes || undefined,
        paymentDetails: docDefaults.paymentDetails || undefined,
        paymentTerms: docDefaults.termsConditions || undefined,
        footerMessage: docDefaults.footerMessage || 'Thank you for your business!',
        templateKey: selectedTemplateKey || undefined,
        clientId: selectedClient?.id,
      },
      lineItems
    );

    setIsSaving(false);

    if (!result.success || !result.document) {
      showToast(result.error || 'Failed to save invoice. Please try again.', 'error');
      return;
    }

    showToast(`${invoiceDraft?.documentType || 'Invoice'} saved successfully`, 'success');
    setSavedDocumentId(result.document.id);
    await refreshDocuments();

    if (dbUserProfile && !dbUserProfile.onboarding_complete) {
      await db.updateUserProfile(authUser.id, { onboarding_complete: true });
      await refreshProfile();
    }

    setCurrentScreen('invoice-detail');
  };

  if (!invoiceDraft) {
    setCurrentScreen('home');
    return null;
  }

  const handleSaveEdits = () => {
    const updatedItems = items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));
    const subtotal = updatedItems.reduce((s, i) => s + i.total, 0);
    const taxRate = invoiceDraft.subtotal > 0 ? invoiceDraft.tax / invoiceDraft.subtotal : 0;
    const tax = subtotal * taxRate;

    setInvoiceDraft({
      ...invoiceDraft,
      client: { name: clientName || null, email: clientEmail || null },
      issueDate,
      dueDate,
      notes: notes || null,
      items: updatedItems,
      subtotal,
      tax,
      total: subtotal + tax,
    });
    setEditMode(false);
  };

  const updateItem = (index: number, field: 'description' | 'quantity' | 'unitPrice', value: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return { ...item, [field]: field === 'description' ? value : (parseFloat(value) || 0) };
    }));
  };

  const inputCls = `${ds.input} text-sm py-2 mt-1`;

  const cardCls = 'bg-white rounded-2xl p-5 border-2 border-green-200 shadow-sm';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col pb-6">
      {/* Header */}
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">{invoiceDraft.documentType || 'Invoice'} Created!</h1>
        <p className="text-gray-600 text-center text-sm">
          {editMode ? 'Edit the fields below then tap Save.' : 'Review the details we extracted from your voice'}
        </p>
      </div>

      <div className="flex-1 p-6 space-y-4 overflow-y-auto">

        {/* Client card */}
        {(selectedClient || invoiceDraft.client?.name) && (
          <div className={cardCls}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Client</p>
                {editMode && !selectedClient ? (
                  <>
                    <input
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Client name"
                      className={inputCls}
                    />
                    <input
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                      placeholder="Email (optional)"
                      className={`${inputCls} mt-2`}
                    />
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {selectedClient?.name || invoiceDraft.client?.name}
                    </h3>
                    {(selectedClient?.email || invoiceDraft.client?.email) && (
                      <p className="text-sm text-gray-600 truncate">
                        {selectedClient?.email || invoiceDraft.client?.email}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Amount card */}
        <div className={cardCls}>
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

        {/* Dates card */}
        <div className={cardCls}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Dates</p>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              {editMode ? (
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Issue Date</p>
                    <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Due Date</p>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
                  </div>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>

        {/* Line items card */}
        <div className={cardCls}>
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
                {(editMode ? items : invoiceDraft.items).map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    {editMode ? (
                      <div className="space-y-2">
                        <input
                          value={items[index].description}
                          onChange={e => updateItem(index, 'description', e.target.value)}
                          placeholder="Description"
                          className={inputCls}
                        />
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">Qty</p>
                            <input
                              type="number"
                              value={items[index].quantity}
                              onChange={e => updateItem(index, 'quantity', e.target.value)}
                              className={inputCls}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">Unit Price</p>
                            <input
                              type="number"
                              value={items[index].unitPrice}
                              onChange={e => updateItem(index, 'unitPrice', e.target.value)}
                              className={inputCls}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{item.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <p className="font-bold text-gray-900 text-sm flex-shrink-0">{formatCurrency(item.total)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {(invoiceDraft.notes || editMode) && (
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</p>
            {editMode ? (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Additional notes..."
                className={inputCls}
              />
            ) : (
              <p className="text-sm text-gray-700">{invoiceDraft.notes}</p>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-6 bg-white border-t border-gray-200">
        {editMode ? (
          <div className="flex gap-3">
            <button
              onClick={() => setEditMode(false)}
              className="flex-1 h-14 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all transform active:scale-95"
            >
              <X className="w-5 h-5" strokeWidth={2} />
              Cancel
            </button>
            <button
              onClick={handleSaveEdits}
              className={`flex-1 h-14 flex items-center justify-center gap-2 ${ds.btnPrimary} transform active:scale-95`}
            >
              <Check className="w-5 h-5" strokeWidth={2.5} />
              Save Changes
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setEditMode(true)}
              className="flex-1 h-14 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all transform active:scale-95"
            >
              <Pencil className="w-5 h-5" strokeWidth={2} />
              Edit Details
            </button>
            <button
              onClick={handleSaveAndContinue}
              disabled={isSaving}
              className={`flex-1 h-14 flex items-center justify-center gap-2 ${ds.btnPrimary} transform active:scale-95 disabled:opacity-60`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                  Saving…
                </>
              ) : (
                <>
                  Looks Good
                  <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
