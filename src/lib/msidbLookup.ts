import { request as httpsRequest } from 'https';
import { SongRagaEntry } from '@/types/raga';
import { resolveRagaProfile, normalizeSongQuery, phoneticKey } from './songSearch';

// In-memory cache for live MSIDB queries
const MSIDB_CACHE = new Map<string, { matchedSong: SongRagaEntry; ragaProfile: any } | null>();

/**
 * MSIDB's certificate chain is currently incomplete. Keep the compatibility
 * exception tightly scoped to these public, read-only catalogue requests;
 * never change TLS verification for the rest of the Next.js server.
 */
function fetchMSIDBHtml(url: string): Promise<{ ok: boolean; status: number; html: string }> {
  return new Promise((resolve, reject) => {
    const request = httpsRequest(
      url,
      {
        headers: {
          'User-Agent': 'RagaFinder/1.0 (+https://raga-finder-ideapad.vercel.app)',
          Accept: 'text/html,application/xhtml+xml',
        },
        rejectUnauthorized: false,
        timeout: 4500,
      },
      response => {
        const chunks: Buffer[] = [];
        response.on('data', chunk => chunks.push(Buffer.from(chunk)));
        response.on('end', () => {
          resolve({
            ok: Boolean(response.statusCode && response.statusCode >= 200 && response.statusCode < 300),
            status: response.statusCode || 0,
            html: Buffer.concat(chunks).toString('utf8'),
          });
        });
      }
    );

    request.once('timeout', () => request.destroy(new Error('MSIDB request timed out')));
    request.once('error', reject);
    request.end();
  });
}

function titleMatchScore(query: string, title: string): number {
  const normalizedQuery = normalizeSongQuery(query);
  const normalizedTitle = normalizeSongQuery(title);
  const queryPhonetic = phoneticKey(query);
  const titlePhonetic = phoneticKey(title);

  if (normalizedQuery === normalizedTitle) return 100;
  if (queryPhonetic.length >= 3 && queryPhonetic === titlePhonetic) return 98;
  if (normalizedTitle.startsWith(`${normalizedQuery} `) || normalizedQuery.startsWith(`${normalizedTitle} `)) return 90;

  const queryWords = new Set(normalizedQuery.split(' ').filter(Boolean));
  const titleWords = new Set(normalizedTitle.split(' ').filter(Boolean));
  const overlap = [...queryWords].filter(word => titleWords.has(word)).length;
  return queryWords.size ? Math.round((overlap / queryWords.size) * 80) : 0;
}

function cleanHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function lookupSongOnMSIDB(
  rawQuery: string
): Promise<{ matchedSong: SongRagaEntry; ragaProfile: any } | null> {
  if (!rawQuery || rawQuery.trim().length < 2) return null;

  const qNorm = normalizeSongQuery(rawQuery);
  const cacheKey = phoneticKey(qNorm) || qNorm;

  if (MSIDB_CACHE.has(cacheKey)) {
    return MSIDB_CACHE.get(cacheKey) || null;
  }

  try {
    const searchUrl = `https://en.msidb.org/songs.php?tag=Search&song=${encodeURIComponent(rawQuery.trim())}`;
    const searchRes = await fetchMSIDBHtml(searchUrl);

    if (!searchRes.ok) return null;

    const html = searchRes.html;
    const rows = html.match(/<tr\b[^>]*\bclass\s*=\s*["']?[^"'>]*\bptableslist\b[^"'>]*["']?[^>]*>[\s\S]*?<\/tr>/gi) || [];

    if (rows.length === 0) {
      MSIDB_CACHE.set(cacheKey, null);
      return null;
    }

    // Find the best row matching the song query
    let bestScore = 0;
    let bestSongId = '';
    let bestTitle = '';
    let bestFilm = '';
    let bestComposer = '';
    let bestSingers = '';
    let bestYear = '';

    for (const tr of rows) {
      const idMatch = tr.match(/s\.php\?(\d+)/i);
      const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => cleanHtml(m[1]));

      if (idMatch && tds.length >= 2) {
        const title = tds[0];
        const film = tds[1];
        const year = tds[2] || '';
        const composer = tds[3] || '';
        const singers = tds[5] || '';

        const score = titleMatchScore(rawQuery, title);
        if (score > bestScore) {
          bestScore = score;
          bestSongId = idMatch[1];
          bestTitle = title;
          bestFilm = film;
          bestYear = year;
          bestComposer = composer;
          bestSingers = singers;
        }
      }
    }

    // Never present MSIDB's first result as an answer for a different composition.
    if (!bestSongId || bestScore < 70) {
      MSIDB_CACHE.set(cacheKey, null);
      return null;
    }

    // Fetch individual song details to extract Raga
    const songUrl = `https://en.msidb.org/s.php?${bestSongId}`;
    const songRes = await fetchMSIDBHtml(songUrl);

    if (!songRes.ok) return null;

    const songHtml = songRes.html;

    // Extract Raga
    let raga = '';
    const ragaMatch =
      songHtml.match(/(?:Ragas?\.php|category=raga)[^"']*(?:artist|raga)=([^"'&>]+)/i) ||
      songHtml.match(/<t[dh][^>]*>\s*Raga\s*<\/t[dh]>\s*<t[dh][^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i) ||
      songHtml.match(/\bRaga\b[\s\S]{0,250}?<a[^>]*>([^<]+)<\/a>/i);

    if (ragaMatch && ragaMatch[1]) {
      try {
        raga = cleanHtml(decodeURIComponent(ragaMatch[1].replace(/\+/g, ' ')));
      } catch {
        raga = cleanHtml(ragaMatch[1].replace(/\+/g, ' '));
      }
    }

    if (!raga || raga.toLowerCase().includes('categorization') || raga.toLowerCase().includes('not available') || raga.trim().length < 2) {
      MSIDB_CACHE.set(cacheKey, null);
      return null;
    }

    // Extract film, composer, singer if not already populated
    if (!bestFilm) {
      const filmMatch = songHtml.match(/m\.php\?\d+[^>]*>([^<]+)<\/a>/i);
      if (filmMatch) bestFilm = cleanHtml(filmMatch[1]);
    }
    if (!bestComposer) {
      const musicianMatch = songHtml.match(/Musician[\s\S]{1,120}?>([^<]+)<\/a>/i);
      if (musicianMatch) bestComposer = cleanHtml(musicianMatch[1]);
    }
    if (!bestSingers) {
      const singerMatch = songHtml.match(/Singers[\s\S]{1,120}?>([^<]+)<\/a>/i);
      if (singerMatch) bestSingers = cleanHtml(singerMatch[1]);
    }
    if (!bestYear) {
      const yearMatch = songHtml.match(/Year[\s\S]{1,100}?>\s*(\d{4})\s*</i);
      if (yearMatch) bestYear = yearMatch[1].trim();
    }

    const matchedSong: SongRagaEntry = {
      title: bestTitle || rawQuery.trim(),
      filmOrAlbum: bestFilm ? `${bestFilm}${bestYear ? ` (${bestYear})` : ''}` : 'Malayalam Cinema',
      composer: bestComposer || 'Traditional',
      singers: bestSingers || 'Malayalam Artists',
      language: 'Malayalam Film Song',
      raga: raga,
      source: 'MSIDB Verified',
    };

    const ragaProfile = resolveRagaProfile(raga);

    const result = {
      matchedSong,
      ragaProfile,
    };

    MSIDB_CACHE.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn(`[MSIDB Live Lookup] Request for "${rawQuery}" timed out or failed:`, error);
    return null;
  }
}
