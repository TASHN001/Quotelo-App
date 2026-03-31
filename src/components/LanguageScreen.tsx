import { ArrowLeft, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../lib/translations';

export function LanguageScreen() {
  const { setCurrentScreen, language, updateLanguage, t } = useApp();

  const handleLanguageChange = async (newLanguage: typeof language) => {
    await updateLanguage(newLanguage);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col transition-colors">
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => setCurrentScreen('app-settings')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white absolute left-1/2 transform -translate-x-1/2">
            {t('language.title')}
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('language.selectLanguage')}
        </p>

        <div className="space-y-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">{lang.nativeName}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{lang.name}</div>
                </div>
                {language === lang.code && (
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
