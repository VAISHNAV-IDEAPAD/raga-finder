'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music, ShieldAlert, BookOpen, Sparkles, LogIn, UserPlus } from 'lucide-react';
import ActivateAiModal from './ActivateAiModal';
import AuthModal from './AuthModal';
import SignupSuccessModal from './SignupSuccessModal';
import UserProfileBadge from './UserProfileBadge';
import { UserEntry } from '@/types/user';

export default function Navbar() {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ active: boolean; provider: string }>({
    active: false,
    provider: '',
  });

  // Auth States
  const [currentUser, setCurrentUser] = useState<UserEntry | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [newlyRegisteredUser, setNewlyRegisteredUser] = useState<UserEntry | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | undefined>(undefined);

  const checkAiStatus = () => {
    const key = typeof window !== 'undefined' ? localStorage.getItem('raga_ai_key') : null;
    const provider = typeof window !== 'undefined' ? localStorage.getItem('raga_ai_provider') || 'gemini' : 'gemini';
    if (key && key.trim().length > 5) {
      setAiStatus({ active: true, provider: provider === 'gemini' ? 'Gemini' : 'OpenAI' });
      return;
    }

    // Check server status
    fetch('/api/ai/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.serverHasKey) {
          setAiStatus({
            active: true,
            provider: data.provider === 'gemini' ? 'Gemini' : 'OpenAI',
          });
        } else {
          setAiStatus({ active: false, provider: '' });
        }
      })
      .catch(() => {
        setAiStatus({ active: false, provider: '' });
      });
  };

  useEffect(() => {
    checkAiStatus();
    window.addEventListener('raga_ai_updated', checkAiStatus);

    // Read stored user session
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('raga_user_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.user) {
            setCurrentUser(parsed.user);
          }
        }
      } catch {
        // ignore
      }

      const handleOpenAuth = (e: Event) => {
        const customEvent = e as CustomEvent<{ mode?: 'login' | 'signup' }>;
        const targetMode = customEvent?.detail?.mode === 'login' ? 'login' : 'signup';
        setAuthModalMode(targetMode);
        setIsAuthModalOpen(true);
      };

      window.addEventListener('open_auth_modal', handleOpenAuth);
      return () => {
        window.removeEventListener('raga_ai_updated', checkAiStatus);
        window.removeEventListener('open_auth_modal', handleOpenAuth);
      };
    }

    return () => {
      window.removeEventListener('raga_ai_updated', checkAiStatus);
    };
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('raga_user_session');
    }
    setCurrentUser(null);
  };

  const handleAuthSuccess = (user: UserEntry, isNewSignup: boolean, notifMessage?: string) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'raga_user_session',
        JSON.stringify({
          user,
          loginAt: new Date().toISOString(),
        })
      );
    }
    setIsAuthModalOpen(false);

    if (isNewSignup) {
      setNewlyRegisteredUser(user);
      setNotificationMsg(notifMessage);
      setIsSuccessModalOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-panel border-b border-amber-200/60 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-raga-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-raga-500/20 group-hover:scale-105 transition-transform">
                <Music className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 group-hover:text-raga-600 transition-colors">
                    Raga<span className="text-raga-600">Finder</span>
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 hidden md:block">
                  Carnatic & Hindustani Musicology
                </p>
              </div>
            </Link>

            {/* Navigation Links & Right Section */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <Link
                href="/"
                className="hidden sm:flex px-2.5 py-1.5 text-xs sm:text-sm font-medium text-stone-700 hover:text-raga-600 hover:bg-amber-50 rounded-lg transition-colors items-center gap-1.5"
              >
                <Music className="w-3.5 h-3.5 text-raga-500" />
                <span>Finder</span>
              </Link>

              <Link
                href="/melakarta"
                className="hidden sm:flex px-2.5 py-1.5 text-xs sm:text-sm font-medium text-stone-700 hover:text-raga-600 hover:bg-amber-50 rounded-lg transition-colors items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>72 Melakartas</span>
              </Link>

              {/* Activate AI / AI Status Button */}
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className={`px-2.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 border shadow-xs ${
                  aiStatus.active
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-gradient-to-r from-amber-500 to-raga-500 text-white border-amber-400 hover:from-amber-600 hover:to-raga-600 shadow-amber-500/20'
                }`}
                title="Configure Google Gemini or OpenAI API Key"
              >
                {aiStatus.active ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="hidden xs:inline">AI:</span> {aiStatus.provider}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Activate AI</span>
                  </>
                )}
              </button>

              <Link
                href="/admin"
                className="px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 border border-stone-800"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Admin Teaching</span>
                <span className="lg:hidden">Admin</span>
              </Link>

              {/* Right Corner Login & Signup Section */}
              <div className="ml-1 pl-1.5 sm:pl-2 border-l border-amber-300/80 flex items-center gap-1.5">
                {currentUser ? (
                  <UserProfileBadge user={currentUser} onLogout={handleLogout} />
                ) : (
                  <>
                    {/* Direct Login Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode('login');
                        setIsAuthModalOpen(true);
                      }}
                      className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-stone-700 hover:text-raga-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1 border border-stone-200 hover:border-amber-300 shadow-xs"
                      title="Direct login for existing members"
                    >
                      <LogIn className="w-3.5 h-3.5 text-stone-500" />
                      <span className="hidden xs:inline">Direct </span>Login
                    </button>

                    {/* Sign Up Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode('signup');
                        setIsAuthModalOpen(true);
                      }}
                      className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-raga-600 to-amber-600 hover:from-raga-700 hover:to-amber-700 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1"
                      title="Sign up with Mobile, Google, Microsoft, or Email"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Sign Up</span>
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <ActivateAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />

      {/* Authentication Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Thank You For Joining Celebration Modal */}
      <SignupSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        user={newlyRegisteredUser}
        notificationMessage={notificationMsg}
      />
    </>
  );
}
