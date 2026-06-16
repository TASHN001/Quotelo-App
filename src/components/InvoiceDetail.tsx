import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Download, Share2, CheckCircle, Copy, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import { getTemplate } from '../templates';
import { normalizeDocumentData } from '../lib/invoiceHelpers';
import { generatePDFBlob, getInvoiceFilename } from '../lib/pdfGenerator';
import {
  shareNatively,
  createInvoiceShareMessage,
  blobToFile,
  downloadBlob,
  canUseNativeShare
} from '../lib/shareUtils';
import { calculateDocumentStatus, getStatusLabel, getStatusColor } from '../lib/statusManager';
import { ds, statusBadge } from '../lib/designSystem';
import { EditableInvoiceLayout } from './EditableInvoiceLayout';
import { getCurrentTimestamp, getCurrentDate } from '../lib/dateUtils';
import type { LineItem } from './EditableLineItems';
import type { Document, DocumentLineItem, InvoiceData } from '../lib/types';
import type { Currency } from '../lib/currency';

export function InvoiceDetail() {
  const { setCurrentScreen, previousScreen, business, savedDocumentId, setSavedDocumentId, dbUserProfile, formatCurrency, showToast, authUser } = useApp();
  const [document, setDocument] = useState<Document | null>(null);
  const [lineItems, setLineItems] = useState<DocumentLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
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
        document.currency,
        (document.document_type ? (document.document_type.charAt(0).toUpperCase() + document.document_type.slice(1)) : 'Invoice') as 'Invoice' | 'Quote' | 'Receipt'
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
        document.currency,
        (document.document_type ? (document.document_type.charAt(0).toUpperCase() + document.document_type.slice(1)) : 'Invoice') as 'Invoice' | 'Quote' | 'Receipt'
      );

      const filename = getInvoiceFilename(document.document_number);
      const pdfBlob = await generatePDFBlob(invoiceRef.current, invoiceData);

      const shareMessage = createInvoiceShareMessage(
        invoiceData,
        business?.business_name,
        (document.currency || business?.default_currency || 'ZAR') as Currency
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
      <div className={`min-h-screen ${ds.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${ds.callout} text-[#8e8e93]`}>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className={`min-h-screen ${ds.bg} flex flex-col items-center justify-center p-6`}>
        <p className={`${ds.callout} text-[#8e8e93] mb-4`}>Invoice not found</p>
        <button onClick={() => setCurrentScreen('home')} className={ds.btnPrimary}>
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
    document.currency,
    (document.document_type ? (document.document_type.charAt(0).toUpperCase() + document.document_type.slice(1)) : 'Invoice') as 'Invoice' | 'Quote' | 'Receipt'
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
    <div className={`min-h-screen ${ds.bg} pb-28`}>
      {/* Sub-screen header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-[#f2f2f7]">
        <button onClick={() => setCurrentScreen(previousScreen as any)} className={ds.headerIconBtn}>
          <ChevronLeft className="w-4 h-4 text-[#3c3c43]" />
        </button>
        <p className={`${ds.headline} text-black`}>{document.document_number}</p>
        <button
          onClick={() => setCurrentScreen('invoice-editor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-[#f97316] text-white rounded-xl ${ds.footnote} font-semibold ${ds.shadowOrange} ${ds.press} ${ds.transition}`}
        >
          <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
          Edit
        </button>
      </div>

      <div className="px-4 flex flex-col gap-3 pt-3">
        {/* Hero card */}
        <div className={`bg-white rounded-[20px] p-5 ${ds.shadow1}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className={`${ds.title2} text-black ${ds.numeric}`}>{formatCurrency(document.total)}</p>
              <p className={`${ds.footnote} text-[#8e8e93] mt-0.5`}>{document.client_name}</p>
            </div>
            <span className={statusBadge(currentStatus as 'draft' | 'sent' | 'paid' | 'overdue' | 'viewed')}>
              {statusLabel}
            </span>
          </div>

          {/* Progress bar */}
          {(() => {
            const progressSteps = ['Draft', 'Sent', 'Viewed', 'Paid'];
            const activeIdx = Math.max(0, progressSteps.findIndex(s => s.toLowerCase() === currentStatus));
            return (
              <>
                <div className="flex gap-1.5">
                  {progressSteps.map((_, i) => (
                    <div key={i} className={`flex-1 h-1 rounded-full ${i <= activeIdx ? 'bg-[#f97316]' : 'bg-[#e5e5ea]'}`} />
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  {progressSteps.map((s, i) => (
                    <span key={s} className={`text-[10px] font-bold ${i <= activeIdx ? 'text-[#f97316]' : 'text-[#c7c7cc]'}`}>{s}</span>
                  ))}
                </div>
              </>
            );
          })()}
        </div>

        {/* Details grouped card */}
        <div>
          <p className={`${ds.caption} text-[#8e8e93] mb-2`}>DETAILS</p>
          <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {[
              { label: 'Client',     value: document.client_name },
              { label: 'Issue date', value: document.issue_date },
              { label: 'Due date',   value: document.due_date },
              { label: 'Subtotal',   value: formatCurrency(document.subtotal) },
              ...(document.tax_total > 0 ? [{ label: 'Tax', value: formatCurrency(document.tax_total) }] : []),
              { label: 'Total',      value: formatCurrency(document.total) },
            ].map(({ label, value }, idx, arr) => (
              <div key={label} className={`flex items-center justify-between px-4 py-3 ${idx < arr.length - 1 ? 'border-b border-[#f2f2f7]' : ''}`}>
                <span className={`${ds.callout} text-[#8e8e93]`}>{label}</span>
                <span className={`${ds.callout} font-semibold text-black`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice preview */}
        <div>
          <p className={`${ds.caption} text-[#8e8e93] mb-2`}>PREVIEW</p>
          <div ref={invoiceRef} className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-x-hidden">
            <EditableInvoiceLayout
              data={invoiceData}
              document={document}
              lineItems={lineItems}
              onUpdate={handleUpdateField}
              onUpdateLineItems={handleUpdateLineItems}
              styles={templateStyles}
              readOnly={true}
            />
          </div>
        </div>

        {/* Primary action row */}
        <div className="flex gap-3 mt-1">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`flex-1 ${ds.btnSecondary} flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {isExporting ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-5 h-5" strokeWidth={2} />
            )}
            <span>{isExporting ? 'Generating...' : 'Export PDF'}</span>
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className={`flex-1 ${ds.btnPrimary} flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {isSharing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Share2 className="w-5 h-5" strokeWidth={2} />
            )}
            <span>{isSharing ? 'Sharing...' : 'Share'}</span>
          </button>
        </div>

        {/* Secondary actions */}
        <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {currentStatus !== 'paid' && currentStatus !== 'cancelled' && (
            <button
              onClick={handleMarkAsPaid}
              disabled={isMarkingPaid}
              className="w-full px-4 py-3 flex items-center gap-3 border-b border-[#f2f2f7] disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5 text-[#34c759]" strokeWidth={2} />
              <span className={`${ds.callout} font-semibold text-black`}>
                {isMarkingPaid ? 'Marking...' : 'Mark as Paid'}
              </span>
            </button>
          )}
          <button
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className="w-full px-4 py-3 flex items-center gap-3 disabled:opacity-50"
          >
            <Copy className="w-5 h-5 text-[#007aff]" strokeWidth={2} />
            <span className={`${ds.callout} font-semibold text-black`}>
              {isDuplicating ? 'Duplicating...' : 'Duplicate Invoice'}
            </span>
          </button>
        </div>
      </div>

    </div>
  );
}
