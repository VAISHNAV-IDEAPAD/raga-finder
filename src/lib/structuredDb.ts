import songDatabase from '@/data/song_ragas_db.json';
import seedRagas from '@/data/seed_ragas.json';
import msidbRagasMap from '@/data/msidb_ragas_profiles.json';
import { SongRagaEntry, Tradition, RagaProfile } from '@/types/raga';

export interface StructuredSongFilters {
  composer?: string;
  raga?: string;
  film?: string;
  singer?: string;
  language?: string;
  year?: string;
}

export interface StructuredRagaFilters {
  tradition?: Tradition;
  melakartaNumber?: number;
  thaat?: string;
  rasa?: string;
  timeOfDay?: string;
}

export interface ExtractedQueryFacets {
  cleanQuery: string;
  composer?: string;
  raga?: string;
  singer?: string;
  language?: string;
  melakartaNumber?: number;
  thaat?: string;
  tradition?: Tradition;
}

function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

/**
 * High-Speed Structured Musicology Database
 */
class StructuredMusicologyDB {
  public songs: SongRagaEntry[] = [];
  public ragas: RagaProfile[] = [];

  // Structured Inverted Indices for Songs
  private songByComposer: Map<string, Set<number>> = new Map();
  private songByRaga: Map<string, Set<number>> = new Map();
  private songByFilm: Map<string, Set<number>> = new Map();
  private songBySinger: Map<string, Set<number>> = new Map();
  private songByLanguage: Map<string, Set<number>> = new Map();
  private songByYear: Map<string, Set<number>> = new Map();

