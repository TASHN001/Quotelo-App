import { Home, FileText, Users, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ds } from '../lib/designSystem';

type Tab = 'home' | 'invoices-list' | 'clients' | 'profile';

const TABS: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: 'home',          label: 'Home',     Icon: Home },
  { id: 'invoices-list', label: 'Invoices', Icon: FileText },
  { id: 'clients',       label: 'Clients',  Icon: Users },
  { id: 'profile',       label: 'Profile',  Icon: User },
];

// Screens that belong to each tab (for active state detection on sub-screens)
const TAB_SCREENS: Record<Tab, string[]> = {
  'home':          ['home', 'ai-generator', 'data-preview', 'template-selector', 'document-preview', 'chat', 'dashboard'],
  'invoices-list': ['invoices-list', 'invoice-detail', 'invoice-editor', 'templates-list', 'template-preview'],
  'clients':       ['clients', 'client-details'],
  'profile':       ['profile', 'profile-data', 'app-settings', 'appearance-settings', 'change-password', 'language-settings', 'currency-settings', 'reminder-settings', 'data-privacy', 'eula-view', 'terms'],
};

export function BottomTabBar() {
  const { currentScreen, setCurrentScreen } = useApp();

  function activeTab(): Tab {
    for (const [tab, screens] of Object.entries(TAB_SCREENS) as [Tab, string[]][]) {
      if (screens.includes(currentScreen)) return tab;
    }
    return 'home';
  }

  const active = activeTab();

  return (
    <div className={`fixed bottom-0 left-0 right-0 ${ds.tabBar} pb-safe`}>
      <div className="flex items-center justify-around pt-2 pb-4">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => setCurrentScreen(id)}
              className={`flex flex-col items-center gap-1 flex-1 ${ds.transition}`}
            >
              <Icon
                className="w-6 h-6"
                strokeWidth={isActive ? 2.5 : 2}
                color={isActive ? '#f97316' : '#8e8e93'}
              />
              <span
                className={`text-[10px] font-semibold ${isActive ? 'text-[#f97316]' : 'text-[#8e8e93]'}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
