'use client';

import React, { useState } from 'react';
import {
  Music,
  Search,
  Sparkles,
  BookOpen,
  FileText,
  SlidersHorizontal,
  Info,
  CheckCircle,
} from 'lucide-react';
import SwaraKeyboard from '@/components/SwaraKeyboard';
import RagaResultCard from '@/components/RagaResultCard';
import { IdentifyRequest, IdentifyResponse, Tradition } from '@/types/raga';

export default function HomePage() {
  const [searchMode, setSearchMode] = useState<'swaras' | 'song' | 'description'>('swaras');
  const [selectedSwaras, setSelectedSwaras] = useState<string[]>(['S', 'R1', 'G3', 'M1', 'P', 'D1', 'N3']);
  const [songQuery, setSongQuery] = useState('');
  const [descQuery, setDescQuery] = useState('');
  const [traditionPreference, setTraditionPreference] = useState<Tradition>('Both');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchResult, setSearchResult] = useState<IdentifyResponse | null>(null);

  const handleSearch = async () => {
    setErrorMsg('');
    setIsLoading(true);

    const payload: IdentifyRequest = {
      mode: searchMode,
      traditionPreference,
    };

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
      if (!res.ok || (!data.success && !data.raga)) {
        throw new Error(data.error || 'Failed to identify raga');
      }

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
      <section className="pt-10 pb-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-semibold mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-raga-600" />
          <span>Powered by OpenAI & Continuous Admin Ground-Truth Teaching</span>
        </div>

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
      </section>

      {/* Main Search Panel */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    'Omkaaram Omkaaram',
                    'Vatapi Ganapatim',
                    'Idhayam Oru Kovil',
                    'Pramadavanam',
                    'Albela Sajan',
                    'Samaja Vara Gamana',
                    'Kalyana Then Nila',
                    'Kannodu Kaanbadhellam',
                    'Endaro Mahanubhavulu',
                    'Mohanam',
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSongQuery(s);
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 border border-stone-200 transition-colors font-medium"
                    >
                      {s}
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
                    <span>Searching Verified Movie & Classical Database...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Find Raga of this Song / Kriti</span>
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

        {/* Results Area */}
        {searchResult && (
          <div id="raga-result-section" className="mt-12 animate-fadeIn">
            <RagaResultCard result={searchResult} rawQuery={searchResult.rawQuery} />
          </div>
        )}
      </main>
    </div>
  );
}
