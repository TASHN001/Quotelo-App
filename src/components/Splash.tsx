import { useApp } from '../context/AppContext';
import { useState, useEffect } from 'react';
import { designSystem as ds } from '../lib/designSystem';

export function Splash() {
  const { setCurrentScreen, authUser, dbUserProfile, isLoading } = useApp();
  const [logoVisible, setLogoVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLogoVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  console.log('[Splash] Rendering, isLoading:', isLoading, 'authUser:', !!authUser, 'dbUserProfile:', !!dbUserProfile);

  return (
    <div className={`min-h-screen ${ds.surfaces.base.light} ${ds.surfaces.base.dark} flex flex-col items-center justify-between p-8`}>
      <div className="flex-1 flex flex-col items-center justify-center">
        <img
          src="/Quotelo.png"
          alt="Quotelo Logo"
          className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mb-6 drop-shadow-lg"
        />

        <h1 className={`${ds.typography.h1} text-gray-900 dark:text-white mb-3`}>Quotelo</h1>

        <p className={`${ds.typography.body} text-gray-500 dark:text-gray-400 text-center mb-12`}>
          The future of effortless billing.
        </p>

        <button
          onClick={() => {
            if (!authUser) {
              setCurrentScreen('auth');
            } else if (!dbUserProfile?.eula_accepted) {
              setCurrentScreen('eula');
            } else if (dbUserProfile?.onboarding_complete) {
              setCurrentScreen('home');
            } else {
              setCurrentScreen('onboarding');
            }
          }}
          className={`w-full max-w-sm ${ds.button.primary.base} ${ds.button.primary.hover} ${ds.button.primary.active} text-white py-4 px-8 ${ds.radius.lg} font-semibold text-lg ${ds.button.primary.shadow} ${ds.button.primary.hoverShadow} ${ds.button.primary.activeShadow} ${ds.transition.spring} active:scale-[0.98]`}
          style={{ animation: 'shake 2.5s ease-in-out infinite' }}
        >
          Get Started
        </button>
      </div>

      <div className="text-center pb-8">
        <p className={`${ds.typography.caption} text-gray-400 dark:text-gray-500 tracking-wider mb-2`}>
          POWERED BY
        </p>
        <img
          src="/novify_logo_(1).png"
          alt="Novify Logo"
          className={`h-12 mx-auto transition-all duration-1000 ease-in-out ${
            logoVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        />
      </div>
    </div>
  );
}
