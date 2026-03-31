import { ChevronDown } from 'lucide-react';
import { CURRENCIES, Currency } from '../lib/currency';

interface CurrencySelectProps {
  value: string;
  onChange: (currency: Currency) => void;
  label?: string;
  required?: boolean;
}

export default function CurrencySelect({ value, onChange, label, required }: CurrencySelectProps) {
  const selectedCurrency = CURRENCIES.find(c => c.code === value);

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as Currency)}
          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 cursor-pointer"
        >
          <option value="">Select currency</option>
          {CURRENCIES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.symbol} {currency.code} - {currency.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>

      {selectedCurrency && (
        <p className="mt-1 text-sm text-gray-500">
          {selectedCurrency.symbol} {selectedCurrency.name}
        </p>
      )}
    </div>
  );
}
