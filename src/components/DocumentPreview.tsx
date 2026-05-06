import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ds } from '../lib/designSystem';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { getTemplate, getMockInvoiceData } from '../templates';
import { normalizeInvoiceDraft } from '../lib/invoiceHelpers';
import { getCurrentTimestamp } from '../lib/dateUtils';
import type { InvoiceData } from '../lib/types';

export function DocumentPreview() {
  const {
    setCurrentScreen,
    selectedTemplateKey,
    business,
    invoiceDraft,
    authUser,
    setSavedDocumentId,
    refreshDocuments,
    showToast,
    dbUserProfile,
    selectedClient,
    refreshProfile,
    t
  } = useApp();
  const [isSaving, setIsSaving] = useState(false);

  if (!selectedTemplateKey) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">{t('documentPreview.noTemplate')}</p>
      </div>
    );
  }

  let template = getTemplate(selectedTemplateKey);

  // Fallback: Try adding 'invoice-' prefix for legacy keys
  if (!template && !selectedTemplateKey.startsWith('invoice-')) {
    template = getTemplate(`invoice-${selectedTemplateKey}`);
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">{t('documentPreview.templateNotFound')}</p>
      </div>
    );
  }

  let invoiceData: InvoiceData;

  if (invoiceDraft) {
    invoiceData = normalizeInvoiceDraft(
      invoiceDraft,
      business,
      dbUserProfile?.signature_data_url,
      undefined,
      selectedClient
    );
  } else {
    invoiceData = getMockInvoiceData();
    if (business) {
      invoiceData.business.name = business.business_name;
      invoiceData.business.email = business.email;
      invoiceData.business.phone = business.phone;
      invoiceData.business.logoUrl = business.logo_url;
    }
    invoiceData.signatureDataUrl = dbUserProfile?.signature_data_url;
  }

  const TemplateComponent = template.component;

  const handleSaveInvoice = async () => {
    if (!invoiceDraft || !authUser || !business) {
      showToast(t('documentPreview.missingData'), 'error');
      return;
    }

    setIsSaving(true);

    const invoiceNumber = `INV-${getCurrentTimestamp()}`;

    const lineItems = invoiceDraft.items.map(item => ({
      name: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: 0,
      lineTotal: item.total
    }));

    const paymentTerms = {
      dueType: 'net_30' as const,
      latePaymentNotice: 'Late payments may incur fees or result in service suspension.'
    };

    const result = await db.saveInvoiceWithLineItems(
      authUser.id,
      business.id,
      {
        documentType: 'invoice',
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
        notes: invoiceDraft.notes || undefined,
        paymentTerms: JSON.stringify(paymentTerms),
        footerMessage: 'Thank you for your business!',
        templateKey: selectedTemplateKey || undefined,
        clientId: selectedClient?.id
      },
      lineItems
    );

    setIsSaving(false);

    if (!result.success || !result.document) {
      showToast(result.error || t('toast.error'), 'error');
      return;
    }

    showToast(t('toast.invoiceSaved'), 'success');
    setSavedDocumentId(result.document.id);
    await refreshDocuments();

    if (dbUserProfile && !dbUserProfile.onboarding_complete) {
      console.log('[DocumentPreview] First invoice saved during onboarding, completing onboarding...');
      await db.updateUserProfile(authUser.id, {
        onboarding_complete: true
      });
      await refreshProfile();
    }

    setCurrentScreen('invoice-detail');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col overflow-x-hidden">
      <div className="bg-white p-4 sm:p-6 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4 max-w-full">
          <button
            onClick={() => setCurrentScreen('template-selector')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">{template.name}</h1>
            <p className="text-xs sm:text-sm text-gray-600 truncate">{t('documentPreview.preview')}</p>
          </div>
          <button
            onClick={handleSaveInvoice}
            disabled={isSaving || !invoiceDraft}
            className={`px-4 sm:px-6 py-2 sm:py-3 ${ds.btnPrimary} text-sm sm:text-base flex-shrink-0 disabled:opacity-50`}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('documentPreview.saving')}</span>
              </div>
            ) : (
              t('documentPreview.continue')
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-0 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto bg-white sm:rounded-xl sm:shadow-xl overflow-x-hidden">
          <TemplateComponent data={invoiceData} />
        </div>
      </div>
    </div>
  );
}
