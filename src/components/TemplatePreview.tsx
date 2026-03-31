import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MinimalInvoice } from '../templates/invoice/Minimal';
import { ModernInvoice } from '../templates/invoice/Modern';
import { getSampleInvoiceData, TEMPLATE_METADATA } from '../lib/sampleData';
import { db } from '../lib/database';

export function TemplatePreview() {
  const { setCurrentScreen, selectedPreviewTemplateKey, authUser, showToast, refreshProfile } = useApp();
  const [isSelecting, setIsSelecting] = useState(false);
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
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
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
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </div>
  );
}