  // Structured Inverted Indices for Ragas
  private ragaByName: Map<string, number> = new Map();
  private ragaByTradition: Map<string, Set<number>> = new Map();
  private ragaByMelakarta: Map<number, number> = new Map();
  private ragaByThaat: Map<string, Set<number>> = new Map();

  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.initialized) return;

    this.songs = songDatabase as SongRagaEntry[];

    // 1. Build Song Structured Indices
    this.songs.forEach((s, idx) => {
      // Index by Composer
      if (s.composer) {
        const compTokens = normalize(s.composer).split(/\s+/).filter((t) => t.length > 2);
        compTokens.forEach((token) => {
          let set = this.songByComposer.get(token);
          if (!set) {
            set = new Set();
            this.songByComposer.set(token, set);
          }
          set.add(idx);
        });
      }

      // Index by Raga (handling multi-ragas)
      const rList = s.ragas && s.ragas.length > 0
        ? s.ragas
        : s.raga ? s.raga.split(/[\/,]+/).map((r) => r.trim()).filter(Boolean) : [];

      rList.forEach((rName) => {
        const normR = normalize(rName);
        if (normR) {
          let set = this.songByRaga.get(normR);
          if (!set) {
            set = new Set();
            this.songByRaga.set(normR, set);
          }
          set.add(idx);
        }
      });

      // Index by Film / Album
      if (s.filmOrAlbum) {
        const filmTokens = normalize(s.filmOrAlbum).split(/\s+/).filter((t) => t.length > 2);
        filmTokens.forEach((token) => {
          let set = this.songByFilm.get(token);
          if (!set) {
            set = new Set();
            this.songByFilm.set(token, set);
          }
          set.add(idx);
        });
      }

      // Index by Singer
      if (s.singers) {
        const singerTokens = normalize(s.singers).split(/\s+/).filter((t) => t.length > 2);
        singerTokens.forEach((token) => {
          let set = this.songBySinger.get(token);
          if (!set) {
            set = new Set();
            this.songBySinger.set(token, set);
          }
          set.add(idx);
        });
      }

      // Index by Language
      if (s.language) {
        const normLang = normalize(s.language);
        let set = this.songByLanguage.get(normLang);
        if (!set) {
          set = new Set();
          this.songByLanguage.set(normLang, set);
        }
        set.add(idx);
      }

      // Index by Year
      if (s.year) {
        const y = s.year.trim();
        let set = this.songByYear.get(y);
        if (!set) {
          set = new Set();
          this.songByYear.set(y, set);
        }
        set.add(idx);
      }
    });

    // 2. Build Ragas Structured Indices
    const seenRagas = new Set<string>();

    const ingestRagaProfile = (r: any) => {
      if (!r || !r.name) return;
      const normName = normalize(r.name);
      if (seenRagas.has(normName)) return;
      seenRagas.add(normName);

      const profile: RagaProfile = {
        name: r.name,
        alternateNames: r.alternateNames || [],
        tradition: (r.tradition as Tradition) || 'Both',
        melakartaNumber: r.melakartaNumber || undefined,
        thaat: r.thaat || undefined,
        parentRaga: r.parentRaga || undefined,
        arohana: r.arohana || 'Standard classical scale',
        avarohana: r.avarohana || 'Standard classical scale',
        swarasCarnatic: r.swarasCarnatic || r.swaras || [],
        swarasHindustani: r.swarasHindustani || [],
        rasaOrMood: r.rasaOrMood || r.rasa || 'Melodic',
        timeOfDay: r.timeOfDay || 'Anytime',
        famousSongs: r.famousSongs || [],
        explanation: r.explanation || r.description || '',
      };

      const rIdx = this.ragas.length;
      this.ragas.push(profile);

      this.ragaByName.set(normName, rIdx);
      (r.alternateNames || []).forEach((alt: string) => {
        this.ragaByName.set(normalize(alt), rIdx);
      });

      // Tradition
      const tradKey = profile.tradition.toLowerCase();
      let tradSet = this.ragaByTradition.get(tradKey);
      if (!tradSet) {
        tradSet = new Set();
        this.ragaByTradition.set(tradKey, tradSet);
      }
      tradSet.add(rIdx);

      // Melakarta
      if (profile.melakartaNumber) {
        this.ragaByMelakarta.set(profile.melakartaNumber, rIdx);
      }

      // Thaat
      if (profile.thaat) {
        const thaatKey = normalize(profile.thaat);
        let thaatSet = this.ragaByThaat.get(thaatKey);
        if (!thaatSet) {
          thaatSet = new Set();
          this.ragaByThaat.set(thaatKey, thaatSet);
        }
        thaatSet.add(rIdx);
      }
    };

    seedRagas.forEach(ingestRagaProfile);
    Object.values(msidbRagasMap).forEach(ingestRagaProfile);

    this.initialized = true;
  }

  /**
   * Look up a Raga Profile by canonical or alternate name
   */
  public getRagaByName(name: string): RagaProfile | null {
    if (!name) return null;
    const norm = normalize(name);
    const idx = this.ragaByName.get(norm);
    if (idx !== undefined && this.ragas[idx]) return this.ragas[idx];

    // Substring or alternate name fallback
    return (
      this.ragas.find((r) => {
        if (normalize(r.name) === norm) return true;
        if (r.alternateNames?.some((alt) => normalize(alt) === norm)) return true;
        return false;
      }) || null
    );
  }

  /**
   * Get compositions composed in a given raga
   */
  public getSongsForRaga(ragaName: string, limit = 10): SongRagaEntry[] {
    if (!ragaName) return [];
    const norm = normalize(ragaName);
    const indices = this.songByRaga.get(norm);
    if (!indices) return [];
    return Array.from(indices)
      .slice(0, limit)
      .map((i) => this.songs[i]);
  }

  /**
   * Search songs by query string with optional attribute filters
   */
  public searchSongs(query: string, filters: StructuredSongFilters = {}, limit = 10): SongRagaEntry[] {
    const normQ = normalize(query);
    if (!normQ) return this.querySongs(filters).slice(0, limit);

    const matches: SongRagaEntry[] = [];
    for (const song of this.songs) {
      const titleNorm = normalize(song.title);
      if (titleNorm.includes(normQ) || (song.filmOrAlbum && normalize(song.filmOrAlbum).includes(normQ))) {
        if (filters.composer && (!song.composer || !normalize(song.composer).includes(normalize(filters.composer)))) continue;
        if (filters.raga && (!song.raga || !normalize(song.raga).includes(normalize(filters.raga)))) continue;
        matches.push(song);
        if (matches.length >= limit) break;
      }
    }
    return matches;
  }

  /**
   * Filter Songs by Structured Attributes
   */
  public querySongs(filters: StructuredSongFilters): SongRagaEntry[] {
    let candidateIndices: Set<number> | null = null;

    if (filters.composer) {
      const compTokens = normalize(filters.composer).split(/\s+/).filter((t) => t.length > 2);
      compTokens.forEach((t) => {
        const matches = this.songByComposer.get(t);
        if (matches) {
          candidateIndices = candidateIndices
            ? new Set([...candidateIndices].filter((i) => matches.has(i)))
            : new Set(matches);
        }
      });
    }

    if (filters.raga) {
      const normR = normalize(filters.raga);
      const matches = this.songByRaga.get(normR);
      if (matches) {
        candidateIndices = candidateIndices
          ? new Set([...candidateIndices].filter((i) => matches.has(i)))
          : new Set(matches);
      }
    }

    if (filters.film) {
      const filmTokens = normalize(filters.film).split(/\s+/).filter((t) => t.length > 2);
      filmTokens.forEach((t) => {
        const matches = this.songByFilm.get(t);
        if (matches) {
          candidateIndices = candidateIndices
            ? new Set([...candidateIndices].filter((i) => matches.has(i)))
            : new Set(matches);
        }
      });
    }

    if (filters.singer) {
      const singerTokens = normalize(filters.singer).split(/\s+/).filter((t) => t.length > 2);
      singerTokens.forEach((t) => {
        const matches = this.songBySinger.get(t);
        if (matches) {
          candidateIndices = candidateIndices
            ? new Set([...candidateIndices].filter((i) => matches.has(i)))
            : new Set(matches);
        }
      });
    }

    if (filters.language) {
      const normLang = normalize(filters.language);
      const matches = this.songByLanguage.get(normLang);
      if (matches) {
        candidateIndices = candidateIndices
          ? new Set([...candidateIndices].filter((i) => matches.has(i)))
          : new Set(matches);
      }
    }

    if (!candidateIndices) return [];
    return Array.from(candidateIndices).map((idx) => this.songs[idx]);
  }

  /**
   * Filter Ragas by Structured Attributes
   */
  public queryRagas(filters: StructuredRagaFilters): RagaProfile[] {
    let candidateIndices: Set<number> | null = null;

    if (filters.melakartaNumber) {
      const rIdx = this.ragaByMelakarta.get(filters.melakartaNumber);
      if (rIdx !== undefined) {
        candidateIndices = new Set([rIdx]);
      } else {
        return [];
      }
    }

    if (filters.tradition) {
      const tradMatches = this.ragaByTradition.get(filters.tradition.toLowerCase());
      if (tradMatches) {
        candidateIndices = candidateIndices
          ? new Set([...candidateIndices].filter((i) => tradMatches.has(i)))
          : new Set(tradMatches);
      }
    }

    if (filters.thaat) {
      const thaatMatches = this.ragaByThaat.get(normalize(filters.thaat));
      if (thaatMatches) {
        candidateIndices = candidateIndices
          ? new Set([...candidateIndices].filter((i) => thaatMatches.has(i)))
          : new Set(thaatMatches);
      }
    }

    if (!candidateIndices) return this.ragas;
    return Array.from(candidateIndices).map((idx) => this.ragas[idx]);
  }

  /**
   * Intelligently extract structured entities/facets from freeform queries
   */
  public parseQueryFacets(rawQuery: string): ExtractedQueryFacets {
    const qLower = rawQuery.toLowerCase();
    const facets: ExtractedQueryFacets = { cleanQuery: rawQuery };

    // 1. Check for Melakarta Number (e.g. "melakarta 22", "22nd melakarta", "chakra 4")
    const melMatch = qLower.match(/\b(?:melakarta|mela|melakartha)\s*(?:#|no\.?|number)?\s*(\d{1,2})\b|\b(\d{1,2})(?:st|nd|rd|th)?\s*melakarta\b/);
    if (melMatch) {
      const num = parseInt(melMatch[1] || melMatch[2], 10);
      if (num >= 1 && num <= 72) {
        facets.melakartaNumber = num;
      }
    }

    // 2. Check for Thaat (e.g. "kalyan thaat", "bhairav thaat")
    const thaatMatch = qLower.match(/\b(bilawal|kalyan|khamaj|kafi|asavari|bhairav|bhairavi|todi|poorvi|marwa)\s*(?:thaat)?\b/);
    if (thaatMatch && qLower.includes('thaat')) {
      facets.thaat = thaatMatch[1];
    }

    // 3. Check for Tradition
    if (qLower.includes('carnatic') && !qLower.includes('hindustani')) {
      facets.tradition = 'Carnatic';
    } else if (qLower.includes('hindustani') && !qLower.includes('carnatic')) {
      facets.tradition = 'Hindustani';
    }

    // 4. Check for known Composers
    const knownComposers = [
      'ilaiyaraaja', 'ilayaraja', 'a r rahman', 'rahman', 'devarajan', 'g devarajan',
      'raveendran', 'johnson', 'vidyasagar', 'm s viswanathan', 'm s v', 'm m keeravani',
      'mithoon', 'pritam', 's thaman', 'thaman', 'harris jayaraj', 'anirudh', 'salil chowdhury',
      'thyagaraja', 'dikshitar', 'syama sastri', 'purandara dasa', 'swathi thirunal'
    ];
    for (const c of knownComposers) {
      if (qLower.includes(c)) {
        facets.composer = c;
        break;
      }
    }

    // 5. Check for known Singers
    const knownSingers = [
      'yesudas', 'k j yesudas', 'chithra', 'k s chithra', 'janaki', 's janaki',
      'spb', 's p balasubrahmanyam', 'shreya ghoshal', 'arijit singh', 'sid sriram',
      'bombay jayashri', 'sujatha', 'mg sreekumar', 'p susheela'
    ];
    for (const s of knownSingers) {
      if (qLower.includes(s)) {
        facets.singer = s;
        break;
      }
    }

    return facets;
  }
}

export const structuredDb = new StructuredMusicologyDB();
