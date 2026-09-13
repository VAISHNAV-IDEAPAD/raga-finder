'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, Music, ArrowRight, Volume2 } from 'lucide-react';
import { playSwaraSequence } from '@/lib/audioSynth';

const CHAKRAS = [
  { no: 1, name: 'Indu (Moon)', m: 'M1', ragas: [
    { no: 1, name: 'Kanakangi', swaras: 'S R1 G1 M1 P D1 N1 S\'' },
    { no: 2, name: 'Ratnangi', swaras: 'S R1 G1 M1 P D1 N2 S\'' },
    { no: 3, name: 'Ganamurti', swaras: 'S R1 G1 M1 P D1 N3 S\'' },
    { no: 4, name: 'Vanaspati', swaras: 'S R1 G1 M1 P D2 N2 S\'' },
    { no: 5, name: 'Manavati', swaras: 'S R1 G1 M1 P D2 N3 S\'' },
    { no: 6, name: 'Tanarupi', swaras: 'S R1 G1 M1 P D3 N3 S\'' },
  ]},
  { no: 2, name: 'Netra (Eyes)', m: 'M1', ragas: [
    { no: 7, name: 'Senavati', swaras: 'S R1 G2 M1 P D1 N1 S\'' },
    { no: 8, name: 'Hanumatodi', swaras: 'S R1 G2 M1 P D1 N2 S\'' },
    { no: 9, name: 'Dhenuka', swaras: 'S R1 G2 M1 P D1 N3 S\'' },
    { no: 10, name: 'Natakapriya', swaras: 'S R1 G2 M1 P D2 N2 S\'' },
    { no: 11, name: 'Kokilapriya', swaras: 'S R1 G2 M1 P D2 N3 S\'' },
    { no: 12, name: 'Rupavati', swaras: 'S R1 G2 M1 P D3 N3 S\'' },
  ]},
  { no: 3, name: 'Agni (Fire)', m: 'M1', ragas: [
    { no: 13, name: 'Gayakapriya', swaras: 'S R1 G3 M1 P D1 N1 S\'' },
    { no: 14, name: 'Vakulabharanam', swaras: 'S R1 G3 M1 P D1 N2 S\'' },
    { no: 15, name: 'Mayamalavagowla', swaras: 'S R1 G3 M1 P D1 N3 S\'' },
    { no: 16, name: 'Chakravakam', swaras: 'S R1 G3 M1 P D2 N2 S\'' },
    { no: 17, name: 'Suryakantam', swaras: 'S R1 G3 M1 P D2 N3 S\'' },
    { no: 18, name: 'Hatakambari', swaras: 'S R1 G3 M1 P D3 N3 S\'' },
  ]},
  { no: 4, name: 'Veda (Scriptures)', m: 'M1', ragas: [
    { no: 19, name: 'Jhankaradhwani', swaras: 'S R2 G2 M1 P D1 N1 S\'' },
    { no: 20, name: 'Natabhairavi', swaras: 'S R2 G2 M1 P D1 N2 S\'' },
    { no: 21, name: 'Keeravani', swaras: 'S R2 G2 M1 P D1 N3 S\'' },
    { no: 22, name: 'Kharaharapriya', swaras: 'S R2 G2 M1 P D2 N2 S\'' },
    { no: 23, name: 'Gourimanohari', swaras: 'S R2 G2 M1 P D2 N3 S\'' },
    { no: 24, name: 'Varunapriya', swaras: 'S R2 G2 M1 P D3 N3 S\'' },
  ]},
  { no: 5, name: 'Bana (Arrows)', m: 'M1', ragas: [
    { no: 25, name: 'Mararanjani', swaras: 'S R2 G3 M1 P D1 N1 S\'' },
    { no: 26, name: 'Charukesi', swaras: 'S R2 G3 M1 P D1 N2 S\'' },
    { no: 27, name: 'Sarasangi', swaras: 'S R2 G3 M1 P D1 N3 S\'' },
    { no: 28, name: 'Harikambhoji', swaras: 'S R2 G3 M1 P D2 N2 S\'' },
    { no: 29, name: 'Dheerasankarabharanam', swaras: 'S R2 G3 M1 P D2 N3 S\'' },
    { no: 30, name: 'Naganandini', swaras: 'S R2 G3 M1 P D3 N3 S\'' },
  ]},
  { no: 6, name: 'Ritu (Seasons)', m: 'M1', ragas: [
    { no: 31, name: 'Yagapriya', swaras: 'S R3 G3 M1 P D1 N1 S\'' },
    { no: 32, name: 'Ragavardhini', swaras: 'S R3 G3 M1 P D1 N2 S\'' },
    { no: 33, name: 'Gangeyabhushani', swaras: 'S R3 G3 M1 P D1 N3 S\'' },
    { no: 34, name: 'Vagadheeswari', swaras: 'S R3 G3 M1 P D2 N2 S\'' },
    { no: 35, name: 'Sulini', swaras: 'S R3 G3 M1 P D2 N3 S\'' },
    { no: 36, name: 'Chalanata', swaras: 'S R3 G3 M1 P D3 N3 S\'' },
  ]},
  { no: 7, name: 'Rishi (Sages)', m: 'M2', ragas: [
    { no: 37, name: 'Salagam', swaras: 'S R1 G1 M2 P D1 N1 S\'' },
    { no: 38, name: 'Jalarnavam', swaras: 'S R1 G1 M2 P D1 N2 S\'' },
    { no: 39, name: 'Jhalavarali', swaras: 'S R1 G1 M2 P D1 N3 S\'' },
    { no: 40, name: 'Navaneetam', swaras: 'S R1 G1 M2 P D2 N2 S\'' },
    { no: 41, name: 'Pavani', swaras: 'S R1 G1 M2 P D2 N3 S\'' },
    { no: 42, name: 'Raghupriya', swaras: 'S R1 G1 M2 P D3 N3 S\'' },
  ]},
  { no: 8, name: 'Vasu (Gods)', m: 'M2', ragas: [
    { no: 43, name: 'Gavambodhi', swaras: 'S R1 G2 M2 P D1 N1 S\'' },
    { no: 44, name: 'Bhavapriya', swaras: 'S R1 G2 M2 P D1 N2 S\'' },
    { no: 45, name: 'Subhapantuvarali', swaras: 'S R1 G2 M2 P D1 N3 S\'' },
    { no: 46, name: 'Shadvidhamargini', swaras: 'S R1 G2 M2 P D2 N2 S\'' },
    { no: 47, name: 'Suvarnangi', swaras: 'S R1 G2 M2 P D2 N3 S\'' },
    { no: 48, name: 'Divyamani', swaras: 'S R1 G2 M2 P D3 N3 S\'' },
  ]},
  { no: 9, name: 'Brahma', m: 'M2', ragas: [
    { no: 49, name: 'Dhavalambari', swaras: 'S R1 G3 M2 P D1 N1 S\'' },
    { no: 50, name: 'Namanarayani', swaras: 'S R1 G3 M2 P D1 N2 S\'' },
    { no: 51, name: 'Kamavardhini (Pantuvarali)', swaras: 'S R1 G3 M2 P D1 N3 S\'' },
    { no: 52, name: 'Ramapriya', swaras: 'S R1 G3 M2 P D2 N2 S\'' },
    { no: 53, name: 'Gamanashrama', swaras: 'S R1 G3 M2 P D2 N3 S\'' },
    { no: 54, name: 'Viswambhari', swaras: 'S R1 G3 M2 P D3 N3 S\'' },
  ]},
  { no: 10, name: 'Disi (Directions)', m: 'M2', ragas: [
    { no: 55, name: 'Syamalangi', swaras: 'S R2 G2 M2 P D1 N1 S\'' },
    { no: 56, name: 'Shanmukhapriya', swaras: 'S R2 G2 M2 P D1 N2 S\'' },
    { no: 57, name: 'Simhendramadhyamam', swaras: 'S R2 G2 M2 P D1 N3 S\'' },
    { no: 58, name: 'Hemavati', swaras: 'S R2 G2 M2 P D2 N2 S\'' },
    { no: 59, name: 'Dharmavati', swaras: 'S R2 G2 M2 P D2 N3 S\'' },
    { no: 60, name: 'Neetimati', swaras: 'S R2 G2 M2 P D3 N3 S\'' },
  ]},
  { no: 11, name: 'Rudra', m: 'M2', ragas: [
    { no: 61, name: 'Kantamani', swaras: 'S R2 G3 M2 P D1 N1 S\'' },
    { no: 62, name: 'Rishabhapriya', swaras: 'S R2 G3 M2 P D1 N2 S\'' },
    { no: 63, name: 'Latangi', swaras: 'S R2 G3 M2 P D1 N3 S\'' },
    { no: 64, name: 'Vachaspati', swaras: 'S R2 G3 M2 P D2 N2 S\'' },
    { no: 65, name: 'Mechakalyani', swaras: 'S R2 G3 M2 P D2 N3 S\'' },
    { no: 66, name: 'Chitrambari', swaras: 'S R2 G3 M2 P D3 N3 S\'' },
  ]},
  { no: 12, name: 'Aditya (Suns)', m: 'M2', ragas: [
    { no: 67, name: 'Sucharitra', swaras: 'S R3 G3 M2 P D1 N1 S\'' },
    { no: 68, name: 'Jyotiswarupini', swaras: 'S R3 G3 M2 P D1 N2 S\'' },
    { no: 69, name: 'Dhatuvardhani', swaras: 'S R3 G3 M2 P D1 N3 S\'' },
    { no: 70, name: 'Nasikabhushani', swaras: 'S R3 G3 M2 P D2 N2 S\'' },
    { no: 71, name: 'Kosalam', swaras: 'S R3 G3 M2 P D2 N3 S\'' },
    { no: 72, name: 'Rasikapriya', swaras: 'S R3 G3 M2 P D3 N3 S\'' },
  ]},
];

