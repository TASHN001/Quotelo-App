import { ChevronLeft, ChevronRight, Palette, Lock, Globe, DollarSign, Bell, Shield, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ds } from '../lib/designSystem';

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
    <div className={`min-h-screen ${ds.bg}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => setCurrentScreen('profile')} className={ds.headerIconBtn}>
          <ChevronLeft className="w-4 h-4 text-[#3c3c43]" />
        </button>
        <h1 className={`${ds.title2} text-black`}>{t('settings.title')}</h1>
      </div>

      <div className="px-4 flex flex-col gap-4 pb-10">
        <div>
          <p className={`${ds.caption} text-[#8e8e93] mb-2`}>GENERAL</p>
          <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {SETTINGS_ITEMS.map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentScreen(item.screen)}
                className={`w-full flex items-center justify-between px-4 py-3 ${ds.transition} ${ds.press} ${
                  index < SETTINGS_ITEMS.length - 1 ? 'border-b border-[#f2f2f7]' : ''
                }`}
              >
                <span className={`${ds.callout} text-black`}>{t(item.labelKey as any)}</span>
                <ChevronRight className="w-4 h-4 text-[#c7c7cc]" strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={`${ds.caption} text-[#8e8e93] mb-2`}>LEGAL</p>
          <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {LEGAL_ITEMS.map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentScreen(item.screen)}
                className={`w-full flex items-center justify-between px-4 py-3 ${ds.transition} ${ds.press} ${
                  index < LEGAL_ITEMS.length - 1 ? 'border-b border-[#f2f2f7]' : ''
                }`}
              >
                <div className="text-left">
                  <p className={`${ds.callout} text-black`}>{item.label}</p>
                  <p className={`${ds.footnote} text-[#8e8e93]`}>{item.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#c7c7cc]" strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
