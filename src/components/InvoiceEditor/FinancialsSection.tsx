import { useState } from 'react';
import { Percent, DollarSign, Calculator, ChevronDown } from 'lucide-react';
import type { Document } from '../../lib/types';

interface FinancialsSectionProps {
  document: Document;
  onUpdate: (updates: Partial<Document>) => void;
  formatCurrency: (amount: number) => string;
}

export function FinancialsSection({ document, onUpdate, formatCurrency }: FinancialsSectionProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTaxChange = (value: number, type: 'percentage' | 'fixed') => {
    onUpdate({
      tax_rate: value,
      tax_type: type
    });

    recalculateTotals(value, type, document.discount_value, document.discount_type);
  };

  const handleDiscountChange = (value: number, type: 'percentage' | 'fixed') => {
    onUpdate({
      discount_value: value,
      discount_type: type
    });

    recalculateTotals(document.tax_rate, document.tax_type, value, type);
  };

  const recalculateTotals = (
    taxRate: number | undefined,
    taxType: string | undefined,
    discountValue: number | undefined,
    discountType: string | undefined
  ) => {
    const subtotal = document.subtotal;
    let discountAmount = 0;

    if (discountValue && discountValue > 0) {
      if (discountType === 'percentage') {
        discountAmount = subtotal * discountValue / 100;
      } else {
        discountAmount = discountValue;
      }
    }

    const afterDiscount = document.discount_applied_before_tax
      ? subtotal - discountAmount
      : subtotal;

    let taxAmount = document.tax_total;
    if (document.global_tax && taxRate && taxRate > 0) {
      if (taxType === 'percentage') {
        taxAmount = afterDiscount * taxRate / 100;
      } else {
        taxAmount = taxRate;
      }
    }

    const total = document.discount_applied_before_tax
      ? afterDiscount + taxAmount
      : subtotal + taxAmount - discountAmount;

    const amountDue = total - (document.partial_payments_total || 0);

    onUpdate({
      tax_total: taxAmount,
      total,
      amount_due: amountDue
    });
  };

  const handlePartialPayment = (amount: number) => {
    const amountDue = document.total - amount;
    onUpdate({
      partial_payments_total: amount,
      amount_due: amountDue
    });
  };

  return (
    <div className="pt-4 space-y-4">
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Subtotal</span>
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(document.subtotal)}
          </span>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Tax</span>
              <div className="flex border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => onUpdate({ tax_type: 'percentage' })}
                  className={`px-2 py-1 text-xs ${
                    document.tax_type === 'percentage' || !document.tax_type
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-white text-gray-500'
                  }`}
                >
                  <Percent className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onUpdate({ tax_type: 'fixed' })}
                  className={`px-2 py-1 text-xs ${
                    document.tax_type === 'fixed'
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-white text-gray-500'
                  }`}
                >
                  <DollarSign className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={document.tax_rate || 0}
                onChange={(e) => handleTaxChange(parseFloat(e.target.value) || 0, (document.tax_type || 'percentage') as 'percentage' | 'fixed')}
                min="0"
                step="0.5"
                className="w-20 px-2 py-1 border border-gray-200 rounded-md text-sm text-right focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <span className="text-sm text-gray-500 w-6">
                {document.tax_type === 'fixed' ? '' : '%'}
              </span>
            </div>
          </div>
          <div className="flex justify-end">
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(document.tax_total)}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Discount</span>
              <div className="flex border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => handleDiscountChange(document.discount_value || 0, 'percentage')}
                  className={`px-2 py-1 text-xs ${
                    document.discount_type === 'percentage' || !document.discount_type
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-white text-gray-500'
                  }`}
                >
                  <Percent className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDiscountChange(document.discount_value || 0, 'fixed')}
                  className={`px-2 py-1 text-xs ${
                    document.discount_type === 'fixed'
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-white text-gray-500'
                  }`}
                >
                  <DollarSign className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={document.discount_value || 0}
                onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0, (document.discount_type || 'percentage') as 'percentage' | 'fixed')}
                min="0"
                step="0.5"
                className="w-20 px-2 py-1 border border-gray-200 rounded-md text-sm text-right focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <span className="text-sm text-gray-500 w-6">
                {document.discount_type === 'fixed' ? '' : '%'}
              </span>
            </div>
          </div>
          {(document.discount_value || 0) > 0 && (
            <div className="flex justify-end">
              <span className="text-sm font-medium text-red-600">
                -{formatCurrency(
                  document.discount_type === 'percentage'
                    ? document.subtotal * (document.discount_value || 0) / 100
                    : (document.discount_value || 0)
                )}
              </span>
            </div>
          )}
        </div>

        <div className="border-t-2 border-gray-900 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(document.total)}
            </span>
          </div>
        </div>

        {(document.partial_payments_total || 0) > 0 && (
          <>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Payments Received</span>
              <span className="text-green-600 font-medium">
                -{formatCurrency(document.partial_payments_total || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-base font-bold text-gray-900">Amount Due</span>
              <span className="text-xl font-bold text-orange-600">
                {formatCurrency(document.amount_due || document.total)}
              </span>
            </div>
          </>
        )}
      </div>

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <span>Advanced Options</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
      </button>

      {showAdvanced && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Use global tax rate</label>
            <button
              onClick={() => onUpdate({ global_tax: !document.global_tax })}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                document.global_tax ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  document.global_tax ? 'translate-x-4' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Apply discount before tax</label>
            <button
              onClick={() => onUpdate({ discount_applied_before_tax: !document.discount_applied_before_tax })}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                document.discount_applied_before_tax ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  document.discount_applied_before_tax ? 'translate-x-4' : ''
                }`}
              />
            </button>
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-2 block">Record Partial Payment</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={document.partial_payments_total || 0}
                onChange={(e) => handlePartialPayment(parseFloat(e.target.value) || 0)}
                min="0"
                max={document.total}
                step="0.01"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="0.00"
              />
              <button
                onClick={() => handlePartialPayment(document.total)}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
              >
                Full
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
