import { useState, useEffect } from 'react';
import { ArrowLeft, Check, SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ds } from '../lib/designSystem';
import { MinimalInvoice } from '../templates/invoice/Minimal';
import { ModernInvoice } from '../templates/invoice/Modern';
import { getSampleInvoiceData, TEMPLATE_METADATA } from '../lib/sampleData';
import { db } from '../lib/database';

const DEFAULTS_KEY = 'quotelo_document_defaults';

export interface DocumentDefaults {
  paymentDetails: string;
  termsConditions: string;
  footerMessage: string;
  notes: string;
}

export function loadDocumentDefaults(): DocumentDefaults {
  try {
    const stored = localStorage.getItem(DEFAULTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { paymentDetails: '', termsConditions: '', footerMessage: '', notes: '' };
}

function saveDocumentDefaults(defaults: DocumentDefaults) {
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(defaults));
}

export function DefaultsModal({ onClose }: { onClose: () => void }) {
  const [values, setValues] = useState<DocumentDefaults>(loadDocumentDefaults);

  const handleSave = () => {
    saveDocumentDefaults(values);
    onClose();
  };

  const field = (label: string, key: keyof DocumentDefaults, placeholder: string, rows = 3) => (
    <div key={key}>
      <label className="block text-xs font-semibold text-[#8e8e93] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <textarea
        rows={rows}
        value={values[key]}
        onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
        placeholder={placeholder}
        className={`${ds.input} resize-none text-sm`}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="flex-1" onClick={onClose} />
      <div className="bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#c7c7cc] rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#f2f2f7]">
          <h2 className="text-base font-bold text-black">Document Defaults</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#e5e5ea]">
            <X className="w-4 h-4 text-[#3c3c43]" />
          </button>
        </div>
        <p className="text-xs text-[#8e8e93] px-5 pt-3 pb-1">
          These details will automatically appear on all new invoices, quotes, and receipts.
        </p>
        {/* Fields */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-20 flex flex-col gap-4">
          {field('Banking Details', 'paymentDetails', 'e.g. Bank: FNB\nAccount: 123456789\nBranch: 250655', 4)}
          {field('Terms & Conditions', 'termsConditions', 'e.g. Payment due within 30 days of invoice date.', 3)}
          {field('Footer Message', 'footerMessage', 'e.g. Thank you for your business!', 2)}
          {field('Default Notes', 'notes', 'e.g. Please reference the invoice number when making payment.', 2)}
        </div>
        {/* Save */}
        <div className="px-5 py-4 border-t border-[#f2f2f7]">
          <button
            onClick={handleSave}
            className={`w-full ${ds.btnPrimary} py-3.5`}
          >
            Save Defaults
          </button>
        </div>
      </div>
    </div>
  );
}

export function TemplatePreview() {
  const { setCurrentScreen, selectedPreviewTemplateKey, authUser, showToast, refreshProfile } = useApp();
  const [isSelecting, setIsSelecting] = useState(false);
  const [showDefaults, setShowDefaults] = useState(false);
  const sampleData = getSampleInvoiceData();

  const templateKey = selectedPreviewTemplateKey || 'invoice-minimal';
  const template = TEMPLATE_METADATA[templateKey as keyof typeof TEMPLATE_METADATA];

  const renderTemplate = () => {
    switch (templateKey) {
      case 'invoice-minimal':
        return <MinimalInvoice data={sampleData} />;
      case 'invoice-modern':
        return <ModernInvoice data={sampleData} />;
      default:
        return <MinimalInvoice data={sampleData} />;
    }
  };

  const handleSelectTemplate = async () => {
    if (!authUser) {
      showToast('Please sign in to select a template', 'error');
      return;
    }

    setIsSelecting(true);

    try {
      await db.updateUserProfile(authUser.id, {
        selected_template_key: templateKey
      });

      await refreshProfile();

      showToast('Template selected', 'success');
      setCurrentScreen('templates-list');
    } catch (error) {
      console.error('Error selecting template:', error);
      showToast('Failed to select template', 'error');
    } finally {
      setIsSelecting(false);
    }
  };

  if (!template) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Template not found</p>
          <button
            onClick={() => setCurrentScreen('templates-list')}
            className={`px-6 py-3 ${ds.btnPrimary}`}
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white p-4 sm:p-6 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setCurrentScreen('templates-list')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-gray-900">{template.name}</h1>
            <p className="text-xs sm:text-sm text-gray-600">{template.description}</p>
          </div>
          <button
            onClick={() => setShowDefaults(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex-shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">Defaults</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          {renderTemplate()}
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-4 sm:p-6">
        <button
          onClick={handleSelectTemplate}
          disabled={isSelecting}
          className={`w-full ${ds.btnPrimary} py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
          {isSelecting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Selecting...</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5" strokeWidth={2} />
              <span>Continue</span>
            </>
          )}
        </button>
      </div>

      {showDefaults && <DefaultsModal onClose={() => setShowDefaults(false)} />}
    </div>
  );
}