export default function MelakartaPage() {
  const [search, setSearch] = useState('');
  const [playingRagaNo, setPlayingRagaNo] = useState<number | null>(null);

  const handlePlayScale = async (swarasStr: string, ragaNo: number) => {
    if (playingRagaNo !== null) return;
    const notes = swarasStr.split(' ').filter(Boolean);
    setPlayingRagaNo(ragaNo);
    await playSwaraSequence(notes, 0.4);
    setPlayingRagaNo(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>72 Melakarta Katapayadi System</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-stone-900">
          The 72 Janaka (Parent) Ragas of Carnatic Music
        </h1>
        <p className="mt-3 text-sm text-stone-600 leading-relaxed">
          Structured into 12 Chakras of 6 ragas each. Chakras 1-6 use Shuddha Madhyamam (M1) and
          Chakras 7-12 use Prati Madhyamam (M2).
        </p>

        {/* Search */}
        <div className="mt-6 relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search melakarta by name or number (e.g. Kalyani, 15, 29)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-sm"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Chakras Grid */}
      <div className="space-y-8">
        {CHAKRAS.map((chakra) => {
          const filteredRagas = chakra.ragas.filter(
            (r) =>
              r.name.toLowerCase().includes(search.toLowerCase()) ||
              r.no.toString() === search.trim() ||
              chakra.name.toLowerCase().includes(search.toLowerCase())
          );

          if (search && filteredRagas.length === 0) return null;

          return (
            <div
              key={chakra.no}
              className="rounded-3xl glass-panel border border-amber-200/80 p-6 shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-200/60 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 font-bold text-sm flex items-center justify-center">
                    {chakra.no}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">
                      Chakra {chakra.no}: {chakra.name}
                    </h2>
                    <span className="text-xs text-stone-500 font-mono">
                      Madhyamam: {chakra.m} ({chakra.m === 'M1' ? 'Shuddha' : 'Prati'})
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredRagas.map((raga) => (
                  <div
                    key={raga.no}
                    className="p-3.5 rounded-xl bg-white border border-stone-200 hover:border-amber-300 transition-all shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-700">
                          #{raga.no}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePlayScale(raga.swaras, raga.no)}
                          disabled={playingRagaNo !== null}
                          className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 flex items-center gap-1"
                        >
                          <Volume2 className="w-3 h-3 text-amber-600" />
                          <span>{playingRagaNo === raga.no ? 'Playing...' : 'Play'}</span>
                        </button>
                      </div>
                      <h3 className="text-sm font-bold text-stone-900 mt-1">{raga.name}</h3>
                      <div className="text-[11px] font-mono text-stone-600 mt-1 bg-stone-50 p-1.5 rounded border border-stone-100">
                        {raga.swaras}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Link
                        href={`/?swaras=${encodeURIComponent(raga.swaras)}`}
                        className="text-[11px] text-raga-600 hover:text-raga-700 font-bold inline-flex items-center gap-0.5"
                      >
                        <span>Find details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
