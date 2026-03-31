import { ArrowLeft, ChevronRight, Palette, Lock, Globe, DollarSign, Bell, Shield, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';

const SETTINGS_ITEMS = [
  { icon: Palette, labelKey: 'settings.appearance', screen: 'appearance-settings', color: 'text-blue-500' },
  { icon: Bell, labelKey: 'settings.reminders', screen: 'reminder-settings', color: 'text-orange-500' },
  { icon: Lock, labelKey: 'settings.changePassword', screen: 'change-password', color: 'text-red-500' },
  { icon: Globe, labelKey: 'settings.language', screen: 'language-settings', color: 'text-teal-500' },
  { icon: DollarSign, labelKey: 'settings.currency', screen: 'currency-settings', color: 'text-green-500' }
];

const LEGAL_ITEMS = [
  { icon: Shield, label: 'End User License Agreement', screen: 'eula-view', color: 'text-orange-500', description: 'View the full EULA' },
  { icon: FileText, label: 'Data Privacy Policy', screen: 'data-privacy', color: 'text-blue-500', description: 'How we handle your data' }
];

export function AppSettingsScreen() {
  const { setCurrentScreen, t } = useApp();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10 shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => setCurrentScreen('profile')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white absolute left-1/2 transform -translate-x-1/2">
            {t('settings.title')}
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
            General
          </p>
          <div className="space-y-2">
            {SETTINGS_ITEMS.map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentScreen(item.screen)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-sm">
                      <item.icon className={`w-5 h-5 ${item.color}`} strokeWidth={2} />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{t(item.labelKey as any)}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
            Legal
          </p>
          <div className="space-y-2">
            {LEGAL_ITEMS.map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentScreen(item.screen)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-sm">
                      <item.icon className={`w-5 h-5 ${item.color}`} strokeWidth={2} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
