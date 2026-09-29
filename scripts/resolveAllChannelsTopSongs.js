const fs = require('fs');
const https = require('https');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'src', 'data', 'raga_radio_90.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

function fetchInnertube(query) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      context: { client: { clientName: 'WEB', clientVersion: '2.20231201.00.00' } },
      query: query
    });
    const agent = new https.Agent({ rejectUnauthorized: false });
    const req = https.request('https://www.youtube.com/youtubei/v1/search', {
      method: 'POST',
      agent,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      timeout: 5000
    }, (res) => {
      let body = '';
      res.on('data', c => {
        body += c;
        const match = body.match(/"videoId":\s*"([a-zA-Z0-9_-]{11})"/);
        if (match && match[1]) {
          req.destroy();
          resolve(match[1]);
        }
      });
      res.on('end', () => {
        const match = body.match(/"videoId":\s*"([a-zA-Z0-9_-]{11})"/);
        resolve(match ? match[1] : null);
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.write(postData);
    req.end();
  });
}

// Helper to run tasks with concurrency limit
async function asyncPool(poolLimit, array, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);
    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

async function run() {
  console.log(`Starting bulk video resolution for all 90 ragas...`);
  
  // Collect all songs needing resolution (top 4 songs of every raga)
  const tasks = [];
  for (let r = 0; r < data.length; r++) {
    const raga = data[r];
    const songsToResolve = Math.min(raga.songs.length, 4);
    for (let s = 0; s < songsToResolve; s++) {
      const song = raga.songs[s];
      if (!song.videoId) {
        tasks.push({ ragaIndex: r, songIndex: s, song });
      }
    }
  }

  console.log(`Found ${tasks.length} songs needing videoId resolution.`);
  let resolvedCount = 0;

  await asyncPool(6, tasks, async ({ song }) => {
    const cleanTitle = song.title.replace(/\([^)]*\)/g, '').trim();
    const cleanMovie = song.movie.replace(/\([^)]*\)/g, '').trim();
    const q = `${cleanTitle} ${cleanMovie} Malayalam song`;
    const vid = await fetchInnertube(q);
    if (vid) {
      song.videoId = vid;
      resolvedCount++;
    }
  });

  // Also assign channelDefaultVideoId for every raga channel
  for (let r = 0; r < data.length; r++) {
    const raga = data[r];
    const firstWithVideo = raga.songs.find(s => s.videoId);
    if (firstWithVideo) {
      raga.defaultVideoId = firstWithVideo.videoId;
    } else if (raga.songs[0]) {
      // Fallback default
      raga.defaultVideoId = 'BKlsIpDB_QA'; // Mohanam fallback
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Successfully resolved ${resolvedCount} new video IDs! Total saved to raga_radio_90.json.`);
}

run();
