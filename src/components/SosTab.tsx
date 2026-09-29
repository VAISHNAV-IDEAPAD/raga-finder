'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LifeBuoy,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Music,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Sliders,
  BookOpen,
  Send,
  Zap,
  RotateCcw,
  Search,
} from 'lucide-react';
import { playSingleSwara, playSwaraSequence } from '@/lib/audioSynth';

interface ConfusionPair {
  id: string;
  raga1: {
    name: string;
    tradition: 'Carnatic' | 'Hindustani' | 'Both';
    scale: string;
    swaras: string[];
    details: string;
  };
  raga2: {
    name: string;
    tradition: 'Carnatic' | 'Hindustani' | 'Both';
    scale: string;
    swaras: string[];
    details: string;
  };
  criticalDifference: string;
  audioSwaras1: string[];
  audioSwaras2: string[];
}

const CONFUSION_PAIRS: ConfusionPair[] = [
  {
    id: 'mohanam-bhoopali',
    raga1: {
      name: 'Mohanam',
      tradition: 'Carnatic',
      scale: "S R2 G3 P D2 S' / S' D2 P G3 R2 S",
      swaras: ['S', 'R2', 'G3', 'P', 'D2'],
      details: 'Janya of 28th Melakarta Harikambhoji. Characterized by prominent gamakas (kampita) on G3 (Antara Gandharam) and D2 (Chatusruti Dhaivatham).',
    },
    raga2: {
      name: 'Bhoopali',
      tradition: 'Hindustani',
      scale: "Sa Re Ga Pa Dha Sa' / Sa' Dha Pa Ga Re Sa",
      swaras: ['Sa', 'Re', 'Ga', 'Pa', 'Dha'],
      details: 'Kalyan Thaat audav raga. Straight, gentle meend glide from Ga to Re and Dha to Pa. Vadi is Ga, Samvadi is Dha. Little to no oscillation.',
    },
    criticalDifference:
      'Gamakas & Phrasing: Mohanam leans heavily on oscillating G3 and D2 with Carnatic jarus, while Bhoopali emphasizes calm, glide (meend) rests on Ga and Dha without oscillation.',
    audioSwaras1: ['S', 'R2', 'G3', 'P', 'D2', "S'", 'D2', 'P', 'G3', 'R2', 'S'],
    audioSwaras2: ['S', 'R2', 'G3', 'P', 'D2', "S'", 'D2', 'P', 'G3', 'R2', 'S'],
  },
  {
    id: 'keeravani-simhendramadhyamam',
    raga1: {
      name: 'Keeravani (21st Melakarta)',
      tradition: 'Carnatic',
      scale: "S R2 G2 M1 P D1 N3 S'",
      swaras: ['S', 'R2', 'G2', 'M1', 'P', 'D1', 'N3'],
      details: 'Shuddha Madhyamam (M1). Evokes profound pathos, devotional longing, and tender melancholy. Western equivalent: Harmonic Minor scale.',
    },
    raga2: {
      name: 'Simhendramadhyamam (57th)',
      tradition: 'Carnatic',
      scale: "S R2 G2 M2 P D1 N3 S'",
      swaras: ['S', 'R2', 'G2', 'M2', 'P', 'D1', 'N3'],
      details: 'Prati Madhyamam (M2). The sharp Madhyama adds brilliant intensity, majesty, and meditative mystery compared to the softer Keeravani.',
    },
    criticalDifference:
      'The Madhyama is the decisive differentiator: Keeravani uses Shuddha Madhyamam (M1 - 4/3 ratio), while Simhendramadhyamam uses Prati Madhyamam (M2 - sharp 45/32 ratio).',
    audioSwaras1: ['S', 'R2', 'G2', 'M1', 'P', 'D1', 'N3', "S'"],
    audioSwaras2: ['S', 'R2', 'G2', 'M2', 'P', 'D1', 'N3', "S'"],
  },
  {
    id: 'kalyani-yaman',
    raga1: {
      name: 'Kalyani (Mechakalyani 65th)',
      tradition: 'Carnatic',
      scale: "S R2 G3 M2 P D2 N3 S' / S' N3 D2 P M2 G3 R2 S",
      swaras: ['S', 'R2', 'G3', 'M2', 'P', 'D2', 'N3'],
      details: 'Direct ascending and descending scale; frequent landing directly on Shadja (S) and Panchama (P). Rich with all-note gamakas.',
    },
    raga2: {
      name: 'Yaman (Kalyan)',
      tradition: 'Hindustani',
      scale: "'Ni Re Ga Ma(t) Dha Ni Sa' / Sa' Ni Dha Pa Ma(t) Ga Re Sa",
      swaras: ['Ni,', 'Re', 'Ga', 'Ma', 'Dha', 'Ni'],
      details: 'Varjit Sa and Pa in Ascent (aroha): typically begins from Mandra Nishad ("Ni Re Ga"), avoiding Sa. Pancham is skipped in ascent (Ni Re Ga Ma Dha Ni Sa).',
    },
    criticalDifference:
      'Arohana Treatment of Sa & Pa: Kalyani ascends straight through S and P; Yaman avoids Sa at the start of phrases and often jumps over Pa in ascent ("Ni-Re-Ga, Ma-Dha-Ni-Sa").',
    audioSwaras1: ['S', 'R2', 'G3', 'M2', 'P', 'D2', 'N3', "S'"],
    audioSwaras2: ['N,', 'R2', 'G3', 'M2', 'D2', 'N3', "S'", 'N3', 'D2', 'P', 'M2', 'G3', 'R2', 'S'],
  },
  {
    id: 'mayamalavagowla-bhairav',
    raga1: {
      name: 'Mayamalavagowla (15th)',
      tradition: 'Carnatic',
      scale: "S R1 G3 M1 P D1 N3 S'",
      swaras: ['S', 'R1', 'G3', 'M1', 'P', 'D1', 'N3'],
      details: 'Symmetrical tetrachords (S R1 G3 M1 & P D1 N3 S). Used as foundational raga for beginners. Oscillated R1 and D1.',
    },
    raga2: {
      name: 'Bhairav',
      tradition: 'Hindustani',
      scale: "Sa re Ga ma Pa dha Ni Sa'",
      swaras: ['Sa', 're', 'Ga', 'ma', 'Pa', 'dha', 'Ni'],
      details: 'Early dawn raga. Characteristic slow, wide, trembling oscillation (andolan) strictly on Komal Rishabh (re) and Komal Dhaivat (dha).',
    },
    criticalDifference:
      'Ornamentation Dynamics: In Bhairav, the andolan on re and dha is slow, solemn, and meditative; in Mayamalavagowla, the oscillations are standard Carnatic kampita gamakas.',
    audioSwaras1: ['S', 'R1', 'G3', 'M1', 'P', 'D1', 'N3', "S'"],
    audioSwaras2: ['S', 'R1', 'G3', 'M1', 'P', 'D1', 'N3', "S'"],
  },
  {
    id: 'hamsadhwani-mohanam',
    raga1: {
      name: 'Hamsadhwani',
      tradition: 'Both',
      scale: "S R2 G3 P N3 S' / S' N3 P G3 R2 S",
      swaras: ['S', 'R2', 'G3', 'P', 'N3'],
      details: 'Pentatonic scale omitting Ma and Dha. Features the sparkling Kakali Nishadam (N3). Extremely popular for opening compositions.',
    },
    raga2: {
      name: 'Mohanam',
      tradition: 'Carnatic',
      scale: "S R2 G3 P D2 S' / S' D2 P G3 R2 S",
      swaras: ['S', 'R2', 'G3', 'P', 'D2'],
      details: 'Pentatonic scale omitting Ma and Ni. Features the rich Chatusruti Dhaivatham (D2). Broad, regal, and comforting flavor.',
    },
    criticalDifference:
      '5th Swara Distinction: Hamsadhwani has N3 (Kakali Ni) with NO Dhaivatha; Mohanam has D2 (Chatusruti Dha) with NO Nishada.',
    audioSwaras1: ['S', 'R2', 'G3', 'P', 'N3', "S'", 'N3', 'P', 'G3', 'R2', 'S'],
    audioSwaras2: ['S', 'R2', 'G3', 'P', 'D2', "S'", 'D2', 'P', 'G3', 'R2', 'S'],
  },
  {
    id: 'charukesi-natabhairavi',
    raga1: {
      name: 'Charukesi (26th Melakarta)',
      tradition: 'Carnatic',
      scale: "S R2 G3 M1 P D1 N2 S'",
      swaras: ['S', 'R2', 'G3', 'M1', 'P', 'D1', 'N2'],
      details: 'Major lower tetrachord (S R2 G3 M1 - like Sankarabharanam) combined with minor upper tetrachord (P D1 N2 S - like Natabhairavi).',
    },
    raga2: {
      name: 'Natabhairavi (20th Melakarta)',
      tradition: 'Carnatic',
      scale: "S R2 G2 M1 P D1 N2 S'",
      swaras: ['S', 'R2', 'G2', 'M1', 'P', 'D1', 'N2'],
      details: 'Pure natural minor scale (Aeolian mode). Uses Sadharana Gandharam (G2), evoking continuous somber, introspective sentiment.',
    },
    criticalDifference:
      'Gandhara Swara (G3 vs G2): Charukesi uses bright Antara Gandharam (G3), creating a bittersweet interplay between the happy start and poignant finish.',
    audioSwaras1: ['S', 'R2', 'G3', 'M1', 'P', 'D1', 'N2', "S'"],
    audioSwaras2: ['S', 'R2', 'G2', 'M1', 'P', 'D1', 'N2', "S'"],
  },
  {
    id: 'hindolam-malkauns',
    raga1: {
      name: 'Hindolam',
      tradition: 'Carnatic',
      scale: "S G2 M1 D1 N2 S' / S' N2 D1 M1 G2 S",
      swaras: ['S', 'G2', 'M1', 'D1', 'N2'],
      details: 'Panchama-varja and Rishabha-varja pentatonic raga. Light, soothing, devotional, and uplifting with fluid gamakas.',
    },
    raga2: {
      name: 'Malkauns',
      tradition: 'Hindustani',
      scale: "Sa ga ma dha ni Sa' / Sa' ni dha ma ga Sa",
      swaras: ['Sa', 'ga', 'ma', 'dha', 'ni'],
      details: 'Midnight raga of profound gravity, dignity, and peace. Emphasizes heavy and slow oscillations on ga and dha.',
    },
    criticalDifference:
      'Atmosphere & Dhaivata Tuning: Hindolam is sung in quick/medium tempos with bright Carnatic phrases; Malkauns is deep, slow, and solemn with heavy meends centered around Madhyam.',
    audioSwaras1: ['S', 'G2', 'M1', 'D1', 'N2', "S'", 'N2', 'D1', 'M1', 'G2', 'S'],
    audioSwaras2: ['S', 'G2', 'M1', 'D1', 'N2', "S'", 'N2', 'D1', 'M1', 'G2', 'S'],
  },
];

