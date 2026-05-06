import { CheckCircle, Send, Clock, AlertTriangle, Ban, Copy } from 'lucide-react';
import { ds } from '../../lib/designSystem';
import type { Document } from '../../lib/types';

interface StatusTrackerProps {
  document: Document;
  onStatusChange: (status: Document['status']) => void;
  onDuplicate: () => void;
  formatCurrency: (amount: number) => string;
}

const statusOptions: { key: Document['status']; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { key: 'draft',     label: 'Draft',     icon: Clock,          color: 'text-[#8e8e93]',  bg: 'bg-[#f2f2f7]' },
  { key: 'sent',      label: 'Sent',      icon: Send,           color: 'text-[#1d4ed8]',  bg: 'bg-[#dbeafe]' },
  { key: 'paid',      label: 'Paid',      icon: CheckCircle,    color: 'text-[#065f46]',  bg: 'bg-[#d1fae5]' },
  { key: 'overdue',   label: 'Overdue',   icon: AlertTriangle,  color: 'text-[#991b1b]',  bg: 'bg-[#fee2e2]' },
  { key: 'cancelled', label: 'Cancelled', icon: Ban,            color: 'text-[#8e8e93]',  bg: 'bg-[#f2f2f7]' }
];

export function StatusTracker({ document, onStatusChange, onDuplicate, formatCurrency }: StatusTrackerProps) {
  const currentStatus = statusOptions.find(s => s.key === document.status) || statusOptions[0];
  const CurrentIcon = currentStatus.icon;

  return (
    <div className="pt-4 space-y-4">
      {/* Current status summary */}
      <div className="flex items-center gap-3 p-4 bg-[#f2f2f7] rounded-xl">
        <div className={`w-10 h-10 ${currentStatus.bg} rounded-full flex items-center justify-center`}>
          <CurrentIcon className={`w-5 h-5 ${currentStatus.color}`} />
        </div>
        <div className="flex-1">
          <p className={`${ds.caption} text-[#8e8e93]`}>Current Status</p>
          <p className={`${ds.headline} ${currentStatus.color}`}>
            {currentStatus.label}
          </p>
        </div>
        <div className="text-right">
          <p className={`${ds.caption} text-[#8e8e93]`}>Amount</p>
          <p className={`${ds.headline} text-black ${ds.numeric}`}>
            {formatCurrency(document.total)}
          </p>
        </div>
      </div>

      {/* Status picker */}
      <div>
        <label className={`${ds.caption} text-[#8e8e93] mb-2 block`}>Update Status</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {statusOptions.map(({ key, label, icon: Icon, color, bg }) => (
            <button
              key={key}
              onClick={() => onStatusChange(key)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 ${ds.transition} ${
                document.status === key
                  ? 'border-[#f97316] bg-[#fff3e8]'
                  : 'border-[#f2f2f7] bg-white'
              }`}
            >
              <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <span className={`${ds.caption} text-black`}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Paid date notice */}
      {document.paid_date && document.status === 'paid' && (
        <div className="flex items-center gap-2 p-3 bg-[#d1fae5] rounded-xl">
          <CheckCircle className="w-5 h-5 text-[#065f46]" />
          <p className={`${ds.callout} font-semibold text-[#065f46]`}>
            Paid on {new Date(document.paid_date).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Duplicate */}
      <div className="pt-2 border-t border-[#f2f2f7]">
        <button
          onClick={onDuplicate}
          className={`w-full flex items-center justify-center gap-2 py-3 bg-[#f2f2f7] rounded-xl ${ds.callout} text-black font-semibold ${ds.transition}`}
        >
          <Copy className="w-4 h-4" />
          <span>Duplicate This Invoice</span>
        </button>
      </div>
    </div>
  );
}
