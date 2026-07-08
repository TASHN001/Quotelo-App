import { useState, useEffect } from 'react';
import { ArrowLeft, Briefcase, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DefaultsModal } from './TemplatePreview';
import { ds } from '../lib/designSystem';
import { TemplatePreviewCard } from './TemplatePreviewCard';
import { MinimalInvoice } from '../templates/invoice/Minimal';
import { ModernInvoice } from '../templates/invoice/Modern';
import { getSampleInvoiceData, TEMPLATE_METADATA, TemplateKey } from '../lib/sampleData';
import { db } from '../lib/database';

interface TemplatePreference {
  template_key: string;
  is_favorite: boolean;
  is_default: boolean;
}

export function TemplatesList() {
  const { setCurrentScreen, setSelectedPreviewTemplateKey, authUser, showToast } = useApp();
  const [preferences, setPreferences] = useState<TemplatePreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDefaults, setShowDefaults] = useState(false);
  const sampleData = getSampleInvoiceData();

  useEffect(() => {
    loadPreferences();
  }, [authUser]);

  const loadPreferences = async () => {
    if (!authUser) {
      setIsLoading(false);
      return;
    }

    const prefs = await db.getUserTemplatePreferences(authUser.id);
    setPreferences(prefs);
    setIsLoading(false);
  };

  const handleTemplateClick = (templateKey: string) => {
    setSelectedPreviewTemplateKey(templateKey);
    setCurrentScreen('template-preview');
  };

  const handleFavoriteToggle = async (e: React.MouseEvent, templateKey: string) => {
    e.stopPropagation();
    if (!authUser) return;

    const success = await db.toggleTemplateFavorite(authUser.id, templateKey);
    if (success) {
      await loadPreferences();
      const pref = preferences.find(p => p.template_key === templateKey);
      showToast(
        pref?.is_favorite ? 'Removed from favorites' : 'Added to favorites',
        'success'
      );
    } else {
      showToast('Failed to update favorite', 'error');
    }
  };

  const handleSetDefault = async (e: React.MouseEvent, templateKey: string) => {
    e.stopPropagation();
    if (!authUser) return;

    const success = await db.setDefaultTemplate(authUser.id, templateKey);
    if (success) {
      await loadPreferences();
      showToast('Default template updated', 'success');
    } else {
      showToast('Failed to set default template', 'error');
    }
  };

  const getPreference = (templateKey: string) => {
    return preferences.find(p => p.template_key === templateKey) || {
      template_key: templateKey,
      is_favorite: false,
      is_default: false
    };
  };

  const renderTemplateCard = (templateKey: TemplateKey) => {
    const meta = TEMPLATE_METADATA[templateKey];
    const pref = getPreference(templateKey);

    let preview = null;
    if (templateKey === 'invoice-minimal') {
      preview = <MinimalInvoice data={sampleData} />;
    } else if (templateKey === 'invoice-modern') {
      preview = <ModernInvoice data={sampleData} />;
    } else {
      preview = <MinimalInvoice data={sampleData} />;
    }

    return (
      <TemplatePreviewCard
        key={templateKey}
        name={meta.name}
        description={meta.description}
        planTier={meta.planTier}
        preview={preview}
        onClick={() => handleTemplateClick(templateKey)}
        isFavorite={pref.is_favorite}
        isDefault={pref.is_default}
        isComingSoon={meta.comingSoon}
        onFavoriteToggle={(e) => handleFavoriteToggle(e, templateKey)}
        onSetDefault={(e) => handleSetDefault(e, templateKey)}
      />
    );
  };

  const generalTemplates = Object.keys(TEMPLATE_METADATA).filter(
    key => TEMPLATE_METADATA[key as TemplateKey].category === 'general'
  ) as TemplateKey[];

  const industryTemplates = Object.keys(TEMPLATE_METADATA).filter(
    key => TEMPLATE_METADATA[key as TemplateKey].category === 'industry'
  ) as TemplateKey[];

  const sortedGeneralTemplates = generalTemplates.sort((a, b) => {
    const prefA = getPreference(a);
    const prefB = getPreference(b);
    if (prefA.is_default && !prefB.is_default) return -1;
    if (!prefA.is_default && prefB.is_default) return 1;
    if (prefA.is_favorite && !prefB.is_favorite) return -1;
    if (!prefA.is_favorite && prefB.is_favorite) return 1;
    return 0;
  });

  const favoriteCount = preferences.filter(p => p.is_favorite).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24 transition-colors">
      <div className="bg-white p-4 sm:p-6 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setCurrentScreen('home')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-gray-900">Templates</h1>
            <p className="text-xs sm:text-sm text-gray-600">
              {favoriteCount > 0 ? `${favoriteCount} favorite${favoriteCount !== 1 ? 's' : ''}` : 'Choose your invoice style'}
            </p>
          </div>
          <button
            onClick={() => setShowDefaults(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex-shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">Defaults</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Your Templates
            </h2>
            <div className="space-y-6">
              {sortedGeneralTemplates.map(templateKey => renderTemplateCard(templateKey))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Briefcase className="w-5 h-5 text-gray-700" strokeWidth={2} />
              <h2 className="text-lg font-bold text-gray-900">
                Industry Templates
              </h2>
            </div>
            <div className="space-y-6">
              {industryTemplates.map(templateKey => renderTemplateCard(templateKey))}
            </div>
          </div>
        </div>
      </div>
      {showDefaults && <DefaultsModal onClose={() => setShowDefaults(false)} />}
    </div>
  );
}
