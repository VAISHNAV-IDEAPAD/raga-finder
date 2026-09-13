'use client';

import React, { useState } from 'react';
import { Volume2, RotateCcw, Sparkles, Play } from 'lucide-react';
import { playSingleSwara, playSwaraSequence } from '@/lib/audioSynth';

interface SwaraKeyboardProps {
  selectedSwaras: string[];
  onChange: (swaras: string[]) => void;
  onSearch: () => void;
  isLoading: boolean;
}

const CARNATIC_GROUPS = [
  { name: 'Shadjam', swaras: [{ symbol: 'S', label: 'Shadjam (Sa)' }] },
  {
    name: 'Rishabham',
    swaras: [
      { symbol: 'R1', label: 'Shuddha Ri' },
      { symbol: 'R2', label: 'Chatushruti Ri' },
      { symbol: 'R3', label: 'Shatshruti Ri' },
    ],
  },
  {
    name: 'Gandharam',
    swaras: [
      { symbol: 'G1', label: 'Shuddha Ga' },
      { symbol: 'G2', label: 'Sadharana Ga' },
      { symbol: 'G3', label: 'Antara Ga' },
    ],
  },
  {
    name: 'Madhyamam',
    swaras: [
      { symbol: 'M1', label: 'Shuddha Ma' },
      { symbol: 'M2', label: 'Prati Ma' },
    ],
  },
  { name: 'Panchamam', swaras: [{ symbol: 'P', label: 'Panchamam (Pa)' }] },
  {
    name: 'Dhaivatham',
    swaras: [
      { symbol: 'D1', label: 'Shuddha Dha' },
      { symbol: 'D2', label: 'Chatushruti Dha' },
      { symbol: 'D3', label: 'Shatshruti Dha' },
    ],
  },
  {
    name: 'Nishadham',
    swaras: [
      { symbol: 'N1', label: 'Shuddha Ni' },
      { symbol: 'N2', label: 'Kaisiki Ni' },
      { symbol: 'N3', label: 'Kakali Ni' },
    ],
  },
];

const PRESETS = [
  { name: 'Mayamalavagowla', swaras: ['S', 'R1', 'G3', 'M1', 'P', 'D1', 'N3'] },
  { name: 'Mohanam / Bhoopali', swaras: ['S', 'R2', 'G3', 'P', 'D2'] },
  { name: 'Kalyani / Yaman', swaras: ['S', 'R2', 'G3', 'M2', 'P', 'D2', 'N3'] },
  { name: 'Kharaharapriya / Kafi', swaras: ['S', 'R2', 'G2', 'M1', 'P', 'D2', 'N2'] },
  { name: 'Keeravani / Kirwani', swaras: ['S', 'R2', 'G2', 'M1', 'P', 'D1', 'N3'] },
  { name: 'Hanumatodi / Bhairavi', swaras: ['S', 'R1', 'G2', 'M1', 'P', 'D1', 'N2'] },
  { name: 'Hamsadhwani', swaras: ['S', 'R2', 'G3', 'P', 'N3'] },
  { name: 'Hindolam / Malkauns', swaras: ['S', 'G2', 'M1', 'D1', 'N2'] },
  { name: 'Charukesi', swaras: ['S', 'R2', 'G3', 'M1', 'P', 'D1', 'N2'] },
];

export default function SwaraKeyboard({
  selectedSwaras,
  onChange,
  onSearch,
  isLoading,
}: SwaraKeyboardProps) {
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);

  const toggleSwara = (swara: string) => {
    playSingleSwara(swara, 0.45);
    if (selectedSwaras.includes(swara)) {
      onChange(selectedSwaras.filter((s) => s !== swara));
    } else {
      onChange([...selectedSwaras, swara]);
    }
  };

  const handlePlaySequence = async () => {
    if (selectedSwaras.length === 0 || isPlayingSeq) return;
    setIsPlayingSeq(true);
    await playSwaraSequence(selectedSwaras, 0.5);
    setIsPlayingSeq(false);
  };

  const handleClear = () => {
    onChange(['S']); // Keep Sa as root
  };

  const applyPreset = (presetSwaras: string[]) => {
    onChange(presetSwaras);
    playSwaraSequence(presetSwaras.slice(0, 4), 0.35);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Current Selection Display */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Selected Swara Pool:
            </span>
            <span className="text-xs text-stone-500">
              ({selectedSwaras.length} notes selected)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlaySequence}
              disabled={selectedSwaras.length === 0 || isPlayingSeq}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingSeq ? 'Playing...' : 'Audition Notes'}</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-1 text-xs font-medium rounded-lg text-stone-600 hover:bg-stone-200/60 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Selected Swara Pills */}
        <div className="flex flex-wrap gap-2 min-h-[44px] items-center p-2 rounded-xl bg-white/70 border border-amber-100">
          {selectedSwaras.length === 0 ? (
            <span className="text-xs text-stone-400 italic">
              Click the swara keys below or select a preset to begin...
            </span>
          ) : (
            selectedSwaras.map((swara) => (
              <span
                key={swara}
                onClick={() => toggleSwara(swara)}
                className="cursor-pointer inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-raga-500 text-white font-bold text-sm shadow-sm hover:bg-raga-600 transition-all hover:scale-105"
                title="Click to remove or play"
              >
                {swara}
                <span className="text-[10px] opacity-75">×</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Interactive Swara Key Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {CARNATIC_GROUPS.map((group) => (
          <div
            key={group.name}
            className="p-2.5 rounded-xl bg-white border border-stone-200/80 shadow-sm flex flex-col justify-between"
          >
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2 block text-center">
              {group.name}
            </span>
            <div className="space-y-1.5 flex-1 flex flex-col justify-end">
              {group.swaras.map((item) => {
                const isSelected = selectedSwaras.includes(item.symbol);
                return (
                  <button
                    key={item.symbol}
                    type="button"
                    onClick={() => toggleSwara(item.symbol)}
                    className={`w-full py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-gradient-to-r from-raga-500 to-amber-600 text-white shadow-md ring-2 ring-raga-400 ring-offset-1 scale-[1.02]'
                        : 'bg-stone-50 hover:bg-amber-100/70 text-stone-800 border border-stone-200 hover:border-amber-300'
                    }`}
                  >
                    <span className="text-sm font-extrabold">{item.symbol}</span>
                    <span className="text-[9px] font-medium opacity-80 truncate max-w-full">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Presets */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
            Quick Raga Scales to Try:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p.swaras)}
              className="px-2.5 py-1 text-xs rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSearch}
          disabled={selectedSwaras.length < 3 || isLoading}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-raga-600 via-amber-600 to-raga-700 hover:from-raga-700 hover:to-amber-800 text-white font-bold text-base shadow-lg shadow-raga-500/25 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Swaras with Musicology Engine...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Find Raga with OpenAI & Taught Rules</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
