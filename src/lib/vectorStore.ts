import seedRagas from '@/data/seed_ragas.json';
import msidbRagasMap from '@/data/msidb_ragas_profiles.json';
import songDatabase from '@/data/song_ragas_db.json';
import { Tradition } from '@/types/raga';

// Standard 16 Carnatic / Hindustani Swaras for pitch vector representation
export const ALL_SWARAS = [
  'S', 'R1', 'R2', 'R3', 'G1', 'G2', 'G3', 'M1', 'M2', 'P', 'D1', 'D2', 'D3', 'N1', 'N2', 'N3'
];

export const THAATS = [
  'kalyan', 'bilawal', 'khamaj', 'kafi', 'asavari', 'bhairav', 'bhairavi', 'todi', 'poorvi', 'marwa'
];

export const RASAS = [
  'bhakti', 'shringara', 'karuna', 'shanta', 'veera', 'gambhira', 'hasya', 'adbhuta', 'pathos', 'devotion', 'romance'
];

export const TIMES = [
  'morning', 'afternoon', 'dusk', 'evening', 'night', 'midnight', 'anytime'
];

export const DENSE_DIM = 192;

export interface IndexedRagaDoc {
  name: string;
  alternateNames: string[];
  tradition: Tradition;
  melakartaNumber?: number;
  thaat?: string;
  parentRaga?: string;
  arohana: string;
  avarohana: string;
  swaras: string[];
  swarasCarnatic: string[];
  swarasHindustani: string[];
  rasa: string;
  timeOfDay: string;
  explanation: string;
  textCorpus: string;
  denseEmbedding: number[];
}

export interface VectorSearchResult {
  raga: IndexedRagaDoc;
  score: number;
  textSimilarity: number;
  swaraSimilarity: number;
  denseSimilarity: number;
}

export interface SongVectorResult {
  title: string;
  filmOrAlbum?: string;
  composer?: string;
  singers?: string;
  raga: string;
  ragas?: string[];
  score: number;
}

export interface ComposerRagaProfile {
  composer: string;
  topRagas: Array<{ raga: string; count: number; sampleTitle: string }>;
  totalSongs: number;
}

// Tokenizer helper
function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

// Fast string hash for dense projection
function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function projectTextToDense(text: string, length: number): number[] {
  const vec = new Array(length).fill(0);
  const words = tokenize(text);
  words.forEach((word) => {
    const h = hashString(word);
    const idx = h % length;
    const sign = h & 0x1000 ? 1 : -1;
    vec[idx] += sign * (1 + Math.log(word.length));
  });
  return vec;
}

function normalizeVector(vec: number[]): number[] {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  if (norm === 0) return vec;
  const sqrtNorm = Math.sqrt(norm);
  return vec.map((v) => v / sqrtNorm);
}

/**
 * Generate 192-dimensional dense embedding vector for a Raga
 */