const KATAPAYADI_RULES = [
  { group: '1 (Ka / Ta / Pa / Ya)', consonants: 'Ka (क/க), Ta (ट), Pa (प), Ya (य)' },
  { group: '2 (Kha / Tha / Pha / Ra)', consonants: 'Kha (ख), Tha (ठ), Pha (फ), Ra (र)' },
  { group: '3 (Ga / Dda / Ba / La)', consonants: 'Ga (ग), Dda (ड), Ba (ब), La (ल)' },
  { group: '4 (Gha / Ddha / Bha / Va)', consonants: 'Gha (घ), Ddha (ढ), Bha (भ), Va (व)' },
  { group: '5 (Nga / Nna / Ma / Sa)', consonants: 'Nga (ङ), Nna (ण), Ma (म), Sa (श)' },
  { group: '6 (Cha / Ta / Sha)', consonants: 'Cha (च), Ta (त), Sha (ष)' },
  { group: '7 (Chha / Tha / Sa)', consonants: 'Chha (छ), Tha (थ), Sa (स)' },
  { group: '8 (Ja / Da / Ha)', consonants: 'Ja (ज), Da (द), Ha (ह)' },
  { group: '9 (Jha / Dha / Lla)', consonants: 'Jha (झ), Dha (ध), Lla (ळ)' },
  { group: '0 (Nya / Na)', consonants: 'Nya (ञ), Na (न)' },
];

