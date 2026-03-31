import { ArrowLeft, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTemplatesByDocumentType } from '../templates';

export function TemplateSelector() {
  const { setCurrentScreen, selectedDocumentType, dbUserProfile, setSelectedTemplateKey } = useApp();

  const templates = getTemplatesByDocumentType(
    selectedDocumentType,
    dbUserProfile?.plan_tier || 'free'
  );

  const handleSelectTemplate = (templateKey: string) => {
    setSelectedTemplateKey(templateKey);
    setCurrentScreen('document-preview');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setCurrentScreen('ai-generator')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Choose Template</h1>
        </div>

        <p className="text-gray-600">
          Select a template for your {selectedDocumentType.toLowerCase()}
        </p>
      </div>

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-4">
          {templates.map((template) => {
            const isLocked = template.planTier === 'pro' && dbUserProfile?.plan_tier === 'free';

            return (
              <button
                key={template.key}
                onClick={() => !isLocked && handleSelectTemplate(template.key)}
                disabled={isLocked}
                className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                  isLocked
                    ? 'border-gray-200 bg-gray-50 opacity-60'
                    : 'border-gray-200 bg-white hover:border-orange-500 hover:shadow-lg'
                }`}
              >
                {isLocked && (
                  <div className="absolute top-4 right-4 bg-orange-500 text-white p-2 rounded-lg">
                    <Lock className="w-4 h-4" />
                  </div>
                )}

                <h3 className="text-xl font-bold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {template.documentType} Template
                </p>

                <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center min-h-[200px]">
                  <p className="text-gray-400 text-sm">Template Preview</p>
                </div>

                {isLocked && (
                  <div className="mt-4 text-center">
                    <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
                      Pro Members Only
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No templates available for {selectedDocumentType}</p>
          </div>
        )}
      </div>
    </div>
  );
}
