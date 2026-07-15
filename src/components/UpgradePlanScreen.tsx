import { ChevronLeft, Check, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ds } from '../lib/designSystem';

const FREE_FEATURES = [
  'Up to 5 invoices/month',
  'Basic templates',
  'PDF export',
  'WhatsApp sharing',
  'Client management',
];

const PRO_FEATURES = [
  'Unlimited invoices',
  'All premium templates',
  'AI voice & text generation',
  'Customer statements',
  'Overdue reminders',
  'Custom branding & logo',
  'Priority support',
];

export function UpgradePlanScreen() {
  const { setCurrentScreen, dbUserProfile } = useApp();
  const isPro = dbUserProfile?.plan_tier === 'pro';

  const handleUpgrade = () => {
    // ponytail: full IAP requires Capacitor native SDK; placeholder CTA until wired
    window.open('mailto:support@quoteloapp.com?subject=Upgrade%20to%20Pro%20Plan', '_blank');
  };

  const handleManageSubscription = () => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const url = isIOS
      ? 'itms-apps://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';
    window.open(url, '_blank');
  };

  return (
    <div className={`h-screen overflow-y-auto ${ds.bg}`}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => setCurrentScreen('profile')} className={ds.headerIconBtn}>
          <ChevronLeft className="w-4 h-4 text-[#3c3c43]" />
        </button>
        <h1 className={`${ds.title2} text-black`}>Upgrade Plan</h1>
      </div>

      <div className="px-4 pb-10 flex flex-col gap-4">

        {/* Free plan */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-3">
            <p className={`${ds.caption} text-[#8e8e93]`}>{isPro ? 'PREVIOUS PLAN' : 'CURRENT PLAN'}</p>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#f2f2f7] rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#8e8e93]" strokeWidth={2} />
            </div>
            <div>
              <p className={`${ds.headline} text-black font-semibold`}>Free Plan</p>
              <p className={`${ds.footnote} text-[#8e8e93]`}>$0 / month</p>
            </div>
          </div>
          <div className="space-y-2">
            {FREE_FEATURES.map(f => (
              <div key={f} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#34c759] flex-shrink-0" strokeWidth={2.5} />
                <p className={`${ds.footnote} text-[#3c3c43]`}>{f}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pro plan */}
        <div className="bg-[#f97316] rounded-2xl p-5 shadow-[0_4px_16px_rgba(249,115,22,0.3)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" strokeWidth={2} fill="white" />
              </div>
              <div>
                <p className={`${ds.headline} text-white font-semibold`}>Pro Plan</p>
                <p className={`${ds.footnote} text-white/80`}>$12 / month</p>
              </div>
            </div>
            <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {isPro ? 'ACTIVE' : 'BEST VALUE'}
            </span>
          </div>

          <div className="space-y-2 mb-5">
            {PRO_FEATURES.map(f => (
              <div key={f} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white flex-shrink-0" strokeWidth={2.5} />
                <p className={`${ds.footnote} text-white`}>{f}</p>
              </div>
            ))}
          </div>

          {isPro ? (
            <button
              onClick={handleManageSubscription}
              className="block w-full bg-white text-[#f97316] text-center font-semibold rounded-xl py-3 text-[15px] active:scale-[0.97] transition-all duration-150"
            >
              Manage Subscription
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              className="block w-full bg-white text-[#f97316] text-center font-semibold rounded-xl py-3 text-[15px] active:scale-[0.97] transition-all duration-150"
            >
              Upgrade to Pro
            </button>
          )}
        </div>

        <p className={`${ds.footnote} text-[#8e8e93] text-center`}>
          Questions? Email us at support@quoteloapp.com
        </p>
      </div>
    </div>
  );
}
