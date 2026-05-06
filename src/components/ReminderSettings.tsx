import { useState, useEffect } from 'react';
import { ChevronLeft, Bell, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import type { UserReminderSettings } from '../lib/types';
import { getCurrentDate } from '../lib/dateUtils';
import { ds } from '../lib/designSystem';

export function ReminderSettingsScreen() {
  const { authUser, setCurrentScreen, showToast } = useApp();
  const [settings, setSettings] = useState<UserReminderSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [authUser]);

  const loadSettings = async () => {
    if (!authUser) {
      setIsLoading(false);
      return;
    }

    const userSettings = await db.getUserReminderSettings(authUser.id);

    if (userSettings) {
      setSettings(userSettings);
    } else {
      setSettings({
        user_id: authUser.id,
        auto_followup_enabled: false,
        reminder_frequency: 3,
        email_reminders_enabled: false,
        created_at: getCurrentDate().toISOString(),
        updated_at: getCurrentDate().toISOString()
      });
    }

    setIsLoading(false);
  };

  const handleToggle = async (field: 'auto_followup_enabled' | 'email_reminders_enabled') => {
    if (!settings || !authUser) return;

    const newSettings = {
      ...settings,
      [field]: !settings[field]
    };

    setSettings(newSettings);

    setIsSaving(true);
    const updated = await db.upsertUserReminderSettings(authUser.id, newSettings);
    setIsSaving(false);

    if (updated) {
      showToast('Settings saved', 'success');
    } else {
      showToast('Failed to save settings', 'error');
      setSettings(settings);
    }
  };

  const handleFrequencyChange = async (frequency: 3 | 7 | 14) => {
    if (!settings || !authUser) return;

    const newSettings = {
      ...settings,
      reminder_frequency: frequency
    };

    setSettings(newSettings);

    setIsSaving(true);
    const updated = await db.upsertUserReminderSettings(authUser.id, newSettings);
    setIsSaving(false);

    if (updated) {
      showToast('Reminder frequency updated', 'success');
    } else {
      showToast('Failed to update frequency', 'error');
      setSettings(settings);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${ds.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className={`${ds.callout} text-[#8e8e93]`}>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className={`min-h-screen ${ds.bg}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => setCurrentScreen('profile')} className={ds.headerIconBtn}>
          <ChevronLeft className="w-4 h-4 text-[#3c3c43]" />
        </button>
        <h1 className={`${ds.title2} text-black`}>Reminders</h1>
      </div>

      <div className="px-4 flex flex-col gap-4 pb-10">

        {/* Info banner */}
        <div className="bg-[#e8f4fd] rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-[#007aff] flex-shrink-0 mt-0.5" />
          <div>
            <p className={`${ds.footnote} font-semibold text-[#1c3d5a] mb-0.5`}>Smart Reminders Help You Get Paid Faster</p>
            <p className={`${ds.footnote} text-[#1c3d5a]`}>We'll suggest when to send follow-ups for overdue invoices. All reminders are optional and you stay in full control.</p>
          </div>
        </div>

        {/* Reminder Suggestions toggle */}
        <div>
          <p className={`${ds.caption} text-[#8e8e93] mb-2`}>NOTIFICATIONS</p>
          <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#fff3e8] rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#f97316]" />
                </div>
                <div>
                  <p className={`${ds.callout} text-black`}>Reminder Suggestions</p>
                  <p className={`${ds.footnote} text-[#8e8e93]`}>Show alerts for overdue invoices</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('auto_followup_enabled')}
                disabled={isSaving}
                className={`relative w-12 h-7 rounded-full ${ds.transition} ${
                  settings.auto_followup_enabled ? 'bg-[#f97316]' : 'bg-[#e5e5ea]'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm ${ds.transition} ${
                    settings.auto_followup_enabled ? 'left-[calc(100%-26px)]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-[#f2f2f7] flex items-center justify-between px-4 py-3 opacity-50">
              <div>
                <p className={`${ds.callout} text-black`}>Automatic Email Reminders</p>
                <p className={`${ds.footnote} text-[#f97316]`}>Coming soon</p>
              </div>
              <button disabled className="relative w-12 h-7 rounded-full bg-[#e5e5ea] cursor-not-allowed">
                <div className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>
        </div>

        {/* Frequency */}
        <div>
          <p className={`${ds.caption} text-[#8e8e93] mb-2`}>REMINDER FREQUENCY</p>
          <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {[
              { value: 3 as const, label: '3 days after due date', description: 'Quick follow-up' },
              { value: 7 as const, label: '7 days after due date', description: 'Balanced approach' },
              { value: 14 as const, label: '14 days after due date', description: 'Patient follow-up' }
            ].map((option, index, arr) => (
              <button
                key={option.value}
                onClick={() => handleFrequencyChange(option.value)}
                disabled={isSaving}
                className={`w-full flex items-center justify-between px-4 py-3 ${ds.transition} ${ds.press} ${
                  index < arr.length - 1 ? 'border-b border-[#f2f2f7]' : ''
                }`}
              >
                <div className="text-left">
                  <p className={`${ds.callout} text-black`}>{option.label}</p>
                  <p className={`${ds.footnote} text-[#8e8e93]`}>{option.description}</p>
                </div>
                {settings.reminder_frequency === option.value && (
                  <div className="w-6 h-6 bg-[#f97316] rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-4 py-4">
          <p className={`${ds.footnote} font-semibold text-black mb-2`}>How Reminders Work</p>
          <ul className={`${ds.footnote} text-[#8e8e93] flex flex-col gap-1.5`}>
            <li className="flex gap-2"><span className="text-[#f97316]">•</span><span>We check your invoices and suggest reminders for overdue payments</span></li>
            <li className="flex gap-2"><span className="text-[#f97316]">•</span><span>You choose when and how to send reminders — nothing happens automatically</span></li>
            <li className="flex gap-2"><span className="text-[#f97316]">•</span><span>You can dismiss reminders or mark invoices as paid anytime</span></li>
          </ul>
        </div>

      </div>
    </div>
  );
}
