import { AppProvider, useApp } from './context/AppContext';
import { Splash } from './components/Splash';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { Home } from './components/Home';
import { AIGenerator } from './components/AIGenerator';
import { InvoiceDataPreview } from './components/InvoiceDataPreview';
import { TemplateSelector } from './components/TemplateSelector';
import { TemplatesList } from './components/TemplatesList';
import { TemplatePreview } from './components/TemplatePreview';
import { DocumentPreview } from './components/DocumentPreview';
import { Chat } from './components/Chat';
import { Profile } from './components/Profile';
import { InvoiceDetail } from './components/InvoiceDetail';
import { InvoiceEditor } from './components/InvoiceEditor';
import { Clients } from './components/Clients';
import { ClientDetails } from './components/ClientDetails';
import { DashboardOverview } from './components/DashboardOverview';
import { InvoicesList } from './components/InvoicesList';
import { ProfileDataScreen } from './components/ProfileDataScreen';
import { DataPrivacyScreen } from './components/DataPrivacyScreen';
import { AppSettingsScreen } from './components/AppSettingsScreen';
import { AppearanceScreen } from './components/AppearanceScreen';
import { ChangePasswordScreen } from './components/ChangePasswordScreen';
import { LanguageScreen } from './components/LanguageScreen';
import { CurrencyScreen } from './components/CurrencyScreen';
import { ReminderSettingsScreen } from './components/ReminderSettings';
import { EULAScreen } from './components/EULAScreen';
import { TermsScreen } from './components/TermsScreen';
import { UpgradePlanScreen } from './components/UpgradePlanScreen';
import { Toast } from './components/Toast';
import { BottomTabBar } from './components/BottomTabBar';

// Screens that show the persistent bottom tab bar
const TAB_BAR_SCREENS = new Set([
  'home', 'invoices-list', 'invoice-detail', 'invoice-editor',
  'clients', 'client-details', 'profile', 'profile-data',
  'app-settings', 'appearance-settings', 'change-password',
  'language-settings', 'currency-settings', 'reminder-settings',
  'data-privacy', 'eula-view', 'terms', 'dashboard',
  'templates-list', 'template-preview',
]);

function AppRouter() {
  const { currentScreen } = useApp();

  switch (currentScreen) {
    case 'splash':           return <Splash />;
    case 'auth':             return <Auth />;
    case 'onboarding':       return <Onboarding />;
    case 'home':             return <Home />;
    case 'ai-generator':     return <AIGenerator />;
    case 'data-preview':     return <InvoiceDataPreview />;
    case 'template-selector':return <TemplateSelector />;
    case 'templates-list':   return <TemplatesList />;
    case 'template-preview': return <TemplatePreview />;
    case 'document-preview': return <DocumentPreview />;
    case 'chat':             return <Chat />;
    case 'invoice-detail':   return <InvoiceDetail />;
    case 'invoice-editor':   return <InvoiceEditor />;
    case 'clients':          return <Clients />;
    case 'client-details':   return <ClientDetails />;
    case 'dashboard':        return <DashboardOverview />;
    case 'invoices-list':    return <InvoicesList />;
    case 'profile-data':     return <ProfileDataScreen />;
    case 'profile':          return <Profile />;
    case 'data-privacy':     return <DataPrivacyScreen />;
    case 'app-settings':     return <AppSettingsScreen />;
    case 'appearance-settings': return <AppearanceScreen />;
    case 'change-password':  return <ChangePasswordScreen />;
    case 'language-settings':return <LanguageScreen />;
    case 'currency-settings':return <CurrencyScreen />;
    case 'reminder-settings':return <ReminderSettingsScreen />;
    case 'eula':             return <EULAScreen />;
    case 'eula-view':        return <EULAScreen viewOnly />;
    case 'terms':            return <TermsScreen />;
    case 'upgrade-plan':     return <UpgradePlanScreen />;
    default:                 return <Splash />;
  }
}

function ToastContainer() {
  const { toasts, removeToast } = useApp();
  return (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}

function App() {
  const { currentScreen } = useApp();
  const showTabBar = TAB_BAR_SCREENS.has(currentScreen);

  return (
    <>
      <AppRouter />
      {showTabBar && <BottomTabBar />}
      <ToastContainer />
    </>
  );
}

function AppWithProvider() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}

export default AppWithProvider;
