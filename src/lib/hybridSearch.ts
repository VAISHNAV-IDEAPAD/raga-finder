import { structuredDb, StructuredSongFilters, ExtractedQueryFacets } from './structuredDb';
import { vectorStore, IndexedRagaDoc } from './vectorStore';
import { SongRagaEntry, RagaProfile } from '@/types/raga';

export interface HybridSongResult {
  song: SongRagaEntry;
  score: number;
  sparseRank?: number;
  denseRank?: number;
  matchedFacets?: Partial<ExtractedQueryFacets>;
}

export interface HybridRagaResult {
  raga: RagaProfile;
  score: number;
  sparseRank?: number;
  denseRank?: number;
  swaraSimilarity?: number;
  matchedFacets?: Partial<ExtractedQueryFacets>;
}

function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

class HybridSearchEngine {
  private songsBM25InvertedIndex: Map<string, number[]> = new Map();
  private docTokens: string[][] = [];
  private docLengths: number[] = [];
  private avgDocLength = 0;
  private totalSongs = 0;
  private k1 = 1.2;
  private b = 0.75;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.initialized) return;

    const songs = structuredDb.songs;
    this.totalSongs = songs.length;
    let totalLen = 0;

    for (let i = 0; i < this.totalSongs; i++) {
      const s = songs[i];
      const text = `${s.title} ${s.filmOrAlbum || ''} ${s.composer || ''} ${s.lyricist || ''} ${s.singers || ''} ${s.raga || ''}`;
      const tokens = tokenize(text);
      this.docTokens.push(tokens);
      this.docLengths.push(tokens.length);
      totalLen += tokens.length;

      const unique = new Set(tokens);
      unique.forEach((t) => {
        let list = this.songsBM25InvertedIndex.get(t);
        if (!list) {
          list = [];
          this.songsBM25InvertedIndex.set(t, list);
        }
        list.push(i);
      });
    }

    this.avgDocLength = this.totalSongs > 0 ? totalLen / this.totalSongs : 1;
    this.initialized = true;
  }

  /**
   * BM25 Sparse Search over Song Database
   */
  private searchSongsBM25(query: string, topK = 30): Array<{ docIdx: number; score: number; rank: number }> {
    const qTokens = tokenize(query);
    const scores = new Map<number, number>();

    qTokens.forEach((term) => {
      const postings = this.songsBM25InvertedIndex.get(term);
      if (postings) {
        const df = postings.length;
        const idf = Math.log((this.totalSongs - df + 0.5) / (df + 0.5) + 1);

        postings.forEach((docIdx) => {
          const tokens = this.docTokens[docIdx];
          let tf = 0;
          for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === term) tf++;
          }

          const dl = this.docLengths[docIdx];
          const num = tf * (this.k1 + 1);
          const den = tf + this.k1 * (1 - this.b + this.b * (dl / this.avgDocLength));
          const termScore = idf * (num / den);

          scores.set(docIdx, (scores.get(docIdx) || 0) + termScore);
        });
      }
    });

    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([docIdx, score], rank) => ({ docIdx, score, rank }));
  }

  /**
   * Hybrid Search over Songs (Dense Embeddings + BM25 Sparse + Structured Relational DB)
   */
  public searchSongs(query: string, filters?: StructuredSongFilters, topK = 10): HybridSongResult[] {
    const facets = structuredDb.parseQueryFacets(query);

    // 1. Sparse BM25 Search
    const sparseMatches = this.searchSongsBM25(query, 40);

    // 2. Dense Vector Search
    const denseMatches = vectorStore.searchSongs(query, 40);

    // 3. Structured DB Candidates (if filters or facets found)
    const activeFilters: StructuredSongFilters = {
      ...filters,
      composer: filters?.composer || facets.composer,
      singer: filters?.singer || facets.singer,
      raga: filters?.raga || facets.raga,
    };

    const structuredCandidates = (activeFilters.composer || activeFilters.singer || activeFilters.raga)
      ? structuredDb.querySongs(activeFilters)
      : [];

    const structuredIndices = new Set(
      structuredCandidates.map((s) => structuredDb.songs.indexOf(s)).filter((idx) => idx !== -1)
    );

    // 4. Reciprocal Rank Fusion (RRF)
    const k = 60;
    const rrfScores = new Map<number, { score: number; sparseRank?: number; denseRank?: number }>();

    sparseMatches.forEach((m) => {
      const entry = rrfScores.get(m.docIdx) || { score: 0 };
      entry.score += 0.55 / (k + m.rank);
      entry.sparseRank = m.rank;
      rrfScores.set(m.docIdx, entry);
    });

    denseMatches.forEach((m, denseRank) => {
      // Find docIdx of song
      const docIdx = structuredDb.songs.findIndex(
        (s) => s.title === m.title && s.filmOrAlbum === m.filmOrAlbum
      );
      if (docIdx !== -1) {
        const entry = rrfScores.get(docIdx) || { score: 0 };
        entry.score += 0.45 / (k + denseRank);
        entry.denseRank = denseRank;
        rrfScores.set(docIdx, entry);
      }
    });

    // Exact Title & Structured Match Bonuses
    const normQ = query.toLowerCase().trim();
    for (let i = 0; i < structuredDb.songs.length; i++) {
      const s = structuredDb.songs[i];
      const titleLower = s.title.toLowerCase().trim();

      // Exact title match gets super boost
      if (titleLower === normQ) {
        const entry = rrfScores.get(i) || { score: 0 };
        entry.score += 1.5;
        rrfScores.set(i, entry);
      } else if (titleLower.startsWith(normQ + ' ') || normQ.startsWith(titleLower + ' ')) {
        const entry = rrfScores.get(i) || { score: 0 };
        entry.score += 0.4;
        rrfScores.set(i, entry);
      }

      // Structured match bonus
      if (structuredIndices.has(i)) {
        const entry = rrfScores.get(i) || { score: 0 };
        entry.score += 0.35;
        rrfScores.set(i, entry);
      }
    }

    const ranked = Array.from(rrfScores.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, topK);

    return ranked.map(([docIdx, info]) => ({
      song: structuredDb.songs[docIdx],
      score: Math.round(info.score * 1000) / 1000,
      sparseRank: info.sparseRank,
      denseRank: info.denseRank,
      matchedFacets: facets,
    }));
  }

  /**
   * Hybrid Search over Ragas (192-Dim Dense Embeddings + Exact Swaras + Structured Relational DB)
   */
  public searchRagas(
    query: string,
    swaras: string[] = [],
    topK = 5
  ): HybridRagaResult[] {
    const facets = structuredDb.parseQueryFacets(query);

    // 1. Dense Multi-Modal Vector Search (incorporating 192-dim embeddings + swaras)
    const vectorMatches = vectorStore.searchRagas(query, swaras, 20);

    // 2. Structured Raga Filtering (Melakarta, Thaat, Tradition)
    const structuredRagas = (facets.melakartaNumber || facets.thaat || facets.tradition)
      ? structuredDb.queryRagas({
          melakartaNumber: facets.melakartaNumber,
          thaat: facets.thaat,
          tradition: facets.tradition,
        })
      : [];

    const structuredNames = new Set(structuredRagas.map((r) => r.name.toLowerCase()));

    // 3. Reciprocal Rank Fusion & Structured Weighting
    const k = 60;
    const finalScores: Array<{ raga: RagaProfile; score: number; denseRank: number; swaraSim: number }> = [];

    vectorMatches.forEach((m, denseRank) => {
      let score = 1.0 / (k + denseRank);

      // Swara pitch interval weight
      if (m.swaraSimilarity > 0) {
        score += m.swaraSimilarity * 0.5;
      }

      // Structured facet boost (e.g. matched Melakarta number or Thaat from query)
      if (structuredNames.has(m.raga.name.toLowerCase())) {
        score += 0.4;
      }

      // Exact name match boost
      const rNorm = m.raga.name.toLowerCase();
      const qNorm = query.toLowerCase().trim();
      if (rNorm === qNorm || m.raga.alternateNames.some((alt) => alt.toLowerCase() === qNorm)) {
        score += 1.2;
      }

      // Build RagaProfile
      const profile: RagaProfile = {
        name: m.raga.name,
        alternateNames: m.raga.alternateNames,
        tradition: m.raga.tradition,
        melakartaNumber: m.raga.melakartaNumber,
        thaat: m.raga.thaat,
        parentRaga: m.raga.parentRaga,
        arohana: m.raga.arohana,
        avarohana: m.raga.avarohana,
        swarasCarnatic: m.raga.swarasCarnatic,
        swarasHindustani: m.raga.swarasHindustani,
        rasaOrMood: m.raga.rasa,
        timeOfDay: m.raga.timeOfDay,
        famousSongs: [],
        explanation: m.raga.explanation,
      };

      finalScores.push({
        raga: profile,
        score,
        denseRank,
        swaraSim: m.swaraSimilarity,
      });
    });

    finalScores.sort((a, b) => b.score - a.score);

    return finalScores.slice(0, topK).map((item) => ({
      raga: item.raga,
      score: Math.round(item.score * 1000) / 1000,
      denseRank: item.denseRank,
      swaraSimilarity: item.swaraSim,
      matchedFacets: facets,
    }));
  }
}

export const hybridSearch = new HybridSearchEngine();
