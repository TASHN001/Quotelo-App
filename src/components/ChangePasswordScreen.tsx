import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { auth } from '../lib/auth';

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
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col transition-colors">
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => setCurrentScreen('app-settings')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white absolute left-1/2 transform -translate-x-1/2">
            {t('changePassword.title')}
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('changePassword.currentPassword')}
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (errors.currentPassword) {
                    setErrors({ ...errors, currentPassword: undefined });
                  }
                }}
                disabled={isLoading}
                className={`w-full px-4 py-3 pr-12 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border ${
                  errors.currentPassword
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-200 dark:border-gray-700'
                } focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.currentPassword}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('changePassword.newPassword')}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) {
                    setErrors({ ...errors, newPassword: undefined });
                  }
                }}
                disabled={isLoading}
                className={`w-full px-4 py-3 pr-12 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border ${
                  errors.newPassword
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-200 dark:border-gray-700'
                } focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.newPassword}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('changePassword.confirmPassword')}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: undefined });
                  }
                }}
                disabled={isLoading}
                className={`w-full px-4 py-3 pr-12 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border ${
                  errors.confirmPassword
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-200 dark:border-gray-700'
                } focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('changePassword.updating') : t('changePassword.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
