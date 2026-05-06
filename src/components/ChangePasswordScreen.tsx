import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { auth } from '../lib/auth';
import { ds } from '../lib/designSystem';

export function ChangePasswordScreen() {
  const { setCurrentScreen, t, showToast } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = t('changePassword.currentPasswordRequired');
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = t('changePassword.newPasswordRequired');
    } else if (newPassword.length < 8) {
      newErrors.newPassword = t('changePassword.minLength');
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = t('changePassword.confirmPasswordRequired');
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t('changePassword.passwordsMustMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await auth.updatePassword(newPassword);

      if (result.success) {
        showToast(t('changePassword.success'), 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
        setTimeout(() => {
          setCurrentScreen('app-settings');
        }, 1500);
      } else {
        showToast(result.error || t('toast.error'), 'error');
      }
    } catch (error) {
      console.error('Password update error:', error);
      showToast(t('toast.error'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${ds.bg}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => setCurrentScreen('profile')} className={ds.headerIconBtn}>
          <ChevronLeft className="w-4 h-4 text-[#3c3c43]" />
        </button>
        <h1 className={`${ds.title2} text-black`}>{t('changePassword.title')}</h1>
      </div>

      <div className="px-4 flex flex-col gap-4 pb-10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {/* Current Password */}
            <div className="px-4 py-3 border-b border-[#f2f2f7]">
              <label className={`${ds.footnote} text-[#8e8e93] block mb-1`}>
                {t('changePassword.currentPassword')}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (errors.currentPassword) setErrors({ ...errors, currentPassword: undefined });
                  }}
                  disabled={isLoading}
                  className={`${ds.input} pr-12 ${errors.currentPassword ? 'ring-2 ring-[#ff3b30]' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e8e93]"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className={`mt-1 ${ds.footnote} text-[#ff3b30]`}>{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div className="px-4 py-3 border-b border-[#f2f2f7]">
              <label className={`${ds.footnote} text-[#8e8e93] block mb-1`}>
                {t('changePassword.newPassword')}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors({ ...errors, newPassword: undefined });
                  }}
                  disabled={isLoading}
                  className={`${ds.input} pr-12 ${errors.newPassword ? 'ring-2 ring-[#ff3b30]' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e8e93]"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className={`mt-1 ${ds.footnote} text-[#ff3b30]`}>{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="px-4 py-3">
              <label className={`${ds.footnote} text-[#8e8e93] block mb-1`}>
                {t('changePassword.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  disabled={isLoading}
                  className={`${ds.input} pr-12 ${errors.confirmPassword ? 'ring-2 ring-[#ff3b30]' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e8e93]"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className={`mt-1 ${ds.footnote} text-[#ff3b30]`}>{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`${ds.btnPrimary} w-full text-center disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? t('changePassword.updating') : t('changePassword.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
