import { Check, LayoutGrid as Layout } from 'lucide-react';
import { templates } from '../../templates';
import { ds } from '../../lib/designSystem';

interface EditorTemplateSelectorProps {
  currentTemplate: string;
  onChange: (templateKey: string) => void;
}

export function EditorTemplateSelector({ currentTemplate, onChange }: EditorTemplateSelectorProps) {
  const invoiceTemplates = templates.filter(t => t.documentType === 'Invoice');

  return (
    <div className="bg-white rounded-xl pt-2">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Layout className="w-4 h-4 text-[#8e8e93]" />
        <p className={`${ds.caption} text-[#8e8e93]`}>Template</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {invoiceTemplates.map((template) => (
          <button
            key={template.key}
            onClick={() => onChange(template.key)}
            className={`relative flex-shrink-0 w-24 rounded-xl overflow-hidden border-2 ${ds.transition} ${
              currentTemplate === template.key
                ? 'border-[#f97316] shadow-[0_2px_8px_rgba(249,115,22,0.20)]'
                : 'border-[#f2f2f7]'
            }`}
          >
            <div className="aspect-[3/4] bg-[#f2f2f7] flex items-center justify-center">
              <div className="w-16 h-20 bg-white rounded-lg shadow-sm border border-[#f2f2f7] p-1.5">
                <div className="h-2 bg-[#c7c7cc] rounded mb-1 w-3/4"></div>
                <div className="h-1 bg-[#e5e5ea] rounded mb-2 w-1/2"></div>
                <div className="space-y-0.5">
                  <div className="h-0.5 bg-[#e5e5ea] rounded"></div>
                  <div className="h-0.5 bg-[#e5e5ea] rounded"></div>
                  <div className="h-0.5 bg-[#e5e5ea] rounded w-3/4"></div>
                </div>
              </div>
            </div>
            <div className="p-2 bg-white border-t border-[#f2f2f7]">
              <span className={`${ds.caption} text-black block text-center truncate`}>
                {template.name}
              </span>
            </div>
            {currentTemplate === template.key && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-[#f97316] rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            {template.planTier === 'pro' && (
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#f59e0b] rounded text-[10px] font-bold text-white">
                PRO
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
