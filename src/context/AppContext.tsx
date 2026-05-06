import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../lib/database';
import { auth } from '../lib/auth';
import type { User } from '@supabase/supabase-js';
import type { UserProfile as DBUserProfile, Business, Document, ChatThread, DocumentTemplate, InvoiceDraft, Client } from '../lib/types';
import { translations, type Language, type TranslationKey } from '../lib/translations';
import { formatCurrency as formatCurrencyUtil, type Currency } from '../lib/currency';

interface LocalUserProfile {
  name: string;
  avatar?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  companyName: string;
  amount: number;
  status: string;
  date: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface CountryInfo {
  name: string;
  code: string;
  flag: string;
}

interface AppState {
  currentScreen: string;
  authUser: User | null;
  userProfile: LocalUserProfile;
  dbUserProfile: DBUserProfile | null;
  business: Business | null;
  selectedDocumentType: string;
  selectedTemplateKey: string | null;
  selectedPreviewTemplateKey: string | null;
  draftDocumentData: any | null;
  invoiceDraft: InvoiceDraft | null;
  savedDocumentId: string | null;
  selectedClientId: string | null;
  selectedClient: Client | null;
  chatHistoryByType: Record<string, ChatMessage[]>;
  recentInvoices: Invoice[];
  currentThreadId: string | null;
  isLoading: boolean;
  toasts: ToastMessage[];
  language: Language;
  currency: Currency;
  country: CountryInfo | null;
  setCurrentScreen: (screen: string) => void;
  setUserProfile: (profile: LocalUserProfile) => void;
  setSelectedDocumentType: (type: string) => void;
  setSelectedTemplateKey: (key: string | null) => void;
  setSelectedPreviewTemplateKey: (key: string | null) => void;
  setDraftDocumentData: (data: any | null) => void;
  setInvoiceDraft: (draft: InvoiceDraft | null) => void;
  setSavedDocumentId: (id: string | null) => void;
  setSelectedClientId: (id: string | null) => void;
  setSelectedClient: (client: Client | null) => void;
  addChatMessage: (type: string, message: ChatMessage) => void;
  getChatHistory: (type: string) => ChatMessage[];
  refreshDocuments: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getTemplates: () => Promise<DocumentTemplate[]>;
  initializeAuthenticatedUser: (userId: string) => Promise<void>;
  handleSignOut: () => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  t: (key: TranslationKey) => string;
  updateLanguage: (language: Language) => Promise<void>;
  formatCurrency: (amount: number) => string;
  updateCurrency: (currency: Currency) => Promise<void>;
  updateCountry: (country: CountryInfo) => Promise<void>;
  acceptEula: () => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

const STORAGE_KEY = 'quotelo_app_state';
const USER_ID_KEY = 'quotelo_user_id';
const CURRENCY_KEY = 'quotelo_currency';
const COUNTRY_KEY = 'quotelo_country';
const LANGUAGE_KEY = 'quotelo_language';

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<LocalUserProfile>({ name: '' });
  const [dbUserProfile, setDbUserProfile] = useState<DBUserProfile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState('Invoice');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [draftDocumentData, setDraftDocumentData] = useState<any | null>(null);
  const [invoiceDraft, setInvoiceDraft] = useState<InvoiceDraft | null>(null);
  const [chatHistoryByType, setChatHistoryByType] = useState<Record<string, ChatMessage[]>>({});
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPreviewTemplateKey, setSelectedPreviewTemplateKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('ZAR');
  const [country, setCountry] = useState<CountryInfo | null>(null);

