import { useState } from 'react';
import { FileText, Receipt, ClipboardList, AlertTriangle } from 'lucide-react';

interface DocumentTypeSwitcherProps {
  currentType: string;
  onChange: (type: string) => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const documentTypes = [
  { key: 'Invoice', label: 'Invoice', icon: FileText },
  { key: 'Quote', label: 'Quote', icon: ClipboardList },
  { key: 'Receipt', label: 'Receipt', icon: Receipt }
];

export function DocumentTypeSwitcher({ currentType, onChange, showToast }: DocumentTypeSwitcherProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [pendingType, setPendingType] = useState<string | null>(null);

  const handleTypeSelect = (type: string) => {
    if (type === currentType) return;
    setPendingType(type);
    setShowWarning(true);
  };

  const confirmChange = () => {
    if (pendingType) {
      onChange(pendingType);
      if (showToast) {
        showToast(`Document type changed to ${pendingType}`, 'success');
      }
    }
    setShowWarning(false);
    setPendingType(null);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="text-sm font-medium text-gray-700 mb-3 block">Document Type</label>
        <div className="flex gap-2">
          {documentTypes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTypeSelect(key)}
              className={`flex-1 flex flex-col items-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                currentType === key
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Change Document Type?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Changing the document type from <strong>{currentType}</strong> to{' '}
              <strong>{pendingType}</strong> may affect status tracking and certain field labels.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmChange}
                className="flex-1 py-2 px-4 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 text-white rounded-lg font-medium"
              >
                Change Type
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
