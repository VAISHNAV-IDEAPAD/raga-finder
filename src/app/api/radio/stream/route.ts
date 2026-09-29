import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

// In-memory cache for fast instant replay
const videoIdCache = new Map<string, string>();

// Pre-seeded popular tracks for instant 0ms responses
const PRESEEDED_TRACKS: Record<string, string> = {
  'aalappuzha pattanathil': 'CgmLlGuOMyk',
  'a.e.i.o.u': 'vn4mFxpFPxA',
  'aa nimishathinte': 'law7wHYWQI0',
  'aakaasha neelima': 'VzR109G96qE',
  'aalippazham': '9Pz6P4G5M3w',
  'devadoothar paadi': '2w_0XqJ59lY',
  'pramadavanam': 'm7uNfQ0gL5s',
  'harimuraleeravam': '5rWqHw7j8hU',
  'alliyambal': '8PjF19H2qFk',
};

function fetchYouTubeVideoId(query: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      const agent = new https.Agent({ rejectUnauthorized: false });

      const req = https.get(
        url,
        {
          agent,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          timeout: 6000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
            // Stop early once we find the first watch?v= match to save memory & time
            const earlyMatch = data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
            if (earlyMatch && earlyMatch[1]) {
              req.destroy();
              resolve(earlyMatch[1]);
            }
          });

          res.on('end', () => {
            const match = data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
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
    } catch {
      resolve(null);
    }
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || '').trim();

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter q' }, { status: 400 });
  }

  const normalizedQuery = query.toLowerCase();

  // Check pre-seeded
  for (const [key, id] of Object.entries(PRESEEDED_TRACKS)) {
    if (normalizedQuery.includes(key)) {
      return NextResponse.json({
        success: true,
        videoId: id,
        embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1`,
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
        cached: true,
      });
    }
  }

  // Check in-memory cache
  if (videoIdCache.has(normalizedQuery)) {
    const cachedId = videoIdCache.get(normalizedQuery)!;
    return NextResponse.json({
      success: true,
      videoId: cachedId,
      embedUrl: `https://www.youtube.com/embed/${cachedId}?autoplay=1&enablejsapi=1`,
      watchUrl: `https://www.youtube.com/watch?v=${cachedId}`,
      cached: true,
    });
  }

  // Fetch live video ID
  const videoId = await fetchYouTubeVideoId(query);

  if (videoId) {
    videoIdCache.set(normalizedQuery, videoId);
    return NextResponse.json({
      success: true,
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      cached: false,
    });
  }

  return NextResponse.json({
    success: false,
    error: 'Could not resolve stream video ID',
    fallbackSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
  });
}
