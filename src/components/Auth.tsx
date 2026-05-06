import { useState, useEffect } from 'react';
import { FileText, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { auth } from '../lib/auth';
import { useApp } from '../context/AppContext';
import { ds } from '../lib/designSystem';

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
    <div className="min-h-screen bg-white flex flex-col px-6 pt-16 pb-10">
      {/* App icon */}
      <div className="mb-8">
        <div className={`w-14 h-14 bg-[#f97316] ${ds.radiusLg} flex items-center justify-center ${ds.shadowOrange} mb-6`}>
          <FileText className="w-7 h-7 text-white" strokeWidth={2} />
        </div>
        <h1 className={`${ds.title1} text-black mb-1`}>
          {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
        </h1>
        <p className={`${ds.callout} text-[#8e8e93]`}>
          {mode === 'signin' ? 'Sign in to Quotelo' : mode === 'signup' ? 'Start billing in seconds' : 'We\'ll email you a reset link'}
        </p>
      </div>

      <form onSubmit={mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handlePasswordReset} className="flex flex-col gap-4 flex-1">
        {mode === 'signup' && (
          <div>
            <label className={`${ds.caption} text-[#8e8e93] block mb-1.5`}>Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e93]" />
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Tash"
                className={`${ds.input} pl-10`}
              />
            </div>
          </div>
        )}

        <div>
          <label className={`${ds.caption} text-[#8e8e93] block mb-1.5`}>Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e93]" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={`${ds.input} pl-10`}
            />
          </div>
        </div>

        {mode !== 'reset' && (
          <div>
            <label className={`${ds.caption} text-[#8e8e93] block mb-1.5`}>Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e93]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className={`${ds.input} pl-10 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e8e93]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-[#ff3b30] text-[14px] font-medium">{error}</p>
        )}
        {successMessage && (
          <p className="text-[#34c759] text-[14px] font-medium">{successMessage}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`${ds.btnPrimary} w-full mt-2 flex items-center justify-center gap-2`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'
          )}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3 items-center">
        {mode === 'signin' && (
          <>
            <button onClick={() => setMode('reset')} className={`${ds.callout} text-[#8e8e93]`}>
              Forgot password? <span className="text-[#f97316] font-semibold">Reset</span>
            </button>
            <button onClick={() => setMode('signup')} className={`${ds.callout} text-[#8e8e93]`}>
              No account? <span className="text-[#f97316] font-semibold">Create one</span>
            </button>
          </>
        )}
        {(mode === 'signup' || mode === 'reset') && (
          <button onClick={() => setMode('signin')} className={`${ds.callout} text-[#8e8e93]`}>
            Already have an account? <span className="text-[#f97316] font-semibold">Sign in</span>
          </button>
        )}
      </div>
    </div>
  );
}
