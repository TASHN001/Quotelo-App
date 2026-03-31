import { useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { designSystem as ds } from '../lib/designSystem';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
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

  const icons = {
    success: <Check className="w-5 h-5 text-green-700 dark:text-green-400" strokeWidth={2.5} />,
    error: <X className="w-5 h-5 text-red-700 dark:text-red-400" strokeWidth={2.5} />,
    info: <AlertCircle className="w-5 h-5 text-blue-700 dark:text-blue-400" strokeWidth={2.5} />
  };

  const styles = {
    success: `${ds.badge.success.bg} ${ds.badge.success.darkBg} border-green-200 dark:border-green-800 ${ds.badge.success.text} ${ds.badge.success.darkText} ${ds.badge.success.shadow} ${ds.badge.success.darkShadow}`,
    error: `${ds.badge.error.bg} ${ds.badge.error.darkBg} border-red-200 dark:border-red-800 ${ds.badge.error.text} ${ds.badge.error.darkText} ${ds.badge.error.shadow} ${ds.badge.error.darkShadow}`,
    info: `${ds.badge.info.bg} ${ds.badge.info.darkBg} border-blue-200 dark:border-blue-800 ${ds.badge.info.text} ${ds.badge.info.darkText} ${ds.badge.info.shadow} ${ds.badge.info.darkShadow}`
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className={`${styles[type]} border ${ds.radius.md} p-4 flex items-center gap-3 min-w-[300px] max-w-md`}>
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <p className="font-medium flex-1">
          {message}
        </p>
        <button
          onClick={onClose}
          className={`flex-shrink-0 w-6 h-6 ${ds.radius.full} hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center ${ds.transition.base} active:scale-95`}
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
