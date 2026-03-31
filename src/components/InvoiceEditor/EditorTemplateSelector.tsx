import { Check, LayoutGrid as Layout } from 'lucide-react';
import { templates } from '../../templates';

interface EditorTemplateSelectorProps {
  currentTemplate: string;
  onChange: (templateKey: string) => void;
}

export function EditorTemplateSelector({ currentTemplate, onChange }: EditorTemplateSelectorProps) {
  const invoiceTemplates = templates.filter(t => t.documentType === 'Invoice');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Layout className="w-4 h-4 text-gray-500" />
        <label className="text-sm font-medium text-gray-700">Template</label>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {invoiceTemplates.map((template) => (
          <button
            key={template.key}
            onClick={() => onChange(template.key)}
            className={`relative flex-shrink-0 w-24 rounded-lg overflow-hidden border-2 transition-all ${
              currentTemplate === template.key
                ? 'border-orange-500 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="aspect-[3/4] bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
              <div className="w-16 h-20 bg-white rounded shadow-sm border border-gray-200 p-1.5">
                <div className="h-2 bg-gray-300 rounded mb-1 w-3/4"></div>
                <div className="h-1 bg-gray-200 rounded mb-2 w-1/2"></div>
                <div className="space-y-0.5">
                  <div className="h-0.5 bg-gray-200 rounded"></div>
                  <div className="h-0.5 bg-gray-200 rounded"></div>
                  <div className="h-0.5 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
            <div className="p-2 bg-white border-t border-gray-100">
              <span className="text-xs font-medium text-gray-700 block text-center truncate">
                {template.name}
              </span>
            </div>
            {currentTemplate === template.key && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            {template.planTier === 'pro' && (
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 rounded text-[10px] font-bold text-white">
                PRO
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
