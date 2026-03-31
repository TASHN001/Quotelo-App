import { useState, useRef } from 'react';
import { Upload, Check, Shield, Mic, FileText, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storage } from '../lib/storage';
import { db } from '../lib/database';
import { auth } from '../lib/auth';
import { SignaturePad } from './SignaturePad';
import { IndustryGroupSelector } from './IndustryGroupSelector';
import { IndustryTypeSelector } from './IndustryTypeSelector';
import { IndustryGroup } from '../lib/industryData';
import CountrySelect from './CountrySelect';
import CurrencySelect from './CurrencySelect';
import { CountryData } from '../lib/countryData';
import { Currency } from '../lib/currency';
import { getSampleInvoiceData } from '../lib/sampleData';

interface OnboardingState {
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  logoUrl: string;
  logoFile: File | null;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  country: string;
  countryCode: string;
  countryFlag: string;
  defaultCurrency: string;
  industryGroup: IndustryGroup | null;
  industryType: string | null;
  signatureDataUrl: string;
  includeSignatureAutomatically: boolean;
  errors: {
    fullName?: string;
    email?: string;
    businessName?: string;
    country?: string;
    industryGroup?: string;
  };
}

export function Onboarding() {
  const { setCurrentScreen, dbUserProfile, business, refreshProfile, setDraftDocumentData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUserId = async (): Promise<string | null> => {
    let userId = localStorage.getItem('quotelo_user_id');

    if (!userId) {
      console.log('[Onboarding] No userId in localStorage, trying to get from auth session...');
      const user = await auth.getCurrentUser();
      if (user) {
        userId = user.id;
        localStorage.setItem('quotelo_user_id', userId);
        console.log('[Onboarding] Retrieved userId from auth session:', userId);
      }
    }

    return userId;
  };

  const [state, setState] = useState<OnboardingState>({
    step: 1,
    logoUrl: business?.logo_url || '',
    logoFile: null,
    fullName: dbUserProfile?.full_name || '',
    email: dbUserProfile?.email || '',
    phone: dbUserProfile?.phone || '',
    businessName: business?.business_name || '',
    country: business?.country || '',
    countryCode: business?.country_code || '',
    countryFlag: business?.country_flag || '',
    defaultCurrency: business?.default_currency || 'ZAR',
    industryGroup: null,
    industryType: null,
    signatureDataUrl: '',
    includeSignatureAutomatically: false,
    errors: {}
  });

  const [isLoading, setIsLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('[Onboarding] File selected:', file.name, file.type);

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, GIF, or WebP)');
      return;
    }

    setState(prev => ({ ...prev, logoFile: file }));

    setIsLoading(true);
    setUploadSuccess(false);

    const userId = await getUserId();
    if (!userId) {
      console.error('[Onboarding] No user ID found');
      alert('User session not found. Please sign in again.');
      setIsLoading(false);
      return;
    }

    console.log('[Onboarding] Starting upload for user:', userId);

    const { url, error: uploadError } = await storage.uploadLogo(file, userId);

    if (uploadError || !url) {
      console.error('[Onboarding] Upload failed:', uploadError);
      alert(uploadError || 'Failed to upload logo. Please check your connection and try again.');
      setIsLoading(false);
      return;
    }

    console.log('[Onboarding] Upload successful, storing URL in state. Will save to database in Step 3.');
    setState(prev => ({ ...prev, logoUrl: url }));
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 2000);
    setIsLoading(false);
  };

  const validateStep2 = (): boolean => {
    const errors: OnboardingState['errors'] = {};

    if (!state.fullName || state.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }

    if (!state.email || !state.email.includes('@')) {
      errors.email = 'Please enter a valid email address';
    }

    setState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errors: OnboardingState['errors'] = {};

    if (!state.businessName || state.businessName.trim().length < 2) {
      errors.businessName = 'Business name is required';
    }

    if (!state.countryCode || state.countryCode.trim().length < 2) {
      errors.country = 'Country is required';
    }

    setState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  const handleContinueStep1 = () => {
    setState(prev => ({ ...prev, step: 2 }));
  };

  const handleContinueStep2 = async () => {
    console.log('[Onboarding] Step 2: Validating...');

    if (!validateStep2()) {
      console.log('[Onboarding] Step 2: Validation failed');
      return;
    }

    setIsLoading(true);

    const userId = await getUserId();
    if (!userId) {
      console.error('[Onboarding] Step 2: No user ID found');
      alert('User session not found. Please sign in again.');
      setIsLoading(false);
      return;
    }

    console.log('[Onboarding] Step 2: Saving profile for user:', userId, {
      fullName: state.fullName,
      email: state.email,
      phone: state.phone
    });

    const result = await db.upsertUserProfile(userId, {
      full_name: state.fullName,
      email: state.email,
      phone: state.phone || undefined
    });

    setIsLoading(false);

    if (result) {
      console.log('[Onboarding] Step 2: Profile saved successfully:', result);
      setState(prev => ({ ...prev, step: 3 }));
    } else {
      console.error('[Onboarding] Step 2: Failed to save profile. Check browser console for Supabase errors.');
      alert('Failed to save your profile. Please check the browser console for details and try again.');
    }
  };

  const handleContinueStep3 = () => {
    if (!state.industryGroup) {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, industryGroup: 'Please select an industry group' }
      }));
      return;
    }
    setState(prev => ({ ...prev, step: 4, errors: { ...prev.errors, industryGroup: undefined } }));
  };

  const handleContinueStep4 = () => {
    setState(prev => ({ ...prev, step: 5 }));
  };

  const handleSkipStep4 = () => {
    setState(prev => ({ ...prev, industryType: null, step: 5 }));
  };

  const handleCountryChange = (country: CountryData) => {
    setState(prev => ({
      ...prev,
      country: country.name,
      countryCode: country.code,
      countryFlag: country.flag,
      defaultCurrency: country.currencyCode as Currency,
      errors: { ...prev.errors, country: undefined }
    }));
  };

  const handleContinueStep5 = async () => {
    console.log('[Onboarding] Step 5: Validating...');

    if (!validateStep3()) {
      console.log('[Onboarding] Step 5: Validation failed');
      return;
    }

    setIsLoading(true);

    const userId = await getUserId();
    if (!userId) {
      console.error('[Onboarding] Step 5: No user ID found');
      alert('User session not found. Please sign in again.');
      setIsLoading(false);
      return;
    }

    console.log('[Onboarding] Step 5: Saving business...', {
      businessName: state.businessName,
      country: state.country,
      countryCode: state.countryCode,
      countryFlag: state.countryFlag,
      defaultCurrency: state.defaultCurrency,
      industryGroup: state.industryGroup,
      industryType: state.industryType,
      logoUrl: state.logoUrl
    });

    const businessResult = await db.upsertBusiness(userId, {
      business_name: state.businessName,
      country: state.country,
      country_code: state.countryCode,
      country_flag: state.countryFlag,
      default_currency: state.defaultCurrency,
      email: state.email,
      phone: state.phone || undefined,
      logo_url: state.logoUrl || undefined,
      industry_group: state.industryGroup || 'Other',
      industry_type: state.industryType && state.industryType !== 'General' ? state.industryType : undefined
    });

    if (!businessResult) {
      console.error('[Onboarding] Step 5: Failed to save business');
      alert('Failed to save business details. Please check the console for details and try again.');
      setIsLoading(false);
      return;
    }

    console.log('[Onboarding] Step 5: Business saved, moving to signature step...');
    setState(prev => ({ ...prev, step: 6 }));
    setIsLoading(false);
  };

  const handleSignatureSave = (dataUrl: string, setAsDefault: boolean, includeAutomatically: boolean) => {
    setState(prev => ({ ...prev, signatureDataUrl: dataUrl, includeSignatureAutomatically: includeAutomatically }));
  };

  const handleContinueStep6 = async () => {
    if (!state.signatureDataUrl) {
      alert('Please create your signature before continuing.');
      return;
    }

    setIsLoading(true);

    const userId = await getUserId();
    if (!userId) {
      console.error('[Onboarding] Step 6: No user ID found');
      alert('User session not found. Please sign in again.');
      setIsLoading(false);
      return;
    }

    console.log('[Onboarding] Step 6: Saving signature...');

    const profileResult = await db.updateUserProfile(userId, {
      signature_data_url: state.signatureDataUrl,
      include_signature_automatically: state.includeSignatureAutomatically
    });

    if (!profileResult) {
      console.error('[Onboarding] Step 6: Failed to save signature');
      alert('Failed to save signature. Please try again.');
      setIsLoading(false);
      return;
    }

    console.log('[Onboarding] Step 6: Signature saved, moving to final step...');
    setState(prev => ({ ...prev, step: 7 }));
    setIsLoading(false);
  };

  const handleVoiceDemo = () => {
    console.log('[Onboarding] Step 7: Starting voice demo...');
    setCurrentScreen('ai-generator');
  };

  const handleGenerateSampleInvoice = () => {
    console.log('[Onboarding] Step 7: Generating sample invoice...');
    const sampleData = getSampleInvoiceData();
    setDraftDocumentData(sampleData);
    setCurrentScreen('document-preview');
  };

  const handleSkipStep7 = async () => {
    setIsLoading(true);

    const userId = await getUserId();
    if (!userId) {
      console.error('[Onboarding] Step 7: No user ID found');
      alert('User session not found. Please sign in again.');
      setIsLoading(false);
      return;
    }

    console.log('[Onboarding] Step 7: Skipping, completing onboarding...');

    const profileResult = await db.updateUserProfile(userId, {
      onboarding_complete: true
    });

    if (!profileResult) {
      console.error('[Onboarding] Step 7: Failed to complete onboarding');
      alert('Failed to complete onboarding. Please try again.');
      setIsLoading(false);
      return;
    }

    console.log('[Onboarding] Step 7: Onboarding complete, refreshing profile...');
    await refreshProfile();

    console.log('[Onboarding] Step 7: Navigating to home...');
    setCurrentScreen('home');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-6">
      <div className="flex flex-col items-center">
        <img
          src="/Quotelo.png"
          alt="Quotelo"
          className="w-32 h-32 sm:w-36 sm:h-36 mb-4 mt-2"
        />
        <div className="flex justify-center gap-2 pb-8">
          <div className={`w-2 h-2 rounded-full ${state.step >= 1 ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${state.step >= 2 ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${state.step >= 3 ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${state.step >= 4 ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${state.step >= 5 ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${state.step >= 6 ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${state.step >= 7 ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
        </div>
      </div>

      {state.step === 1 && (
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Step 1: Upload your logo
          </h1>
          <p className="text-gray-500 mb-8">
            Professionalize your brand identity.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={handleFileSelect}
            disabled={isLoading}
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-12 flex flex-col items-center justify-center border-2 border-dashed border-orange-200 mb-8 hover:border-orange-300 transition-colors disabled:opacity-50"
          >
            {state.logoUrl ? (
              <>
                <img src={state.logoUrl} alt="Logo preview" className="w-24 h-24 object-contain rounded-xl mb-4" />
                <p className="text-gray-600 font-medium">Logo uploaded!</p>
                <p className="text-gray-400 text-sm">Tap to change</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4">
                  {isLoading ? (
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Upload className="w-8 h-8 text-orange-500" strokeWidth={2} />
                  )}
                </div>
                <p className="text-gray-600 font-medium">
                  {isLoading ? 'Uploading...' : 'Tap to configure'}
                </p>
                <p className="text-gray-400 text-sm">(Optional)</p>
              </>
            )}
          </button>

          {uploadSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-700 text-sm font-medium">Logo uploaded successfully!</span>
            </div>
          )}

          <div className="mt-auto pt-4 flex items-center justify-center gap-2 text-gray-500">
            <Shield className="w-4 h-4" strokeWidth={2} />
            <span className="text-sm">Trusted by freelancers worldwide</span>
          </div>
        </div>
      )}

      {state.step === 2 && (
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Step 2: Profile Details
          </h1>
          <p className="text-gray-500 mb-8">
            Tell us about yourself.
          </p>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={state.fullName}
                onChange={(e) => setState(prev => ({ ...prev, fullName: e.target.value, errors: { ...prev.errors, fullName: undefined } }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your full name"
              />
              {state.errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{state.errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-orange-500">*</span>
              </label>
              <input
                type="email"
                value={state.email}
                onChange={(e) => setState(prev => ({ ...prev, email: e.target.value, errors: { ...prev.errors, email: undefined } }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="your@email.com"
              />
              {state.errors.email && (
                <p className="text-red-500 text-sm mt-1">{state.errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={state.phone}
                onChange={(e) => setState(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div className="mt-auto pt-4 flex items-center justify-center gap-2 text-gray-500">
            <Shield className="w-4 h-4" strokeWidth={2} />
            <span className="text-sm">Your data is encrypted and secure</span>
          </div>
        </div>
      )}

      {state.step === 3 && (
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Step 3: Business Category
          </h1>
          <p className="text-gray-500 mb-8">
            Help us personalize your experience
          </p>

          {state.errors.industryGroup && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <span className="text-red-700 text-sm font-medium">{state.errors.industryGroup}</span>
            </div>
          )}

          <IndustryGroupSelector
            selectedGroup={state.industryGroup}
            onSelect={(group) => setState(prev => ({ ...prev, industryGroup: group, errors: { ...prev.errors, industryGroup: undefined } }))}
          />
        </div>
      )}

      {state.step === 4 && state.industryGroup && (
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Step 4: Industry Type
          </h1>
          <p className="text-gray-500 mb-8">
            What best describes your business? (Optional)
          </p>

          <IndustryTypeSelector
            selectedGroup={state.industryGroup}
            selectedType={state.industryType}
            onSelect={(type) => setState(prev => ({ ...prev, industryType: type }))}
            onSkip={handleSkipStep4}
          />
        </div>
      )}

      {state.step === 5 && (
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Step 5: Business Details
          </h1>
          <p className="text-gray-500 mb-8">
            Set up your business information.
          </p>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={state.businessName}
                onChange={(e) => setState(prev => ({ ...prev, businessName: e.target.value, errors: { ...prev.errors, businessName: undefined } }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your business name"
              />
              {state.errors.businessName && (
                <p className="text-red-500 text-sm mt-1">{state.errors.businessName}</p>
              )}
            </div>

            <div>
              <CountrySelect
                value={state.countryCode}
                onChange={handleCountryChange}
                label="Country"
                required
              />
              {state.errors.country && (
                <p className="text-red-500 text-sm mt-1">{state.errors.country}</p>
              )}
            </div>

            <div>
              <CurrencySelect
                value={state.defaultCurrency}
                onChange={(currency) => setState(prev => ({ ...prev, defaultCurrency: currency }))}
                label="Default Currency"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Auto-updates based on selected country, but you can change it manually.
              </p>
            </div>
          </div>
        </div>
      )}

      {state.step === 6 && (
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Step 6: Create Signature
          </h1>
          <p className="text-gray-500 mb-8">
            Draw your signature with your finger or mouse.
          </p>

          <div className="flex-1 flex items-center justify-center mb-8 px-2">
            <SignaturePad onSave={handleSignatureSave} />
          </div>
        </div>
      )}

      {state.step === 7 && (
        <div className="flex-1 flex flex-col">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" strokeWidth={3} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              You're all set!
            </h1>
            <p className="text-gray-600 mb-2">
              Create your first invoice now
            </p>
            <p className="text-sm text-gray-500">
              Get started with one of these quick options
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <button
              onClick={handleVoiceDemo}
              className="w-full bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 flex items-center gap-4 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Mic className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-lg mb-1">Try Voice Demo</h3>
                <p className="text-orange-50 text-sm">
                  Speak your invoice details and watch the magic happen
                </p>
              </div>
            </button>

            <button
              onClick={handleGenerateSampleInvoice}
              className="w-full bg-white border-2 border-gray-200 text-gray-900 rounded-2xl p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-all hover:border-orange-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-7 h-7 text-orange-600" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-lg mb-1">Generate Sample Invoice</h3>
                <p className="text-gray-600 text-sm">
                  See a pre-filled invoice you can customize
                </p>
              </div>
            </button>
          </div>

          <button
            onClick={handleSkipStep7}
            className="text-center py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
          >
            Skip for now
          </button>

          <div className="mt-auto pt-6 flex items-center justify-center gap-2 text-gray-400">
            <Sparkles className="w-4 h-4" strokeWidth={2} />
            <span className="text-sm">Your journey starts here</span>
          </div>
        </div>
      )}

      {state.step !== 7 && (
        <button
          onClick={
            state.step === 1 ? handleContinueStep1 :
            state.step === 2 ? handleContinueStep2 :
            state.step === 3 ? handleContinueStep3 :
            state.step === 4 ? handleContinueStep4 :
            state.step === 5 ? handleContinueStep5 :
            handleContinueStep6
          }
          disabled={isLoading || (state.step === 3 && !state.industryGroup) || (state.step === 6 && !state.signatureDataUrl)}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-8 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </div>
          ) : (
            'Continue'
          )}
        </button>
      )}
    </div>
  );
}
