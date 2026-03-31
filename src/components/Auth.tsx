import { useState, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { auth } from '../lib/auth';
import { useApp } from '../context/AppContext';
import { designSystem as ds } from '../lib/designSystem';

type AuthMode = 'signin' | 'signup' | 'reset';

export function Auth() {
  const { initializeAuthenticatedUser } = useApp();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [connStatus, setConnStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [connUrl, setConnUrl] = useState('');

  useEffect(() => {
    const testConn = async () => {
      const url = import.meta.env.VITE_SUPABASE_URL as string;
      setConnUrl(url || 'not configured');
      try {
        const res = await fetch(`${url}/auth/v1/health`);
        setConnStatus(res.ok ? 'ok' : 'error');
      } catch {
        setConnStatus('error');
      }
    };
    testConn();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter your email and password');
      setIsLoading(false);
      return;
    }

    const result = await auth.signIn(email, password);

    if (!result.success) {
      const msg = result.error || 'Failed to sign in. Please check your credentials.';
      setError(msg.toLowerCase().includes('fetch') ? 'Connection error — check your internet and try again.' : msg);
      setIsLoading(false);
      return;
    }

    if (result.user) {
      await initializeAuthenticatedUser(result.user.id);
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password || !fullName) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    const result = await auth.signUp(email, password, fullName);

    if (!result.success) {
      const msg = result.error || 'Failed to create account';
      setError(msg.toLowerCase().includes('fetch') ? 'Connection error — check your internet and try again.' : msg);
      setIsLoading(false);
      return;
    }

    if (result.user) {
      await initializeAuthenticatedUser(result.user.id);
    }

    setIsLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (!email) {
      setError('Please enter your email');
      setIsLoading(false);
      return;
    }

    const result = await auth.resetPassword(email);

    if (!result.success) {
      setError(result.error || 'Failed to send reset email');
    } else {
      setSuccessMessage('Password reset email sent! Check your inbox.');
    }

    setIsLoading(false);
  };

  return (
    <div className={`min-h-screen ${ds.surfaces.base.light} ${ds.surfaces.base.dark} flex flex-col p-6 ${ds.transition.base}`}>
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <img
            src="/Quotelo_Logo.png"
            alt="Quotelo Logo"
            className="w-40 h-40 sm:w-44 sm:h-44 mx-auto mb-4 drop-shadow-md"
          />
          <h1 className={`${ds.typography.h2} text-gray-900 dark:text-white mb-2`}>
            {mode === 'reset' ? 'Reset Password' : 'Welcome to Quotelo'}
          </h1>
          <p className={`${ds.typography.body} text-gray-500 dark:text-gray-400`}>
            {mode === 'signin' && 'Sign in to your account'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'reset' && "Enter your email to reset your password"}
          </p>
        </div>

        {connStatus === 'checking' && (
          <div className="flex items-center justify-center gap-2 mb-4 text-gray-400 text-xs">
            <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse"></div>
            <span>Checking connection...</span>
          </div>
        )}
        {connStatus === 'ok' && (
          <div className="flex items-center justify-center gap-2 mb-4 text-green-600 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Connected to Quotelo servers</span>
          </div>
        )}
        {connStatus === 'error' && (
          <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800">
            <p className="font-semibold mb-1">Connection error</p>
            <p>Unable to reach Quotelo servers. Please check your internet connection and try again.</p>
          </div>
        )}

        {mode !== 'reset' && (
          <div className={`flex ${ds.radius.lg} ${ds.input.base} ${ds.input.dark} ${ds.input.shadow} ${ds.input.darkShadow} p-1 mb-6`}>
            <button
              onClick={() => {
                setMode('signin');
                setError('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-3 ${ds.radius.md} font-semibold ${ds.transition.spring} active:scale-95 ${
                mode === 'signin'
                  ? `${ds.button.secondary.base} ${ds.button.secondary.dark} text-gray-900 dark:text-white ${ds.elevation[2]}`
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-3 ${ds.radius.md} font-semibold ${ds.transition.spring} active:scale-95 ${
                mode === 'signup'
                  ? `${ds.button.secondary.base} ${ds.button.secondary.dark} text-gray-900 dark:text-white ${ds.elevation[2]}`
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        <form onSubmit={mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handlePasswordReset} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className={`block ${ds.typography.bodySmall} font-medium text-gray-700 dark:text-gray-300 mb-2`}>
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 ${ds.input.base} ${ds.input.dark} text-gray-900 dark:text-white ${ds.radius.md} focus:outline-none ${ds.input.shadow} ${ds.input.darkShadow} ${ds.input.focus} ${ds.input.darkFocus} ${ds.transition.base}`}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div>
            <label className={`block ${ds.typography.bodySmall} font-medium text-gray-700 dark:text-gray-300 mb-2`}>
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 ${ds.input.base} ${ds.input.dark} text-gray-900 dark:text-white ${ds.radius.md} focus:outline-none ${ds.input.shadow} ${ds.input.darkShadow} ${ds.input.focus} ${ds.input.darkFocus} ${ds.transition.base}`}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label className={`block ${ds.typography.bodySmall} font-medium text-gray-700 dark:text-gray-300 mb-2`}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-gray-600 ${ds.input.base} ${ds.input.dark} text-gray-900 dark:text-white ${ds.radius.md} focus:outline-none ${ds.input.shadow} ${ds.input.darkShadow} ${ds.input.focus} ${ds.input.darkFocus} ${ds.transition.base}`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 ${ds.transition.base}`}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className={`${ds.badge.error.bg} ${ds.badge.error.darkBg} border border-red-200 dark:border-red-800 ${ds.radius.md} p-3 ${ds.badge.error.shadow} ${ds.badge.error.darkShadow}`}>
              <p className={`${ds.badge.error.text} ${ds.badge.error.darkText} ${ds.typography.bodySmall}`}>{error}</p>
            </div>
          )}

          {successMessage && (
            <div className={`${ds.badge.success.bg} ${ds.badge.success.darkBg} border border-green-200 dark:border-green-800 ${ds.radius.md} p-3 ${ds.badge.success.shadow} ${ds.badge.success.darkShadow}`}>
              <p className={`${ds.badge.success.text} ${ds.badge.success.darkText} ${ds.typography.bodySmall}`}>{successMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${ds.button.primary.base} ${ds.button.primary.hover} ${ds.button.primary.active} text-white py-4 ${ds.radius.lg} font-semibold text-lg ${ds.button.primary.shadow} ${ds.button.primary.hoverShadow} ${ds.button.primary.activeShadow} ${ds.transition.spring} disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Please wait...</span>
              </div>
            ) : mode === 'signin' ? (
              'Sign In'
            ) : mode === 'signup' ? (
              'Create Account'
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          {mode === 'signin' && (
            <>
              <button
                onClick={() => {
                  setMode('reset');
                  setError('');
                  setSuccessMessage('');
                }}
                className={`${ds.typography.body} text-orange-600 dark:text-orange-400 font-medium hover:text-orange-700 dark:hover:text-orange-500 ${ds.transition.base}`}
              >
                Forgot password?
              </button>
            </>
          )}

          {mode === 'reset' && (
            <button
              onClick={() => {
                setMode('signin');
                setError('');
                setSuccessMessage('');
              }}
              className={`${ds.typography.body} text-orange-600 dark:text-orange-400 font-medium hover:text-orange-700 dark:hover:text-orange-500 ${ds.transition.base}`}
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
