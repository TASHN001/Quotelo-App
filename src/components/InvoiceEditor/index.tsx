import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, Save, Download, AlertCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/database';
import { getTemplate, templates } from '../../templates';
import { normalizeDocumentData } from '../../lib/invoiceHelpers';
import { loadDocumentDefaults } from '../TemplatePreview';
import { generatePDFBlob, getInvoiceFilename } from '../../lib/pdfGenerator';
import { downloadBlob } from '../../lib/shareUtils';
import { ds } from '../../lib/designSystem';
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
    financials: false,
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

      const itemsToSave = lineItems.filter(item => item.name.trim() || item.unit_price > 0);
      await db.deleteDocumentLineItems(document.id);
      await db.createLineItems(itemsToSave.map((item, i) => ({
        document_id: document.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        line_total: item.line_total,
        sort_order: i
      })));

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
    setDocument(prev => prev ? { ...prev, ...updates } : null);
    setHasUnsavedChanges(true);
  }, []);

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

  // ponytail: useMemo here (before early returns) so the hook is always called unconditionally
  const invoiceData = useMemo((): InvoiceData => {
    if (!document) return {} as InvoiceData;
    const data = normalizeDocumentData(
      document.document_number,
      document.issue_date,
      document.due_date,
      document.client_name,
      document.client_email,
      lineItems.filter(item => item.name.trim() || item.unit_price > 0).map(item => ({
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
      document.terms_conditions || document.payment_terms,
      document.footer_message,
      document.currency,
      (document.document_type as 'Invoice' | 'Quote' | 'Receipt') || 'Invoice',
      document.custom_logo_url
    );
    const docDefaults = loadDocumentDefaults();
    return {
      ...data,
      paymentInstructions: docDefaults.paymentDetails || data.paymentInstructions,
      paymentTerms: data.paymentTerms || docDefaults.termsConditions || undefined,
      footer: data.footer || docDefaults.footerMessage || undefined,
      notes: data.notes || docDefaults.notes || undefined,
    };
  }, [document, lineItems, business, dbUserProfile]);

  const buildInvoiceData = (): InvoiceData => {
    if (!document) {
      return {} as InvoiceData;
    }

    const data = normalizeDocumentData(
      document.document_number,
      document.issue_date,
      document.due_date,
      document.client_name,
      document.client_email,
      lineItems.filter(item => item.name.trim() || item.unit_price > 0).map(item => ({
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
      document.terms_conditions || document.payment_terms,
      document.footer_message,
      document.currency,
      (document.document_type as 'Invoice' | 'Quote' | 'Receipt') || 'Invoice',
      document.custom_logo_url
    );

    const docDefaults = loadDocumentDefaults();
    return {
      ...data,
      paymentInstructions: docDefaults.paymentDetails || data.paymentInstructions,
      paymentTerms: data.paymentTerms || docDefaults.termsConditions || undefined,
      footer: data.footer || docDefaults.footerMessage || undefined,
      notes: data.notes || docDefaults.notes || undefined,
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${ds.callout} text-[#8e8e93]`}>Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <p className={`${ds.callout} text-[#8e8e93] mb-4`}>Document not found</p>
        <button
          onClick={() => setCurrentScreen('home')}
          className={ds.btnPrimary}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-10">
      {/* Sub-screen header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-[#f2f2f7]">
        <button onClick={() => handleNavigateAway('home')} className={ds.headerIconBtn}>
          <ArrowLeft className="w-4 h-4 text-[#3c3c43]" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className={`${ds.headline} text-black truncate`}>
            {document.document_type} Editor
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`${ds.footnote} text-[#8e8e93] truncate`}>{document.document_number}</span>
            {hasUnsavedChanges && (
              <span className={`flex items-center gap-1 ${ds.footnote} text-[#f97316]`}>
                <AlertCircle className="w-3 h-3" />
                Unsaved
              </span>
            )}
            {lastSaveTime && !hasUnsavedChanges && (
              <span className={`flex items-center gap-1 ${ds.footnote} text-[#34c759]`}>
                <Clock className="w-3 h-3" />
                Saved
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave()}
            disabled={isSaving || !hasUnsavedChanges}
            className={`${ds.headerIconBtn} ${hasUnsavedChanges ? 'bg-[#f97316] border-[#f97316]' : ''}`}
            title="Save"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className={`w-4 h-4 ${hasUnsavedChanges ? 'text-white' : 'text-[#3c3c43]'}`} />
            )}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className={ds.headerIconBtn}
            title="Export PDF"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-[#8e8e93] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-[#3c3c43]" />
            )}
          </button>
        </div>
      </div>

      {/* Edit/Preview tab switcher */}
      <div className="flex mx-4 mt-4 mb-2 bg-[#f2f2f7] rounded-xl p-1">
        {(['edit', 'preview'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-[14px] font-semibold ${ds.transition} ${
              activeTab === tab ? 'bg-white text-black shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'text-[#8e8e93]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-4">
        {activeTab === 'preview' ? (
          <div className="py-4">
            <EditorPreview
              ref={invoiceRef}
              invoiceData={invoiceData}
              templateKey={document.template_key || 'invoice-modern'}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-6">
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
        )}
      </div>

      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className={`${ds.title3} text-black mb-2`}>Unsaved Changes</h3>
            <p className={`${ds.callout} text-[#8e8e93] mb-6`}>
              You have unsaved changes. Would you like to save before leaving?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => confirmNavigation(false)}
                className={`flex-1 ${ds.btnSecondary} py-3 text-[15px]`}
              >
                Discard
              </button>
              <button
                onClick={() => confirmNavigation(true)}
                className={`flex-1 ${ds.btnPrimary} py-3 text-[15px]`}
              >
                Save & Exit
              </button>
            </div>
            <button
              onClick={() => setShowUnsavedWarning(false)}
              className={`w-full mt-3 py-2 ${ds.callout} text-[#8e8e93]`}
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
    <div className={`bg-white rounded-xl ${ds.shadow1} overflow-hidden ${ds.transition}`}>
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center justify-between ${ds.transition}`}
      >
        <div className="flex items-center gap-2">
          <span className={`${ds.headline} text-black`}>{title}</span>
          {badge && (
            <span className={`px-2 py-0.5 bg-[#fff3e8] text-[#f97316] ${ds.caption} rounded-full`}>
              {badge}
            </span>
          )}
        </div>
        <span className={`text-[#8e8e93] text-[20px] leading-none ${ds.transition}`}>
          {expanded ? '−' : '+'}
        </span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#f2f2f7]">
          {children}
        </div>
      )}
    </div>
  );
}
