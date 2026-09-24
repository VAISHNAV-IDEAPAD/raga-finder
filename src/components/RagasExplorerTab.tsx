'use client';

import React, { useState, useEffect } from 'react';
import {
  Music,
  Search,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  BookOpen,
  Filter,
  Table,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { playSwaraSequence } from '@/lib/audioSynth';
import seedRagas from '@/data/seed_ragas.json';
import AuthenticJanyaRagaTable from '@/components/AuthenticJanyaRagaTable';

// Complete 72 Melakarta Chakras definition
const CHAKRAS = [
  { no: 1, name: 'Indu (Moon)', m: 'M1', ragas: [
    { no: 1, name: 'Kanakangi', swaras: "S R1 G1 M1 P D1 N1 S'" },
    { no: 2, name: 'Ratnangi', swaras: "S R1 G1 M1 P D1 N2 S'" },
    { no: 3, name: 'Ganamurti', swaras: "S R1 G1 M1 P D1 N3 S'" },
    { no: 4, name: 'Vanaspati', swaras: "S R1 G1 M1 P D2 N2 S'" },
    { no: 5, name: 'Manavati', swaras: "S R1 G1 M1 P D2 N3 S'" },
    { no: 6, name: 'Tanarupi', swaras: "S R1 G1 M1 P D3 N3 S'" },
  ]},
  { no: 2, name: 'Netra (Eyes)', m: 'M1', ragas: [
    { no: 7, name: 'Senavati', swaras: "S R1 G2 M1 P D1 N1 S'" },
    { no: 8, name: 'Hanumatodi', swaras: "S R1 G2 M1 P D1 N2 S'" },
    { no: 9, name: 'Dhenuka', swaras: "S R1 G2 M1 P D1 N3 S'" },
    { no: 10, name: 'Natakapriya', swaras: "S R1 G2 M1 P D2 N2 S'" },
    { no: 11, name: 'Kokilapriya', swaras: "S R1 G2 M1 P D2 N3 S'" },
    { no: 12, name: 'Rupavati', swaras: "S R1 G2 M1 P D3 N3 S'" },
  ]},
  { no: 3, name: 'Agni (Fire)', m: 'M1', ragas: [
    { no: 13, name: 'Gayakapriya', swaras: "S R1 G3 M1 P D1 N1 S'" },
    { no: 14, name: 'Vakulabharanam', swaras: "S R1 G3 M1 P D1 N2 S'" },
    { no: 15, name: 'Mayamalavagowla', swaras: "S R1 G3 M1 P D1 N3 S'" },
    { no: 16, name: 'Chakravakam', swaras: "S R1 G3 M1 P D2 N2 S'" },
    { no: 17, name: 'Suryakantam', swaras: "S R1 G3 M1 P D2 N3 S'" },
    { no: 18, name: 'Hatakambari', swaras: "S R1 G3 M1 P D3 N3 S'" },
  ]},
  { no: 4, name: 'Veda (Scriptures)', m: 'M1', ragas: [
    { no: 19, name: 'Jhankaradhwani', swaras: "S R2 G2 M1 P D1 N1 S'" },
    { no: 20, name: 'Natabhairavi', swaras: "S R2 G2 M1 P D1 N2 S'" },
    { no: 21, name: 'Keeravani', swaras: "S R2 G2 M1 P D1 N3 S'" },
    { no: 22, name: 'Kharaharapriya', swaras: "S R2 G2 M1 P D2 N2 S'" },
    { no: 23, name: 'Gourimanohari', swaras: "S R2 G2 M1 P D2 N3 S'" },
    { no: 24, name: 'Varunapriya', swaras: "S R2 G2 M1 P D3 N3 S'" },
  ]},
  { no: 5, name: 'Bana (Arrows)', m: 'M1', ragas: [
    { no: 25, name: 'Mararanjani', swaras: "S R2 G3 M1 P D1 N1 S'" },
    { no: 26, name: 'Charukesi', swaras: "S R2 G3 M1 P D1 N2 S'" },
    { no: 27, name: 'Sarasangi', swaras: "S R2 G3 M1 P D1 N3 S'" },
    { no: 28, name: 'Harikambhoji', swaras: "S R2 G3 M1 P D2 N2 S'" },
    { no: 29, name: 'Dheerasankarabharanam', swaras: "S R2 G3 M1 P D2 N3 S'" },
    { no: 30, name: 'Naganandini', swaras: "S R2 G3 M1 P D3 N3 S'" },
  ]},
  { no: 6, name: 'Ritu (Seasons)', m: 'M1', ragas: [
    { no: 31, name: 'Yagapriya', swaras: "S R3 G3 M1 P D1 N1 S'" },
    { no: 32, name: 'Ragavardhini', swaras: "S R3 G3 M1 P D1 N2 S'" },
    { no: 33, name: 'Gangeyabhushani', swaras: "S R3 G3 M1 P D1 N3 S'" },
    { no: 34, name: 'Vagadheeswari', swaras: "S R3 G3 M1 P D2 N2 S'" },
    { no: 35, name: 'Sulini', swaras: "S R3 G3 M1 P D2 N3 S'" },
    { no: 36, name: 'Chalanata', swaras: "S R3 G3 M1 P D3 N3 S'" },
  ]},
  { no: 7, name: 'Rishi (Sages)', m: 'M2', ragas: [
    { no: 37, name: 'Salagam', swaras: "S R1 G1 M2 P D1 N1 S'" },
    { no: 38, name: 'Jalarnavam', swaras: "S R1 G1 M2 P D1 N2 S'" },
    { no: 39, name: 'Jhalavarali', swaras: "S R1 G1 M2 P D1 N3 S'" },
    { no: 40, name: 'Navaneetam', swaras: "S R1 G1 M2 P D2 N2 S'" },
    { no: 41, name: 'Pavani', swaras: "S R1 G1 M2 P D2 N3 S'" },
    { no: 42, name: 'Raghupriya', swaras: "S R1 G1 M2 P D3 N3 S'" },
  ]},
  { no: 8, name: 'Vasu (Gods)', m: 'M2', ragas: [
    { no: 43, name: 'Gavambodhi', swaras: "S R1 G2 M2 P D1 N1 S'" },
    { no: 44, name: 'Bhavapriya', swaras: "S R1 G2 M2 P D1 N2 S'" },
    { no: 45, name: 'Subhapantuvarali', swaras: "S R1 G2 M2 P D1 N3 S'" },
    { no: 46, name: 'Shadvidhamargini', swaras: "S R1 G2 M2 P D2 N2 S'" },
    { no: 47, name: 'Suvarnangi', swaras: "S R1 G2 M2 P D2 N3 S'" },
    { no: 48, name: 'Divyamani', swaras: "S R1 G2 M2 P D3 N3 S'" },
  ]},
  { no: 9, name: 'Brahma', m: 'M2', ragas: [
    { no: 49, name: 'Dhavalambari', swaras: "S R1 G3 M2 P D1 N1 S'" },
    { no: 50, name: 'Namanarayani', swaras: "S R1 G3 M2 P D1 N2 S'" },
    { no: 51, name: 'Kamavardhini (Pantuvarali)', swaras: "S R1 G3 M2 P D1 N3 S'" },
    { no: 52, name: 'Ramapriya', swaras: "S R1 G3 M2 P D2 N2 S'" },
    { no: 53, name: 'Gamanashrama', swaras: "S R1 G3 M2 P D2 N3 S'" },
    { no: 54, name: 'Viswambhari', swaras: "S R1 G3 M2 P D3 N3 S'" },
  ]},
  { no: 10, name: 'Disi (Directions)', m: 'M2', ragas: [
    { no: 55, name: 'Syamalangi', swaras: "S R2 G2 M2 P D1 N1 S'" },
    { no: 56, name: 'Shanmukhapriya', swaras: "S R2 G2 M2 P D1 N2 S'" },
    { no: 57, name: 'Simhendramadhyamam', swaras: "S R2 G2 M2 P D1 N3 S'" },
    { no: 58, name: 'Hemavati', swaras: "S R2 G2 M2 P D2 N2 S'" },
    { no: 59, name: 'Dharmavati', swaras: "S R2 G2 M2 P D2 N3 S'" },
    { no: 60, name: 'Neetimati', swaras: "S R2 G2 M2 P D3 N3 S'" },
  ]},
  { no: 11, name: 'Rudra', m: 'M2', ragas: [
    { no: 61, name: 'Kantamani', swaras: "S R2 G3 M2 P D1 N1 S'" },
    { no: 62, name: 'Rishabhapriya', swaras: "S R2 G3 M2 P D1 N2 S'" },
    { no: 63, name: 'Latangi', swaras: "S R2 G3 M2 P D1 N3 S'" },
    { no: 64, name: 'Vachaspati', swaras: "S R2 G3 M2 P D2 N2 S'" },
    { no: 65, name: 'Mechakalyani', swaras: "S R2 G3 M2 P D2 N3 S'" },
    { no: 66, name: 'Chitrambari', swaras: "S R2 G3 M2 P D3 N3 S'" },
  ]},
  { no: 12, name: 'Aditya (Suns)', m: 'M2', ragas: [
    { no: 67, name: 'Sucharitra', swaras: "S R3 G3 M2 P D1 N1 S'" },
    { no: 68, name: 'Jyotiswarupini', swaras: "S R3 G3 M2 P D1 N2 S'" },
    { no: 69, name: 'Dhatuvardhani', swaras: "S R3 G3 M2 P D1 N3 S'" },
    { no: 70, name: 'Nasikabhushani', swaras: "S R3 G3 M2 P D2 N2 S'" },
    { no: 71, name: 'Kosalam', swaras: "S R3 G3 M2 P D2 N3 S'" },
    { no: 72, name: 'Rasikapriya', swaras: "S R3 G3 M2 P D3 N3 S'" },
  ]},
];

interface RagasExplorerTabProps {
  onSelectRagaInFinder: (swaras: string[], ragaName?: string) => void;
}

export default function RagasExplorerTab({ onSelectRagaInFinder }: RagasExplorerTabProps) {
  const [viewMode, setViewMode] = useState<'janya' | 'melakarta' | 'popular' | 'all'>('janya');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChakra, setSelectedChakra] = useState<number | null>(null);
  const [playingRagaId, setPlayingRagaId] = useState<string | null>(null);

  // Sync sub-tab from URL if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sub = params.get('sub');
      if (sub === 'melakarta' || sub === 'popular' || sub === 'all' || sub === 'janya') {
        setViewMode(sub);
      }
    }
  }, []);

  const handleSwitchSubTab = (mode: 'janya' | 'melakarta' | 'popular' | 'all') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'ragas');
      if (mode === 'janya') {
        url.searchParams.delete('sub');
      } else {
        url.searchParams.set('sub', mode);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Flatten Melakartas for search
  const flatMelakartas = React.useMemo(() => {
    const list: Array<{
      no: number;
      name: string;
      swaras: string;
      chakraNo: number;
      chakraName: string;
      madhyama: string;
    }> = [];

    CHAKRAS.forEach((c) => {
      c.ragas.forEach((r) => {
        list.push({
          no: r.no,
          name: r.name,
          swaras: r.swaras,
          chakraNo: c.no,
          chakraName: c.name,
          madhyama: c.m,
        });
      });
    });
    return list;
  }, []);

  const handlePlayNotes = async (id: string, notesString: string) => {
    if (playingRagaId === id) return;
    setPlayingRagaId(id);
    const notesArray = notesString.trim().split(/\s+/);
    await playSwaraSequence(notesArray, 0.45);
    setPlayingRagaId(null);
  };

  const cleanSwarasForFinder = (notesStr: string): string[] => {
    return notesStr
      .replace(/'/g, '')
      .split(/\s+/)
      .filter((s) => s.length > 0 && s !== 'S');
  };

  // Filtered lists for Melakartas
  const filteredMelakartas = flatMelakartas.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.swaras.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.no.toString() === searchQuery.trim();
    const matchesChakra = selectedChakra ? r.chakraNo === selectedChakra : true;
    return matchesSearch && matchesChakra;
  });

  const filteredPopular = (seedRagas as any[]).filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.arohana && r.arohana.toLowerCase().includes(q)) ||
      (r.thaat && r.thaat.toLowerCase().includes(q)) ||
      (r.parentRaga && r.parentRaga.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto px-3 sm:px-6">
      {/* Top Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
          <Music className="w-3.5 h-3.5 text-amber-700" />
          <span>Carnatic & Hindustani Musicological Library</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
          Explore Classical <span className="text-raga-600">Ragas &amp; Scales</span>
        </h2>
        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto">
          Discover the complete 908 authentic Janya ragas, 72 Melakarta parent ragas, arohana-avarohana scales, and audition live swaras with built-in audio synthesis.
        </p>
      </div>

      {/* Primary Sub-View Navigation Switcher */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1 bg-stone-100/90 p-1.5 rounded-2xl border border-stone-200/80 shadow-xs max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => handleSwitchSubTab('janya')}
            className={`px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 ${
              viewMode === 'janya'
                ? 'bg-amber-600 text-white shadow-sm font-black'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Authentic Janya Table</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                viewMode === 'janya' ? 'bg-amber-700 text-amber-100' : 'bg-stone-200 text-stone-700'
              }`}
            >
              908
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchSubTab('melakarta')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              viewMode === 'melakarta'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-300'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>72 Melakartas</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchSubTab('popular')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              viewMode === 'popular'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-300'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-raga-500" />
            <span>Popular &amp; Seed</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchSubTab('all')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
              viewMode === 'all'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-300'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <span>All Overview</span>
          </button>
        </div>
      </div>

      {/* 1. AUTHENTIC JANYA RAGAS TABLE VIEW */}
      {viewMode === 'janya' && (
        <AuthenticJanyaRagaTable onSelectRagaInFinder={onSelectRagaInFinder} />
      )}

      {/* 2. OVERVIEW MODE: Highlights Janya Table + Featured items */}
      {viewMode === 'all' && (
        <div className="space-y-8">
          {/* Spotlight banner for the Authentic Janya Table */}
          <div className="rounded-3xl glass-panel p-6 border border-amber-300 shadow-md bg-gradient-to-r from-amber-50 via-orange-50/50 to-white flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-600 text-white">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Classical Archive</span>
                </span>
                <span className="text-xs text-stone-500 font-semibold">908 Carnatic Janya Ragas</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900">
                Explore the Complete Authentic Janya Table
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-2xl">
                Every known Janya raga mapped to its Melakarta parent across 12 Chakras, featuring Bhashanga swaras, Vakra scales, live audio synth, and search.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSwitchSubTab('janya')}
              className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-amber-600 to-raga-600 hover:from-amber-700 hover:to-raga-700 shadow-md shadow-amber-600/20 transition-all flex items-center gap-2 shrink-0"
            >
              <Table className="w-4 h-4" />
              <span>Open Janya Table (908)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Preview of Janya Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Table className="w-4 h-4 text-amber-600" />
                <span>Authentic Janya Ragas Preview</span>
              </h3>
              <button
                type="button"
                onClick={() => handleSwitchSubTab('janya')}
                className="text-xs font-bold text-raga-600 hover:text-raga-800 flex items-center gap-1"
              >
                <span>View all 908 ragas</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <AuthenticJanyaRagaTable onSelectRagaInFinder={onSelectRagaInFinder} />
          </div>
        </div>
      )}

      {/* 3. 72 MELAKARTAS & POPULAR VIEWS */}
      {(viewMode === 'melakarta' || viewMode === 'popular') && (
        <div className="space-y-6">
          {/* Search & Chakra Control Bar for Melakartas & Popular */}
          <div className="p-4 sm:p-5 rounded-3xl glass-panel shadow-sm border border-amber-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="font-bold text-sm text-stone-800 flex items-center gap-2">
                {viewMode === 'melakarta' ? (
                  <>
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    <span>72 Melakarta Scheme (Janaka Parent Ragas)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-raga-500" />
                    <span>Prominent Carnatic &amp; Hindustani Ragas</span>
                  </>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search by raga name or swaras (e.g. Kalyani, G3)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-inner"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Melakarta Chakra Filter Pills */}
            {viewMode === 'melakarta' && (
              <div className="pt-2 border-t border-amber-100 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-stone-500 font-semibold shrink-0 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-amber-600" />
                  <span>Chakra:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedChakra(null)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                    selectedChakra === null
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  All 12 Chakras
                </button>
                {CHAKRAS.map((c) => (
                  <button
                    key={c.no}
                    type="button"
                    onClick={() => setSelectedChakra(c.no === selectedChakra ? null : c.no)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                      selectedChakra === c.no
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {c.no}. {c.name.split(' ')[0]} ({c.m})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Popular Ragas Grid */}
          {viewMode === 'popular' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPopular.map((r) => {
                  const isPlaying = playingRagaId === `pop-${r.id}`;
                  const swarasList = r.swaras || cleanSwarasForFinder(r.arohana || '');

                  return (
                    <div
                      key={r.id}
                      className="p-5 rounded-2xl glass-panel border border-amber-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-stone-900">
                                {r.name}
                              </h4>
                              {r.melakartaNumber && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                  Melakarta #{r.melakartaNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5">
                              {r.parentRaga || r.thaat ? `${r.parentRaga || ''} • Thaat: ${r.thaat || 'N/A'}` : r.tradition}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handlePlayNotes(`pop-${r.id}`, r.arohana || '')}
                            disabled={isPlaying}
                            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                              isPlaying
                                ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                            }`}
                            title="Audition Arohana Notes"
                          >
                            {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-700" />}
                            <span>{isPlaying ? 'Playing...' : 'Audition'}</span>
                          </button>
                        </div>

                        {/* Arohana / Avarohana */}
                        <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs space-y-1 font-mono">
                          <div className="flex items-center gap-2 text-stone-700">
                            <span className="font-bold text-stone-500 uppercase text-[10px]">Arohana:</span>
                            <span className="text-raga-600 font-semibold">{r.arohana}</span>
                          </div>
                          <div className="flex items-center gap-2 text-stone-700">
                            <span className="font-bold text-stone-500 uppercase text-[10px]">Avarohana:</span>
                            <span className="text-stone-800">{r.avarohana}</span>
                          </div>
                        </div>

                        {r.rasa && (
                          <p className="text-xs text-stone-600 mt-2 italic">
                            <span className="font-semibold text-stone-700">Mood / Rasa:</span> {r.rasa}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-amber-100 flex items-center justify-between">
                        <span className="text-[11px] text-stone-500 font-medium">
                          {r.timeOfDay || 'Classical Raga'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelectRagaInFinder(swarasList, r.name)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-raga-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors flex items-center gap-1"
                        >
                          <span>Load in Finder</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 72 Melakartas Grid */}
          {viewMode === 'melakarta' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredMelakartas.map((m) => {
                  const isPlaying = playingRagaId === `mela-${m.no}`;
                  const swarasArr = cleanSwarasForFinder(m.swaras);

                  return (
                    <div
                      key={m.no}
                      className="p-4 rounded-2xl glass-panel border border-amber-200/70 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-2.5"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-raga-500 to-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {m.no}
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-stone-900 leading-tight">
                                {m.name}
                              </h4>
                              <span className="text-[10px] text-stone-500">
                                Chakra {m.chakraNo}: {m.chakraName}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handlePlayNotes(`mela-${m.no}`, m.swaras)}
                            disabled={isPlaying}
                            className={`p-1.5 rounded-lg border text-xs transition-colors shrink-0 ${
                              isPlaying
                                ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                                : 'bg-stone-50 hover:bg-amber-100 text-stone-700 border-stone-200'
                            }`}
                            title="Audition Swaras"
                          >
                            {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-700" />}
                          </button>
                        </div>

                        <div className="mt-2 p-2 rounded-lg bg-stone-50 border border-stone-200 text-[11px] font-mono text-stone-700 truncate">
                          {m.swaras}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-stone-500">
                          {m.madhyama === 'M1' ? 'Shuddha M1' : 'Prati M2'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelectRagaInFinder(swarasArr, m.name)}
                          className="text-[11px] font-bold text-raga-600 hover:text-raga-700 hover:underline flex items-center gap-0.5"
                        >
                          <span>Find</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