export function createRagaDenseEmbedding(r: {
  name?: string;
  tradition?: string;
  swaras?: string[];
  swarasCarnatic?: string[];
  melakartaNumber?: number;
  thaat?: string;
  rasa?: string;
  timeOfDay?: string;
  description?: string;
  explanation?: string;
  famousSongs?: any[];
}): number[] {
  const vec = new Array(DENSE_DIM).fill(0);

  // 1. Swaras (indices 0 - 15)
  const swarasList = r.swarasCarnatic || r.swaras || [];
  swarasList.forEach((s) => {
    const idx = ALL_SWARAS.indexOf(s.toUpperCase().trim());
    if (idx !== -1) vec[idx] = 1.0;
  });

  // 2. Scale size & contour (indices 16 - 27)
  const count = swarasList.length;
  if (count <= 5) vec[16] = 1.0; // Audava
  else if (count === 6) vec[17] = 1.0; // Shadava
  else if (count >= 7) vec[18] = 1.0; // Sampoorna

  if (r.tradition === 'Carnatic' || r.tradition === 'Both') vec[19] = 1.0;
  if (r.tradition === 'Hindustani' || r.tradition === 'Both') vec[20] = 1.0;

  if (r.melakartaNumber) {
    const chakra = Math.floor((r.melakartaNumber - 1) / 6);
    vec[21 + (chakra % 6)] = 1.0;
  }

  // 3. Thaat (indices 28 - 37)
  if (r.thaat) {
    const tLower = r.thaat.toLowerCase();
    THAATS.forEach((t, i) => {
      if (tLower.includes(t)) vec[28 + i] = 1.0;
    });
  }

  // 4. Rasa / Mood (indices 38 - 48)
  const rasaText = (r.rasa || '').toLowerCase();
  RASAS.forEach((rasa, i) => {
    if (rasaText.includes(rasa)) vec[38 + i] = 1.2;
  });

  // 5. Time of Day (indices 49 - 55)
  const timeText = (r.timeOfDay || '').toLowerCase();
  TIMES.forEach((time, i) => {
    if (timeText.includes(time)) vec[49 + i] = 1.0;
  });

  // 6. Text projection (indices 56 - 191 = 136 dimensions)
  const corpus = [
    r.name || '',
    r.description || r.explanation || '',
    (r.famousSongs || [])
      .map((s: any) => (typeof s === 'string' ? s : `${s.title} ${s.composerOrFilm || ''}`))
      .join(' '),
  ].join(' ');

  const textProj = projectTextToDense(corpus, 136);
  for (let i = 0; i < 136; i++) {
    vec[56 + i] = textProj[i];
  }

  return normalizeVector(vec);
}

// Vector Database Singleton Class
class MusicologyVectorStore {
  private ragaDocs: IndexedRagaDoc[] = [];
  private ragaTokens: string[][] = [];
  private ragaDocFreq: Map<string, number> = new Map();
  private ragaIdf: Map<string, number> = new Map();
  private ragaTfIdfVectors: Array<Map<string, number>> = [];
  private ragaSwaraVectors: number[][] = [];

