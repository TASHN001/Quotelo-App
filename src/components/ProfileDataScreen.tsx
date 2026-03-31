import { ArrowLeft, Building2, User, Settings, ChevronRight, Languages, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function ProfileDataScreen() {
  const {
    setCurrentScreen,
    business,
    dbUserProfile,
    userProfile,
    language,
    currency
  } = useApp();

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Profile Data</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-orange-600 dark:text-orange-400" strokeWidth={2} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Business Identity</h2>
            </div>
            <button
              onClick={() => setCurrentScreen('profile')}
              className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 font-medium hover:text-orange-700 dark:hover:text-orange-300"
            >
              Edit <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {business?.logo_url && (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
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
            <DataRow label="Industry type" value={business?.industry_type} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">User Profile</h2>
            </div>
            <button
              onClick={() => setCurrentScreen('profile')}
              className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 font-medium hover:text-orange-700 dark:hover:text-orange-300"
            >
              Edit <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <DataRow label="Full name" value={userProfile.name || dbUserProfile?.full_name} />
            <DataRow label="Email" value={dbUserProfile?.email || business?.email} />
            <DataRow label="Phone" value={business?.phone} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">App Preferences</h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <button
              onClick={() => setCurrentScreen('language-settings')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Languages className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div className="text-left">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Language</p>
                  <p className="font-medium text-gray-900 dark:text-white">{getLanguageLabel()}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => setCurrentScreen('currency-settings')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div className="text-left">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Currency</p>
                  <p className="font-medium text-gray-900 dark:text-white">{currency?.toUpperCase() || 'ZAR'}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="pb-6"></div>
      </div>
    </div>
  );
}

function DataRow({ label, value, multiline }: { label: string; value?: string | null; multiline?: boolean }) {
  if (!value) return null;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`font-medium text-gray-900 dark:text-white ${multiline ? 'whitespace-pre-wrap' : ''}`}>
        {value}
      </p>
    </div>
  );
}
