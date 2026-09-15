import dns from 'dns';
import { SongRagaEntry } from '@/types/raga';
import { resolveRagaProfile, normalizeSongQuery, phoneticKey } from './songSearch';

// Ensure IPv4 is prioritized on Windows/Node to avoid IPv6 connect timeouts and disable strict TLS rejection for MSIDB
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore in environments where not supported
}

// In-memory cache for live MSIDB queries
const MSIDB_CACHE = new Map<string, { matchedSong: SongRagaEntry; ragaProfile: any } | null>();

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
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9',
      },
      signal: AbortSignal.timeout(4500),
    });

    if (!searchRes.ok) return null;

    const html = await searchRes.text();
    const rows = html.match(/<tr\s+class=ptableslist[\s\S]*?<\/tr>/gi) || [];

    if (rows.length === 0) {
      MSIDB_CACHE.set(cacheKey, null);
      return null;
    }

    // Find the best row matching the song query
    let bestRow = rows[0];
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

        const normTitle = normalizeSongQuery(title);
        const phonTitle = phoneticKey(title);
        const phonQ = phoneticKey(rawQuery);

        if (normTitle === qNorm || (phonQ.length >= 3 && phonTitle === phonQ)) {
          bestSongId = idMatch[1];
          bestTitle = title;
          bestFilm = film;
          bestYear = year;
          bestComposer = composer;
          bestSingers = singers;
          break;
        }

        if (!bestSongId) {
          bestSongId = idMatch[1];
          bestTitle = title;
          bestFilm = film;
          bestYear = year;
          bestComposer = composer;
          bestSingers = singers;
        }
      }
    }

    if (!bestSongId) {
      MSIDB_CACHE.set(cacheKey, null);
      return null;
    }

    // Fetch individual song details to extract Raga
    const songUrl = `https://en.msidb.org/s.php?${bestSongId}`;
    const songRes = await fetch(songUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(4500),
    });

    if (!songRes.ok) return null;

    const songHtml = await songRes.text();

    // Extract Raga
    let raga = '';
    const ragaMatch =
      songHtml.match(/category=raga&(?:amp;)?artist=([^"&>]+)/i) ||
      songHtml.match(/Raga[\s\S]{1,150}?artist=([^"&>]+)/i) ||
      songHtml.match(/Raga[\s\S]{1,150}?>([^<]+)<\/a>/i);

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
