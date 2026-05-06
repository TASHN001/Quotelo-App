import { ChevronLeft, Sun, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ds } from '../lib/designSystem';

export function AppearanceScreen() {
  const { setCurrentScreen } = useApp();

  return (
    <div className={`min-h-screen ${ds.bg}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => setCurrentScreen('profile')} className={ds.headerIconBtn}>
          <ChevronLeft className="w-4 h-4 text-[#3c3c43]" />
        </button>
        <h1 className={`${ds.title2} text-black`}>Appearance</h1>
      </div>

      <div className="px-4 flex flex-col gap-4 pb-10">
        <div>
          <p className={`${ds.caption} text-[#8e8e93] mb-2`}>THEME</p>
          <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#007aff]">
                  <Sun className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div className="text-left">
                  <p className={`${ds.callout} text-black`}>Light</p>
                  <p className={`${ds.footnote} text-[#8e8e93]`}>Light mode theme</p>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full bg-[#007aff] flex items-center justify-center">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
