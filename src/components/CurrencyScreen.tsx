import { ChevronLeft, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CURRENCIES } from '../lib/currency';
import { ds } from '../lib/designSystem';

export function CurrencyScreen() {
  const { setCurrentScreen, currency, updateCurrency, t } = useApp();

  const handleCurrencyChange = async (newCurrency: typeof currency) => {
    await updateCurrency(newCurrency);
  };

  return (
    <div className={`min-h-screen ${ds.bg}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => setCurrentScreen('profile')} className={ds.headerIconBtn}>
          <ChevronLeft className="w-4 h-4 text-[#3c3c43]" />
        </button>
        <h1 className={`${ds.title2} text-black`}>{t('currency.title')}</h1>
      </div>

      <div className="px-4 flex flex-col gap-4 pb-10">
        <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {CURRENCIES.map((curr, index) => (
            <button
              key={curr.code}
              onClick={() => handleCurrencyChange(curr.code)}
              className={`w-full flex items-center justify-between px-4 py-3 ${ds.transition} ${ds.press} ${
                index < CURRENCIES.length - 1 ? 'border-b border-[#f2f2f7]' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{curr.symbol}</span>
                <div className="text-left">
                  <p className={`${ds.callout} text-black`}>{curr.code}</p>
                  <p className={`${ds.footnote} text-[#8e8e93]`}>{curr.name}</p>
                </div>
              </div>
              {currency === curr.code && (
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
