import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/database';
import type { UserReminderSettings } from '../lib/types';
import { getCurrentDate } from '../lib/dateUtils';

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
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('app-settings')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice Reminders</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage overdue invoice notifications</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-300">
            <p className="font-semibold mb-1">Smart Reminders Help You Get Paid Faster</p>
            <p>We'll suggest when to send follow-ups for overdue invoices. All reminders are optional and you stay in full control.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Reminder Suggestions</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Show alerts for overdue invoices</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('auto_followup_enabled')}
                disabled={isSaving}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.auto_followup_enabled
                    ? 'bg-orange-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.auto_followup_enabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Reminder Frequency</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              How many days after the due date should we suggest sending a reminder?
            </p>

            <div className="space-y-2">
              {[
                { value: 3 as const, label: '3 days after due date', description: 'Quick follow-up' },
                { value: 7 as const, label: '7 days after due date', description: 'Balanced approach' },
                { value: 14 as const, label: '14 days after due date', description: 'Patient follow-up' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFrequencyChange(option.value)}
                  disabled={isSaving}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    settings.reminder_frequency === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-300 dark:hover:border-orange-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
                    </div>
                    {settings.reminder_frequency === option.value && (
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 opacity-50">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Automatic Email Reminders</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Send reminders automatically via email</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">Coming soon</p>
              </div>
              <button
                disabled
                className="relative w-14 h-8 rounded-full bg-gray-200 dark:bg-gray-700 cursor-not-allowed"
              >
                <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">How Reminders Work</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li className="flex gap-2">
              <span className="text-orange-500">•</span>
              <span>We check your invoices and suggest reminders for overdue payments</span>
            </li>
            <li className="flex gap-2">
              <span className="text-orange-500">•</span>
              <span>You choose when and how to send reminders - nothing happens automatically</span>
            </li>
            <li className="flex gap-2">
              <span className="text-orange-500">•</span>
              <span>You can dismiss reminders or mark invoices as paid anytime</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
