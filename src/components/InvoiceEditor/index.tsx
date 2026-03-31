import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Save, Download, Eye, CreditCard as Edit3, ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/database';
import { getTemplate, templates } from '../../templates';
import { normalizeDocumentData } from '../../lib/invoiceHelpers';
import { generatePDFBlob, getInvoiceFilename } from '../../lib/pdfGenerator';
import { downloadBlob } from '../../lib/shareUtils';
import { designSystem as ds } from '../../lib/designSystem';
import type { Document, DocumentLineItem, InvoiceData, SavedLineItem, DocumentVersion } from '../../lib/types';
import { DocumentTypeSwitcher } from './DocumentTypeSwitcher';
import { EditorTemplateSelector } from './EditorTemplateSelector';
import { HeaderFieldsSection } from './HeaderFieldsSection';
import { LineItemsSection } from './LineItemsSection';
import { FinancialsSection } from './FinancialsSection';
import { AdditionalSection } from './AdditionalSection';
import { StatusTracker } from './StatusTracker';
import { VersionHistory } from './VersionHistory';
import { EditorPreview } from './EditorPreview';

export function InvoiceEditor() {
  const {
    setCurrentScreen,
    business,
    savedDocumentId,
    dbUserProfile,
    formatCurrency,
    showToast,
    authUser,
    refreshDocuments
  } = useApp();

  const [document, setDocument] = useState<Document | null>(null);
  const [lineItems, setLineItems] = useState<DocumentLineItem[]>([]);
  const [savedItems, setSavedItems] = useState<SavedLineItem[]>([]);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const [expandedSections, setExpandedSections] = useState({
    header: true,
    lineItems: true,
    financials: true,
    additional: false,
    status: false,
    versions: false
  });

  const invoiceRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadDocument();
    loadSavedItems();
  }, [savedDocumentId]);

  useEffect(() => {
    if (hasUnsavedChanges && document) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave();
      }, 30000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, document]);

  const loadDocument = async () => {
    if (!savedDocumentId) {
      setIsLoading(false);
      return;
    }

    const doc = await db.getDocument(savedDocumentId);
    if (!doc) {
      setIsLoading(false);
      return;
    }

    setDocument(doc);

    const items = await db.getDocumentLineItems(savedDocumentId);
    const sortedItems = items
      .filter(item => !item.is_archived)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    setLineItems(sortedItems);

    const docVersions = await db.getDocumentVersions(savedDocumentId);
    setVersions(docVersions);

    setIsLoading(false);
  };

  const loadSavedItems = async () => {
    if (!authUser) return;
    const items = await db.getSavedLineItems(authUser.id);
    setSavedItems(items);
  };

  const handleAutoSave = async () => {
    if (!document || !hasUnsavedChanges) return;
    await handleSave(true);
  };

  const handleSave = async (isAutoSave = false) => {
    if (!document || !authUser) return;

    setIsSaving(true);

    try {
      const snapshot = {
        document: { ...document },
        line_items: lineItems
      };
      await db.createDocumentVersion(document.id, authUser.id, snapshot);

      await db.updateDocument(document.id, {
        ...document,
        last_auto_save: new Date().toISOString()
      });

      await db.deleteDocumentLineItems(document.id);
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        await db.createLineItem({
          document_id: document.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          line_total: item.line_total,
          sort_order: i
        });
      }

      const docVersions = await db.getDocumentVersions(document.id);
      setVersions(docVersions);

      setHasUnsavedChanges(false);
      setLastSaveTime(new Date());

      if (!isAutoSave) {
        showToast('Document saved successfully', 'success');
      }
    } catch (error) {
      console.error('[InvoiceEditor] Error saving:', error);
      showToast('Failed to save document', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateDocument = useCallback((updates: Partial<Document>) => {
    if (!document) return;
    setDocument(prev => prev ? { ...prev, ...updates } : null);
    setHasUnsavedChanges(true);
  }, [document]);

  const handleUpdateBusinessLogo = useCallback(async (logoUrl: string) => {
    if (!business?.id) return;
    try {
      await db.updateBusiness(business.id, { logo_url: logoUrl });
      showToast('Profile logo updated', 'success');
    } catch {
      showToast('Failed to update profile logo', 'error');
    }
  }, [business?.id, showToast]);

  const handleUpdateLineItems = useCallback((items: DocumentLineItem[]) => {
    setLineItems(items);
    setHasUnsavedChanges(true);

    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
    const taxTotal = items.reduce((sum, item) => sum + (item.line_total * (item.tax_rate || 0) / 100), 0);

    setDocument(prev => {
      if (!prev) return null;
      const discountAmount = prev.discount_type === 'percentage'
        ? subtotal * (prev.discount_value || 0) / 100
        : (prev.discount_value || 0);
      const total = subtotal + taxTotal - discountAmount;
      const amountDue = total - (prev.partial_payments_total || 0);

      return {
        ...prev,
        subtotal,
        tax_total: taxTotal,
        total,
        amount_due: amountDue
      };
    });
  }, []);

  const handleExportPDF = async () => {
    if (!invoiceRef.current || !document) {
      showToast('Unable to generate PDF', 'error');
      return;
    }

    setIsExporting(true);

    try {
      const invoiceData = buildInvoiceData();
      const filename = getInvoiceFilename(document.document_number);
      const pdfBlob = await generatePDFBlob(invoiceRef.current, invoiceData);
      downloadBlob(pdfBlob, filename);
      showToast('PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('[InvoiceEditor] Error generating PDF:', error);
      showToast('Failed to generate PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!document) return;

    const success = await db.restoreDocumentVersion(document.id, versionId);
    if (success) {
      showToast('Version restored successfully', 'success');
      await loadDocument();
    } else {
      showToast('Failed to restore version', 'error');
    }
  };

  const handleNavigateAway = (screen: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(screen);
      setShowUnsavedWarning(true);
    } else {
      setCurrentScreen(screen);
    }
  };

  const confirmNavigation = async (save: boolean) => {
    if (save) {
      await handleSave();
    }
    setShowUnsavedWarning(false);
    if (pendingNavigation) {
      await refreshDocuments();
      setCurrentScreen(pendingNavigation);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const buildInvoiceData = (): InvoiceData => {
    if (!document) {
      return {} as InvoiceData;
    }

    return normalizeDocumentData(
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
      document.custom_signature_url || dbUserProfile?.signature_data_url,
      document.client_address,
      document.client_phone,
      document.reference,
      document.payment_details,
      document.payment_terms,
      document.footer_message,
      document.currency,
      (document.document_type as 'Invoice' | 'Quote' | 'Receipt') || 'Invoice',
      document.custom_logo_url
    );
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${ds.surfaces.base.light} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className={`min-h-screen ${ds.surfaces.base.light} flex flex-col items-center justify-center p-6`}>
        <p className="text-gray-600 mb-4">Document not found</p>
        <button
          onClick={() => setCurrentScreen('home')}
          className="px-6 py-3 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 text-white rounded-xl font-semibold"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const invoiceData = buildInvoiceData();

  return (
    <div className={`min-h-screen ${ds.surfaces.base.light} flex flex-col`}>
      <div className={`${ds.glass.light} border-b border-gray-200 px-4 py-3 sticky top-0 z-20`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigateAway('home')}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {document.document_type} Editor
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{document.document_number}</span>
                {hasUnsavedChanges && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="w-3 h-3" />
                    Unsaved
                  </span>
                )}
                {lastSaveTime && !hasUnsavedChanges && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Clock className="w-3 h-3" />
                    Saved
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSave()}
              disabled={isSaving || !hasUnsavedChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                hasUnsavedChanges
                  ? 'bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Save</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-gray-600" />
              )}
              <span className="hidden sm:inline text-gray-700">PDF</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-3 lg:hidden">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'edit'
                ? 'bg-orange-100 text-orange-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'preview'
                ? 'bg-orange-100 text-orange-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className={`flex-1 overflow-y-auto p-4 lg:p-6 ${activeTab === 'preview' ? 'hidden lg:block' : ''}`}>
          <div className="max-w-2xl mx-auto space-y-4">
            <DocumentTypeSwitcher
              currentType={document.document_type}
              onChange={(type) => handleUpdateDocument({ document_type: type })}
              showToast={showToast}
            />

            <EditorTemplateSelector
              currentTemplate={document.template_key || 'invoice-modern'}
              onChange={(key) => handleUpdateDocument({ template_key: key })}
            />

            <CollapsibleSection
              title="Header Information"
              expanded={expandedSections.header}
              onToggle={() => toggleSection('header')}
            >
              <HeaderFieldsSection
                document={document}
                business={business}
                onUpdate={handleUpdateDocument}
                onUpdateBusinessLogo={handleUpdateBusinessLogo}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Line Items"
              expanded={expandedSections.lineItems}
              onToggle={() => toggleSection('lineItems')}
            >
              <LineItemsSection
                lineItems={lineItems}
                savedItems={savedItems}
                onUpdate={handleUpdateLineItems}
                onSaveItem={async (item) => {
                  if (!authUser) return;
                  await db.createSavedLineItem(authUser.id, {
                    name: item.name,
                    default_quantity: item.quantity,
                    default_unit_price: item.unit_price,
                    default_tax_rate: item.tax_rate
                  });
                  await loadSavedItems();
                  showToast('Item saved for future use', 'success');
                }}
                formatCurrency={formatCurrency}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Financial Details"
              expanded={expandedSections.financials}
              onToggle={() => toggleSection('financials')}
            >
              <FinancialsSection
                document={document}
                onUpdate={handleUpdateDocument}
                formatCurrency={formatCurrency}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Additional Information"
              expanded={expandedSections.additional}
              onToggle={() => toggleSection('additional')}
            >
              <AdditionalSection
                document={document}
                business={business}
                onUpdate={handleUpdateDocument}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Status & Actions"
              expanded={expandedSections.status}
              onToggle={() => toggleSection('status')}
            >
              <StatusTracker
                document={document}
                onStatusChange={(status) => handleUpdateDocument({ status })}
                onDuplicate={async () => {
                  const timestamp = Date.now().toString().slice(-6);
                  const newDocNumber = `${document.document_number}-COPY-${timestamp}`;
                  const result = await db.duplicateDocument(document.id, newDocNumber);
                  if (result.success && result.document) {
                    showToast(`Duplicated as ${newDocNumber}`, 'success');
                  }
                }}
                formatCurrency={formatCurrency}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Version History"
              expanded={expandedSections.versions}
              onToggle={() => toggleSection('versions')}
              badge={versions.length > 0 ? versions.length.toString() : undefined}
            >
              <VersionHistory
                versions={versions}
                onRestore={handleRestoreVersion}
              />
            </CollapsibleSection>
          </div>
        </div>

        <div className={`lg:w-1/2 xl:w-2/5 bg-gray-100 overflow-y-auto border-l border-gray-200 ${activeTab === 'edit' ? 'hidden lg:block' : ''}`}>
          <div className="p-4 lg:p-6">
            <div className="sticky top-0">
              <EditorPreview
                ref={invoiceRef}
                invoiceData={invoiceData}
                templateKey={document.template_key || 'invoice-modern'}
              />
            </div>
          </div>
        </div>
      </div>

      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Unsaved Changes</h3>
            <p className="text-gray-600 mb-6">
              You have unsaved changes. Would you like to save before leaving?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => confirmNavigation(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Discard
              </button>
              <button
                onClick={() => confirmNavigation(true)}
                className="flex-1 py-2 px-4 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 text-white rounded-lg font-medium"
              >
                Save & Exit
              </button>
            </div>
            <button
              onClick={() => setShowUnsavedWarning(false)}
              className="w-full mt-3 py-2 text-gray-500 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}

function CollapsibleSection({ title, expanded, onToggle, badge, children }: CollapsibleSectionProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${ds.transition.base}`}>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
              {badge}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}
