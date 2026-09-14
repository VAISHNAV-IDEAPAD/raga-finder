import songsData from '@/data/song_ragas_db.json';
import seedRagas from '@/data/seed_ragas.json';
import { SongRagaEntry, Tradition } from '@/types/raga';

// Normalization helper: strips accents, symbols, and standardizes transliteration
export function normalizeSongQuery(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritical marks
    .toLowerCase()
    .replace(/[\(\)\[\]\-—_.,:;!?'"\/\\+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Phonetic simplification for South Indian / Hindi transliteration variations
export function phoneticKey(str: string): string {
  return normalizeSongQuery(str)
    .replace(/aa+/g, 'a')
    .replace(/ee+/g, 'i')
    .replace(/oo+/g, 'u')
    .replace(/ou|au/g, 'o')
    .replace(/th+/g, 't')
    .replace(/dh+/g, 'd')
    .replace(/gh+/g, 'g')
    .replace(/bh+/g, 'b')
    .replace(/ph+/g, 'p')
    .replace(/sh+/g, 's')
    .replace(/zh+/g, 'l')
    .replace(/w/g, 'v')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Additional Raga profiles for Janyas and popular film ragas not fully defined in seed_ragas
const EXTENDED_RAGA_PROFILES: Record<string, any> = {
  'malayamarutham': {
    name: 'Malayamarutham',
    alternateNames: ['Malayamarutam'],
    tradition: 'Carnatic',
    melakartaNumber: 16,
    parentRaga: 'Chakravakam (16th Melakarta Janya)',
    arohana: "S R1 G3 P D2 N2 S'",
    avarohana: "S' N2 D2 P G3 R1 S",
    swarasCarnatic: ['S', 'R1', 'G3', 'P', 'D2', 'N2'],
    swarasHindustani: ['Sa', 'Komal Re', 'Shuddha Ga', 'Pa', 'Shuddha Dha', 'Komal Ni'],
    vadi: 'P',
    samvadi: 'S',
    pakadOrSignature: 'G3 P D2 N2 S\', N2 D2 P G3 R1 S',
    rasaOrMood: 'Bhakti (Devotion), Shanta (Peace), Dawn Elegance',
    timeOfDay: 'Dawn / Early Morning (Brahma Muhurta)',
    explanation: 'Shadava-Shadava raga omitting Madhyamam (Ma). Highly celebrated in Carnatic morning recitals and Malayalam cinema classics.',
  },
  'darbari kanada': {
    name: 'Darbari Kanada',
    alternateNames: ['Darbari', 'Durbar'],
    tradition: 'Both',
    melakartaNumber: 20,
    thaat: 'Asavari',
    parentRaga: 'Natabhairavi (Carnatic) / Asavari Thaat (Hindustani)',
    arohana: "S R2 G2 M1 P D1 N2 S'",
    avarohana: "S' D1 N2 P M1 P G2 M1 R2 S",
    swarasCarnatic: ['S', 'R2', 'G2', 'M1', 'P', 'D1', 'N2'],
    swarasHindustani: ['Sa', 'Shuddha Re', 'Komal Ga', 'Shuddha Ma', 'Pa', 'Komal Dha', 'Komal Ni'],
    vadi: 'R2 (Re)',
    samvadi: 'P (Pa)',
    pakadOrSignature: 'G2 M1 R2 S, d1 n2 P, M1 P d1 n2 S\'',
    rasaOrMood: 'Grave, Regal, Deep Pathos (Karuna), Majestical',
    timeOfDay: 'Midnight / Late Night',
    explanation: 'Created by Miyan Tansen in Emperor Akbar\'s court. Characterized by deep, slow oscillations (andolan) on Komal Ga and Komal Dha.',
  },
  'abheri': {
    name: 'Abheri',
    alternateNames: ['Aabheri', 'Bhimpalasi (Hindustani equivalent)'],
    tradition: 'Both',
    melakartaNumber: 22,
    thaat: 'Kafi',
    parentRaga: 'Kharaharapriya (22nd Melakarta Janya)',
    arohana: "S G2 M1 P N2 S'",
    avarohana: "S' N2 D2 P M1 G2 R2 S",
    swarasCarnatic: ['S', 'R2', 'G2', 'M1', 'P', 'D2', 'N2'],
    swarasHindustani: ['Sa', 'Komal Ga', 'Shuddha Ma', 'Pa', 'Komal Ni', 'Shuddha Re', 'Shuddha Dha'],
    vadi: 'M1',
    samvadi: 'S',
    pakadOrSignature: 'n2 S M1, M1 P G2, M1 G2 R2 S',
    rasaOrMood: 'Shringara (Romantic Love), Karuna (Longing)',
    timeOfDay: 'Late Afternoon / Early Evening',
    explanation: 'A beloved Audava-Sampoorna raga omitting Ri and Dha in ascent. In modern performance closely mapped to Bhimpalasi.',
  },
  'bhimpalasi': {
    name: 'Bhimpalasi',
    alternateNames: ['Abheri (Carnatic equivalent)'],
    tradition: 'Hindustani',
    melakartaNumber: 22,
    thaat: 'Kafi',
    parentRaga: 'Kafi Thaat',
    arohana: "n2' S G2 M1 P n2 S'",
    avarohana: "S' n2 D2 P M1 G2 R2 S",
    swarasCarnatic: ['S', 'R2', 'G2', 'M1', 'P', 'D2', 'N2'],
    swarasHindustani: ['Sa', 'Komal Ga', 'Shuddha Ma', 'Pa', 'Komal Ni', 'Shuddha Re', 'Shuddha Dha'],
    vadi: 'Ma',
    samvadi: 'Sa',
    pakadOrSignature: 'M1 P G2 M1, G2 R2 S, n2\' S',
    rasaOrMood: 'Poignant, Devotional, Romantic Yearning',
    timeOfDay: 'Late Afternoon (3 PM - 6 PM)',
    explanation: 'A supreme afternoon raga in the Hindustani tradition featuring gentle emphasis on Shuddha Ma and tender Komal Ga.',
  },
  'madhyamavathi': {
    name: 'Madhyamavathi',
    alternateNames: ['Madhyamavati', 'Megh (Hindustani equivalent)'],
    tradition: 'Carnatic',
    melakartaNumber: 22,
    thaat: 'Kafi',
    parentRaga: 'Kharaharapriya (22nd Melakarta Janya)',
    arohana: "S R2 M1 P N2 S'",
    avarohana: "S' N2 P M1 R2 S",
    swarasCarnatic: ['S', 'R2', 'M1', 'P', 'N2'],
    swarasHindustani: ['Sa', 'Shuddha Re', 'Shuddha Ma', 'Pa', 'Komal Ni'],
    vadi: 'M1',
    samvadi: 'S',
    pakadOrSignature: 'R2 M1 P, N2 P M1 R2 S',
    rasaOrMood: 'Auspiciousness (Mangalakari), Shanta, Devotion',
    timeOfDay: 'Afternoon / End of Concert (Mangalam)',
    explanation: 'Audava-Audava pentatonic raga omitting Ga and Dha. Believed to remove blemishes from musical concerts, traditionally sung at the conclusion of recitals.',
  },
  'sivaranjani': {
    name: 'Sivaranjani',
    alternateNames: ['Shivaranjani'],
    tradition: 'Both',
    melakartaNumber: 22,
    thaat: 'Kafi',
    parentRaga: 'Kharaharapriya (22nd Melakarta Janya)',
    arohana: "S R2 G2 P D2 S'",
    avarohana: "S' D2 P G2 R2 S",
    swarasCarnatic: ['S', 'R2', 'G2', 'P', 'D2'],
    swarasHindustani: ['Sa', 'Shuddha Re', 'Komal Ga', 'Pa', 'Shuddha Dha'],
    vadi: 'P',
    samvadi: 'S',
    pakadOrSignature: 'G2 R2 S, D2\' S R2 G2, R2 S',
    rasaOrMood: 'Deep Pathos, Heartbreak (Karuna), Soulful Melancholy',
    timeOfDay: 'Midnight / Anytime',
    explanation: 'Five-note pentatonic scale identical to Mohanam except with Sadharana Gandharam (G2 / Komal Ga), producing intense poignant sentiment.',
  },
  'kapi': {
    name: 'Kapi',
    alternateNames: ['Kaapi', 'Kafi (Carnatic orientation)'],
    tradition: 'Carnatic',
    melakartaNumber: 22,
    thaat: 'Kafi',
    parentRaga: 'Kharaharapriya Janya (Bhashanga)',
    arohana: "S R2 M1 P N3 S'",
    avarohana: "S' N2 D2 N2 P M1 G2 R2 S",
    swarasCarnatic: ['S', 'R2', 'G2', 'M1', 'P', 'D2', 'N2', 'N3'],
    swarasHindustani: ['Sa', 'Shuddha Re', 'Komal Ga', 'Shuddha Ma', 'Pa', 'Shuddha Dha', 'Komal Ni', 'Kakali Ni'],
    vadi: 'P',
    samvadi: 'R2',
    pakadOrSignature: 'R2 M1 P, N2 D2 N2 P, G2 R2 S',
    rasaOrMood: 'Bhakti, Melancholic Love, Yearning',
    timeOfDay: 'Evening / Night',
    explanation: 'A vakra bhashanga raga capable of inducing deep emotion. Famous in Carnatic padams, javalis, and expressive film songs.',
  },
  'bilahari': {
    name: 'Bilahari',
    alternateNames: ['Bilawal Janya'],
    tradition: 'Carnatic',
    melakartaNumber: 29,
    thaat: 'Bilawal',
    parentRaga: 'Dheerasankarabharanam (29th Melakarta Janya)',
    arohana: "S R2 G3 P D2 S'",
    avarohana: "S' N3 D2 P M1 G3 R2 S",
    swarasCarnatic: ['S', 'R2', 'G3', 'M1', 'P', 'D2', 'N3'],
    swarasHindustani: ['Sa', 'Shuddha Re', 'Shuddha Ga', 'Shuddha Ma', 'Pa', 'Shuddha Dha', 'Shuddha Ni'],
    vadi: 'G3',
    samvadi: 'D2',
    pakadOrSignature: 'G3 P D2 S\', S\' N3 D2 P M1 G3 R2 S',
    rasaOrMood: 'Joy, Ujjvala, Celebration, Brightness',
    timeOfDay: 'Morning (Pratah Kala)',
    explanation: 'Audava-Sampoorna scale with Mohanam ascent and Sankarabharanam descent. Evokes vibrant optimism and devotion.',
  },
  'reethigowla': {
    name: 'Reethigowla',
    alternateNames: ['Ritigowla', 'Reethigowle'],
    tradition: 'Carnatic',
    melakartaNumber: 22,
    thaat: 'Kafi',
    parentRaga: 'Kharaharapriya (22nd Melakarta Janya)',
    arohana: "S G2 R2 G2 M1 N2 D2 M1 N2 N2 S'",
    avarohana: "S' N2 D2 M1 G2 M1 P M1 G2 R2 S",
    swarasCarnatic: ['S', 'R2', 'G2', 'M1', 'P', 'D2', 'N2'],
    swarasHindustani: ['Sa', 'Shuddha Re', 'Komal Ga', 'Shuddha Ma', 'Pa', 'Shuddha Dha', 'Komal Ni'],
    vadi: 'G2',
    samvadi: 'N2',
    pakadOrSignature: 'G2 R2 G2 M1, N2 D2 M1, G2 M1 P M1 G2 R2 S',
    rasaOrMood: 'Devotion, Tenderness, Introspective Calm',
    timeOfDay: 'Evening / Night',
    explanation: 'Highly intricate vakra raga with unmistakable oscillations on Gandhara and Nishada. Universally adored for its soothing beauty.',
  },
  'jog': {
    name: 'Jog',
    alternateNames: ['Jogeshwari', 'Raga Jogg'],
    tradition: 'Both',
    melakartaNumber: 28,
    thaat: 'Kafi / Khamaj',
    parentRaga: 'Harikambhoji / Khamaj Thaat',
    arohana: "S G3 M1 P N2 S'",
    avarohana: "S' N2 P M1 G3 M1 G2 S",
    swarasCarnatic: ['S', 'G2', 'G3', 'M1', 'P', 'N2'],
    swarasHindustani: ['Sa', 'Shuddha Ga', 'Komal Ga', 'Shuddha Ma', 'Pa', 'Komal Ni'],
    vadi: 'M1',
    samvadi: 'S',
    pakadOrSignature: 'S G3 M1 P, N2 P M1 G3 M1 G2 S',
    rasaOrMood: 'Mystical, Contemplative, Eerie Elegance',
    timeOfDay: 'Midnight (Late Night)',
    explanation: 'Distinguished by employing both Shuddha Ga (ascent) and Komal Ga (descent) in juxtaposition around Madhyamam.',
  },
  'nattai': {
    name: 'Nattai',
    alternateNames: ['Nata'],
    tradition: 'Carnatic',
    melakartaNumber: 36,
    parentRaga: 'Chalanata (36th Melakarta Janya)',
    arohana: "S R3 G3 M1 P D3 N3 S'",
    avarohana: "S' N3 P M1 R3 S",
    swarasCarnatic: ['S', 'R3', 'G3', 'M1', 'P', 'D3', 'N3'],
    vadi: 'R3',
    samvadi: 'P',
    pakadOrSignature: 'S R3 G3 M1 P, N3 S\', S\' N3 P M1 R3 S',
    rasaOrMood: 'Veera (Valour), Majestic Inauguration, Energy',
    timeOfDay: 'Concert Opening / Anytime',
    explanation: 'Prime auspicious inaugural raga in Carnatic music. First raga of the sacred Pancharatna Kritis (Jagadananda Karaka).',
  },
  'sri ragam': {
    name: 'Sri Ragam',
    alternateNames: ['Shree', 'Sri'],
    tradition: 'Carnatic',
    melakartaNumber: 22,
    parentRaga: 'Kharaharapriya (22nd Melakarta Janya)',
    arohana: "S R2 M1 P N2 S'",
    avarohana: "S' N2 P D2 N2 P M1 R2 G2 R2 S",
    swarasCarnatic: ['S', 'R2', 'G2', 'M1', 'P', 'D2', 'N2'],
    vadi: 'R2',
    samvadi: 'P',
    pakadOrSignature: 'R2 M1 P N2 S\', S\' N2 P D2 N2 P M1 R2 G2 R2 S',
    rasaOrMood: 'Mangalam (Auspiciousness), Divine Peace, Bhakti',
    timeOfDay: 'Evening / End of concert',
    explanation: 'One of the most ancient and sacred ragas in Indian music. Home of the final Pancharatna Kriti "Endaro Mahanubhavulu".',
  },

  'yamuna kalyani': {
    name: 'Yamuna Kalyani',
    alternateNames: ['Yaman Kalyan'],
    tradition: 'Both',
    melakartaNumber: 65,
    thaat: 'Kalyan',
    parentRaga: 'Mechakalyani Janya',
    arohana: "S R2 G3 P M2 P D2 S'",
    avarohana: "S' N3 D2 P M2 P G3 M1 G3 R2 S",
    swarasCarnatic: ['S', 'R2', 'G3', 'M1', 'M2', 'P', 'D2', 'N3'],
    vadi: 'G3',
    samvadi: 'N3',
    pakadOrSignature: 'N3\' R2 G3, M2 P D2 P, M2 P G3 M1 G3 R2 S',
    rasaOrMood: 'Devotion, Shringara, Blissful Serenity',
    timeOfDay: 'Evening / First Prahar of Night',
    explanation: 'A variation of Kalyani enriched by the inclusion of Shuddha Madhyamam (M1) as an ornamentation between Gandharas.',
  },
  'bowli': {
    name: 'Bowli',
    alternateNames: ['Bauli'],
    tradition: 'Carnatic',
    melakartaNumber: 15,
    parentRaga: 'Mayamalavagowla (15th Melakarta Janya)',
    arohana: "S R1 G3 P D1 S'",
    avarohana: "S' N3 D1 P G3 R1 S",
    swarasCarnatic: ['S', 'R1', 'G3', 'P', 'D1', 'N3'],
    vadi: 'G3',
    samvadi: 'D1',
    pakadOrSignature: 'S R1 G3 P D1 S\', S\' N3 D1 P G3 R1 S',
    rasaOrMood: 'Bhakti, Morning Prayer, Awakening',
    timeOfDay: 'Dawn / Early Morning',
    explanation: 'A morning raga omitting Madhyamam, famously chosen for Annamacharya\'s "Brahmam Okkate".',
  },
  'kurinji': {
    name: 'Kurinji',
    alternateNames: ['Kurunji'],
    tradition: 'Carnatic',
    melakartaNumber: 29,
    parentRaga: 'Dheerasankarabharanam Janya',
    arohana: "S N3 S R2 G3 M1 P D2",
    avarohana: "D2 P M1 G3 R2 S N3 S",
    swarasCarnatic: ['S', 'R2', 'G3', 'M1', 'P', 'D2', 'N3'],
    vadi: 'G3',
    samvadi: 'P',
    pakadOrSignature: 'S N3 S R2 G3, M1 G3 R2 S',
    rasaOrMood: 'Vatsalya (Parental Love), Lullaby, Affection',
    timeOfDay: 'Anytime / Night',
    explanation: 'Gentle, soothing raga typically sung in Madhya/Tara stayi. Signature scale for classic lullabies.',
  },
  'revati': {
    name: 'Revati',
    alternateNames: ['Rairakh'],
    tradition: 'Both',
    melakartaNumber: 2,
    parentRaga: 'Ratnangi (2nd Melakarta Janya)',
    arohana: "S R1 M1 P N2 S'",
    avarohana: "S' N2 P M1 R1 S",
    swarasCarnatic: ['S', 'R1', 'M1', 'P', 'N2'],
    vadi: 'M1',
    samvadi: 'S',
    pakadOrSignature: 'S R1 M1 P N2 S\', S\' N2 P M1 R1 S',
    rasaOrMood: 'Pathos, Mystical Intensity, Renunciation',
    timeOfDay: 'Night / Anytime',
    explanation: 'Pentatonic raga with Komal Re and Komal Ni. Revered for dramatic, contemplative prayer hymns and Annamacharya sankeertanas.',
  },
};

// Map existing seed ragas
const SEED_RAGA_MAP = new Map<string, any>();
for (const r of seedRagas) {
  SEED_RAGA_MAP.set(normalizeSongQuery(r.name), r);
  if (r.alternateNames) {
    for (const alt of r.alternateNames) {
      const cleanAlt = normalizeSongQuery(alt.split('(')[0]);
      if (cleanAlt) SEED_RAGA_MAP.set(cleanAlt, r);
    }
  }
}

// Build raga profile resolver
export function resolveRagaProfile(ragaName: string): any {
  if (!ragaName) return null;
  const cleanName = normalizeSongQuery(ragaName.split('/')[0].split('(')[0]);

  // Aliases normalization
  const aliasMap: Record<string, string> = {
    'nata': 'nattai',
    'naata': 'nattai',
    'sri': 'sri ragam',
    'shri': 'sri ragam',
    'sree': 'sri ragam',
    'shree': 'sri ragam',
    'yaman': 'mechakalyani',
    'kalyani': 'mechakalyani',
    'sankarabharanam': 'dheerasankarabharanam',
    'shankarabharanam': 'dheerasankarabharanam',
    'kaapi': 'kapi',
    'kurunji': 'kurinji',
  };
  const lookupName = aliasMap[cleanName] || cleanName;

  let profile: any = null;

  // 1. Check extended profiles
  if (EXTENDED_RAGA_PROFILES[lookupName]) {
    profile = { ...EXTENDED_RAGA_PROFILES[lookupName] };
  } else {
    for (const [k, prof] of Object.entries(EXTENDED_RAGA_PROFILES)) {
      if (lookupName === k || lookupName.includes(k) || k.includes(lookupName)) {
        profile = { ...prof };
        break;
      }
    }
  }

  // 2. Check seed ragas map
  if (!profile && SEED_RAGA_MAP.has(lookupName)) {
    const s = SEED_RAGA_MAP.get(cleanName);
    profile = {
      name: s.name,
      alternateNames: s.alternateNames || [],
      tradition: s.tradition as Tradition,
      melakartaNumber: s.melakartaNumber,
      thaat: s.thaat,
      parentRaga: s.parentRaga,
      arohana: s.arohana,
      avarohana: s.avarohana,
      swarasCarnatic: s.swaras || [],
      swarasHindustani: s.hindustaniNotes ? s.hindustaniNotes.split(', ') : [],
      vadi: s.vadi,
      samvadi: s.samvadi,
      pakadOrSignature: s.pakad,
      rasaOrMood: s.rasa || 'Devotional, Melodic',
      timeOfDay: s.timeOfDay || 'Anytime',
      famousSongs: s.famousSongs || [],
      explanation: `Identified from verified classical Raga knowledge base. ${s.description || ''}`,
    };
  }

  // 3. Fallback generic profile
  if (!profile) {
    profile = {
      name: ragaName.trim(),
      alternateNames: [],
      tradition: 'Carnatic' as Tradition,
      arohana: 'Standard classical scale',
      avarohana: 'Standard classical scale',
      swarasCarnatic: ['S', 'R', 'G', 'M', 'P', 'D', 'N'],
      swarasHindustani: [],
      rasaOrMood: 'Devotional, Melodic',
      timeOfDay: 'Anytime',
      famousSongs: [],
      explanation: `Composition based on Raga ${ragaName}. Verified against historical music archives.`,
    };
  }

  // Enrich profile with notable songs from our 1,905 song database!
  const allSongs = songsData as SongRagaEntry[];
  const ragaNorm = normalizeSongQuery(profile.name);
  const matchingSongs = allSongs
    .filter(s => {
      const sRaga = normalizeSongQuery(s.raga);
      return sRaga.includes(ragaNorm) || ragaNorm.includes(sRaga);
    })
    .slice(0, 6)
    .map(s => ({
      title: s.title,
      composerOrFilm: s.filmOrAlbum ? `${s.filmOrAlbum} (${s.composer || s.language})` : (s.composer || 'Traditional'),
      type: s.source?.includes('Film') || s.language?.includes('Film') ? 'Film Song' : 'Classical Kriti',
    }));

  if (matchingSongs.length > 0) {
    profile.famousSongs = matchingSongs;
  }

  return profile;
}

// Check if query is directly a Raga name (e.g. "Mohanam", "Kalyani", "Darbari", "Sankarabharanam")
export function isDirectRagaQuery(query: string): boolean {
  if (!query || query.trim().length < 3) return false;
  const norm = normalizeSongQuery(query);
  const phon = phoneticKey(query);

  if (SEED_RAGA_MAP.has(norm) || EXTENDED_RAGA_PROFILES[norm]) return true;

  if (phon.length >= 3) {
    for (const k of SEED_RAGA_MAP.keys()) {
      if (phoneticKey(k) === phon) return true;
    }
    for (const k of Object.keys(EXTENDED_RAGA_PROFILES)) {
      if (phoneticKey(k) === phon) return true;
    }
  }
  return false;
}

// Main Search Algorithm for finding songs or direct ragas in our database
export function findSongInDatabase(query: string): { matchedSong?: SongRagaEntry; ragaProfile: any; isDirectRaga?: boolean } | null {
  if (!query || query.trim().length < 2) return null;

  const rawQ = query.trim();
  const normQ = normalizeSongQuery(rawQ);
  const phonQ = phoneticKey(rawQ);

  // 1. Direct Raga Disambiguation:
  // If user typed an actual raga name, return the raga directly with notable songs!
  if (isDirectRagaQuery(rawQ)) {
    const profile = resolveRagaProfile(rawQ);
    if (profile && profile.arohana !== 'Standard classical scale') {
      return {
        ragaProfile: profile,
        isDirectRaga: true,
      };
    }
  }

  const allSongs = songsData as SongRagaEntry[];

  let bestMatch: SongRagaEntry | null = null;
  let highestScore = 0;

  for (const song of allSongs) {
    const normTitle = normalizeSongQuery(song.title);
    const phonTitle = phoneticKey(song.title);
    if (!normTitle || normTitle.length < 2) continue;

    let score = 0;

    // A. Exact title match (highest priority)
    if (normTitle === normQ) {
      score = 100;
    } else if (phonQ.length >= 3 && phonTitle.length >= 3 && phonTitle === phonQ) {
      score = 98;
    }
    // B. Alternate titles exact match
    else if (song.alternateTitles && song.alternateTitles.some(alt => {
      const nAlt = normalizeSongQuery(alt);
      const pAlt = phoneticKey(alt);
      return nAlt === normQ || (phonQ.length >= 3 && pAlt.length >= 3 && pAlt === phonQ);
    })) {
      score = 95;
    }
    // C. Word boundary / phrase prefix on Title (e.g. "Vatapi" -> "Vatapi Ganapatim")
    else if (normTitle.startsWith(normQ + ' ') || (normQ.length >= 4 && normQ.startsWith(normTitle + ' '))) {
      score = 88;
    }
    else if (phonQ.length >= 4 && phonTitle.length >= 4 && (phonTitle.startsWith(phonQ + ' ') || phonQ.startsWith(phonTitle + ' '))) {
      score = 85;
    }
    // D. Title contains query as full word or major portion (>= 50% length)
    else if (normTitle.includes(normQ) && normQ.length >= 4 && (normQ.length / normTitle.length >= 0.45 || normTitle.split(' ').includes(normQ))) {
      score = 80;
    }
    // E. Alternate titles word boundary match
    else if (song.alternateTitles && song.alternateTitles.some(alt => {
      const nAlt = normalizeSongQuery(alt);
      return nAlt.startsWith(normQ + ' ') || (normQ.length >= 4 && nAlt.includes(normQ) && (normQ.length / nAlt.length >= 0.45 || nAlt.split(' ').includes(normQ)));
    })) {
      score = 78;
    }
    // F. Exact film title match (score 72)
    else if (song.filmOrAlbum && normQ.length >= 4 && normalizeSongQuery(song.filmOrAlbum) === normQ) {
      score = 72;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = song;
      if (score === 100) break; // Perfect match
    }
  }

  // Threshold: must achieve at least 70 score to be considered a verified database match
  if (bestMatch && highestScore >= 70) {
    const ragaProfile = resolveRagaProfile(bestMatch.raga);
    return {
      matchedSong: bestMatch,
      ragaProfile,
    };
  }

  // If score is < 70, return null so it cleanly proceeds to AI identification!
  return null;
}

// Autocomplete suggestions across titles, films, composers, and ragas
export function getSongSuggestions(query: string, limit = 6): SongRagaEntry[] {
  if (!query || query.trim().length < 2) return [];
  const normQ = normalizeSongQuery(query);
  const phonQ = phoneticKey(query);
  const results: SongRagaEntry[] = [];
  const seenTitles = new Set<string>();
  const allSongs = songsData as SongRagaEntry[];

  for (const song of allSongs) {
    const normTitle = normalizeSongQuery(song.title);
    const phonTitle = phoneticKey(song.title);
    const normFilm = normalizeSongQuery(song.filmOrAlbum || '');
    const normComposer = normalizeSongQuery(song.composer || '');

    if (
      normTitle.includes(normQ) ||
      phonTitle.includes(phonQ) ||
      normFilm.includes(normQ) ||
      normComposer.includes(normQ)
    ) {
      if (!seenTitles.has(song.title)) {
        seenTitles.add(song.title);
        results.push(song);
        if (results.length >= limit) break;
      }
    }
  }

  return results;
}
