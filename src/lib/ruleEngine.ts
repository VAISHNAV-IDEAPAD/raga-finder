import { structuredDb } from './structuredDb';
import { RagaProfile } from '@/types/raga';

// Katapayadi Sanskrit/Carnatic Consonant Cipher
const KATAPAYADI_CIPHER: Record<string, number> = {
  // Ka group (1-9, 0)
  k: 1, kh: 2, g: 3, gh: 4, ng: 5,
  c: 6, ch: 7, j: 8, jh: 9, ny: 0,

  // Ta retroflex group (1-5)
  t: 1, th: 2, d: 3, dh: 4, n: 5,

  // Pa group (1-5)
  p: 1, ph: 2, b: 3, bh: 4, m: 5,

  // Ya group (1-8)
  y: 1, r: 2, l: 3, v: 4, sh: 5, ss: 6, s: 7, h: 8,
};

export interface KatapayadiResult {
  ragaName: string;
  firstConsonants: [string, string];
  digits: [number, number];
  melakartaNumber: number;
  chakraName: string;
  chakraNumber: number;
  explanation: string;
}

export interface ScaleGrammarAnalysis {
  arohana: string;
  avarohana: string;
  arohanaCount: number;
  avarohanaCount: number;
  scaleType: 'Audava-Audava' | 'Audava-Shadava' | 'Audava-Sampoorna' | 'Shadava-Audava' | 'Shadava-Shadava' | 'Shadava-Sampoorna' | 'Sampoorna-Audava' | 'Sampoorna-Shadava' | 'Sampoorna-Sampoorna' | 'Swarantara' | 'Vakra / Irregular';
  isVakra: boolean;
  vakraPhrases: string[];
  isBhashanga: boolean;
  anyaSwaras: string[];
  omittedSwaras: {
    arohana: string[];
    avarohana: string[];
  };
  musicologicalSummary: string;
}

const CHAKRA_NAMES = [
  'Indu (Moon)', 'Netra (Eyes)', 'Agni (Fire)', 'Veda (Scriptures)',
  'Bana (Arrows)', 'Ritu (Seasons)', 'Rishi (Sages)', 'Vasu (Deities)',
  'Brahma (Creators)', 'Disi (Directions)', 'Rudra (Roarers)', 'Aditya (Suns)',
];

function getKatapayadiDigit(token: string): number | null {
  const clean = token.toLowerCase();
  for (const [prefix, val] of Object.entries(KATAPAYADI_CIPHER).sort((a, b) => b[0].length - a[0].length)) {
    if (clean.startsWith(prefix)) return val;
  }
  return null;
}

/**
 * Katapayadi Sankhya Rule:
 * Calculates Melakarta number (1-72) from the first two consonant sounds of a Janaka raga name.
 * Rule: "Ankanam Vamato Gati" (digits are read in reverse: 2nd consonant is tens, 1st consonant is units).
 */
export function calculateKatapayadiMelakarta(ragaName: string): KatapayadiResult | null {
  const clean = ragaName.toLowerCase().replace(/[^a-z]/g, '');
  const consonantRegex = /(kh|gh|ch|jh|th|dh|ph|bh|sh|ss|ng|ny|[kgcjtdpbmyrlvsh])/g;
  const matches = clean.match(consonantRegex);

  if (!matches || matches.length < 2) return null;

  const d1 = getKatapayadiDigit(matches[0]);
  const d2 = getKatapayadiDigit(matches[1]);

  if (d1 === null || d2 === null) return null;

  // In Katapayadi cipher: reverse order: (d2 * 10) + d1
  let melakartaNumber = d2 * 10 + d1;

  // Edge case normalization for classic aliases (e.g. Mechakalyani: Ma(5) + Cha(6) -> 65)
  if (melakartaNumber < 1 || melakartaNumber > 72) {
    return null;
  }

  const chakraNumber = Math.ceil(melakartaNumber / 6);
  const chakraName = CHAKRA_NAMES[chakraNumber - 1] || 'Janaka Chakra';

  return {
    ragaName,
    firstConsonants: [matches[0], matches[1]],
    digits: [d1, d2],
    melakartaNumber,
    chakraNumber,
    chakraName,
    explanation: `Katapayadi Sankhya: "${matches[0]}" = ${d1}, "${matches[1]}" = ${d2}. By rule "Ankanam Vamato Gati", reading in reverse gives (${d2} * 10) + ${d1} = Melakarta #${melakartaNumber} (${chakraName}).`,
  };
}