const QUICK_KATAPAYADI_EXAMPLES = [
  { name: 'Kharaharapriya', c1: 'Kha (2)', c2: 'Ra (2)', reversed: '22', melakarta: 22, chakra: 'Veda (4)' },
  { name: 'Mayamalavagowla', c1: 'Ma (5)', c2: 'Ya (1)', reversed: '15', melakarta: 15, chakra: 'Agni (3)' },
  { name: 'Dheerasankarabharanam', c1: 'Dhee (9)', c2: 'Ra (2)', reversed: '29', melakarta: 29, chakra: 'Bana (5)' },
  { name: 'Mechakalyani', c1: 'Me (5)', c2: 'Cha (6)', reversed: '65', melakarta: 65, chakra: 'Rudra (11)' },
  { name: 'Hanumatodi', c1: 'Ha (8)', c2: 'Nu (0)', reversed: '08', melakarta: 8, chakra: 'Netra (2)' },
  { name: 'Chakravakam', c1: 'Cha (6)', c2: 'Kra (1)', reversed: '16', melakarta: 16, chakra: 'Agni (3)' },
  { name: 'Charukesi', c1: 'Cha (6)', c2: 'Ru (2)', reversed: '26', melakarta: 26, chakra: 'Bana (5)' },
  { name: 'Shanmukhapriya', c1: 'Sha (6)', c2: 'Na (5)', reversed: '56', melakarta: 56, chakra: 'Disi (10)' },
];

