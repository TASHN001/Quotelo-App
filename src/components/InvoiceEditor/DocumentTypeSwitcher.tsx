import { useState } from 'react';
import { FileText, Receipt, ClipboardList, AlertTriangle } from 'lucide-react';
import { ds } from '../../lib/designSystem';

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
      <div className="bg-white rounded-xl pt-2">
        <p className={`${ds.caption} text-[#8e8e93] mb-3 px-1`}>Document Type</p>
        <div className="bg-[#f2f2f7] rounded-xl p-1 flex">
          {documentTypes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTypeSelect(key)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg ${ds.transition} ${
                currentType === key
                  ? 'bg-white text-black shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                  : 'text-[#8e8e93]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[13px] font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#fff3e8] rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#f97316]" />
              </div>
              <h3 className={`${ds.title3} text-black`}>Change Document Type?</h3>
            </div>
            <p className={`${ds.callout} text-[#8e8e93] mb-6`}>
              Changing the document type from <strong className="text-black">{currentType}</strong> to{' '}
              <strong className="text-black">{pendingType}</strong> may affect status tracking and certain field labels.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWarning(false)}
                className={`flex-1 ${ds.btnSecondary} py-3 text-[15px]`}
              >
                Cancel
              </button>
              <button
                onClick={confirmChange}
                className={`flex-1 ${ds.btnPrimary} py-3 text-[15px]`}
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
