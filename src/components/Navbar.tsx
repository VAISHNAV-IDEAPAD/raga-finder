'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Music,
  ShieldAlert,
  BookOpen,
  Sparkles,
  LogIn,
  UserPlus,
  Download,
  Home,
  LifeBuoy,
  Radio,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import AuthModal from './AuthModal';
import SignupSuccessModal from './SignupSuccessModal';
import UserProfileBadge from './UserProfileBadge';
import { UserEntry } from '@/types/user';

export default function Navbar() {
  // Auth States
  const [currentUser, setCurrentUser] = useState<UserEntry | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [newlyRegisteredUser, setNewlyRegisteredUser] = useState<UserEntry | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | undefined>(undefined);

  // Mobile navigation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'ragas' | 'downloads' | 'sos' | 'radio' | 'updates'>('home');

  useEffect(() => {
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

      const syncTabFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam === 'ragas' || tabParam === 'downloads' || tabParam === 'sos' || tabParam === 'radio' || tabParam === 'updates') {
          setActiveTab(tabParam as 'ragas' | 'downloads' | 'sos' | 'radio' | 'updates');
        } else {
          setActiveTab('home');
        }
      };

      syncTabFromUrl();

      const handleOpenAuth = (e: Event) => {
        const customEvent = e as CustomEvent<{ mode?: 'login' | 'signup' }>;
        const targetMode = customEvent?.detail?.mode === 'login' ? 'login' : 'signup';
        setAuthModalMode(targetMode);
        setIsAuthModalOpen(true);
        setIsMobileMenuOpen(false);
      };

      const handleSwitchTabEvent = (e: Event) => {
        const customEvent = e as CustomEvent<{ tab: 'home' | 'ragas' | 'downloads' | 'sos' | 'radio' | 'updates' }>;
        if (customEvent.detail?.tab) {
          setActiveTab(customEvent.detail.tab);
        }
      };

      window.addEventListener('open_auth_modal', handleOpenAuth);
      window.addEventListener('switch_top_tab', handleSwitchTabEvent);
      window.addEventListener('popstate', syncTabFromUrl);

      return () => {
        window.removeEventListener('open_auth_modal', handleOpenAuth);
        window.removeEventListener('switch_top_tab', handleSwitchTabEvent);
        window.removeEventListener('popstate', syncTabFromUrl);
      };
    }
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

  const handleTabNavigation = (tab: 'home' | 'ragas' | 'downloads' | 'sos' | 'radio' | 'updates') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      const targetUrl = tab === 'home' ? '/' : `/?tab=${tab}`;
      if (window.location.pathname !== '/') {
        window.location.href = targetUrl;
        return;
      }
      window.dispatchEvent(new CustomEvent('switch_top_tab', { detail: { tab } }));
      window.history.pushState({}, '', targetUrl);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-panel border-b border-amber-200/60 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <Link
              href="/"
              onClick={() => handleTabNavigation('home')}
              className="flex items-center space-x-2 sm:space-x-3 group shrink-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-raga-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-raga-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Music className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-xl font-bold tracking-tight text-stone-900 group-hover:text-raga-600 transition-colors">
                    Raga<span className="text-raga-600">Finder</span>
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-stone-500 hidden sm:block">
                  Carnatic & Hindustani Musicology
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 sm:space-x-2">
              <Link
                href="/"
                onClick={() => handleTabNavigation('home')}
                className={`px-2.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'home'
                    ? 'bg-amber-100 text-raga-700 font-bold'
                    : 'text-stone-700 hover:text-raga-600 hover:bg-amber-50'
                }`}
              >
                <Home className="w-3.5 h-3.5 text-stone-500" />
                <span>Home</span>
              </Link>

              <Link
                href="/?tab=ragas"
                onClick={() => handleTabNavigation('ragas')}
                className={`px-2.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'ragas'
                    ? 'bg-amber-100 text-raga-700 font-bold'
                    : 'text-stone-700 hover:text-raga-600 hover:bg-amber-50'
                }`}
              >
                <Music className="w-3.5 h-3.5 text-raga-500" />
                <span>Ragas</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  908
                </span>
              </Link>

              <Link
                href="/?tab=downloads"
                onClick={() => handleTabNavigation('downloads')}
                className={`px-2.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'downloads'
                    ? 'bg-amber-100 text-raga-700 font-bold'
                    : 'text-stone-700 hover:text-raga-600 hover:bg-amber-50'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-amber-600" />
                <span>Downloads</span>
              </Link>

              {/* SOS Menu */}
              <Link
                href="/?tab=sos"
                onClick={() => handleTabNavigation('sos')}
                className={`flex px-2.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-colors items-center gap-1.5 border ${
                  activeTab === 'sos'
                    ? 'bg-rose-100 text-rose-800 border-rose-400 shadow-xs'
                    : 'text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-300/80 bg-rose-50/60 shadow-xs'
                }`}
                title="SOS Musician Rescue: Tanpura, Confusion Solver, Swara Panic"
              >
                <LifeBuoy className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span>SOS</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                  Rescue
                </span>
              </Link>

              {/* Raga Radio Menu */}
              <Link
                href="/?tab=radio"
                onClick={() => handleTabNavigation('radio')}
                className={`flex px-2.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-colors items-center gap-1.5 border ${
                  activeTab === 'radio'
                    ? 'bg-amber-200 text-amber-950 border-amber-400 shadow-xs'
                    : 'text-amber-900 hover:text-amber-950 hover:bg-amber-100/80 border-amber-300/80 bg-amber-50/80 shadow-xs'
                }`}
                title="Raga Radio: 90 Ragas, 3,274 Compositions with Direct In-Menu Radio Streaming"
              >
                <Radio className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>Raga Radio</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                  90 Ragas
                </span>
              </Link>

              {/* Updates Menu (Live Malayalam Film Songs) */}
              <Link
                href="/?tab=updates"
                onClick={() => handleTabNavigation('updates')}
                className={`flex px-2.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-colors items-center gap-1.5 border ${
                  activeTab === 'updates'
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-400 shadow-xs'
                    : 'text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50 border-emerald-300/80 bg-emerald-50/70 shadow-xs'
                }`}
                title="Live Malayalam Film Songs (Spotify Direct Stream)"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>Spotify Updates</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#1DB954] text-white shadow-2xs">
                  Live
                </span>
              </Link>

              <Link
                href="/melakarta"
                className="flex px-2.5 py-1.5 text-xs sm:text-sm font-medium text-stone-700 hover:text-raga-600 hover:bg-amber-50 rounded-lg transition-colors items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>72 Melakartas</span>
              </Link>

              <Link
                href="/admin"
                className="px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 border border-stone-800"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin</span>
              </Link>

              {/* Right Corner Login & Signup Section */}
              <div className="ml-1 pl-1.5 sm:pl-2 border-l border-amber-300/80 flex items-center gap-1.5">
                {currentUser ? (
                  <UserProfileBadge user={currentUser} onLogout={handleLogout} />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode('login');
                        setIsAuthModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 text-xs sm:text-sm font-medium text-stone-700 hover:text-raga-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1 border border-stone-200 hover:border-amber-300 shadow-xs"
                      title="Direct login for existing members"
                    >
                      <LogIn className="w-3.5 h-3.5 text-stone-500" />
                      <span>Login</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode('signup');
                        setIsAuthModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-raga-600 to-amber-600 hover:from-raga-700 hover:to-amber-700 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1"
                      title="Sign up with Mobile, Google, Microsoft, or Email"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Sign Up</span>
                    </button>
                  </>
                )}
              </div>
            </nav>

            {/* Mobile Header Right Section: Quick Auth + Hamburger Toggle */}
            <div className="flex lg:hidden items-center gap-2">
              {currentUser ? (
                <div className="scale-90 origin-right">
                  <UserProfileBadge user={currentUser} onLogout={handleLogout} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-raga-600 to-amber-600 hover:from-raga-700 hover:to-amber-700 rounded-lg shadow-sm flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Join</span>
                </button>
              )}

              {/* Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 border border-amber-300 transition-colors focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-stone-900" />
                ) : (
                  <Menu className="w-5 h-5 text-stone-900" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-Down Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-amber-200 bg-white/95 backdrop-blur-xl shadow-2xl px-4 py-4 space-y-3 animate-fadeIn max-h-[80vh] overflow-y-auto">
            {/* User Profile Card or Auth Buttons */}
            {!currentUser ? (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-stone-900">Raga Finder Community</div>
                  <div className="text-[11px] text-stone-500">Sign in to save discoveries &amp; rules</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('login');
                      setIsAuthModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-amber-50 border border-stone-200 rounded-lg shadow-xs"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('signup');
                      setIsAuthModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-raga-600 to-amber-600 rounded-lg shadow-xs"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            ) : null}

            {/* Menu Links */}
            <div className="space-y-1">
              <Link
                href="/"
                onClick={() => handleTabNavigation('home')}
                className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'home'
                    ? 'bg-amber-100 text-raga-700 font-bold'
                    : 'text-stone-800 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Home className="w-4 h-4 text-stone-500" />
                  <span>Home (Raga Finder AI)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>

              <Link
                href="/?tab=ragas"
                onClick={() => handleTabNavigation('ragas')}
                className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'ragas'
                    ? 'bg-amber-100 text-raga-700 font-bold'
                    : 'text-stone-800 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Music className="w-4 h-4 text-raga-500" />
                  <span>Ragas Explorer &amp; Janya Table</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                  908 Ragas
                </span>
              </Link>

              <Link
                href="/?tab=radio"
                onClick={() => handleTabNavigation('radio')}
                className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'radio'
                    ? 'bg-amber-200 text-amber-950 font-bold'
                    : 'text-amber-950 bg-amber-50/80 hover:bg-amber-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Radio className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Raga Radio (Direct Streaming)</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                  90 Ragas
                </span>
              </Link>

              <Link
                href="/?tab=updates"
                onClick={() => handleTabNavigation('updates')}
                className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'updates'
                    ? 'bg-emerald-100 text-emerald-950 font-bold'
                    : 'text-emerald-950 bg-emerald-50/80 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>Spotify Updates (Malayalam Songs)</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1DB954] text-white">
                  Live Feed
                </span>
              </Link>

              <Link
                href="/?tab=sos"
                onClick={() => handleTabNavigation('sos')}
                className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'sos'
                    ? 'bg-rose-100 text-rose-800 font-bold'
                    : 'text-rose-800 bg-rose-50/80 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LifeBuoy className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span>SOS Musician Rescue</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                  Emergency
                </span>
              </Link>

              <Link
                href="/?tab=downloads"
                onClick={() => handleTabNavigation('downloads')}
                className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'downloads'
                    ? 'bg-amber-100 text-raga-700 font-bold'
                    : 'text-stone-800 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>Downloads Center</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                  5 Datasets
                </span>
              </Link>

              <Link
                href="/melakarta"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-stone-800 hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>72 Melakarta Janaka System</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>

              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Admin Teaching Console</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Floating Mobile Bottom Navigation Bar (< md screens) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-panel border-t border-amber-200/90 shadow-xl bg-white/95 backdrop-blur-lg px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {/* 1. Home */}
          <button
            type="button"
            onClick={() => handleTabNavigation('home')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'home'
                ? 'text-raga-600 font-bold bg-amber-50/80 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Home className={`w-4 h-4 ${activeTab === 'home' ? 'text-raga-600' : 'text-stone-500'}`} />
            <span className="text-[10px] mt-0.5">Home</span>
          </button>

          {/* 2. Ragas (908) */}
          <button
            type="button"
            onClick={() => handleTabNavigation('ragas')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all relative ${
              activeTab === 'ragas'
                ? 'text-raga-600 font-bold bg-amber-50/80 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <div className="relative">
              <Music className={`w-4 h-4 ${activeTab === 'ragas' ? 'text-raga-600' : 'text-stone-500'}`} />
              <span className="absolute -top-1.5 -right-3 text-[8px] font-black px-1 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                908
              </span>
            </div>
            <span className="text-[10px] mt-0.5">Ragas</span>
          </button>

          {/* 3. Radio */}
          <button
            type="button"
            onClick={() => handleTabNavigation('radio')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all relative ${
              activeTab === 'radio'
                ? 'text-amber-800 font-bold bg-amber-100/90 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <div className="relative">
              <Radio className={`w-4 h-4 ${activeTab === 'radio' ? 'text-amber-700 animate-pulse' : 'text-stone-500'}`} />
              <span className="absolute -top-1.5 -right-2 text-[8px] font-black px-1 rounded-full bg-amber-300 text-amber-950">
                90
              </span>
            </div>
            <span className="text-[10px] mt-0.5">Radio</span>
          </button>

          {/* 4. SOS */}
          <button
            type="button"
            onClick={() => handleTabNavigation('sos')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all relative ${
              activeTab === 'sos'
                ? 'text-rose-700 font-bold bg-rose-50 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <div className="relative">
              <LifeBuoy className={`w-4 h-4 ${activeTab === 'sos' ? 'text-rose-600 animate-pulse' : 'text-rose-500'}`} />
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            </div>
            <span className="text-[10px] mt-0.5">SOS</span>
          </button>

          {/* 5. Downloads */}
          <button
            type="button"
            onClick={() => handleTabNavigation('downloads')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'downloads'
                ? 'text-raga-600 font-bold bg-amber-50/80 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Download className={`w-4 h-4 ${activeTab === 'downloads' ? 'text-raga-600' : 'text-stone-500'}`} />
            <span className="text-[10px] mt-0.5">Downloads</span>
          </button>
        </div>
      </nav>

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
