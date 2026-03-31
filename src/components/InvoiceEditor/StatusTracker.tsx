import { CheckCircle, Send, Clock, AlertTriangle, Ban, Copy } from 'lucide-react';
import type { Document } from '../../lib/types';

interface StatusTrackerProps {
  document: Document;
  onStatusChange: (status: Document['status']) => void;
  onDuplicate: () => void;
  formatCurrency: (amount: number) => string;
}

const statusOptions: { key: Document['status']; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { key: 'draft', label: 'Draft', icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' },
  { key: 'sent', label: 'Sent', icon: Send, color: 'text-blue-600', bg: 'bg-blue-100' },
  { key: 'paid', label: 'Paid', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  { key: 'overdue', label: 'Overdue', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  { key: 'cancelled', label: 'Cancelled', icon: Ban, color: 'text-gray-400', bg: 'bg-gray-100' }
];

export function StatusTracker({ document, onStatusChange, onDuplicate, formatCurrency }: StatusTrackerProps) {
  const currentStatus = statusOptions.find(s => s.key === document.status) || statusOptions[0];
  const CurrentIcon = currentStatus.icon;

  return (
    <div className="pt-4 space-y-4">
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <div className={`w-10 h-10 ${currentStatus.bg} rounded-full flex items-center justify-center`}>
          <CurrentIcon className={`w-5 h-5 ${currentStatus.color}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500">Current Status</p>
          <p className={`text-lg font-semibold ${currentStatus.color}`}>
            {currentStatus.label}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Amount</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(document.total)}
          </p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Update Status</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {statusOptions.map(({ key, label, icon: Icon, color, bg }) => (
            <button
              key={key}
              onClick={() => onStatusChange(key)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                document.status === key
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <span className="text-xs font-medium text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {document.paid_date && document.status === 'paid' && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-700">
              Paid on {new Date(document.paid_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-gray-200">
        <button
          onClick={onDuplicate}
          className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Copy className="w-4 h-4" />
          <span className="text-sm font-medium">Duplicate This Invoice</span>
        </button>
      </div>
    </div>
  );
}
