import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import 'react-day-picker/dist/style.css';
import { getCurrentDate } from '../lib/dateUtils';
import { ds } from '../lib/designSystem';

interface DatePickerModalProps {
  isOpen: boolean;
  title: string;
  value: string | Date;
  minDate?: string | Date;
  maxDate?: string | Date;
  onSelect: (date: string) => void;
  onClose: () => void;
}

export function DatePickerModal({
  isOpen,
  title,
  value,
  minDate,
  maxDate,
  onSelect,
  onClose
}: DatePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && value) {
      try {
        const date = typeof value === 'string' ? parseISO(value) : value;
        setSelectedDate(date);
        setError('');
      } catch {
        setSelectedDate(getCurrentDate());
      }
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    setSelectedDate(date);
    setError('');

    if (minDate) {
      const min = typeof minDate === 'string' ? parseISO(minDate) : minDate;
      if (date < min) {
        setError('Date cannot be earlier than the issue date');
        return;
      }
    }

    if (maxDate) {
      const max = typeof maxDate === 'string' ? parseISO(maxDate) : maxDate;
      if (date > max) {
        setError('Date cannot be later than the due date');
        return;
      }
    }
  };

  const handleConfirm = () => {
    if (!selectedDate) return;
    if (error) return;

    const isoDate = format(selectedDate, 'yyyy-MM-dd');
    onSelect(isoDate);
    onClose();
  };

  const handleCancel = () => {
    setError('');
    onClose();
  };

  const disabledDays: { before?: Date; after?: Date } = {};
  if (minDate) {
    const min = typeof minDate === 'string' ? parseISO(minDate) : minDate;
    disabledDays.before = min;
  }
  if (maxDate) {
    const max = typeof maxDate === 'string' ? parseISO(maxDate) : maxDate;
    disabledDays.after = max;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={handleCancel} />
      <div className="relative bg-white rounded-t-[20px] shadow-[0_-4px_16px_rgba(0,0,0,0.10)]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 bg-[#e5e5ea] rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-[#f2f2f7]">
          <button onClick={handleCancel} className={`${ds.callout} text-[#8e8e93]`}>Cancel</button>
          <h2 className={`${ds.headline} text-black`}>{title}</h2>
          <button
            onClick={handleConfirm}
            disabled={!selectedDate || !!error}
            className={`${ds.callout} text-[#f97316] font-semibold disabled:opacity-40`}
          >
            Done
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 bg-[#fff7ed] border border-[#fed7aa] rounded-xl">
            <p className={`${ds.footnote} text-[#c2410c]`}>{error}</p>
          </div>
        )}

        {/* Date picker */}
        <div className="date-picker-container px-4 pb-6 pt-2">
          <style>{`
            .date-picker-container .rdp {
              --rdp-cell-size: 40px;
              --rdp-accent-color: #f97316;
              --rdp-background-color: #fed7aa;
              margin: 0;
            }

            .date-picker-container .rdp-months {
              justify-content: center;
            }

            .date-picker-container .rdp-month {
              width: 100%;
            }

            .date-picker-container .rdp-caption {
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 0 0 1rem 0;
            }

            .date-picker-container .rdp-caption_label {
              font-size: 1rem;
              font-weight: 600;
              color: #111827;
            }

            .date-picker-container .rdp-nav {
              position: absolute;
              right: 0;
              left: 0;
              display: flex;
              justify-content: space-between;
            }

            .date-picker-container .rdp-nav_button {
              width: 32px;
              height: 32px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #6b7280;
              transition: all 0.2s;
            }

            .date-picker-container .rdp-nav_button:hover {
              background-color: #f3f4f6;
              color: #111827;
            }

            .date-picker-container .rdp-head_cell {
              font-weight: 600;
              font-size: 0.75rem;
              color: #6b7280;
              text-transform: uppercase;
            }

            .date-picker-container .rdp-cell {
              padding: 2px;
            }

            .date-picker-container .rdp-day {
              border-radius: 8px;
              font-size: 0.875rem;
              color: #111827;
              transition: all 0.2s;
            }

            .date-picker-container .rdp-day:hover:not(.rdp-day_selected):not(.rdp-day_disabled) {
              background-color: #fed7aa;
            }

            .date-picker-container .rdp-day_selected {
              background-color: #f97316 !important;
              color: white !important;
              font-weight: 600;
            }

            .date-picker-container .rdp-day_disabled {
              color: #d1d5db;
              cursor: not-allowed;
            }

            .date-picker-container .rdp-day_today:not(.rdp-day_selected) {
              font-weight: 600;
              color: #f97316;
            }
          `}</style>

          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={disabledDays}
            showOutsideDays
          />
        </div>
      </div>
    </div>
  );
}