  useEffect(() => {
    // Always enforce light mode
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  useEffect(() => {
    // Set up auth state listener synchronously so the subscription can be cleaned up on unmount
    const subscription = auth.onAuthStateChange((session) => {
      if (session && session.user) {
        console.log('[App] Auth state changed: user signed in');
        setAuthUser(session.user);
        loadUserData(session.user.id);
      } else {
        console.log('[App] Auth state changed: user signed out');
        setAuthUser(null);
        setDbUserProfile(null);
        setBusiness(null);
        setUserProfile({ name: '' });
        setRecentInvoices([]);
        setCurrentScreen('splash');
      }
    });

    initializeApp();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const initializeApp = async () => {
    try {
      console.log('[App] Initializing application...');

      const session = await auth.getSession();

      if (session && session.user) {
        console.log('[App] Found existing session for user:', session.user.id);
        setAuthUser(session.user);
        await loadUserData(session.user.id);
      } else {
        console.log('[App] No existing session, user needs to sign in');
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.selectedDocumentType) setSelectedDocumentType(data.selectedDocumentType);
        } catch (e) {
          console.error('[App] Failed to parse stored state', e);
        }
      }

      console.log('[App] Initialization complete');
    } catch (error) {
      console.error('[App] Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    console.log('[App] Loading user data for:', userId);

    localStorage.setItem(USER_ID_KEY, userId);

    // Load cached preferences from localStorage for instant UI
    const cachedCurrency = localStorage.getItem(CURRENCY_KEY);
    const cachedCountry = localStorage.getItem(COUNTRY_KEY);
    const cachedLanguage = localStorage.getItem(LANGUAGE_KEY);

    if (cachedCurrency) {
      setCurrency(cachedCurrency as Currency);
    }
    if (cachedCountry) {
      try {
        setCountry(JSON.parse(cachedCountry));
      } catch (e) {
        console.error('[App] Failed to parse cached country', e);
      }
    }
    if (cachedLanguage) {
      setLanguage(cachedLanguage as Language);
    }

    let profile = await db.getUserProfile(userId);

    if (!profile) {
      console.log('[App] Profile not found, creating new profile...');
      const authUser = await auth.getCurrentUser();
      profile = await db.createUserProfile(
        userId,
        authUser?.user_metadata?.full_name || '',
        authUser?.email || ''
      );

      if (!profile) {
        console.error('[App] Failed to create user profile');
        return;
      }
    }

    console.log('[App] User profile loaded:', profile);
    setDbUserProfile(profile);
    setUserProfile({ name: profile.full_name || '' });

    // Load language preference from database
    if (profile.language) {
      setLanguage(profile.language as Language);
      localStorage.setItem(LANGUAGE_KEY, profile.language);
    }

    const businesses = await db.getUserBusinesses(userId);
    console.log('[App] Businesses loaded:', businesses);

    if (businesses.length > 0) {
      setBusiness(businesses[0]);

      // Load currency from business
      if (businesses[0].default_currency) {
        setCurrency(businesses[0].default_currency as Currency);
        localStorage.setItem(CURRENCY_KEY, businesses[0].default_currency);
      }

      // Load country data from business
      if (businesses[0].country_code && businesses[0].country && businesses[0].country_flag) {
        const countryInfo: CountryInfo = {
          name: businesses[0].country,
          code: businesses[0].country_code,
          flag: businesses[0].country_flag
        };
        setCountry(countryInfo);
        localStorage.setItem(COUNTRY_KEY, JSON.stringify(countryInfo));
      }
    } else {
      console.log('[App] No businesses found for user');
    }

    await loadDocuments(userId);

    console.log('[App] User data loaded, navigating to correct screen');
    if (!profile.eula_accepted) {
      setCurrentScreen('eula');
    } else if (!profile.onboarding_complete) {
      setCurrentScreen('onboarding');
    } else {
      setCurrentScreen('home');
    }
  };

  const initializeAuthenticatedUser = async (userId: string) => {
    console.log('[App] Initializing authenticated user:', userId);
    await loadUserData(userId);
  };

  const handleSignOut = async () => {
    console.log('[App] Signing out user');

    const result = await auth.signOut();

    if (!result.success) {
      console.error('[App] Sign out failed:', result.error);
      return;
    }

    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(STORAGE_KEY);

    setAuthUser(null);
    setDbUserProfile(null);
    setBusiness(null);
    setUserProfile({ name: '' });
    setRecentInvoices([]);
    setChatHistoryByType({});
    setCurrentThreadId(null);

    setCurrentScreen('splash');
  };

  const loadDocuments = async (userId: string) => {
    const docs = await db.getUserDocuments(userId, 5);
    const invoices: Invoice[] = docs.map(doc => ({
      id: doc.id,
      invoiceNumber: doc.document_number || '',
      companyName: doc.client_name,
      amount: doc.total,
      status: doc.status,
      date: new Date(doc.created_at).toISOString().split('T')[0]
    }));
    setRecentInvoices(invoices);
  };

  const refreshDocuments = async () => {
    const userId = localStorage.getItem(USER_ID_KEY);
    if (userId) {
      await loadDocuments(userId);
    }
  };

  const refreshProfile = async () => {
    const userId = localStorage.getItem(USER_ID_KEY);
    if (userId) {
      const profile = await db.getUserProfile(userId);
      if (profile) {
        setDbUserProfile(profile);
        setUserProfile({ name: profile.full_name });

        const businesses = await db.getUserBusinesses(userId);
        if (businesses.length > 0) {
          setBusiness(businesses[0]);

          // Refresh currency
          if (businesses[0].default_currency) {
            setCurrency(businesses[0].default_currency as Currency);
            localStorage.setItem(CURRENCY_KEY, businesses[0].default_currency);
          }

          // Refresh country data
          if (businesses[0].country_code && businesses[0].country && businesses[0].country_flag) {
            const countryInfo: CountryInfo = {
              name: businesses[0].country,
              code: businesses[0].country_code,
              flag: businesses[0].country_flag
            };
            setCountry(countryInfo);
            localStorage.setItem(COUNTRY_KEY, JSON.stringify(countryInfo));
          }
        }
      }
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const updateLanguage = async (newLanguage: Language) => {
    setLanguage(newLanguage);

    if (authUser) {
      const result = await db.updateUserProfileLanguage(authUser.id, newLanguage);
      if (result) {
        setDbUserProfile(result);
      }
    }
  };

  const formatCurrency = (amount: number): string => {
    return formatCurrencyUtil(amount, currency);
  };

  const updateCurrency = async (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem(CURRENCY_KEY, newCurrency);

    if (authUser && business) {
      const result = await db.updateBusinessCurrency(business.id, newCurrency);
      if (result) {
        setBusiness(result);
      }
    }
  };

  const updateCountry = async (newCountry: CountryInfo) => {
    setCountry(newCountry);
    localStorage.setItem(COUNTRY_KEY, JSON.stringify(newCountry));

    if (authUser && business) {
      const result = await db.updateBusiness(business.id, {
        country: newCountry.name,
        country_code: newCountry.code,
        country_flag: newCountry.flag
      });
      if (result) {
        setBusiness(result);
      }
    }
  };

  const getTemplates = async (): Promise<DocumentTemplate[]> => {
    if (!dbUserProfile) return [];
    return await db.getTemplates(dbUserProfile.plan_tier, selectedDocumentType);
  };

  const acceptEula = async () => {
    if (!authUser) return;
    const now = new Date().toISOString();
    const updated = await db.updateUserProfile(authUser.id, {
      eula_accepted: true,
      eula_accepted_at: now
    });
    if (updated) {
      setDbUserProfile(updated);
      if (updated.onboarding_complete) {
        setCurrentScreen('home');
      } else {
        setCurrentScreen('onboarding');
      }
    }
  };

  useEffect(() => {
    const stateToStore = {
      selectedDocumentType
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToStore));
  }, [selectedDocumentType]);

  const addChatMessage = async (type: string, message: ChatMessage) => {
    setChatHistoryByType(prev => ({
      ...prev,
      [type]: [...(prev[type] || []), message]
    }));

    const userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) return;

    let threadId = currentThreadId;
    if (!threadId) {
      const thread = await db.createChatThread(userId, type);
      if (thread) {
        threadId = thread.id;
        setCurrentThreadId(threadId);
      }
    }

    if (threadId) {
      await db.createChatMessage(threadId, message.role, message.content);
    }
  };

  const getChatHistory = (type: string): ChatMessage[] => {
    return chatHistoryByType[type] || [];
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  console.log('[AppContext] Rendering provider, currentScreen:', currentScreen, 'isLoading:', isLoading);

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        authUser,
        userProfile,
        dbUserProfile,
        business,
        selectedDocumentType,
        selectedTemplateKey,
        selectedPreviewTemplateKey,
        draftDocumentData,
        invoiceDraft,
        savedDocumentId,
        selectedClientId,
        selectedClient,
        chatHistoryByType,
        recentInvoices,
        currentThreadId,
        isLoading,
        toasts,
        language,
        currency,
        country,
        setCurrentScreen,
        setUserProfile,
        setSelectedDocumentType,
        setSelectedTemplateKey,
        setSelectedPreviewTemplateKey,
        setDraftDocumentData,
        setInvoiceDraft,
        setSavedDocumentId,
        setSelectedClientId,
        setSelectedClient,
        addChatMessage,
        getChatHistory,
        refreshDocuments,
        refreshProfile,
        getTemplates,
        initializeAuthenticatedUser,
        handleSignOut,
        showToast,
        removeToast,
        t,
        updateLanguage,
        formatCurrency,
        updateCurrency,
        updateCountry,
        acceptEula
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
