'use client';

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  HelpCircle,
  Binary,
  Layers,
  Search,
  Music,
} from 'lucide-react';
import {
  calculateKatapayadiMelakarta,
  analyzeScaleGrammar,
  disambiguateRagaRule,
  KatapayadiResult,
} from '@/lib/ruleEngine';
import { structuredDb } from '@/lib/structuredDb';
import { RagaProfile } from '@/types/raga';

interface RuleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRaga: (raga: RagaProfile) => void;
}

export default function RuleSearchModal({
  isOpen,
  onClose,
  onSelectRaga,
}: RuleSearchModalProps) {
  const [activeTab, setActiveTab] = useState<'katapayadi' | 'varja' | 'disambiguate'>('katapayadi');

  // Katapayadi state
  const [kataInput, setKataInput] = useState('Mayamalavagowla');
  const [kataResult, setKataResult] = useState<KatapayadiResult | null>(() =>
    calculateKatapayadiMelakarta('Mayamalavagowla')
  );

  // Varja / Scale Grammar state
  const [scaleFilter, setScaleFilter] = useState<'Audava' | 'Shadava' | 'Sampoorna' | 'Bhashanga' | 'Vakra'>('Audava');

  // Disambiguation state
  const [disambigPair, setDisambigPair] = useState<string>('mohanam vs shivaranjani');

  const handleKataCalculate = (name: string) => {
    setKataInput(name);
    const res = calculateKatapayadiMelakarta(name);
    setKataResult(res);
  };

  const getFilteredRagas = () => {
    const ragas = structuredDb.ragas;
    return ragas.filter((r) => {
      const g = analyzeScaleGrammar(r.arohana, r.avarohana);
      if (scaleFilter === 'Audava') return g.scaleType.includes('Audava');
      if (scaleFilter === 'Shadava') return g.scaleType.includes('Shadava');
      if (scaleFilter === 'Sampoorna') return g.scaleType.includes('Sampoorna');
      if (scaleFilter === 'Bhashanga') return g.isBhashanga;
      if (scaleFilter === 'Vakra') return g.isVakra;
      return true;
    }).slice(0, 12);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-stone-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-900 via-amber-950/30 to-stone-900 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Binary className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                Musicological Rule Engine
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Carnatic Grammar
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Explore Sanskrit Katapayadi ciphers, Varja scale classifications, and raga disambiguations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="px-6 pt-4 border-b border-stone-800 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('katapayadi')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'katapayadi'
                ? 'border-amber-400 text-amber-300 bg-stone-800/60 font-black'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Binary className="w-4 h-4" />
            Katapayadi Cipher
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('varja')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'varja'
                ? 'border-amber-400 text-amber-300 bg-stone-800/60 font-black'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Varja Scale Rules
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('disambiguate')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'disambiguate'
                ? 'border-amber-400 text-amber-300 bg-stone-800/60 font-black'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Raga Disambiguation
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* TAB 1: KATAPAYADI CIPHER */}
          {activeTab === 'katapayadi' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-stone-300 space-y-1">
                <span className="font-bold text-amber-300 block">
                  Rule of Katapayadi Sankhya (कादि नव, टादि नव, पादि पञ्च, याद्यष्टौ):
                </span>
                <p>
                  Melakarta numbers (#1-72) are coded into the first two consonants of a Janaka raga name.
                  By the ancient mathematical canon <em>"Ankanam Vamato Gati"</em>, digits are read in reverse:
                  the 2nd consonant gives the tens place, and the 1st consonant gives the units place.
                </p>
              </div>

              {/* Input & Quick Presets */}
              <div>
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1.5">
                  Enter Janaka Raga Name:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={kataInput}
                    onChange={(e) => handleKataCalculate(e.target.value)}
                    placeholder="e.g. Mayamalavagowla, Kharaharapriya, Harikambhoji..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-stone-400 mr-1">Try classical examples:</span>
                  {[
                    'Mayamalavagowla',
                    'Kharaharapriya',
                    'Harikambhoji',
                    'Dheerasankarabharanam',
                    'Mechakalyani',
                    'Charukesi',
                    'Simhendramadhyamam',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleKataCalculate(preset)}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 font-medium"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated Result */}
              {kataResult ? (
                <div className="p-4 rounded-2xl bg-stone-800/80 border border-amber-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-stone-400">Calculated Parent Scale:</span>
                      <h4 className="text-xl font-black text-amber-400">
                        {kataResult.ragaName} = Melakarta #{kataResult.melakartaNumber}
                      </h4>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold text-right">
                      Chakra #{kataResult.chakraNumber}
                      <span className="block text-[10px] text-stone-300">{kataResult.chakraName}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-900 text-xs font-mono text-stone-200">
                    {kataResult.explanation}
                  </div>

                  {/* Action button to load this raga in main view */}
                  {structuredDb.getRagaByName(kataResult.ragaName) && (
                    <button
                      type="button"
                      onClick={() => {
                        const prof = structuredDb.getRagaByName(kataResult.ragaName);
                        if (prof) {
                          onSelectRaga(prof);
                          onClose();
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      View Full Scale & Compositions for {kataResult.ragaName}
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-stone-800/40 border border-stone-700 text-stone-400 text-xs">
                  Could not parse Melakarta number for "{kataInput}". Ensure standard Sanskrit Janaka prefix.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VARJA SCALE RULES */}
          {activeTab === 'varja' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'Audava', label: 'Audava (5 Swaras / Pentatonic)' },
                  { id: 'Shadava', label: 'Shadava (6 Swaras / Hexatonic)' },
                  { id: 'Sampoorna', label: 'Sampoorna (7 Swaras / Heptatonic)' },
                  { id: 'Bhashanga', label: 'Bhashanga (Foreign Notes)' },
                  { id: 'Vakra', label: 'Vakra (Zig-Zag Contour)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setScaleFilter(item.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      scaleFilter === item.id
                        ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {getFilteredRagas().map((r, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      onSelectRaga(r);
                      onClose();
                    }}
                    className="p-3.5 rounded-2xl bg-stone-800/70 hover:bg-stone-750 border border-stone-700 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{r.name}</span>
                        {r.melakartaNumber && (
                          <span className="text-[10px] text-amber-400 font-semibold">
                            Melakarta #{r.melakartaNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 font-mono mt-1 truncate">
                        {r.arohana}
                      </p>
                    </div>
                    <span className="text-[10px] text-stone-500 mt-2">
                      Click to inspect full swaras and film/classical repertoire
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DISAMBIGUATION */}
          {activeTab === 'disambiguate' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                Select Closely Allied Raga Pair to Disambiguate:
              </span>

              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'mohanam vs shivaranjani', label: 'Mohanam vs Shivaranjani' },
                  { key: 'kalyani vs yamuna kalyani', label: 'Kalyani vs Yamuna Kalyani' },
                  { key: 'gambheera nattai vs hamsadhwani', label: 'Gambheera Nattai vs Hamsadhwani' },
                  { key: 'keeravani vs simhendramadhyamam', label: 'Keeravani vs Simhendramadhyamam' },
                  { key: 'bilahari vs shankarabharanam', label: 'Bilahari vs Shankarabharanam' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setDisambigPair(item.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      disambigPair === item.key
                        ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Explanation Card */}
              {disambigPair && (
                <div className="p-4 rounded-2xl bg-stone-800/80 border border-amber-500/40 space-y-2">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                    Microtonal & Sanchara Differentiation:
                  </span>
                  <p className="text-sm text-stone-200 leading-relaxed">
                    {disambiguateRagaRule(disambigPair.split(' vs ')[0], disambigPair.split(' vs ')[1])}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
