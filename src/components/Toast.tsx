import { useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ds } from '../lib/designSystem';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-slide-up">
      <div className={`bg-white ${ds.radiusMd} ${ds.shadow2} px-4 py-3 flex items-center gap-3`}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          type === 'success' ? 'bg-[#d1fae5]' :
          type === 'error'   ? 'bg-[#fee2e2]' :
          type === 'warning' ? 'bg-[#fef3c7]' :
                               'bg-[#dbeafe]'
        }`}>
          {type === 'success' ? <CheckCircle className="w-4 h-4 text-[#065f46]" /> :
           type === 'error'   ? <AlertCircle className="w-4 h-4 text-[#991b1b]" /> :
           type === 'warning' ? <AlertTriangle className="w-4 h-4 text-[#92400e]" /> :
                                <Info className="w-4 h-4 text-[#1d4ed8]" />}
        </div>
        <p className={`${ds.callout} text-black flex-1`}>{message}</p>
        <button onClick={onClose} className="text-[#c7c7cc] ml-2">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
