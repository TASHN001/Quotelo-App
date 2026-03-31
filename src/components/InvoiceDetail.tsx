import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, Share2, MessageCircle, Home as HomeIcon, User, Plus, CheckCircle, Copy, CreditCard as Edit3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { getTemplate } from '../templates';
import { normalizeDocumentData } from '../lib/invoiceHelpers';
import { generatePDFBlob, getInvoiceFilename } from '../lib/pdfGenerator';
import { storage } from '../lib/storage';
import {
  shareNatively,
  createInvoiceShareMessage,
  openWhatsApp,
  blobToFile,
  downloadBlob,
  canUseNativeShare
} from '../lib/shareUtils';
import { calculateDocumentStatus, getStatusLabel, getStatusColor } from '../lib/statusManager';
import { EditableInvoiceLayout } from './EditableInvoiceLayout';
import { getCurrentTimestamp, getCurrentDate } from '../lib/dateUtils';
import type { LineItem } from './EditableLineItems';
import type { Document, DocumentLineItem, InvoiceData } from '../lib/types';

export function InvoiceDetail() {
  const { setCurrentScreen, business, savedDocumentId, setSavedDocumentId, dbUserProfile, formatCurrency, showToast, authUser } = useApp();
  const [document, setDocument] = useState<Document | null>(null);
  const [lineItems, setLineItems] = useState<DocumentLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isWhatsAppSharing, setIsWhatsAppSharing] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDocument();
  }, [savedDocumentId]);

  const loadDocument = async () => {
    if (!savedDocumentId) {
      console.error('[InvoiceDetail] No document ID provided');
      setIsLoading(false);
      return;
    }

    const doc = await db.getDocument(savedDocumentId);
    if (!doc) {
      console.error('[InvoiceDetail] Document not found');
      setIsLoading(false);
      return;
    }

    setDocument(doc);

    const items = await db.getDocumentLineItems(savedDocumentId);
    setLineItems(items);

    setIsLoading(false);
  };

  const handleUpdateField = async (field: string, value: any) => {
    if (!document || !savedDocumentId) return;

    try {
      const updates: Partial<Document> = { [field]: value };
      const updated = await db.updateDocument(savedDocumentId, updates);

      if (updated) {
        setDocument(updated);
        showToast('Updated successfully', 'success');
      }
    } catch (error) {
      console.error('[InvoiceDetail] Error updating field:', error);
      showToast('Failed to update', 'error');
      throw error;
    }
  };

  const handleUpdateLineItems = async (items: LineItem[]) => {
    if (!document || !savedDocumentId) return;

    try {
      await db.deleteDocumentLineItems(savedDocumentId);

      for (const item of items) {
        await db.addDocumentLineItem(savedDocumentId, {
          name: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          line_total: item.total
        });
      }

      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxRate = document.tax_total / document.subtotal || 0;
      const taxTotal = subtotal * taxRate;
      const total = subtotal + taxTotal;

      await db.updateDocument(savedDocumentId, {
        subtotal,
        tax_total: taxTotal,
        total
      });

      await loadDocument();
      showToast('Line items updated', 'success');
    } catch (error) {
      console.error('[InvoiceDetail] Error updating line items:', error);
      showToast('Failed to update line items', 'error');
      throw error;
    }
  };

  const handleExportPDF = async () => {
    if (!invoiceRef.current || !document) {
      showToast('Unable to generate PDF', 'error');
      return;
    }

    setIsExporting(true);

    try {
      const invoiceData: InvoiceData = normalizeDocumentData(
        document.document_number,
        document.issue_date,
        document.due_date,
        document.client_name,
        document.client_email,
        lineItems.map(item => ({
          description: item.name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.line_total
        })),
        document.subtotal,
        document.tax_total,
        document.total,
        document.notes,
        business,
        dbUserProfile?.signature_data_url,
        document.client_address,
        document.client_phone,
        document.reference,
        document.payment_details,
        document.payment_terms,
        document.footer_message,
        document.currency
      );

      const filename = getInvoiceFilename(document.document_number);
      const pdfBlob = await generatePDFBlob(invoiceRef.current, invoiceData);

      downloadBlob(pdfBlob, filename);
      showToast('PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('[InvoiceDetail] Error generating PDF:', error);
      showToast('Failed to generate PDF. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!invoiceRef.current || !document || !authUser) {
      showToast('Unable to share invoice', 'error');
      return;
    }

    setIsSharing(true);

    try {
      const invoiceData: InvoiceData = normalizeDocumentData(
        document.document_number,
        document.issue_date,
        document.due_date,
        document.client_name,
        document.client_email,
        lineItems.map(item => ({
          description: item.name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.line_total
        })),
        document.subtotal,
        document.tax_total,
        document.total,
        document.notes,
        business,
        dbUserProfile?.signature_data_url,
        document.client_address,
        document.client_phone,
        document.reference,
        document.payment_details,
        document.payment_terms,
        document.footer_message,
        document.currency
      );

      const filename = getInvoiceFilename(document.document_number);
      const pdfBlob = await generatePDFBlob(invoiceRef.current, invoiceData);

      const shareMessage = createInvoiceShareMessage(
        invoiceData,
        business?.business_name,
        formatCurrency(0).replace('0', '').trim()
      );

      if (canUseNativeShare()) {
        const pdfFile = await blobToFile(pdfBlob, filename);
        const shared = await shareNatively({
          title: `Invoice ${document.document_number}`,
          text: shareMessage,
          files: [pdfFile]
        });

        if (shared) {
          showToast('Invoice shared successfully', 'success');
        }
      } else {
        downloadBlob(pdfBlob, filename);
        showToast('PDF downloaded. Native sharing not supported on this device.', 'success');
      }
    } catch (error) {
      console.error('[InvoiceDetail] Error sharing invoice:', error);
      showToast('Failed to share invoice. Please try again.', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const handleWhatsAppShare = async () => {
    if (!invoiceRef.current || !document || !authUser) {
      showToast('Unable to share to WhatsApp', 'error');
      return;
    }

    setIsWhatsAppSharing(true);

    try {
      const invoiceData: InvoiceData = normalizeDocumentData(
        document.document_number,
        document.issue_date,
        document.due_date,
        document.client_name,
        document.client_email,
        lineItems.map(item => ({
          description: item.name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.line_total
        })),
        document.subtotal,
        document.tax_total,
        document.total,
        document.notes,
        business,
        dbUserProfile?.signature_data_url,
        document.client_address,
        document.client_phone,
        document.reference,
        document.payment_details,
        document.payment_terms,
        document.footer_message,
        document.currency
      );

      const filename = getInvoiceFilename(document.document_number);
      const pdfBlob = await generatePDFBlob(invoiceRef.current, invoiceData);

      const uploadResult = await storage.uploadPDF(pdfBlob, filename, authUser.id);

      if (uploadResult.error || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Failed to upload PDF');
      }

      const shareMessage = createInvoiceShareMessage(
        invoiceData,
        business?.business_name,
        formatCurrency(0).replace('0', '').trim()
      );

      const whatsappMessage = `${shareMessage}\n\nDownload PDF: ${uploadResult.url}`;

      openWhatsApp(whatsappMessage, document.client_phone);
      showToast('Opening WhatsApp...', 'success');
    } catch (error) {
      console.error('[InvoiceDetail] Error sharing to WhatsApp:', error);
      showToast('Failed to share to WhatsApp. Please try again.', 'error');
    } finally {
      setIsWhatsAppSharing(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!document) return;

    setIsMarkingPaid(true);

    try {
      const paidDate = getCurrentDate().toISOString();
      const updated = await db.updateDocumentStatus(document.id, 'paid', paidDate);

      if (updated) {
        showToast(`Invoice marked as paid - ${formatCurrency(document.total)}`, 'success');
        await loadDocument();
      } else {
        showToast('Failed to mark invoice as paid', 'error');
      }
    } catch (error) {
      console.error('[InvoiceDetail] Error marking as paid:', error);
      showToast('Failed to mark invoice as paid', 'error');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleDuplicate = async () => {
    if (!document) return;

    setIsDuplicating(true);

    try {
      const timestamp = getCurrentTimestamp().toString().slice(-6);
      const newDocNumber = `${document.document_number}-COPY-${timestamp}`;

      const result = await db.duplicateDocument(document.id, newDocNumber);

      if (result.success && result.document) {
        showToast(`Invoice duplicated as ${newDocNumber}`, 'success');
        setSavedDocumentId(result.document.id);
        await loadDocument();
      } else {
        showToast('Failed to duplicate invoice', 'error');
      }
    } catch (error) {
      console.error('[InvoiceDetail] Error duplicating invoice:', error);
      showToast('Failed to duplicate invoice', 'error');
    } finally {
      setIsDuplicating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <p className="text-gray-600 mb-4">Invoice not found</p>
        <button
          onClick={() => setCurrentScreen('home')}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const invoiceData: InvoiceData = normalizeDocumentData(
    document.document_number,
    document.issue_date,
    document.due_date,
    document.client_name,
    document.client_email,
    lineItems.map(item => ({
      description: item.name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      total: item.line_total
    })),
    document.subtotal,
    document.tax_total,
    document.total,
    document.notes,
    business,
    dbUserProfile?.signature_data_url,
    document.client_address,
    document.client_phone,
    document.reference,
    document.payment_details,
    document.payment_terms,
    document.footer_message,
    document.currency
  );

  let template = document.template_key ? getTemplate(document.template_key) : null;

  // Fallback: Try adding 'invoice-' prefix for legacy keys
  if (!template && document.template_key && !document.template_key.startsWith('invoice-')) {
    template = getTemplate(`invoice-${document.template_key}`);
  }

  const templateStyles = template?.component ? {
    container: 'bg-white p-4 sm:p-6 md:p-8 w-full max-w-full box-border',
    header: 'flex flex-col sm:flex-row items-start justify-between mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-gray-900 gap-4',
    logoContainer: 'w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0',
    invoiceTitle: 'text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900',
    invoiceNumber: 'text-xs sm:text-sm text-gray-600 font-medium',
    metaRow: 'grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8',
    infoLabel: 'text-xs font-semibold text-gray-500 uppercase mb-2',
    infoText: 'text-xs sm:text-sm text-gray-900',
    dateRow: 'mt-4 sm:mt-6 space-y-2',
    dateLabel: 'text-xs font-semibold text-gray-500 uppercase',
    dateValue: 'text-xs sm:text-sm text-gray-900 mt-1',
    tableContainer: 'w-full overflow-x-auto mb-6 sm:mb-8 -mx-4 sm:mx-0',
    tableHeader: 'border-b-2 border-gray-900',
    tableHeaderCell: 'text-left py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold text-gray-900',
    tableRow: 'border-b border-gray-200',
    tableCell: 'py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm text-gray-900',
    totalsContainer: 'flex justify-end mb-6 sm:mb-8',
    totalRow: 'flex justify-between py-1.5 sm:py-2 text-xs sm:text-sm',
    totalLabel: 'text-gray-600',
    totalValue: 'text-gray-900',
    grandTotalRow: 'flex justify-between py-2 sm:py-3 border-t-2 border-gray-900',
    grandTotalLabel: 'text-base sm:text-lg font-bold text-gray-900',
    grandTotalValue: 'text-lg sm:text-xl font-bold text-gray-900',
    footer: 'space-y-3 sm:space-y-4 mt-6 sm:mt-8',
    footerLabel: 'text-xs font-semibold text-gray-500 uppercase mb-1',
    footerText: 'text-xs sm:text-sm text-gray-700'
  } : {};

  const currentStatus = calculateDocumentStatus(document);
  const statusColors = getStatusColor(document);
  const statusLabel = getStatusLabel(document);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col pb-24">
      <div className="bg-white p-4 sm:p-6 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setCurrentScreen('home')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">Invoice {document.document_number}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                {document.client_name} • {new Date(document.created_at).toLocaleDateString()}
              </p>
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors.bg} ${statusColors.text} ${statusColors.darkBg} ${statusColors.darkText}`}>
                {statusLabel}
              </span>
            </div>
          </div>
          <button
            onClick={() => setCurrentScreen('invoice-editor')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-0 sm:p-4 md:p-6">
        <div ref={invoiceRef} className="max-w-4xl mx-auto bg-white sm:rounded-xl sm:shadow-xl overflow-x-hidden mb-4 sm:mb-6">
          <EditableInvoiceLayout
            data={invoiceData}
            document={document}
            lineItems={lineItems}
            onUpdate={handleUpdateField}
            onUpdateLineItems={handleUpdateLineItems}
            styles={templateStyles}
          />
        </div>

        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 px-4 sm:px-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="bg-white border-2 border-gray-200 text-gray-900 py-4 px-6 rounded-xl font-semibold hover:border-gray-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" strokeWidth={2} />
                  <span>Export PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handleWhatsAppShare}
              disabled={isWhatsAppSharing}
              className="bg-white border-2 border-green-500 text-green-600 py-4 px-6 rounded-xl font-semibold hover:bg-green-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWhatsAppSharing ? (
                <>
                  <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" strokeWidth={2} />
                  <span>WhatsApp</span>
                </>
              )}
            </button>

            <button
              onClick={handleShare}
              disabled={isSharing}
              className="bg-white border-2 border-orange-500 text-orange-600 py-4 px-6 rounded-xl font-semibold hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSharing ? (
                <>
                  <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" strokeWidth={2} />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {currentStatus !== 'paid' && currentStatus !== 'cancelled' && (
              <button
                onClick={handleMarkAsPaid}
                disabled={isMarkingPaid}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMarkingPaid ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Marking...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" strokeWidth={2} />
                    <span>Mark as Paid</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className={`bg-white border-2 border-blue-500 text-blue-600 py-4 px-6 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                currentStatus === 'paid' || currentStatus === 'cancelled' ? 'sm:col-span-2' : ''
              }`}
            >
              {isDuplicating ? (
                <>
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Duplicating...</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" strokeWidth={2} />
                  <span>Duplicate Invoice</span>
                </>
              )}
            </button>
          </div>
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
    </div>
  );
}