const SHRU_TI_KEYS = [
  { key: 'C', label: 'C (1 Kattai)', freq: 261.63 },
  { key: 'C#', label: 'C# (1.5 Kattai)', freq: 277.18 },
  { key: 'D', label: 'D (2 Kattai)', freq: 293.66 },
  { key: 'D#', label: 'D# (2.5 Kattai)', freq: 311.13 },
  { key: 'E', label: 'E (3 Kattai)', freq: 329.63 },
  { key: 'F', label: 'F (4 Kattai)', freq: 349.23 },
  { key: 'F#', label: 'F# (4.5 Kattai)', freq: 369.99 },
  { key: 'G', label: 'G (5 Kattai)', freq: 392.0 },
  { key: 'G#', label: 'G# (5.5 Kattai)', freq: 415.3 },
  { key: 'A', label: 'A (6 Kattai)', freq: 440.0 },
  { key: 'A#', label: 'A# (6.5 Kattai)', freq: 466.16 },
  { key: 'B', label: 'B (7 Kattai)', freq: 493.88 },
];

interface SosTabProps {
  onSelectSwaras?: (swaras: string[], name?: string) => void;
}

export default function SosTab({ onSelectSwaras }: SosTabProps) {
  const [activeSubSection, setActiveSubSection] = useState<'tanpura' | 'disambiguation' | 'quick-swara' | 'katapayadi' | 'helpdesk'>('tanpura');
  const [selectedKey, setSelectedKey] = useState<string>('C');
  const [tanpuraTuning, setTanpuraTuning] = useState<'Pa' | 'Ma' | 'Ni'>('Pa');
  const [isTanpuraPlaying, setIsTanpuraPlaying] = useState<boolean>(false);
  const [droneVolume, setDroneVolume] = useState<number>(0.3);
  const [activeTanpuraString, setActiveTanpuraString] = useState<number>(-1);

  // Quick Swara Panic States
  const [panicSwaras, setPanicSwaras] = useState<string[]>(['S', 'R2', 'G3']);
  const [panicPlayingSwara, setPanicPlayingSwara] = useState<string | null>(null);

  // Disambiguation Search Query
  const [filterQuery, setFilterQuery] = useState('');
  const [playingPairId, setPlayingPairId] = useState<string | null>(null);

  // Audio Context Ref for Tanpura Drone Loop
  const audioCtxRef = useRef<AudioContext | null>(null);
  const droneTimerRef = useRef<any>(null);
  const isPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      stopTanpura();
    };
  }, []);

  const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const pluckTanpuraString = (freq: number, stringIndex: number, gainLevel: number) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    setActiveTanpuraString(stringIndex);

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now); // 1st overtone

    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(freq + 0.5, now); // slight chorus detune

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(gainLevel * 0.4, now + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    osc3.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + 3.0);
    osc2.stop(now + 3.0);
    osc3.stop(now + 3.0);
  };

  const startTanpura = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    setIsTanpuraPlaying(true);
    isPlayingRef.current = true;

    const baseItem = SHRU_TI_KEYS.find((k) => k.key === selectedKey) || SHRU_TI_KEYS[0];
    const baseSa = baseItem.freq;

    // String ratios
    let firstRatio = 1.5; // Pa
    if (tanpuraTuning === 'Ma') firstRatio = 4 / 3;
    if (tanpuraTuning === 'Ni') firstRatio = 15 / 8 * 0.5; // Mandra Ni

    const strings = [
      { ratio: firstRatio, strIdx: 1 },
      { ratio: 2.0, strIdx: 2 }, // Madhya Sa'
      { ratio: 2.0, strIdx: 3 }, // Madhya Sa'
      { ratio: 1.0, strIdx: 4 }, // Mandra Sa
    ];

    let currentStr = 0;

    const playNextString = () => {
      if (!isPlayingRef.current) return;

      const target = strings[currentStr];
      const strFreq = baseSa * target.ratio;
      pluckTanpuraString(strFreq, target.strIdx, droneVolume);

      currentStr = (currentStr + 1) % strings.length;
      droneTimerRef.current = setTimeout(playNextString, 1100);
    };

    playNextString();
  };

  const stopTanpura = () => {
    setIsTanpuraPlaying(false);
    isPlayingRef.current = false;
    setActiveTanpuraString(-1);
    if (droneTimerRef.current) {
      clearTimeout(droneTimerRef.current);
      droneTimerRef.current = null;
    }
  };

  const toggleTanpura = () => {
    if (isTanpuraPlaying) {
      stopTanpura();
    } else {
      startTanpura();
    }
  };

  const handleAuditionScale = async (id: string, notes: string[]) => {
    if (playingPairId) return;
    setPlayingPairId(id);
    await playSwaraSequence(notes, 0.45);
    setPlayingPairId(null);
  };

  const togglePanicSwara = (swara: string) => {
    playSingleSwara(swara, 0.4);
    setPanicPlayingSwara(swara);
    setTimeout(() => setPanicPlayingSwara(null), 400);

    setPanicSwaras((prev) =>
      prev.includes(swara) ? prev.filter((s) => s !== swara) : [...prev, swara]
    );
  };

  // Instant fuzzy matches from panic swaras
  const getPanicMatches = () => {
    if (panicSwaras.length === 0) return [];
    const candidates = [
      { name: 'Mohanam', melakarta: 28, swaras: ['S', 'R2', 'G3', 'P', 'D2'], tradition: 'Carnatic' },
      { name: 'Hamsadhwani', melakarta: 29, swaras: ['S', 'R2', 'G3', 'P', 'N3'], tradition: 'Carnatic' },
      { name: 'Mayamalavagowla', melakarta: 15, swaras: ['S', 'R1', 'G3', 'M1', 'P', 'D1', 'N3'], tradition: 'Carnatic' },
      { name: 'Keeravani', melakarta: 21, swaras: ['S', 'R2', 'G2', 'M1', 'P', 'D1', 'N3'], tradition: 'Carnatic' },
      { name: 'Kalyani', melakarta: 65, swaras: ['S', 'R2', 'G3', 'M2', 'P', 'D2', 'N3'], tradition: 'Carnatic' },
      { name: 'Sankarabharanam', melakarta: 29, swaras: ['S', 'R2', 'G3', 'M1', 'P', 'D2', 'N3'], tradition: 'Carnatic' },
      { name: 'Charukesi', melakarta: 26, swaras: ['S', 'R2', 'G3', 'M1', 'P', 'D1', 'N2'], tradition: 'Carnatic' },
      { name: 'Hindolam', melakarta: 20, swaras: ['S', 'G2', 'M1', 'D1', 'N2'], tradition: 'Carnatic' },
      { name: 'Revati', melakarta: 2, swaras: ['S', 'R1', 'M1', 'P', 'N2'], tradition: 'Carnatic' },
      { name: 'Simhendramadhyamam', melakarta: 57, swaras: ['S', 'R2', 'G2', 'M2', 'P', 'D1', 'N3'], tradition: 'Carnatic' },
    ];

    return candidates
      .map((c) => {
        const matchingCount = panicSwaras.filter((s) => c.swaras.includes(s)).length;
        const score = Math.round((matchingCount / Math.max(c.swaras.length, panicSwaras.length)) * 100);
        return { ...c, score, matchingCount };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  };

  const filteredConfusionPairs = CONFUSION_PAIRS.filter(
    (p) =>
      p.raga1.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.raga2.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.criticalDifference.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* SOS Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-900 via-rose-800 to-amber-950 text-white p-6 sm:p-10 shadow-2xl border border-rose-700/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40 text-xs font-bold tracking-wide uppercase">
              <LifeBuoy className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
              <span>Musician &amp; Listener SOS Emergency Rescue</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Instant <span className="text-rose-300 underline decoration-rose-400/60">SOS</span> Musicology Rescue
            </h1>
            <p className="text-sm sm:text-base text-rose-100/90 leading-relaxed">
              Stuck on a tricky raga during a concert, exam, or recording? Need an immediate Tanpura drone, a 1-tap swara panic identifier, or instant disambiguation between lookalike ragas? You are covered.
            </p>
          </div>

          {/* Quick SOS Mode Selector Pills */}
          <div className="bg-black/30 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex flex-wrap gap-1.5 shrink-0 self-stretch md:self-auto justify-center">
            <button
              type="button"
              onClick={() => setActiveSubSection('tanpura')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubSection === 'tanpura'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-rose-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Tanpura Drone</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubSection('disambiguation')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubSection === 'disambiguation'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-rose-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Confusion Solver</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubSection('quick-swara')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubSection === 'quick-swara'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-rose-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Swara Panic</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubSection('katapayadi')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubSection === 'katapayadi'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-rose-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Katapayadi Formula</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-SECTION 1: EMERGENCY TANPURA DRONE & SHRUTI TUNER */}
      {activeSubSection === 'tanpura' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-rose-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2 text-rose-700 font-bold text-lg">
                <Volume2 className="w-5 h-5 text-rose-600" />
                <span>Live Emergency Shruti Tanpura Drone</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Continuous harmonic tanpura drone for vocalists, instrumentalists, and pitch calibration.
              </p>
            </div>

            {/* Play / Stop Master Button */}
            <button
              type="button"
              onClick={toggleTanpura}
              className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                isTanpuraPlaying
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
              }`}
            >
              {isTanpuraPlaying ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop Tanpura Drone</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Tanpura ({selectedKey} Shruti)</span>
                </>
              )}
            </button>
          </div>

          {/* Visual String Vibration Display */}
          <div className="bg-stone-900 rounded-2xl p-6 text-white flex flex-col items-center justify-center gap-4 relative overflow-hidden">
            <div className="text-xs uppercase tracking-widest text-amber-400 font-bold">
              {isTanpuraPlaying ? 'Tanpura Resonating • 4-String Sequential Pluck' : 'Tanpura Paused • Click Start to Resonate'}
            </div>

            <div className="flex items-center justify-center gap-6 sm:gap-12 w-full max-w-lg my-2">
              {[
                { name: `${tanpuraTuning} (First)`, idx: 1, label: 'String 1' },
                { name: "Sa' (Madhya)", idx: 2, label: 'String 2' },
                { name: "Sa' (Chorus)", idx: 3, label: 'String 3' },
                { name: 'Sa (Mandra)', idx: 4, label: 'String 4' },
              ].map((str) => {
                const isActive = activeTanpuraString === str.idx && isTanpuraPlaying;
                return (
                  <div key={str.idx} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] text-stone-400 font-mono">{str.label}</span>
                    <div
                      className={`w-3 rounded-full transition-all duration-300 ${
                        isActive
                          ? 'h-24 bg-gradient-to-t from-amber-400 via-rose-400 to-yellow-200 shadow-lg shadow-rose-500/50 scale-110'
                          : 'h-16 bg-stone-700'
                      }`}
                    />
                    <span className={`text-xs font-bold ${isActive ? 'text-amber-300 scale-105' : 'text-stone-400'}`}>
                      {str.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Tuning Mode Toggle: Pa, Ma, Ni */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-stone-400 font-semibold">Tuning Mode:</span>
              <div className="bg-stone-800 p-1 rounded-xl flex gap-1 border border-stone-700">
                {(['Pa', 'Ma', 'Ni'] as ('Pa' | 'Ma' | 'Ni')[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setTanpuraTuning(mode);
                      if (isTanpuraPlaying) {
                        stopTanpura();
                        setTimeout(startTanpura, 150);
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      tanpuraTuning === mode
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    {mode}-Shruti
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Shruti Pitch Picker Buttons */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Select Shruti Pitch / Key (Kattai):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {SHRU_TI_KEYS.map((k) => (
                <button
                  key={k.key}
                  type="button"
                  onClick={() => {
                    setSelectedKey(k.key);
                    if (isTanpuraPlaying) {
                      stopTanpura();
                      setTimeout(startTanpura, 150);
                    }
                  }}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center ${
                    selectedKey === k.key
                      ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white border-rose-600 shadow-md'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <span className="text-sm font-black">{k.key}</span>
                  <span className={`text-[10px] ${selectedKey === k.key ? 'text-rose-100' : 'text-stone-500'}`}>
                    {k.label.split('(')[1]?.replace(')', '') || ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: INSTANT RAGA DISAMBIGUATION (CONFUSION SOLVER) */}
      {activeSubSection === 'disambiguation' && (
        <div className="space-y-6">
          {/* Search bar inside Disambiguation */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-md border border-rose-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-rose-600" />
                <span>Raga Disambiguation Matrix (Common Confusion Pairs)</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-600">
                Instantly resolve confusion between commonly mistaken Carnatic and Hindustani twin scales.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter by raga name..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Confusion Cards Grid */}
          <div className="grid grid-cols-1 gap-6">
            {filteredConfusionPairs.map((pair) => (
              <div
                key={pair.id}
                className="bg-white rounded-3xl p-6 shadow-md border border-stone-200/90 hover:border-rose-300 transition-all space-y-4"
              >
                {/* Critical Difference Banner */}
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300/80 flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-black uppercase text-amber-900 tracking-wider">
                      Crucial Musicological Distinction:
                    </span>
                    <p className="text-xs sm:text-sm text-amber-950 font-medium mt-0.5 leading-relaxed">
                      {pair.criticalDifference}
                    </p>
                  </div>
                </div>

                {/* Side-by-side comparison boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Raga 1 Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-stone-50 to-amber-50/40 border border-amber-200/70 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-stone-900">{pair.raga1.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          {pair.raga1.tradition}
                        </span>
                      </div>
                      <div className="mt-2 text-xs font-mono font-bold text-raga-700 bg-white/80 p-2 rounded-lg border border-amber-200/60">
                        {pair.raga1.scale}
                      </div>
                      <p className="mt-2 text-xs text-stone-600 leading-relaxed">{pair.raga1.details}</p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-amber-200/60">
                      <button
                        type="button"
                        onClick={() => handleAuditionScale(`${pair.id}-1`, pair.audioSwaras1)}
                        disabled={playingPairId === `${pair.id}-1`}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>{playingPairId === `${pair.id}-1` ? 'Playing Notes...' : 'Hear Scale'}</span>
                      </button>

                      {onSelectSwaras && (
                        <button
                          type="button"
                          onClick={() => onSelectSwaras(pair.raga1.swaras, pair.raga1.name)}
                          className="text-xs font-semibold text-raga-600 hover:underline flex items-center gap-1"
                        >
                          <span>Open in Finder</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Raga 2 Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-stone-50 to-rose-50/40 border border-rose-200/70 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-stone-900">{pair.raga2.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                          {pair.raga2.tradition}
                        </span>
                      </div>
                      <div className="mt-2 text-xs font-mono font-bold text-rose-700 bg-white/80 p-2 rounded-lg border border-rose-200/60">
                        {pair.raga2.scale}
                      </div>
                      <p className="mt-2 text-xs text-stone-600 leading-relaxed">{pair.raga2.details}</p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-rose-200/60">
                      <button
                        type="button"
                        onClick={() => handleAuditionScale(`${pair.id}-2`, pair.audioSwaras2)}
                        disabled={playingPairId === `${pair.id}-2`}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>{playingPairId === `${pair.id}-2` ? 'Playing Notes...' : 'Hear Scale'}</span>
                      </button>

                      {onSelectSwaras && (
                        <button
                          type="button"
                          onClick={() => onSelectSwaras(pair.raga2.swaras, pair.raga2.name)}
                          className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <span>Open in Finder</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: 1-TAP SWARA PANIC IDENTIFIER */}
      {activeSubSection === 'quick-swara' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-rose-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2 text-rose-700 font-bold text-lg">
                <LifeBuoy className="w-5 h-5 text-rose-600" />
                <span>1-Tap Swara Panic Identifier</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Hear notes in a performance or exam? Tap the swaras you hear to instantly reveal matching ragas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPanicSwaras([])}
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-rose-600 border border-stone-300 rounded-xl flex items-center gap-1 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Selected Swaras</span>
            </button>
          </div>

          {/* Quick Clickable Swaras Grid */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Tap Swaras You Hear (Includes Audio Audition):
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {['S', 'R1', 'R2', 'R3', 'G1', 'G2', 'G3', 'M1', 'M2', 'P', 'D1', 'D2', 'D3', 'N1', 'N2', 'N3'].map(
                (swara) => {
                  const isSelected = panicSwaras.includes(swara);
                  const isAuditioning = panicPlayingSwara === swara;
                  return (
                    <button
                      key={swara}
                      type="button"
                      onClick={() => togglePanicSwara(swara)}
                      className={`p-3 rounded-2xl font-black text-sm border transition-all flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-[1.02]'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                      } ${isAuditioning ? 'ring-4 ring-amber-400' : ''}`}
                    >
                      <span>{swara}</span>
                      <span className={`text-[9px] font-normal ${isSelected ? 'text-rose-200' : 'text-stone-400'}`}>
                        {swara.startsWith('S') ? 'Shadja' : swara.startsWith('P') ? 'Panchama' : 'Note'}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Instant Matches Card */}
          <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Emergency Matches for Selected Swaras ({panicSwaras.join(' ')}):
              </span>
              <span className="text-xs font-bold text-amber-700">{getPanicMatches().length} Top Results</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {getPanicMatches().map((match) => (
                <div
                  key={match.name}
                  className="p-4 rounded-xl bg-white border border-amber-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-stone-900 text-base">{match.name}</h4>
                      <p className="text-xs text-stone-500 font-mono mt-0.5">
                        Melakarta #{match.melakarta} &bull; {match.swaras.join(' ')}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {match.score}% Match
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => playSwaraSequence(match.swaras, 0.4)}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 text-amber-600" />
                      <span>Audition</span>
                    </button>

                    {onSelectSwaras && (
                      <button
                        type="button"
                        onClick={() => onSelectSwaras(match.swaras, match.name)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                      >
                        <span>Analyze in Main Finder &rarr;</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 4: KATAPAYADI EMERGENCY FORMULA & CHEAT SHEET */}
      {activeSubSection === 'katapayadi' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-rose-200/80 space-y-6">
          <div className="pb-4 border-b border-stone-200">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-lg">
              <BookOpen className="w-5 h-5 text-rose-600" />
              <span>Katapayadi Sankhya Emergency Decoder</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              The ancient Sanskrit cryptographic formula to find the exact Melakarta number (1 to 72) of any Janaka raga in seconds!
            </p>
          </div>

          {/* Formula Rule Explanation Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-stone-800 space-y-2">
            <h3 className="font-bold text-sm text-amber-900">
              The Golden Katapayadi Rule: &ldquo;Ankanam Vamato Gatih&rdquo; (Numbers proceed from Right to Left)
            </h3>
            <ol className="list-decimal list-inside text-xs text-stone-700 space-y-1">
              <li>Take the first two syllables of the Melakarta raga name.</li>
              <li>Match each syllable to its numerical digit in the Katapayadi mnemonic table.</li>
              <li>Reverse the order of the two digits: (First Syllable &rarr; Units place, Second Syllable &rarr; Tens place).</li>
              <li>The resulting two-digit integer gives the exact parent Melakarta number!</li>
            </ol>
          </div>

          {/* Quick Examples Grid */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Worked Examples:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {QUICK_KATAPAYADI_EXAMPLES.map((ex) => (
                <div key={ex.name} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 space-y-1">
                  <div className="font-black text-sm text-stone-900">{ex.name}</div>
                  <div className="text-xs text-stone-600">
                    <span className="font-semibold text-rose-700">{ex.c1}</span> +{' '}
                    <span className="font-semibold text-amber-700">{ex.c2}</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-800 pt-1 border-t border-stone-200 flex justify-between">
                    <span>Reversed: {ex.reversed}</span>
                    <span className="bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                      Melakarta #{ex.melakarta}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Katapayadi Consonant Mnemonic Table */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Katapayadi Cipher Reference Table (Digits 1 to 0):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {KATAPAYADI_RULES.map((rule) => (
                <div key={rule.group} className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                  <span className="font-black text-rose-700 block mb-1">Digit {rule.group.split(' ')[0]}</span>
                  <p className="text-stone-600 text-[11px] leading-tight">{rule.consonants}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
