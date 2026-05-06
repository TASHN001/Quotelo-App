import { Building, Edit } from 'lucide-react';
import { Business } from '../lib/types';
import { getIndustryContext } from '../lib/industryData';
import { ds } from '../lib/designSystem';

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
      <div className={`bg-white ${ds.radiusXl} ${ds.shadow1} p-6 mb-4`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className={`${ds.headline} text-black`}>Business Identity</h2>
            <p className={`${ds.footnote} text-[#8e8e93] mt-1`}>Add your business information</p>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="w-20 h-20 bg-[#f2f2f7] rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-10 h-10 text-[#8e8e93]" strokeWidth={2} />
          </div>
          <p className={`${ds.callout} text-[#8e8e93] mb-4`}>No business information yet</p>
          <button onClick={onAdd} className={ds.btnPrimary}>
            Add Business Identity
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white ${ds.radiusXl} ${ds.shadow1} p-6 mb-4`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className={`${ds.headline} text-black`}>Business Identity</h2>
          <p className={`${ds.footnote} text-[#8e8e93] mt-1`}>This info will appear on invoices</p>
        </div>
        <button
          onClick={onEdit}
          className={ds.headerIconBtn}
        >
          <Edit className="w-4 h-4 text-[#f97316]" strokeWidth={2} />
        </button>
      </div>

      <div className="flex items-start gap-4">
        {business.logo_url ? (
          <div className="w-14 h-14 rounded-full overflow-hidden bg-[#f2f2f7] flex items-center justify-center flex-shrink-0 border border-[#e5e5ea]">
            <img
              src={business.logo_url}
              alt="Business logo"
              className="w-full h-full object-contain p-1"
            />
          </div>
        ) : (
          <div className="w-14 h-14 bg-[#f2f2f7] rounded-full flex items-center justify-center flex-shrink-0">
            <span className={`${ds.title3} text-[#3c3c43]`}>
              {business.business_name?.charAt(0) || 'B'}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className={`${ds.headline} text-black mb-1`}>
            {business.business_name}
          </h3>

          {(business.industry_group || business.industry_type) && (
            <p className={`${ds.footnote} text-[#8e8e93] mb-2`}>
              {business.industry_type && business.industry_type !== 'General'
                ? `${business.industry_type} (${business.industry_group})`
                : getIndustryContext(business)}
            </p>
          )}

          {hasAddress ? (
            <p className={`${ds.footnote} text-[#8e8e93] mb-2`}>
              {formatAddress(business)}
            </p>
          ) : (
            <p className={`${ds.footnote} text-[#c7c7cc] italic mb-2`}>No address added</p>
          )}

          <div className="space-y-1.5">
            {business.country && (
              <p className={`${ds.footnote} text-[#8e8e93]`}>
                <span className="font-medium text-[#3c3c43]">Country: </span>
                {business.country}
              </p>
            )}
            {business.business_registration_number && (
              <p className={`${ds.footnote} text-[#8e8e93]`}>
                <span className="font-medium text-[#3c3c43]">Reg No: </span>
                {business.business_registration_number}
              </p>
            )}
            {(business.vat_tax_number || business.tax_number) && (
              <p className={`${ds.footnote} text-[#8e8e93]`}>
                <span className="font-medium text-[#3c3c43]">Tax/VAT: </span>
                {business.vat_tax_number || business.tax_number}
              </p>
            )}
            {(business.bank_name || business.bank_account_number || business.bank_swift_code) && (
              <div className="pt-2 mt-1 border-t border-[#f2f2f7]">
                <p className={`${ds.footnote} font-semibold text-[#3c3c43] mb-1`}>Bank Details</p>
                {business.bank_name && (
                  <p className={`${ds.footnote} text-[#8e8e93]`}>
                    <span className="font-medium text-[#3c3c43]">Bank: </span>
                    {business.bank_name}
                  </p>
                )}
                {business.bank_account_number && (
                  <p className={`${ds.footnote} text-[#8e8e93]`}>
                    <span className="font-medium text-[#3c3c43]">Account: </span>
                    {business.bank_account_number}
                  </p>
                )}
                {business.bank_swift_code && (
                  <p className={`${ds.footnote} text-[#8e8e93]`}>
                    <span className="font-medium text-[#3c3c43]">SWIFT: </span>
                    {business.bank_swift_code}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