  // Song database inverted index
  private songInvertedIndex: Map<string, number[]> = new Map();
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.initialized) return;

    // 1. Ingest Seed Ragas and MSIDB Ragas
    const seen = new Set<string>();

    const ingestRaga = (r: any) => {
      if (!r || !r.name) return;
      const key = r.name.toLowerCase().trim();
      if (seen.has(key)) return;
      seen.add(key);

      const swarasList: string[] = r.swaras || r.swarasCarnatic || [];
      const textCorpus = [
        r.name,
        ...(r.alternateNames || []),
        r.tradition,
        r.thaat || '',
        r.parentRaga || '',
        r.rasa || r.rasaOrMood || '',
        r.timeOfDay || '',
        r.description || r.explanation || '',
        (r.famousSongs || [])
          .map((s: any) => (typeof s === 'string' ? s : `${s.title} ${s.composerOrFilm || ''}`))
          .join(' '),
      ]
        .join(' ')
        .toLowerCase();

      const denseEmbedding = createRagaDenseEmbedding({
        name: r.name,
        tradition: r.tradition,
        swaras: swarasList,
        swarasCarnatic: r.swarasCarnatic || swarasList,
        melakartaNumber: r.melakartaNumber,
        thaat: r.thaat,
        rasa: r.rasa || r.rasaOrMood || '',
        timeOfDay: r.timeOfDay || '',
        description: r.description,
        explanation: r.explanation,
        famousSongs: r.famousSongs,
      });

      this.ragaDocs.push({
        name: r.name,
        alternateNames: r.alternateNames || [],
        tradition: (r.tradition as Tradition) || 'Both',
        melakartaNumber: r.melakartaNumber,
        thaat: r.thaat,
        parentRaga: r.parentRaga,
        arohana: r.arohana || 'Standard classical scale',
        avarohana: r.avarohana || 'Standard classical scale',
        swaras: swarasList,
        swarasCarnatic: r.swarasCarnatic || swarasList,
        swarasHindustani: r.swarasHindustani || [],
        rasa: r.rasa || r.rasaOrMood || 'Melodic',
        timeOfDay: r.timeOfDay || 'Anytime',
        explanation: r.explanation || r.description || '',
        textCorpus,
        denseEmbedding,
      });
    };

    // Ingest seed ragas
    for (const r of seedRagas) {
      ingestRaga(r);
    }

    // Ingest MSIDB ragas
    const msidbValues = Object.values(msidbRagasMap);
    for (const r of msidbValues) {
      ingestRaga(r);
    }

    // 2. Build TF-IDF vectors for Ragas
    const N = this.ragaDocs.length;
    this.ragaTokens = this.ragaDocs.map((doc) => {
      const tokens = tokenize(doc.textCorpus);
      const unique = new Set(tokens);
      unique.forEach((t) => {
        this.ragaDocFreq.set(t, (this.ragaDocFreq.get(t) || 0) + 1);
      });
      return tokens;
    });

    this.ragaDocFreq.forEach((df, term) => {
      this.ragaIdf.set(term, Math.log((N + 1) / (df + 1)) + 1);
    });

    for (let i = 0; i < N; i++) {
      const tokens = this.ragaTokens[i];
      const doc = this.ragaDocs[i];

      // TF map
      const tf = new Map<string, number>();
      tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));

      // TF-IDF map
      const tfidf = new Map<string, number>();
      tf.forEach((count, t) => {
        const idfVal = this.ragaIdf.get(t);
        if (idfVal !== undefined) {
          tfidf.set(t, (count / tokens.length) * idfVal);
        }
      });
      this.ragaTfIdfVectors.push(tfidf);

      // Swara pitch bitvector
      const sVec = new Array(ALL_SWARAS.length).fill(0);
      doc.swaras.forEach((s) => {
        const idx = ALL_SWARAS.indexOf(s.toUpperCase().trim());
        if (idx !== -1) sVec[idx] = 1;
      });
      this.ragaSwaraVectors.push(sVec);
    }

    // 3. Build Inverted Index for 5,187 Songs
    for (let i = 0; i < songDatabase.length; i++) {
      const s: any = songDatabase[i];
      const songText = `${s.title} ${s.filmOrAlbum || ''} ${s.composer || ''} ${s.singers || ''} ${s.raga || ''}`;
      const sTokens = new Set(tokenize(songText));
      sTokens.forEach((t) => {
        let list = this.songInvertedIndex.get(t);
        if (!list) {
          list = [];
          this.songInvertedIndex.set(t, list);
        }
        list.push(i);
      });
    }

    this.initialized = true;
  }

  private cosineSim(vecA: Map<string, number>, vecB: Map<string, number>): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    vecA.forEach((val, term) => {
      normA += val * val;
      const bVal = vecB.get(term);
      if (bVal !== undefined) {
        dot += val * bVal;
      }
    });

    vecB.forEach((val) => {
      normB += val * val;
    });

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private swaraSim(vecA: number[], vecB: number[]): number {
    let dot = 0;
    let sumA = 0;
    let sumB = 0;
    for (let i = 0; i < vecA.length; i++) {
      if (vecA[i] && vecB[i]) dot++;
      if (vecA[i]) sumA++;
      if (vecB[i]) sumB++;
    }
    const union = sumA + sumB - dot;
    return union > 0 ? dot / union : 0;
  }

  private denseSim(vecA: number[], vecB: number[]): number {
    let dot = 0;
    for (let i = 0; i < DENSE_DIM; i++) {
      dot += vecA[i] * vecB[i];
    }
    return dot;
  }

  /**
   * Search Ragas using Hybrid Vector + Dense Embeddings + Swara Overlap
   */
  public searchRagas(
    queryText: string,
    querySwaras: string[] = [],
    topK = 5
  ): VectorSearchResult[] {
    const qTokens = tokenize(queryText);
    const qTf = new Map<string, number>();
    qTokens.forEach((t) => qTf.set(t, (qTf.get(t) || 0) + 1));

    const qTfIdf = new Map<string, number>();
    qTf.forEach((count, t) => {
      const idfVal = this.ragaIdf.get(t);
      if (idfVal !== undefined) {
        qTfIdf.set(t, (count / qTokens.length) * idfVal);
      }
    });

    const qSVec = new Array(ALL_SWARAS.length).fill(0);
    querySwaras.forEach((s) => {
      const idx = ALL_SWARAS.indexOf(s.toUpperCase().trim());
      if (idx !== -1) qSVec[idx] = 1;
    });

    // Dense query vector
    const qDense = createRagaDenseEmbedding({
      name: queryText,
      swaras: querySwaras,
      description: queryText,
      rasa: queryText,
      timeOfDay: queryText,
    });

    const hasSwaras = querySwaras.length > 0;
    const results: VectorSearchResult[] = [];

    for (let i = 0; i < this.ragaDocs.length; i++) {
      const doc = this.ragaDocs[i];
      const targetTfIdf = this.ragaTfIdfVectors[i];
      const targetSVec = this.ragaSwaraVectors[i];
      const targetDense = doc.denseEmbedding;

      const textSimilarity = this.cosineSim(qTfIdf, targetTfIdf);
      const swaraSimilarity = hasSwaras ? this.swaraSim(qSVec, targetSVec) : 0;
      const denseSimilarity = this.denseSim(qDense, targetDense);

      // Blended Multi-Modal Embedding Score
      const score = hasSwaras
        ? denseSimilarity * 0.35 + textSimilarity * 0.25 + swaraSimilarity * 0.40
        : denseSimilarity * 0.60 + textSimilarity * 0.40;

      if (score > 0.04) {
        results.push({
          raga: doc,
          score,
          textSimilarity,
          swaraSimilarity,
          denseSimilarity,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Search Songs in the 5,187 database using vector term relevance
   */
  public searchSongs(queryText: string, topK = 5): SongVectorResult[] {
    const qTokens = tokenize(queryText);
    const scores = new Map<number, number>();
    const totalSongs = songDatabase.length;

    qTokens.forEach((t) => {
      const postings = this.songInvertedIndex.get(t);
      if (postings) {
        const idf = Math.log((totalSongs + 1) / (postings.length + 1)) + 1;
        postings.forEach((idx) => {
          scores.set(idx, (scores.get(idx) || 0) + idf);
        });
      }
    });

    const ranked = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK);

    return ranked.map(([idx, score]) => {
      const s: any = songDatabase[idx];
      return {
        title: s.title,
        filmOrAlbum: s.filmOrAlbum,
        composer: s.composer,
        singers: s.singers,
        raga: s.raga,
        ragas: s.ragas,
        score,
      };
    });
  }

  /**
   * Extract composer raga preferences and tendencies from database
   */
  public getComposerProfile(composerQuery: string): ComposerRagaProfile | null {
    if (!composerQuery || composerQuery.trim().length < 3) return null;
    const cTokens = tokenize(composerQuery);
    if (cTokens.length === 0) return null;

    const composerSongs: any[] = [];
    for (const song of songDatabase as any[]) {
      if (!song.composer) continue;
      const cLower = song.composer.toLowerCase();
      if (cTokens.some((t) => cLower.includes(t))) {
        composerSongs.push(song);
      }
    }

    if (composerSongs.length === 0) return null;

    // Count frequency of ragas used by this composer
    const ragaCounts = new Map<string, { count: number; sampleTitle: string }>();
    for (const s of composerSongs) {
      if (!s.raga) continue;
      const existing = ragaCounts.get(s.raga) || { count: 0, sampleTitle: s.title };
      existing.count += 1;
      ragaCounts.set(s.raga, existing);
    }

    const sortedRagas = Array.from(ragaCounts.entries())
      .map(([raga, data]) => ({ raga, count: data.count, sampleTitle: data.sampleTitle }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      composer: composerQuery,
      topRagas: sortedRagas,
      totalSongs: composerSongs.length,
    };
  }

  /**
   * Look up exact or canonical raga document
   */
  public getRagaDoc(name: string): IndexedRagaDoc | undefined {
    const norm = name.toLowerCase().trim();
    return this.ragaDocs.find(
      (r) =>
        r.name.toLowerCase() === norm ||
        r.alternateNames.some((alt) => alt.toLowerCase() === norm)
    );
  }

  public getAllRagas(): IndexedRagaDoc[] {
    return this.ragaDocs;
  }
}

// Global Singleton Instance
export const vectorStore = new MusicologyVectorStore();
