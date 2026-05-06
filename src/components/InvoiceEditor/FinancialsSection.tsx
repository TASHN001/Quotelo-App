import { useState } from 'react';
import { Percent, DollarSign, ChevronDown } from 'lucide-react';
import { ds } from '../../lib/designSystem';
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
    <div className="pt-4 space-y-3">
      {/* Totals summary card */}
      <div className="bg-white rounded-xl border border-[#f2f2f7] p-4 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className={`${ds.callout} text-[#8e8e93]`}>Subtotal</span>
          <span className={`${ds.callout} font-semibold text-black`}>
            {formatCurrency(document.subtotal)}
          </span>
        </div>

        {/* Tax row */}
        <div className="border-t border-[#f2f2f7] pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`${ds.callout} text-[#8e8e93]`}>Tax</span>
              <div className="flex bg-[#f2f2f7] rounded-lg overflow-hidden">
                <button
                  onClick={() => onUpdate({ tax_type: 'percentage' })}
                  className={`px-2 py-1 text-xs ${ds.transition} ${
                    document.tax_type === 'percentage' || !document.tax_type
                      ? 'bg-white text-black shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                      : 'text-[#8e8e93]'
                  }`}
                >
                  <Percent className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onUpdate({ tax_type: 'fixed' })}
                  className={`px-2 py-1 text-xs ${ds.transition} ${
                    document.tax_type === 'fixed'
                      ? 'bg-white text-black shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                      : 'text-[#8e8e93]'
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
                className={`${ds.input} w-20 py-1.5 text-[15px] text-right`}
              />
              <span className={`${ds.callout} text-[#8e8e93] w-4`}>
                {document.tax_type === 'fixed' ? '' : '%'}
              </span>
            </div>
          </div>
          <div className="flex justify-end">
            <span className={`${ds.callout} font-semibold text-black`}>
              {formatCurrency(document.tax_total)}
            </span>
          </div>
        </div>

        {/* Discount row */}
        <div className="border-t border-[#f2f2f7] pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`${ds.callout} text-[#8e8e93]`}>Discount</span>
              <div className="flex bg-[#f2f2f7] rounded-lg overflow-hidden">
                <button
                  onClick={() => handleDiscountChange(document.discount_value || 0, 'percentage')}
                  className={`px-2 py-1 text-xs ${ds.transition} ${
                    document.discount_type === 'percentage' || !document.discount_type
                      ? 'bg-white text-black shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                      : 'text-[#8e8e93]'
                  }`}
                >
                  <Percent className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDiscountChange(document.discount_value || 0, 'fixed')}
                  className={`px-2 py-1 text-xs ${ds.transition} ${
                    document.discount_type === 'fixed'
                      ? 'bg-white text-black shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                      : 'text-[#8e8e93]'
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
                className={`${ds.input} w-20 py-1.5 text-[15px] text-right`}
              />
              <span className={`${ds.callout} text-[#8e8e93] w-4`}>
                {document.discount_type === 'fixed' ? '' : '%'}
              </span>
            </div>
          </div>
          {(document.discount_value || 0) > 0 && (
            <div className="flex justify-end">
              <span className={`${ds.callout} font-semibold text-[#ff3b30]`}>
                -{formatCurrency(
                  document.discount_type === 'percentage'
                    ? document.subtotal * (document.discount_value || 0) / 100
                    : (document.discount_value || 0)
                )}
              </span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="border-t-2 border-black pt-3 mt-1">
          <div className="flex justify-between items-center">
            <span className={`${ds.headline} text-black`}>Total</span>
            <span className={`${ds.title2} text-black ${ds.numeric}`}>
              {formatCurrency(document.total)}
            </span>
          </div>
        </div>

        {(document.partial_payments_total || 0) > 0 && (
          <>
            <div className="flex justify-between items-center">
              <span className={`${ds.callout} text-[#8e8e93]`}>Payments Received</span>
              <span className={`${ds.callout} font-semibold text-[#34c759]`}>
                -{formatCurrency(document.partial_payments_total || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#f2f2f7]">
              <span className={`${ds.headline} text-black`}>Amount Due</span>
              <span className={`${ds.title2} text-[#f97316] ${ds.numeric}`}>
                {formatCurrency(document.amount_due || document.total)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-[#f2f2f7] rounded-xl ${ds.callout} text-[#8e8e93] font-medium ${ds.transition}`}
      >
        <span>Advanced Options</span>
        <ChevronDown className={`w-4 h-4 ${ds.transition} ${showAdvanced ? 'rotate-180' : ''}`} />
      </button>

      {showAdvanced && (
        <div className="space-y-4 p-4 bg-white rounded-xl border border-[#f2f2f7]">
          <div className="flex items-center justify-between">
            <label className={`${ds.callout} text-black`}>Use global tax rate</label>
            <button
              onClick={() => onUpdate({ global_tax: !document.global_tax })}
              className={`relative w-11 h-6 rounded-full ${ds.transition} ${
                document.global_tax ? 'bg-[#f97316]' : 'bg-[#c7c7cc]'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm ${ds.transition} ${
                  document.global_tax ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className={`${ds.callout} text-black`}>Apply discount before tax</label>
            <button
              onClick={() => onUpdate({ discount_applied_before_tax: !document.discount_applied_before_tax })}
              className={`relative w-11 h-6 rounded-full ${ds.transition} ${
                document.discount_applied_before_tax ? 'bg-[#f97316]' : 'bg-[#c7c7cc]'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm ${ds.transition} ${
                  document.discount_applied_before_tax ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          <div>
            <label className={`${ds.callout} text-black font-medium mb-2 block`}>Record Partial Payment</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={document.partial_payments_total || 0}
                onChange={(e) => handlePartialPayment(parseFloat(e.target.value) || 0)}
                min="0"
                max={document.total}
                step="0.01"
                className={`flex-1 ${ds.input}`}
                placeholder="0.00"
              />
              <button
                onClick={() => handlePartialPayment(document.total)}
                className="px-4 py-3 bg-[#d1fae5] text-[#065f46] rounded-xl text-[15px] font-semibold"
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