/**
 * Musicological Rule: Scale Grammar, Varja, Vakra, and Bhashanga Analysis
 */
export function analyzeScaleGrammar(arohana: string, avarohana: string): ScaleGrammarAnalysis {
  const parseNotes = (str: string) =>
    str
      .replace(/['\,]/g, '')
      .split(/[\s\/]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0 && s !== '-' && s !== 'S' && s !== "S'");

  const aroNotes = parseNotes(arohana);
  const avaNotes = parseNotes(avarohana);

  // In Indian classical music, count is total distinct swaras per octave (including base Sa)
  // Audava = 5 notes (Sa + 4), Shadava = 6 notes (Sa + 5), Sampoorna = 7 notes (Sa + 6)
  const aroCount = aroNotes.length + 1;
  const avaCount = avaNotes.length + 1;

  // Classify scale by number of swaras (Audava = 5, Shadava = 6, Sampoorna = 7)
  const getCountName = (c: number) => {
    if (c <= 4) return 'Swarantara';
    if (c === 5) return 'Audava';
    if (c === 6) return 'Shadava';
    return 'Sampoorna';
  };

  const scaleType = `${getCountName(aroCount)}-${getCountName(avaCount)}` as any;

  // Check Varja (omitted notes)
  const allBaseSwaras = ['R', 'G', 'M', 'P', 'D', 'N'];
  const aroBase = new Set(aroNotes.map((n) => n[0]));
  const avaBase = new Set(avaNotes.map((n) => n[0]));

  const aroOmitted = allBaseSwaras.filter((s) => !aroBase.has(s));
  const avaOmitted = allBaseSwaras.filter((s) => !avaBase.has(s));

  // Check Vakra (irregular or zig-zag ascent/descent)
  const isVakra =
    arohana.includes('M1 P M1') ||
    arohana.includes('P M1 P') ||
    avarohana.includes('P M1 P') ||
    avarohana.includes('M1 P G') ||
    avarohana.includes('D1 N2 P') ||
    avarohana.includes('N2 D2 N2');

  const vakraPhrases: string[] = [];
  if (isVakra) {
    vakraPhrases.push('Zig-zag (Vakra) phrase detected in melodic movement');
  }

  // Check Bhashanga (Anya Swaras - e.g. both N2 and N3, or both M1 and M2)
  const combined = [...aroNotes, ...avaNotes];
  const anyaSwaras: string[] = [];

  const noteCategories = new Map<string, Set<string>>();
  combined.forEach((n) => {
    const base = n[0];
    if (!noteCategories.has(base)) noteCategories.set(base, new Set());
    noteCategories.get(base)!.add(n);
  });

  noteCategories.forEach((variants, base) => {
    if (variants.size > 1) {
      anyaSwaras.push(`${base} has multiple varieties: [${Array.from(variants).join(', ')}]`);
    }
  });

  const isBhashanga = anyaSwaras.length > 0;

  let summary = `${scaleType} scale`;
  if (isVakra) summary += ` with Vakra (non-linear) contour`;
  if (isBhashanga) summary += `, Bhashanga (incorporating foreign swara varieties)`;
  if (aroOmitted.length > 0) summary += `. Omitted in ascent: ${aroOmitted.join(', ')}`;
  if (avaOmitted.length > 0) summary += `. Omitted in descent: ${avaOmitted.join(', ')}`;

  return {
    arohana,
    avarohana,
    arohanaCount: aroCount,
    avarohanaCount: avaCount,
    scaleType,
    isVakra,
    vakraPhrases,
    isBhashanga,
    anyaSwaras,
    omittedSwaras: {
      arohana: aroOmitted,
      avarohana: avaOmitted,
    },
    musicologicalSummary: summary,
  };
}

/**
 * Musicological Disambiguation Rules:
 * Resolves commonly confused raga pairs based on microtonal swaras and sancharas.
 */
export function disambiguateRagaRule(ragaA: string, ragaB: string): string | null {
  const key = [ragaA.toLowerCase(), ragaB.toLowerCase()].sort().join(' vs ');

  const rules: Record<string, string> = {
    'mohanam vs shivaranjani':
      'Mohanam uses Antara Gandharam (G3) giving a joyous, triumphant, majestic mood. Shivaranjani uses Sadharana Gandharam (G2), transforming the exact same pentatonic scale into deep pathos, romantic sorrow, and heartbreak (Karuna rasa).',
    'kalyani vs yamuna kalyani':
      'Kalyani is a complete Sampoorna raga using Teevra/Prati Madhyamam (M2) exclusively. Yamuna Kalyani frequently introduces Shuddha Madhyamam (M1) in characteristic gamaka phrases (P M1 G3), lending a delicate, romantic, and folk-devotional flavor.',
    'gambheera nattai vs hamsadhwani':
      'Both are five-note pentatonic scales. Hamsadhwani uses Chatusruti Rishabham (R2) without Madhyamam: [S R2 G3 P N3]. Gambheera Nattai omits Rishabham and introduces Shuddha Madhyamam (M1): [S G3 M1 P N3], creating a powerful temple nagaswaram prayer mood.',
    'keeravani vs simhendramadhyamam':
      'Both share identical Komal Gandhara (G2), Komal Dhaivata (D1), and Kakali Nishada (N3). Keeravani uses Shuddha Madhyamam (M1), giving an intimate, introspective mood. Simhendramadhyamam uses Prati Madhyamam (M2), evoking fiery, intense grandeur (Veera/Raudra rasa).',
    'bilahari vs shankarabharanam':
      'Shankarabharanam is a full Sampoorna raga. Bilahari omits Madhyamam and Nishadam in ascent (S R2 G3 P D2 S\') and introduces foreign Kaisiki Nishada (N2) in descent (S\' N3 D2 P M1 G3 R2 S / P M1 G3 R2 S N2 D2 S), making it a Bhashanga raga with morning celebratory brightness.',
  };

  return rules[key] || null;
}

export const disambiguateRagas = disambiguateRagaRule;

/**
 * Execute Rule-Based Search
 */
export function searchByMusicologicalRule(query: string): RagaProfile[] {
  const qLower = query.toLowerCase();

  // 1. Check Katapayadi Cipher Query
  const kataMelakarta = calculateKatapayadiMelakarta(query);
  if (kataMelakarta) {
    const melMatches = structuredDb.queryRagas({ melakartaNumber: kataMelakarta.melakartaNumber });
    if (melMatches.length > 0) return melMatches;
  }

  // 2. Check Varja Rules (Audava / Shadava / Sampoorna)
  let targetScale = '';
  if (qLower.includes('audava') || qLower.includes('pentatonic') || qLower.includes('5 note') || qLower.includes('5 swara')) {
    targetScale = 'Audava';
  } else if (qLower.includes('shadava') || qLower.includes('hexatonic') || qLower.includes('6 note') || qLower.includes('6 swara')) {
    targetScale = 'Shadava';
  } else if (qLower.includes('sampoorna') || qLower.includes('heptatonic') || qLower.includes('7 note') || qLower.includes('7 swara')) {
    targetScale = 'Sampoorna';
  }

  if (targetScale) {
    return structuredDb.ragas.filter((r) => {
      const grammar = analyzeScaleGrammar(r.arohana, r.avarohana);
      return grammar.scaleType.includes(targetScale);
    }).slice(0, 10);
  }

  // 3. Check Bhashanga / Anya Swaras
  if (qLower.includes('bhashanga') || qLower.includes('foreign note') || qLower.includes('accidental')) {
    return structuredDb.ragas.filter((r) => {
      const grammar = analyzeScaleGrammar(r.arohana, r.avarohana);
      return grammar.isBhashanga;
    }).slice(0, 10);
  }

  // 4. Check Vakra Sanchara
  if (qLower.includes('vakra') || qLower.includes('zig zag') || qLower.includes('non linear')) {
    return structuredDb.ragas.filter((r) => {
      const grammar = analyzeScaleGrammar(r.arohana, r.avarohana);
      return grammar.isVakra;
    }).slice(0, 10);
  }

  return [];
}
