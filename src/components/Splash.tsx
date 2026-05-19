import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ds } from '../lib/designSystem';

export function Splash() {
  const { setCurrentScreen, authUser, dbUserProfile, isLoading } = useApp();
  const [novifyVisible, setNovifyVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setNovifyVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  function handleStart() {
    if (!authUser)                            return setCurrentScreen('auth');
    if (!dbUserProfile?.eula_accepted)        return setCurrentScreen('eula');
    if (dbUserProfile?.onboarding_complete)   return setCurrentScreen('home');
    setCurrentScreen('onboarding');
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-between p-8">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <img
          src="/Quotelo_Logo.png"
          alt="Quotelo"
          className="w-48 h-48 mb-6 drop-shadow-sm"
        />
        <h1 className={`${ds.largeTitle} text-black mb-3 text-center`}>Quotelo</h1>
        <p className={`${ds.callout} text-[#8e8e93] text-center mb-14`}>
          The future of effortless billing.
        </p>

        <button
          onClick={handleStart}
          disabled={isLoading}
          className={`${ds.btnPrimary} w-full text-center`}
        >
          {isLoading ? 'Loading…' : 'Get Started'}
        </button>
      </div>

      <div className="text-center pb-8">
        <p className={`${ds.caption} text-[#c7c7cc] mb-2`}>POWERED BY</p>
        <img
          src="/novify_logo_(1).png"
          alt="Novify"
          className={`h-10 mx-auto ${ds.transition} ${novifyVisible ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
    </div>
  );
}
