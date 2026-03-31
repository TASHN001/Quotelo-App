import { Building, Edit } from 'lucide-react';
import { Business } from '../lib/types';
import { getIndustryContext } from '../lib/industryData';

interface BusinessIdentityCardProps {
  business: Business | null;
  onEdit: () => void;
  onAdd: () => void;
}

export function BusinessIdentityCard({ business, onEdit, onAdd }: BusinessIdentityCardProps) {
  const formatAddress = (business: Business): string => {
    const parts = [];

    if (business.address_line1) parts.push(business.address_line1);
    if (business.address_line2) parts.push(business.address_line2);
    if (business.city) parts.push(business.city);
    if (business.state) parts.push(business.state);
    if (business.postal_code) parts.push(business.postal_code);

    return parts.join(', ');
  };

  const hasAddress = business?.address_line1 || business?.city || business?.postal_code;

  if (!business) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Business Identity</h2>
            <p className="text-sm text-gray-600 mt-1">Add your business information</p>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Building className="w-10 h-10 text-orange-500" strokeWidth={2} />
          </div>
          <p className="text-gray-600 mb-4">No business information yet</p>
          <button
            onClick={onAdd}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow"
          >
            Add Business Identity
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Business Identity</h2>
          <p className="text-sm text-gray-600 mt-1">This info will appear on invoices</p>
        </div>
        <button
          onClick={onEdit}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Edit className="w-5 h-5 text-orange-600" strokeWidth={2} />
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-4">
          {business.logo_url ? (
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
              <img
                src={business.logo_url}
                alt="Business logo"
                className="w-full h-full object-contain p-1"
              />
            </div>
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-2xl">
                {business.business_name?.charAt(0) || 'B'}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {business.business_name}
            </h3>

            {hasAddress ? (
              <p className="text-sm text-gray-600 mb-3">
                {formatAddress(business)}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic mb-3">No address added</p>
            )}

            <div className="space-y-2 text-xs">
              {business.country && (
                <div>
                  <span className="text-gray-500 font-medium">Country:</span>{' '}
                  <span className="text-gray-700">{business.country}</span>
                </div>
              )}
              {(business.industry_group || business.industry_type) && (
                <div>
                  <span className="text-gray-500 font-medium">Industry:</span>{' '}
                  <span className="text-gray-700">
                    {business.industry_type && business.industry_type !== 'General'
                      ? `${business.industry_type} (${business.industry_group})`
                      : getIndustryContext(business)}
                  </span>
                </div>
              )}
              {business.business_registration_number && (
                <div>
                  <span className="text-gray-500 font-medium">Registration Number:</span>{' '}
                  <span className="text-gray-700">{business.business_registration_number}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-4">
                {(business.vat_tax_number || business.tax_number) && (
                  <div>
                    <span className="text-gray-500 font-medium">Tax/VAT Number:</span>{' '}
                    <span className="text-gray-700">
                      {business.vat_tax_number || business.tax_number}
                    </span>
                  </div>
                )}
              </div>
              {(business.bank_name || business.bank_account_number || business.bank_swift_code) && (
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <div className="text-gray-500 font-semibold mb-1">Bank Details</div>
                  {business.bank_name && (
                    <div>
                      <span className="text-gray-500 font-medium">Bank:</span>{' '}
                      <span className="text-gray-700">{business.bank_name}</span>
                    </div>
                  )}
                  {business.bank_account_number && (
                    <div>
                      <span className="text-gray-500 font-medium">Account:</span>{' '}
                      <span className="text-gray-700">{business.bank_account_number}</span>
                    </div>
                  )}
                  {business.bank_swift_code && (
                    <div>
                      <span className="text-gray-500 font-medium">SWIFT:</span>{' '}
                      <span className="text-gray-700">{business.bank_swift_code}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
