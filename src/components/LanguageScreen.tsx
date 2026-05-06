import { ChevronLeft, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../lib/translations';
import { ds } from '../lib/designSystem';

export function LanguageScreen() {
  const { setCurrentScreen, language, updateLanguage, t } = useApp();

  const handleLanguageChange = async (newLanguage: typeof language) => {
    await updateLanguage(newLanguage);
  };

  return (
    <div className={`min-h-screen ${ds.bg}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => setCurrentScreen('profile')} className={ds.headerIconBtn}>
          <ChevronLeft className="w-4 h-4 text-[#3c3c43]" />
        </button>
        <h1 className={`${ds.title2} text-black`}>{t('language.title')}</h1>
      </div>

      <div className="px-4 flex flex-col gap-4 pb-10">
        <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {LANGUAGES.map((lang, index) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-3 ${ds.transition} ${ds.press} ${
                index < LANGUAGES.length - 1 ? 'border-b border-[#f2f2f7]' : ''
              }`}
            >
              <div className="text-left">
                <p className={`${ds.callout} text-black`}>{lang.nativeName}</p>
                <p className={`${ds.footnote} text-[#8e8e93]`}>{lang.name}</p>
              </div>
              {language === lang.code && (
                <div className="w-6 h-6 bg-[#f97316] rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
