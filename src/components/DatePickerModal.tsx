import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import 'react-day-picker/dist/style.css';
import { getCurrentDate } from '../lib/dateUtils';

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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={handleCancel}
            className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={2} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="date-picker-container mb-6">
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

            .dark .date-picker-container .rdp-caption_label {
              color: #ffffff;
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

            .dark .date-picker-container .rdp-nav_button:hover {
              background-color: #374151;
              color: #ffffff;
            }

            .date-picker-container .rdp-head_cell {
              font-weight: 600;
              font-size: 0.75rem;
              color: #6b7280;
              text-transform: uppercase;
            }

            .dark .date-picker-container .rdp-head_cell {
              color: #9ca3af;
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

            .dark .date-picker-container .rdp-day {
              color: #ffffff;
            }

            .date-picker-container .rdp-day:hover:not(.rdp-day_selected):not(.rdp-day_disabled) {
              background-color: #fed7aa;
            }

            .dark .date-picker-container .rdp-day:hover:not(.rdp-day_selected):not(.rdp-day_disabled) {
              background-color: #ea580c;
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

            .dark .date-picker-container .rdp-day_disabled {
              color: #4b5563;
            }

            .date-picker-container .rdp-day_today:not(.rdp-day_selected) {
              font-weight: 600;
              color: #f97316;
            }

            .dark .date-picker-container .rdp-day_today:not(.rdp-day_selected) {
              color: #fb923c;
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

        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedDate || !!error}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select Date
          </button>
        </div>
      </div>
    </div>
  );
}
