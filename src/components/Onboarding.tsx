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
import { ds } from '../lib/designSystem';

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
  const { setCurrentScreen, dbUserProfile, business, refreshProfile, setDraftDocumentData, setSelectedTemplateKey } = useApp();
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

  const handleVoiceDemo = async () => {
    const userId = await getUserId();
    if (userId) {
      await db.updateUserProfile(userId, { onboarding_complete: true });
      await refreshProfile();
    }
    setCurrentScreen('ai-generator');
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

  const totalSteps = 7;

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-12 pb-10">

      {/* Step indicator */}
      <div className="flex gap-2 justify-center mb-10">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < state.step ? 'bg-[#f97316] w-6' : 'bg-[#e5e5ea] w-3'
            }`}
          />
        ))}
      </div>

      {state.step === 1 && (
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`w-20 h-20 bg-[#fff7ed] ${ds.radiusXl} flex items-center justify-center mb-6`}>
              <Upload className="w-10 h-10 text-[#f97316]" strokeWidth={1.5} />
            </div>
            <h1 className={`${ds.title1} text-black mb-3`}>Upload your logo</h1>
            <p className={`${ds.body} text-[#8e8e93] max-w-xs`}>Professionalize your brand identity.</p>
          </div>

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
            className={`bg-[#fff7ed] ${ds.radiusXl} p-12 flex flex-col items-center justify-center border-2 border-dashed border-[#fed7aa] mb-8 ${ds.transition} hover:border-[#f97316] disabled:opacity-50`}
          >
            {state.logoUrl ? (
              <>
                <img src={state.logoUrl} alt="Logo preview" className="w-24 h-24 object-contain rounded-xl mb-4" />
                <p className={`${ds.callout} text-black font-semibold`}>Logo uploaded!</p>
                <p className={`${ds.footnote} text-[#8e8e93]`}>Tap to change</p>
              </>
            ) : (
              <>
                <div className={`w-16 h-16 bg-white ${ds.radiusLg} flex items-center justify-center ${ds.shadow2} mb-4`}>
                  {isLoading ? (
                    <div className="w-8 h-8 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Upload className="w-8 h-8 text-[#f97316]" strokeWidth={1.5} />
                  )}
                </div>
                <p className={`${ds.callout} text-black font-semibold`}>
                  {isLoading ? 'Uploading...' : 'Tap to upload'}
                </p>
                <p className={`${ds.footnote} text-[#8e8e93]`}>(Optional)</p>
              </>
            )}
          </button>

          {uploadSuccess && (
            <div className="bg-[#d1fae5] border border-[#6ee7b7] rounded-xl p-3 mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-[#065f46]" />
              <span className={`${ds.footnote} text-[#065f46] font-semibold`}>Logo uploaded successfully!</span>
            </div>
          )}

          <div className="mt-auto pt-4 flex items-center justify-center gap-2 text-[#8e8e93]">
            <Shield className="w-4 h-4" strokeWidth={1.5} />
            <span className={ds.footnote}>Trusted by freelancers worldwide</span>
          </div>
        </div>
      )}

      {state.step === 2 && (
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`w-20 h-20 bg-[#fff7ed] ${ds.radiusXl} flex items-center justify-center mb-6`}>
              <Shield className="w-10 h-10 text-[#f97316]" strokeWidth={1.5} />
            </div>
            <h1 className={`${ds.title1} text-black mb-3`}>Profile Details</h1>
            <p className={`${ds.body} text-[#8e8e93] max-w-xs`}>Tell us about yourself.</p>
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <label className={`block ${ds.footnote} font-semibold text-black mb-2`}>
                Full Name <span className="text-[#f97316]">*</span>
              </label>
              <input
                type="text"
                value={state.fullName}
                onChange={(e) => setState(prev => ({ ...prev, fullName: e.target.value, errors: { ...prev.errors, fullName: undefined } }))}
                className={ds.input}
                placeholder="Enter your full name"
              />
              {state.errors.fullName && (
                <p className={`${ds.footnote} text-red-500 mt-1`}>{state.errors.fullName}</p>
              )}
            </div>

            <div>
              <label className={`block ${ds.footnote} font-semibold text-black mb-2`}>
                Email <span className="text-[#f97316]">*</span>
              </label>
              <input
                type="email"
                value={state.email}
                onChange={(e) => setState(prev => ({ ...prev, email: e.target.value, errors: { ...prev.errors, email: undefined } }))}
                className={ds.input}
                placeholder="your@email.com"
              />
              {state.errors.email && (
                <p className={`${ds.footnote} text-red-500 mt-1`}>{state.errors.email}</p>
              )}
            </div>

            <div>
              <label className={`block ${ds.footnote} font-semibold text-black mb-2`}>
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={state.phone}
                onChange={(e) => setState(prev => ({ ...prev, phone: e.target.value }))}
                className={ds.input}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div className="mt-auto pt-4 flex items-center justify-center gap-2 text-[#8e8e93]">
            <Shield className="w-4 h-4" strokeWidth={1.5} />
            <span className={ds.footnote}>Your data is encrypted and secure</span>
          </div>
        </div>
      )}

      {state.step === 3 && (
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`w-20 h-20 bg-[#fff7ed] ${ds.radiusXl} flex items-center justify-center mb-6`}>
              <FileText className="w-10 h-10 text-[#f97316]" strokeWidth={1.5} />
            </div>
            <h1 className={`${ds.title1} text-black mb-3`}>Business Category</h1>
            <p className={`${ds.body} text-[#8e8e93] max-w-xs`}>Help us personalize your experience.</p>
          </div>

          {state.errors.industryGroup && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <span className={`${ds.footnote} text-red-700 font-semibold`}>{state.errors.industryGroup}</span>
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
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`w-20 h-20 bg-[#fff7ed] ${ds.radiusXl} flex items-center justify-center mb-6`}>
              <Sparkles className="w-10 h-10 text-[#f97316]" strokeWidth={1.5} />
            </div>
            <h1 className={`${ds.title1} text-black mb-3`}>Industry Type</h1>
            <p className={`${ds.body} text-[#8e8e93] max-w-xs`}>What best describes your business?</p>
          </div>

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
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`w-20 h-20 bg-[#fff7ed] ${ds.radiusXl} flex items-center justify-center mb-6`}>
              <FileText className="w-10 h-10 text-[#f97316]" strokeWidth={1.5} />
            </div>
            <h1 className={`${ds.title1} text-black mb-3`}>Business Details</h1>
            <p className={`${ds.body} text-[#8e8e93] max-w-xs`}>Set up your business information.</p>
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <label className={`block ${ds.footnote} font-semibold text-black mb-2`}>
                Business Name <span className="text-[#f97316]">*</span>
              </label>
              <input
                type="text"
                value={state.businessName}
                onChange={(e) => setState(prev => ({ ...prev, businessName: e.target.value, errors: { ...prev.errors, businessName: undefined } }))}
                className={ds.input}
                placeholder="Enter your business name"
              />
              {state.errors.businessName && (
                <p className={`${ds.footnote} text-red-500 mt-1`}>{state.errors.businessName}</p>
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
                <p className={`${ds.footnote} text-red-500 mt-1`}>{state.errors.country}</p>
              )}
            </div>

            <div>
              <CurrencySelect
                value={state.defaultCurrency}
                onChange={(currency) => setState(prev => ({ ...prev, defaultCurrency: currency }))}
                label="Default Currency"
                required
              />
              <p className={`${ds.footnote} text-[#8e8e93] mt-2`}>
                Auto-updates based on selected country, but you can change it manually.
              </p>
            </div>
          </div>
        </div>
      )}

      {state.step === 6 && (
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`w-20 h-20 bg-[#fff7ed] ${ds.radiusXl} flex items-center justify-center mb-6`}>
              <Check className="w-10 h-10 text-[#f97316]" strokeWidth={1.5} />
            </div>
            <h1 className={`${ds.title1} text-black mb-3`}>Create Signature</h1>
            <p className={`${ds.body} text-[#8e8e93] max-w-xs`}>Draw your signature with your finger or mouse.</p>
          </div>

          <div className="flex-1 flex items-center justify-center mb-8 px-2">
            <SignaturePad onSave={handleSignatureSave} />
          </div>
        </div>
      )}

      {state.step === 7 && (
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`w-20 h-20 bg-[#fff7ed] ${ds.radiusXl} flex items-center justify-center mb-6`}>
              <Sparkles className="w-10 h-10 text-[#f97316]" strokeWidth={1.5} />
            </div>
            <h1 className={`${ds.title1} text-black mb-3`}>You're all set!</h1>
            <p className={`${ds.body} text-[#8e8e93] max-w-xs`}>Create your first invoice now.</p>
          </div>

          <div className="space-y-4 mb-6">
            <button
              onClick={handleVoiceDemo}
              className={`w-full bg-[#f97316] text-white ${ds.radiusLg} p-6 flex items-center gap-4 ${ds.shadowOrange} ${ds.transition} ${ds.press}`}
            >
              <div className={`w-14 h-14 bg-white/20 ${ds.radiusMd} flex items-center justify-center flex-shrink-0`}>
                <Mic className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
              <div className="text-left flex-1">
                <h3 className={`${ds.headline} text-white mb-1`}>Try Voice Demo</h3>
                <p className={`${ds.footnote} text-white/70`}>
                  Speak your invoice details and watch the magic happen
                </p>
              </div>
            </button>

          </div>

          <button
            onClick={handleSkipStep7}
            className={`${ds.callout} text-[#8e8e93] text-center py-3 ${ds.transition}`}
          >
            Skip for now
          </button>
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
          className={`${ds.btnPrimary} w-full text-center mt-4 disabled:opacity-50`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
