import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import radioChannelsData from '@/data/raga_radio_90.json';
import { RagaRadioChannel } from '@/types/radio';

// In-memory cache for fast instant replay
const videoIdCache = new Map<string, string>();

// Index all pre-resolved songs from the 90 raga channels
const indexedSongs = new Map<string, string>();
const ragaDefaultMap = new Map<string, string>();

(radioChannelsData as RagaRadioChannel[]).forEach((channel) => {
  if (channel.defaultVideoId) {
    ragaDefaultMap.set(channel.name.toLowerCase(), channel.defaultVideoId);
    ragaDefaultMap.set(channel.id.toLowerCase(), channel.defaultVideoId);
  }
  channel.songs.forEach((song) => {
    if (song.videoId) {
      const clean = song.title.toLowerCase().replace(/\([^)]*\)/g, '').trim();
      indexedSongs.set(clean, song.videoId);
    }
  });
});

function fetchInnertubeVideoId(query: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const postData = JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20231201.00.00',
          },
        },
        query: query,
      });

      const agent = new https.Agent({ rejectUnauthorized: false });

      const req = https.request(
        'https://www.youtube.com/youtubei/v1/search',
        {
          method: 'POST',
          agent,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          timeout: 6000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
            // Stop early if videoId is found
            const match = data.match(/"videoId":\s*"([a-zA-Z0-9_-]{11})"/);
            if (match && match[1]) {
              req.destroy();
              resolve(match[1]);
            }
          });

          res.on('end', () => {
            const match = data.match(/"videoId":\s*"([a-zA-Z0-9_-]{11})"/);
            if (match && match[1]) {
              resolve(match[1]);
            } else {
              resolve(null);
            }
          });
        }
      );

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });

      req.write(postData);
      req.end();
    } catch {
      resolve(null);
    }
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || '').trim();
  const raga = (searchParams.get('raga') || '').trim().toLowerCase();

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter q' }, { status: 400 });
  }

  const normalizedQuery = query.toLowerCase();

  // 1. Check indexed songs from raga_radio_90.json (560+ songs)
  for (const [title, id] of indexedSongs.entries()) {
    if (normalizedQuery.includes(title)) {
      return NextResponse.json({
        success: true,
        videoId: id,
        embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1`,
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
        source: 'indexed_raga_songs',
      });
    }
  }

  // 2. Check in-memory cache
  if (videoIdCache.has(normalizedQuery)) {
    const cachedId = videoIdCache.get(normalizedQuery)!;
    return NextResponse.json({
      success: true,
      videoId: cachedId,
      embedUrl: `https://www.youtube.com/embed/${cachedId}?autoplay=1&enablejsapi=1`,
      watchUrl: `https://www.youtube.com/watch?v=${cachedId}`,
      source: 'cache',
    });
  }

  // 3. Fetch live video ID via Innertube API
  let videoId = await fetchInnertubeVideoId(query);

  // 4. Fallback: Simplified query without parentheticals or clutter
  if (!videoId) {
    const simplified = query
      .replace(/\([^)]*\)/g, '')
      .replace(/\b(malayalam|song|songs|19\d\d|20\d\d)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (simplified.length > 2) {
      videoId = await fetchInnertubeVideoId(`${simplified} Malayalam song`);
    }
  }

  if (videoId) {
    videoIdCache.set(normalizedQuery, videoId);
    return NextResponse.json({
      success: true,
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      source: 'innertube_live',
    });
  }

  // 5. Fallback: Raga channel's default verified stream
  const ragaFallback = raga ? ragaDefaultMap.get(raga) : null;
  const finalFallback = ragaFallback || 'BKlsIpDB_QA'; // Mohanam featured track

  return NextResponse.json({
    success: true,
    videoId: finalFallback,
    isFallback: true,
    embedUrl: `https://www.youtube.com/embed/${finalFallback}?autoplay=1&enablejsapi=1`,
    watchUrl: `https://www.youtube.com/watch?v=${finalFallback}`,
    source: 'raga_default_fallback',
  });
}

