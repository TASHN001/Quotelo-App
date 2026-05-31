import { useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EditBusinessModal } from './EditBusinessModal';
import { db } from '../lib/database';
import { ds } from '../lib/designSystem';
import type { Business } from '../lib/types';

export function ProfileDataScreen() {
  const {
    setCurrentScreen,
    business,
    dbUserProfile,
    userProfile,
    language,
    currency,
    refreshProfile,
    showToast,
  } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);

  const handleBusinessSave = async (businessData: Partial<Business>) => {
    const userId = localStorage.getItem('quotelo_user_id');
    if (!userId) return;
    const result = await db.upsertBusiness(userId, businessData);
    if (result) {
      await refreshProfile();
      showToast('Business details saved', 'success');
    }
    setShowEditModal(false);
  };

  const getLanguageLabel = () => {
    switch (language) {
      case 'en': return 'English';
      case 'af': return 'Afrikaans';
      case 'zu': return 'Zulu';
      case 'xh': return 'Xhosa';
      default: return 'English';
    }
  };

  return (
    <div className={`h-screen overflow-y-auto ${ds.bg}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => setCurrentScreen('profile')} className={ds.headerIconBtn}>
          <ChevronLeft className="w-4 h-4 text-[#3c3c43]" />
        </button>
        <h1 className={`${ds.title2} text-black flex-1`}>Profile & Business</h1>
        <button
          onClick={() => setShowEditModal(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-[#f97316] text-white rounded-xl ${ds.footnote} font-semibold ${ds.press} ${ds.transition}`}
        >
          <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
          Edit
        </button>
      </div>

      <div className="px-4 flex flex-col gap-4 pb-10">

        {/* Business Identity */}
        <div>
          <p className={`${ds.caption} text-[#8e8e93] mb-2`}>BUSINESS IDENTITY</p>
          <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {business?.logo_url && (
              <div className="p-4 border-b border-[#f2f2f7]">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#f2f2f7]">
                  <img src={business.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
              </div>
            )}
            <DataRow label="Business name" value={business?.business_name} />
            <DataRow
              label="Address"
              value={[business?.address_line1, business?.address_line2, business?.city, business?.state, business?.postal_code]
                .filter(Boolean)
                .join(', ')}
            />
            <DataRow label="Country" value={business?.country} />
            <DataRow label="Default currency" value={business?.default_currency?.toUpperCase()} />
            <DataRow label="Tax/VAT number" value={business?.vat_tax_number || business?.tax_number || business?.vat_number} />
            <DataRow label="Registration number" value={business?.business_registration_number} />
            <DataRow label="Bank name" value={business?.bank_name} />
            <DataRow label="Account number" value={business?.bank_account_number} />
            <DataRow label="SWIFT/BIC code" value={business?.bank_swift_code} />
            <DataRow label="Payment instructions" value={business?.payment_instructions} multiline />
            <DataRow label="Industry group" value={business?.industry_group} />
            <DataRow label="Industry type" value={business?.industry_type} isLast />
          </div>
        </div>

        {/* User Profile */}
        <div>
          <p className={`${ds.caption} text-[#8e8e93] mb-2`}>USER PROFILE</p>
          <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <DataRow label="Full name" value={userProfile.name || dbUserProfile?.full_name} />
            <DataRow label="Email" value={dbUserProfile?.email || business?.email} />
            <DataRow label="Phone" value={business?.phone} isLast />
          </div>
        </div>

        {/* App Preferences */}
        <div>
          <p className={`${ds.caption} text-[#8e8e93] mb-2`}>APP PREFERENCES</p>
          <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <button
              onClick={() => setCurrentScreen('language-settings')}
              className={`w-full flex items-center justify-between px-4 py-3 border-b border-[#f2f2f7] ${ds.transition} ${ds.press}`}
            >
              <div className="text-left">
                <p className={`${ds.footnote} text-[#8e8e93]`}>Language</p>
                <p className={`${ds.callout} text-black`}>{getLanguageLabel()}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
            </button>
            <button
              onClick={() => setCurrentScreen('currency-settings')}
              className={`w-full flex items-center justify-between px-4 py-3 ${ds.transition} ${ds.press}`}
            >
              <div className="text-left">
                <p className={`${ds.footnote} text-[#8e8e93]`}>Currency</p>
                <p className={`${ds.callout} text-black`}>{currency?.toUpperCase() || 'ZAR'}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
            </button>
          </div>
        </div>

      </div>

      {showEditModal && (
        <EditBusinessModal
          business={business}
          onClose={() => setShowEditModal(false)}
          onSave={handleBusinessSave}
          userId={localStorage.getItem('quotelo_user_id') || ''}
        />
      )}
    </div>
  );
}

function DataRow({ label, value, multiline, isLast }: { label: string; value?: string | null; multiline?: boolean; isLast?: boolean }) {
  if (!value) return null;

  return (
    <div className={`px-4 py-3 flex flex-col gap-0.5 ${isLast ? '' : 'border-b border-[#f2f2f7]'}`}>
      <p className={`${ds.footnote} text-[#8e8e93]`}>{label}</p>
      <p className={`${ds.callout} text-black ${multiline ? 'whitespace-pre-wrap' : ''}`}>
        {value}
      </p>
    </div>
  );
}
