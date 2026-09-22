'use client';

import React, { useState, useEffect } from 'react';
import {
  Music,
  Search,
  Sparkles,
  BookOpen,
  FileText,
  SlidersHorizontal,
  Info,
  CheckCircle,
  Zap,
  Home,
  Download,
} from 'lucide-react';
import SwaraKeyboard from '@/components/SwaraKeyboard';
import RagaResultCard from '@/components/RagaResultCard';
import ActivateAiModal from '@/components/ActivateAiModal';
import RagasExplorerTab from '@/components/RagasExplorerTab';
import DownloadsTab from '@/components/DownloadsTab';
import { IdentifyRequest, IdentifyResponse, Tradition } from '@/types/raga';

export default function HomePage() {
  const [activeTopTab, setActiveTopTab] = useState<'home' | 'ragas' | 'downloads'>('home');
  const [searchMode, setSearchMode] = useState<'swaras' | 'song' | 'description'>('swaras');
  const [selectedSwaras, setSelectedSwaras] = useState<string[]>(['S', 'R1', 'G3', 'M1', 'P', 'D1', 'N3']);
  const [songQuery, setSongQuery] = useState('');
  const [descQuery, setDescQuery] = useState('');
  const [traditionPreference, setTraditionPreference] = useState<Tradition>('Both');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchResult, setSearchResult] = useState<IdentifyResponse | null>(null);

  // AI Activation states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [needsAiActivationFor, setNeedsAiActivationFor] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<{ active: boolean; provider: string }>({
    active: false,
    provider: '',
  });

  const checkAiStatus = () => {
    const key = typeof window !== 'undefined' ? localStorage.getItem('raga_ai_key') : null;
    const provider = typeof window !== 'undefined' ? localStorage.getItem('raga_ai_provider') || 'gemini' : 'gemini';
    if (key && key.trim().length > 5) {
      setAiStatus({ active: true, provider: provider === 'gemini' ? 'Gemini' : 'OpenAI' });
      return;
    }

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
      .catch(() => setAiStatus({ active: false, provider: '' }));
  };

  useEffect(() => {
    checkAiStatus();
    window.addEventListener('raga_ai_updated', checkAiStatus);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'ragas' || tabParam === 'downloads' || tabParam === 'home') {
        setActiveTopTab(tabParam as 'home' | 'ragas' | 'downloads');
      }

      const handlePopState = () => {
        const currentParams = new URLSearchParams(window.location.search);
        const currentTab = currentParams.get('tab');
        if (currentTab === 'ragas' || currentTab === 'downloads') {
          setActiveTopTab(currentTab);
        } else {
          setActiveTopTab('home');
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('raga_ai_updated', checkAiStatus);
        window.removeEventListener('popstate', handlePopState);
      };
    }

    return () => window.removeEventListener('raga_ai_updated', checkAiStatus);
  }, []);

  const handleTopTabChange = (tab: 'home' | 'ragas' | 'downloads') => {
    setActiveTopTab(tab);
    if (typeof window !== 'undefined') {
      const url = tab === 'home' ? '/' : `/?tab=${tab}`;
      window.history.pushState({}, '', url);
    }
  };

  const handleSelectRagaFromExplorer = (swaras: string[]) => {
    setSelectedSwaras(swaras);
    setSearchMode('swaras');
    setActiveTopTab('home');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.scrollTo({ top: 250, behavior: 'smooth' });
    }
  };

  const handleSearch = async () => {
    setErrorMsg('');
    setIsLoading(true);

    const payload: IdentifyRequest = {
      mode: searchMode,
      traditionPreference,
    };

    // Attach active AI credentials from localStorage if present
    const storedAiKey = typeof window !== 'undefined' ? localStorage.getItem('raga_ai_key') : null;
    const storedAiProvider = typeof window !== 'undefined' ? (localStorage.getItem('raga_ai_provider') as 'gemini' | 'openai') || 'gemini' : 'gemini';
    const storedAiModel = typeof window !== 'undefined' ? localStorage.getItem('raga_ai_model') : null;

    if (storedAiKey) {
      payload.aiApiKey = storedAiKey;
      payload.aiProvider = storedAiProvider;
      if (storedAiModel) payload.aiModel = storedAiModel;
    }

    if (searchMode === 'swaras') {
      if (selectedSwaras.length < 3) {
        setErrorMsg('Please select at least 3 swaras to identify a raga.');
        setIsLoading(false);
        return;
      }
      payload.swaras = selectedSwaras;
    } else if (searchMode === 'song') {
      if (!songQuery.trim()) {
        setErrorMsg('Please enter a song name or composition title.');
        setIsLoading(false);
        return;
      }
      payload.songQuery = songQuery.trim();
    } else {
      if (!descQuery.trim()) {
        setErrorMsg('Please enter musical notes, scale or description.');
        setIsLoading(false);
        return;
      }
      payload.description = descQuery.trim();
    }

    try {
      const res = await fetch('/api/identify-raga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || (!data.success && !data.raga && !data.needsAiActivation)) {
        throw new Error(data.error || 'Failed to identify raga');
      }

      // If song not in database and AI needs activation, prompt user
      if (data.needsAiActivation) {
        setNeedsAiActivationFor(data.unindexedSongTitle || songQuery);
        setSearchResult(null);
        setErrorMsg('');
        setTimeout(() => {
          const el = document.getElementById('ai-activation-prompt-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return;
      }

      setNeedsAiActivationFor(null);
      setSearchResult(data);
      if (!data.success && data.raga?.explanation) {
        setErrorMsg(data.raga.explanation);
      }
      // Scroll to result smoothly
      setTimeout(() => {
        const el = document.getElementById('raga-result-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with Raga identification engine.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-music-pattern pb-20">
      {/* Hero Section */}
      <section className="pt-8 pb-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        {/* Top 3 Navigation Tabs: Home, Ragas, Downloads - Positioned directly UPWARD of Powered by Google */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex p-1.5 rounded-2xl bg-amber-50/90 backdrop-blur-md border border-amber-300/80 shadow-md">
            <button
              type="button"
              onClick={() => handleTopTabChange('home')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTopTab === 'home'
                  ? 'bg-gradient-to-r from-raga-600 to-amber-600 text-white shadow-md'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-amber-100/60'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={() => handleTopTabChange('ragas')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTopTab === 'ragas'
                  ? 'bg-gradient-to-r from-raga-600 to-amber-600 text-white shadow-md'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-amber-100/60'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Ragas</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTopTab === 'ragas' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
                }`}
              >
                72+
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTopTabChange('downloads')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTopTab === 'downloads'
                  ? 'bg-gradient-to-r from-raga-600 to-amber-600 text-white shadow-md'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-amber-100/60'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Downloads</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTopTab === 'downloads' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
                }`}
              >
                5
              </span>
            </button>
          </div>
        </div>

        {/* Powered by Google Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/90 border border-amber-300 text-amber-900 text-xs font-semibold mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-raga-600" />
          <span>Powered by Google Gemini &amp; OpenAI &bull; Continuous Admin Ground-Truth Teaching</span>
        </div>

        {activeTopTab === 'home' && (
          <>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-stone-900 tracking-tight">
              Find Any <span className="text-raga-600">Raga</span> in Seconds
            </h1>
            <p className="mt-4 text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Explore Carnatic and Hindustani classical ragas by tapping Swaras, typing any song or
              film title, or describing musical scales with precision AI analysis.
            </p>

            {/* Mode Switcher Tabs */}
            <div className="mt-8 inline-flex p-1.5 rounded-2xl glass-panel shadow-md border border-amber-200/80">
              <button
                type="button"
                onClick={() => setSearchMode('swaras')}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                  searchMode === 'swaras'
                    ? 'bg-gradient-to-r from-raga-500 to-amber-600 text-white shadow-md'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/70'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>By Swaras (Notes)</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchMode('song')}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                  searchMode === 'song'
                    ? 'bg-gradient-to-r from-raga-500 to-amber-600 text-white shadow-md'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/70'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>By Song / Kriti</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchMode('description')}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                  searchMode === 'description'
                    ? 'bg-gradient-to-r from-raga-500 to-amber-600 text-white shadow-md'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/70'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Western / Description</span>
              </button>
            </div>
          </>
        )}
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeTopTab === 'home' && (
          <>
            <div className="p-6 sm:p-8 rounded-3xl glass-panel shadow-xl border border-amber-200/80 space-y-6">
          {/* Tradition Preference Filter */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-amber-200/60">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-600">
              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
              <span>Tradition Preference:</span>
            </div>
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
              {(['Both', 'Carnatic', 'Hindustani'] as Tradition[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTraditionPreference(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    traditionPreference === t
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Mode 1: Swara Keyboard */}
          {searchMode === 'swaras' && (
            <SwaraKeyboard
              selectedSwaras={selectedSwaras}
              onChange={setSelectedSwaras}
              onSearch={handleSearch}
              isLoading={isLoading}
            />
          )}

          {/* Mode 2: Song / Kriti Search */}
          {searchMode === 'song' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Enter Song, Kriti, Bandish or Cinema Song Title:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Omkaaram Omkaaram, Vatapi Ganapatim, Pramadavanam, Idhayam Oru Kovil, Albela Sajan..."
                    value={songQuery}
                    onChange={(e) => setSongQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full px-4 py-3.5 pr-12 text-sm sm:text-base rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-inner"
                  />
                  <Search className="w-5 h-5 text-stone-400 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Sample Song suggestions */}
              <div>
                <span className="text-xs text-stone-500 font-medium mr-2">Try searching:</span>
                <div className="inline-flex flex-wrap gap-1.5 mt-1">
                  {[
                    { label: 'Aadiparaashakthi (6 Ragas)', query: 'Aadiparaashakthi' },
                    { label: 'Devasabhaathalam (8 Ragas)', query: 'Devasabhaathalam' },
                    { label: 'Aananda Nadanam (4 Ragas)', query: 'Aananda Nadanam' },
                    { label: 'Pramadavanam', query: 'Pramadavanam' },
                    { label: 'A.E.I.O.U', query: 'A.E.I.O.U' },
                    { label: 'Vatapi Ganapatim', query: 'Vatapi Ganapatim' },
                    { label: 'Omkaaram Omkaaram', query: 'Omkaaram Omkaaram' },
                    { label: 'Albela Sajan', query: 'Albela Sajan' },
                    { label: 'Samaja Vara Gamana', query: 'Samaja Vara Gamana' },
                    { label: 'Harivaraasanam', query: 'Harivaraasanam' },
                  ].map((item) => (
                    <button
                      key={item.query}
                      type="button"
                      onClick={() => {
                        setSongQuery(item.query);
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 border border-stone-200 transition-colors font-medium"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSearch}
                disabled={!songQuery.trim() || isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-raga-600 to-amber-600 hover:from-raga-700 hover:to-amber-700 text-white font-bold text-base shadow-lg shadow-raga-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{aiStatus.active ? `Consulting ${aiStatus.provider} AI & Music Database...` : 'Searching Verified Movie & Classical Database...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>{aiStatus.active ? `Find Raga with ${aiStatus.provider} AI & Database` : 'Find Raga of this Song / Kriti'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Mode 3: Western / Description */}
          {searchMode === 'description' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Describe the Scale, Western Notes, or Mood:
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Western scale: C, D, E, F#, G, A, B or 'An early morning meditative raga with komal re and komal dha depicting deep devotion'..."
                  value={descQuery}
                  onChange={(e) => setDescQuery(e.target.value)}
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-inner resize-none"
                />
              </div>

              <div>
                <span className="text-xs text-stone-500 font-medium mr-2">Try examples:</span>
                <div className="inline-flex flex-wrap gap-1.5 mt-1">
                  {[
                    'Notes: C D E F# G A B',
                    'Pentatonic scale omitting Ma and Ni with Major 3rd and 6th',
                    'Late night raga with Sadharana Gandharam and Kaisiki Nishadham',
                  ].map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setDescQuery(ex)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 border border-stone-200 transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSearch}
                disabled={!descQuery.trim() || isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-raga-600 to-amber-600 hover:from-raga-700 hover:to-amber-700 text-white font-bold text-base shadow-lg shadow-raga-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Musical Description with OpenAI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Analyze & Identify Raga</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm flex items-start gap-2 animate-fadeIn">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Search Notice:</span> {errorMsg}
              </div>
            </div>
          )}
        </div>

        {/* Unindexed Song AI Activation Prompt Card */}
        {needsAiActivationFor && (
          <div
            id="ai-activation-prompt-section"
            className="mt-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50/50 to-stone-50 border-2 border-amber-300 shadow-xl space-y-4 animate-fadeIn"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-raga-600 text-white shadow-md shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900 border border-amber-300">
                    Unindexed Song Detected
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-1.5">
                  &ldquo;{needsAiActivationFor}&rdquo; is not in the offline database
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl leading-relaxed">
                  Activate the AI Musicologist with 1 click to dynamically identify this song&apos;s classical Raga, Arohana, Avarohana, swaras, and musical director analysis using Google Gemini (100% Free) or OpenAI.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-raga-600 to-amber-600 hover:from-raga-700 hover:to-amber-700 text-white font-black text-sm shadow-lg shadow-raga-500/25 transition-all flex items-center gap-2 hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Activate AI & Identify &ldquo;{needsAiActivationFor}&rdquo;</span>
              </button>
              <span className="text-xs text-stone-500 font-medium">
                (Takes 30 seconds &bull; Free with Google Gemini)
              </span>
            </div>
          </div>
        )}

        {/* Results Area */}
        {searchResult && (
          <div id="raga-result-section" className="mt-12 animate-fadeIn">
            <RagaResultCard result={searchResult} rawQuery={searchResult.rawQuery} />
          </div>
        )}
          </>
        )}

        {/* Tab 2: Ragas Explorer Tab */}
        {activeTopTab === 'ragas' && (
          <RagasExplorerTab onSelectRagaInFinder={handleSelectRagaFromExplorer} />
        )}

        {/* Tab 3: Downloads Tab */}
        {activeTopTab === 'downloads' && (
          <DownloadsTab />
        )}

        {/* Raga Finder Family Community Banner */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50/40 to-stone-50 border border-amber-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-raga-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-raga-500/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                Join the Raga Finder Family
              </h3>
              <p className="text-xs sm:text-sm text-stone-600">
                Sign up with your Mobile Number, Gmail, or Microsoft account to receive welcome confirmations, AI saves, and updates.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open_auth_modal', { detail: { mode: 'login' } }));
                }
              }}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 hover:text-raga-600 hover:bg-white rounded-xl border border-stone-200 transition-colors"
            >
              Direct Login
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open_auth_modal', { detail: { mode: 'signup' } }));
                }
              }}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-raga-600 to-amber-600 hover:from-raga-700 hover:to-amber-700 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      </main>

      <ActivateAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialSongQuery={needsAiActivationFor || songQuery}
        onActivated={() => {
          setNeedsAiActivationFor(null);
          handleSearch();
        }}
      />
    </div>
  );
}
