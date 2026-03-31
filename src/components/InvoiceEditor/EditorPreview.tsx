import { forwardRef } from 'react';
import { getTemplate } from '../../templates';
import type { InvoiceData } from '../../lib/types';

interface EditorPreviewProps {
  invoiceData: InvoiceData;
  templateKey: string;
}

export const EditorPreview = forwardRef<HTMLDivElement, EditorPreviewProps>(
  ({ invoiceData, templateKey }, ref) => {
    let template = getTemplate(templateKey);

    if (!template && !templateKey.startsWith('invoice-')) {
      template = getTemplate(`invoice-${templateKey}`);
    }

    if (!template) {
      template = getTemplate('invoice-modern');
    }

    const TemplateComponent = template?.component;

    if (!TemplateComponent) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-500">Template not found</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Live Preview</span>
          <span className="text-xs text-gray-500">{template?.name || 'Modern'} Template</span>
        </div>
        <div
          ref={ref}
          className="p-4 sm:p-6 overflow-x-auto"
          style={{ minWidth: '320px' }}
        >
          <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left', width: '117.6%' }}>
            <TemplateComponent data={invoiceData} />
          </div>
        </div>
      </div>
    );
  }
);

EditorPreview.displayName = 'EditorPreview';
