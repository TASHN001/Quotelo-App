import { useState } from 'react';
import { ChevronRight, ChevronLeft, Plus, Home as HomeIcon, User, CreditCard, Settings, Shield, LogOut, X, Pen, Building, Scale, FileCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SignaturePad } from './SignaturePad';
import { EditBusinessModal } from './EditBusinessModal';
import { db } from '../lib/database';
import type { Business } from '../lib/types';
import { ds } from '../lib/designSystem';

const MENU_ITEMS = [
  { icon: Building, labelKey: 'profile.businessIdentity', color: 'text-orange-500' },
  { icon: Pen, labelKey: 'profile.signature', color: 'text-blue-500' },
  { icon: CreditCard, labelKey: 'Payment Methods', color: 'text-green-500' },
  { icon: Settings, labelKey: 'profile.settings', color: 'text-gray-600' }
];

const LEGAL_ITEMS = [
  { icon: Shield, label: 'profile.dataPrivacy', screen: 'data-privacy', color: 'text-orange-500' },
  { icon: Scale, label: 'Terms & Conditions', screen: 'terms', color: 'text-blue-500' },
  { icon: FileCheck, label: 'End User License Agreement', screen: 'eula-view', color: 'text-teal-500' }
];

export function Profile() {
  const { business, dbUserProfile, setCurrentScreen, handleSignOut, showToast, refreshProfile, t } = useApp();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEditBusinessModal, setShowEditBusinessModal] = useState(false);

  const confirmSignOut = async () => {
    setIsSigningOut(true);
    await handleSignOut();
    setIsSigningOut(false);
    setShowSignOutModal(false);
  };

  const handleSignatureSave = async (dataUrl: string, setAsDefault: boolean, includeAutomatically: boolean) => {
    const userId = localStorage.getItem('quotelo_user_id');
    if (!userId) return;

    setIsProcessing(true);

    const result = await db.updateUserProfile(userId, {
      signature_data_url: dataUrl,
      include_signature_automatically: includeAutomatically
    });

    if (result) {
      await refreshProfile();
      showToast(t('toast.signatureSaved'), 'success');
      setShowSignatureModal(false);
    } else {
      showToast(t('toast.error'), 'error');
    }

    setIsProcessing(false);
  };

  const handleDeleteSignature = async () => {
    const userId = localStorage.getItem('quotelo_user_id');
    if (!userId) return;

    setIsProcessing(true);

    const result = await db.updateUserProfile(userId, {
      signature_data_url: null
    });

    if (result) {
      await refreshProfile();
      showToast(t('toast.signatureDeleted'), 'success');
      setShowDeleteConfirm(false);
    } else {
      showToast(t('toast.error'), 'error');
    }

    setIsProcessing(false);
  };

  const handleBusinessSave = async (businessData: Partial<Business>) => {
    const userId = localStorage.getItem('quotelo_user_id');
    if (!userId) return;

    const result = await db.upsertBusiness(userId, businessData);

    if (result) {
      await refreshProfile();
      showToast(t('toast.businessSaved'), 'success');
    } else {
      showToast(t('toast.error'), 'error');
      throw new Error('Failed to save');
    }
  };

  const renderMenuItem = (item: typeof MENU_ITEMS[0], index: number) => {
    if (item.labelKey === 'profile.businessIdentity') {
      return (
        <button
          key={index}
          onClick={() => setShowEditBusinessModal(true)}
          className="w-full bg-white border border-[#e5e5ea] rounded-2xl p-5 hover:bg-[#f2f2f7] transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {business?.logo_url ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-sm border border-[#e5e5ea]">
                  <img
                    src={business.logo_url}
                    alt="Business logo"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <item.icon className={`w-6 h-6 ${item.color}`} strokeWidth={2} />
                </div>
              )}
              <div className="text-left">
                <div className="font-semibold text-black">{t(item.labelKey as any)}</div>
                {business?.business_name && (
                  <div className="text-sm text-[#8e8e93] mt-0.5">{business.business_name}</div>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#c7c7cc]" strokeWidth={2} />
          </div>
        </button>
      );
    }

    if (item.labelKey === 'profile.signature') {
      return (
        <button
          key={index}
          onClick={() => setShowSignatureModal(true)}
          className="w-full bg-white border border-[#e5e5ea] rounded-2xl p-5 hover:bg-[#f2f2f7] transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <item.icon className={`w-6 h-6 ${item.color}`} strokeWidth={2} />
              </div>
              <span className="font-semibold text-black">{t(item.labelKey as any)}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#c7c7cc]" strokeWidth={2} />
          </div>
        </button>
      );
    }

    if (item.labelKey === 'profile.settings') {
      return (
        <button
          key={index}
          onClick={() => setCurrentScreen('app-settings')}
          className="w-full bg-white border border-[#e5e5ea] rounded-2xl p-5 hover:bg-[#f2f2f7] transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <item.icon className={`w-6 h-6 ${item.color}`} strokeWidth={2} />
              </div>
              <span className="font-semibold text-black">{t(item.labelKey as any)}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#c7c7cc]" strokeWidth={2} />
          </div>
        </button>
      );
    }

    return (
      <button
        key={index}
        className="w-full bg-white border border-[#e5e5ea] rounded-2xl p-5 flex items-center justify-between hover:bg-[#f2f2f7] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <item.icon className={`w-6 h-6 ${item.color}`} strokeWidth={2} />
          </div>
          <span className="font-semibold text-black">{item.label}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-[#c7c7cc]" strokeWidth={2} />
      </button>
    );
  };

  return (
    <div className={`min-h-screen ${ds.bg} pb-28`}>
      <div className="px-4 pt-14">

        <h1 className={`${ds.title1} text-black mb-5`}>Profile</h1>

        {/* Business identity card */}
        <div className={`bg-white rounded-[20px] p-5 ${ds.shadow1} mb-5`}>
          <div className="flex items-center gap-4">
            {business?.logo_url ? (
              <img src={business.logo_url} alt="" className="w-14 h-14 rounded-2xl object-contain bg-[#f2f2f7] p-1" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#f2f2f7] flex items-center justify-center">
                <span className={`${ds.title2} text-[#3c3c43]`}>{business?.name?.charAt(0) ?? business?.business_name?.charAt(0) ?? '?'}</span>
              </div>
            )}
            <div>
              <p className={`${ds.headline} text-black`}>{business?.name ?? business?.business_name ?? 'Your Business'}</p>
              <p className={`${ds.footnote} text-[#8e8e93]`}>{business?.industry ?? ''}</p>
            </div>
          </div>
        </div>

        {/* Settings sections */}
        {[
          {
            label: 'ACCOUNT',
            rows: [
              { title: 'Profile & Business', screen: 'profile-data' },
              { title: 'Change Password',    screen: 'change-password' },
            ],
          },
          {
            label: 'PREFERENCES',
            rows: [
              { title: 'Appearance',  screen: 'appearance-settings' },
              { title: 'Language',    screen: 'language-settings' },
              { title: 'Currency',    screen: 'currency-settings' },
              { title: 'Reminders',   screen: 'reminder-settings' },
            ],
          },
          {
            label: 'ABOUT',
            rows: [
              { title: 'Data & Privacy',    screen: 'data-privacy' },
              { title: 'Terms of Service',  screen: 'terms' },
              { title: 'License Agreement', screen: 'eula-view' },
            ],
          },
        ].map(section => (
          <div key={section.label} className="mb-4">
            <p className={`${ds.caption} text-[#8e8e93] mb-2`}>{section.label}</p>
            <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              {section.rows.map(({ title, screen }, idx, arr) => (
                <button
                  key={screen}
                  onClick={() => setCurrentScreen(screen as any)}
                  className={`w-full flex items-center justify-between px-4 py-3 ${ds.transition} ${ds.press} ${
                    idx < arr.length - 1 ? 'border-b border-[#f2f2f7]' : ''
                  }`}
                >
                  <span className={`${ds.callout} text-black`}>{title}</span>
                  <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Sign Out */}
        <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] mt-2 mb-6">
          <button
            onClick={() => setShowSignOutModal(true)}
            className={`w-full px-4 py-3 text-[#ff3b30] font-semibold text-[15px] text-left ${ds.transition}`}
          >
            Sign Out
          </button>
        </div>

      </div>

      {showSignatureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">{t('modal.manageSignature')}</h2>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="w-8 h-8 bg-[#f2f2f7] rounded-full flex items-center justify-center hover:bg-[#e5e5ea] transition-colors"
              >
                <X className="w-5 h-5 text-[#3c3c43]" />
              </button>
            </div>

            {dbUserProfile?.signature_data_url ? (
              <div className="space-y-4">
                <div className="border-2 border-[#e5e5ea] rounded-xl p-4 bg-[#f2f2f7]">
                  <p className="text-sm font-medium text-[#3c3c43] mb-2">{t('modal.currentSignature')}</p>
                  <img
                    src={dbUserProfile.signature_data_url}
                    alt="Signature"
                    className="h-20 object-contain mx-auto"
                  />
                </div>

                <SignaturePad
                  onSave={handleSignatureSave}
                  initialSignature={dbUserProfile.signature_data_url}
                  initialIncludeAutomatically={dbUserProfile.include_signature_automatically}
                />

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isProcessing}
                  className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {t('modal.deleteSignature')}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-[#8e8e93] mb-4">{t('modal.drawSignature')}</p>
                <SignaturePad onSave={handleSignatureSave} />
              </div>
            )}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">{t('modal.deleteSignature')}</h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-8 h-8 bg-[#f2f2f7] rounded-full flex items-center justify-center hover:bg-[#e5e5ea] transition-colors"
              >
                <X className="w-5 h-5 text-[#3c3c43]" />
              </button>
            </div>

            <p className="text-[#8e8e93] mb-6">
              {t('modal.deleteSignatureConfirm')}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isProcessing}
                className="flex-1 bg-[#f2f2f7] text-black py-3 rounded-xl font-semibold hover:bg-[#e5e5ea] transition-colors disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteSignature}
                disabled={isProcessing}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
              >
                {isProcessing ? t('modal.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditBusinessModal && (
        <EditBusinessModal
          business={business}
          onClose={() => setShowEditBusinessModal(false)}
          onSave={handleBusinessSave}
          userId={localStorage.getItem('quotelo_user_id') || ''}
        />
      )}

      {showSignOutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">{t('profile.signOut')}</h2>
              <button
                onClick={() => setShowSignOutModal(false)}
                className="w-8 h-8 bg-[#f2f2f7] rounded-full flex items-center justify-center hover:bg-[#e5e5ea] transition-colors"
              >
                <X className="w-5 h-5 text-[#3c3c43]" />
              </button>
            </div>

            <p className="text-[#8e8e93] mb-6">
              {t('modal.signOutConfirm')}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutModal(false)}
                disabled={isSigningOut}
                className="flex-1 bg-[#f2f2f7] text-black py-3 rounded-xl font-semibold hover:bg-[#e5e5ea] transition-colors disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmSignOut}
                disabled={isSigningOut}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
              >
                {isSigningOut ? t('modal.signingOut') : t('profile.signOut')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
