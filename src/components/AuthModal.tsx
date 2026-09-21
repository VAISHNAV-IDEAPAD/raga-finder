'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Mail,
  Phone,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
} from 'lucide-react';
import { UserEntry, AuthProvider } from '@/types/user';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess: (user: UserEntry, isNewSignup: boolean, notificationMsg?: string) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signup',
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'google' | 'microsoft' | 'mobile' | 'email'>('google');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setErrorMsg('');
    setName('');
    setEmail('');
    setMobile('');
    setPassword('');
    setOtp('');
    setIsOtpSent(false);
  };

  const handleSendMobileOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim() || mobile.trim().length < 7) {
      setErrorMsg('Please enter a valid mobile number.');
      return;
    }
    setErrorMsg('');
    setIsOtpSent(true);
    setOtp('1234'); // Pre-fill simulation OTP for effortless user experience
  };

  // Google Fast Sign-in / Sign-up
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg('');

    // Pre-configured simulated accounts or prompt email
    const promptEmail = prompt('Enter your Gmail address for Google Login/Signup:', 'music.lover@gmail.com');
    if (!promptEmail) {
      setIsLoading(false);
      return;
    }

    const derivedName = promptEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: derivedName,
            email: promptEmail,
            provider: 'google',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(derivedName)}`,
          }),
        });
        const data = await res.json();
        if (data.isExistingUser) {
          // Auto sign-in if existing
          onSuccess(data.user, false);
          onClose();
          return;
        }
        if (!res.ok || !data.success) throw new Error(data.error || 'Google signup failed');
        onSuccess(data.user, true, data.notification?.message);
        onClose();
      } else {
        // Direct login
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: promptEmail,
            provider: 'google',
            email: promptEmail,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          // If not registered yet, guide to sign up
          if (data.notFound) {
            setMode('signup');
            setEmail(promptEmail);
            setName(derivedName);
            setErrorMsg('Account not found with this Gmail. Switched to Sign Up for you!');
            return;
          }
          throw new Error(data.error || 'Google login failed');
        }
        onSuccess(data.user, false);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  // Microsoft Fast Sign-in / Sign-up
  const handleMicrosoftAuth = async () => {
    setIsLoading(true);
    setErrorMsg('');

    const promptEmail = prompt('Enter your Microsoft / Outlook email:', 'music.enthusiast@outlook.com');
    if (!promptEmail) {
      setIsLoading(false);
      return;
    }

    const derivedName = promptEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: derivedName,
            email: promptEmail,
            provider: 'microsoft',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(derivedName)}`,
          }),
        });
        const data = await res.json();
        if (data.isExistingUser) {
          onSuccess(data.user, false);
          onClose();
          return;
        }
        if (!res.ok || !data.success) throw new Error(data.error || 'Microsoft signup failed');
        onSuccess(data.user, true, data.notification?.message);
        onClose();
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: promptEmail,
            provider: 'microsoft',
            email: promptEmail,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          if (data.notFound) {
            setMode('signup');
            setEmail(promptEmail);
            setName(derivedName);
            setErrorMsg('Account not found with this Microsoft account. Switched to Sign Up!');
            return;
          }
          throw new Error(data.error || 'Microsoft login failed');
        }
        onSuccess(data.user, false);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Microsoft authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  // Standard Form Submit (Mobile or Email)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const fullMobile = mobile ? `${countryCode} ${mobile.trim()}` : undefined;

        if (authMethod === 'mobile' && !isOtpSent) {
          setIsOtpSent(true);
          setOtp('1234');
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim() || 'Music Lover',
            email: authMethod === 'email' ? email.trim() : undefined,
            mobile: authMethod === 'mobile' ? fullMobile : undefined,
            provider: authMethod,
          }),
        });

        const data = await res.json();
        if (data.isExistingUser) {
          setErrorMsg(data.error);
          setMode('login');
          return;
        }

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Signup failed');
        }

        onSuccess(data.user, true, data.notification?.message);
        onClose();
      } else {
        // Direct Login
        const identifier = authMethod === 'mobile'
          ? `${countryCode} ${mobile.trim()}`
          : email.trim();

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          if (data.notFound) {
            setErrorMsg('Account not found. Switched to Sign Up.');
            setMode('signup');
            return;
          }
          throw new Error(data.error || 'Login failed');
        }

        onSuccess(data.user, false);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl glass-panel shadow-2xl border-2 border-amber-300 bg-white/95 overflow-hidden transition-all">
        {/* Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-raga-500 flex items-center justify-center text-stone-950 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                {mode === 'signup' ? 'Join RagaFinder Family' : 'Direct Login'}
              </h2>
              <p className="text-[11px] text-amber-200/80">
                Carnatic & Hindustani Musicology Community
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs (Sign Up vs Direct Login) */}
        <div className="p-2 border-b border-amber-200/60 bg-amber-50/50 flex gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'signup'
                ? 'bg-white text-stone-900 shadow-sm border border-amber-300'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            New Member? Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'login'
                ? 'bg-white text-stone-900 shadow-sm border border-amber-300'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Existing User? Direct Login
          </button>
        </div>

        {/* Main Body */}
        <div className="p-6 space-y-4">
          {/* Quick OAuth Buttons (Google & Microsoft) */}
          <div className="space-y-2">
            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{mode === 'signup' ? 'Sign up with Gmail / Google' : 'Continue with Google'}</span>
            </button>

            {/* Microsoft */}
            <button
              type="button"
              onClick={handleMicrosoftAuth}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              <span>{mode === 'signup' ? 'Sign up with Microsoft Account' : 'Continue with Microsoft'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 my-3">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Or use Mobile / Email
            </span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          {/* Sub-method tabs: Mobile vs Email */}
          <div className="flex gap-2 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('mobile');
                setErrorMsg('');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                authMethod === 'mobile'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Mobile Number</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email');
                setErrorMsg('');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                authMethod === 'email'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Address</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Raman"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 pl-9 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {authMethod === 'mobile' ? (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Mobile Number *
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="px-2.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+65">🇸🇬 +65</option>
                    <option value="+971">🇦🇪 +971</option>
                  </select>
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      required
                      placeholder="98765 43210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full px-3.5 py-2.5 pl-9 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {isOtpSent && (
                  <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-1">
                      Enter Verification Code (Demo OTP: 1234)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="1234"
                      className="w-full px-3 py-2 text-center text-base tracking-widest font-mono font-bold rounded-lg border border-amber-300 bg-white"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 pl-9 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-raga-600 to-amber-600 hover:from-raga-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-raga-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'signup'
                      ? (authMethod === 'mobile' && !isOtpSent ? 'Send Verification OTP' : 'Complete Sign Up & Join')
                      : 'Direct Login'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
