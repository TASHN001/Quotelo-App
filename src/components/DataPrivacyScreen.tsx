import { ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ds } from '../lib/designSystem';
import { dataPrivacySections } from '../content/dataPrivacy';

export function DataPrivacyScreen() {
  const { setCurrentScreen } = useApp();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Sub-screen header */}
      <div className="flex items-center gap-4 px-4 pt-12 pb-4">
        <button onClick={() => setCurrentScreen('profile')} className={ds.headerIconBtn}>
          <ChevronLeft className="w-4 h-4 text-[#3c3c43]" />
        </button>
        <h1 className={`${ds.title2} text-black flex-1`}>Data &amp; Privacy</h1>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className={`${ds.body} text-[#3c3c43] leading-relaxed`}>
          {dataPrivacySections.map((section, index) => (
            <div key={index} className="bg-[#f2f2f7] rounded-xl p-5 mb-4">
              <h2 className="text-sm font-bold text-black uppercase tracking-wide mb-3">
                {section.title}
              </h2>
              <p className="text-sm text-[#3c3c43] leading-relaxed">
                {section.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
