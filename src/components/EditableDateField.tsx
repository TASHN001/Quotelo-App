import { useState, useEffect } from 'react';
import { Check, Calendar } from 'lucide-react';
import { DatePickerModal } from './DatePickerModal';

interface EditableDateFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
  title?: string;
  minDate?: string;
  maxDate?: string;
}

export function EditableDateField({
  value,
  onSave,
  className = '',
  title = 'Select Date',
  minDate,
  maxDate
}: EditableDateFieldProps) {
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const formatDateForDisplay = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const handleDateSelect = async (newDate: string) => {
    if (newDate === value) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(newDate);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="relative inline-block group">
        <div
          onClick={() => setShowModal(true)}
          className={`cursor-pointer hover:bg-orange-50 hover:border hover:border-orange-200 rounded px-2 py-1 transition-colors flex items-center gap-2 ${className} ${isSaving ? 'opacity-50' : ''}`}
        >
          <Calendar className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span>{formatDateForDisplay(value)}</span>
        </div>
        {showSaved && (
          <div className="absolute -right-6 top-1/2 -translate-y-1/2">
            <Check className="w-4 h-4 text-green-500" strokeWidth={2.5} />
          </div>
        )}
      </div>

      <DatePickerModal
        isOpen={showModal}
        title={title}
        value={value}
        minDate={minDate}
        maxDate={maxDate}
        onSelect={handleDateSelect}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
