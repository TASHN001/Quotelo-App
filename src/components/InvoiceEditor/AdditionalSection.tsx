import { FileText, CreditCard, MessageSquare, RefreshCw } from 'lucide-react';
import type { Document, Business } from '../../lib/types';

interface AdditionalSectionProps {
  document: Document;
  business: Business | null;
  onUpdate: (updates: Partial<Document>) => void;
}

export function AdditionalSection({ document, business, onUpdate }: AdditionalSectionProps) {
  const handleLoadDefaultTerms = () => {
    if (business?.default_terms_conditions) {
      onUpdate({ terms_conditions: business.default_terms_conditions });
    }
  };

  const handleLoadDefaultPayment = () => {
    if (business?.payment_instructions) {
      onUpdate({ payment_details: business.payment_instructions });
    }
  };

  return (
    <div className="pt-4 space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Notes</label>
          </div>
        </div>
        <textarea
          value={document.notes || ''}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          rows={3}
          placeholder="Add any additional notes for the client (e.g., 'Thank you for your business!')"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors resize-none text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Terms & Conditions</label>
          </div>
          {business?.default_terms_conditions && (
            <button
              onClick={handleLoadDefaultTerms}
              className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
            >
              <RefreshCw className="w-3 h-3" />
              Load Default
            </button>
          )}
        </div>
        <textarea
          value={document.terms_conditions || ''}
          onChange={(e) => onUpdate({ terms_conditions: e.target.value })}
          rows={4}
          placeholder="Enter your terms and conditions..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors resize-none text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Payment Instructions</label>
          </div>
          {business?.payment_instructions && (
            <button
              onClick={handleLoadDefaultPayment}
              className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
            >
              <RefreshCw className="w-3 h-3" />
              Load Default
            </button>
          )}
        </div>
        <textarea
          value={document.payment_details || ''}
          onChange={(e) => onUpdate({ payment_details: e.target.value })}
          rows={4}
          placeholder="Bank details, payment links, or other payment instructions..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors resize-none text-sm"
        />
        {business && (business.bank_name || business.bank_account_number) && (
          <button
            onClick={() => {
              const bankDetails = [
                business.bank_name && `Bank: ${business.bank_name}`,
                business.bank_account_number && `Account: ${business.bank_account_number}`,
                business.bank_swift_code && `SWIFT/BIC: ${business.bank_swift_code}`
              ].filter(Boolean).join('\n');
              onUpdate({ payment_details: bankDetails });
            }}
            className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600"
          >
            <CreditCard className="w-3 h-3" />
            Insert bank details from profile
          </button>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Footer Message</label>
        </div>
        <input
          type="text"
          value={document.footer_message || ''}
          onChange={(e) => onUpdate({ footer_message: e.target.value })}
          placeholder="e.g., 'Thank you for your business!'"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors text-sm"
        />
      </div>
    </div>
  );
}
