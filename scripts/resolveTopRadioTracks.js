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

async function run() {
  console.log('Resolving video IDs for the first 2 songs of top 45 ragas...');
  let count = 0;
  for (let r = 0; r < Math.min(data.length, 45); r++) {
    const raga = data[r];
    for (let s = 0; s < Math.min(raga.songs.length, 2); s++) {
      const song = raga.songs[s];
      if (!song.videoId) {
        const cleanTitle = song.title.replace(/\([^)]*\)/g, '').trim();
        const cleanMovie = song.movie.replace(/\([^)]*\)/g, '').trim();
        const q = `${cleanTitle} ${cleanMovie} Malayalam song`;
        const vid = await fetchInnertube(q);
        if (vid) {
          song.videoId = vid;
          count++;
        }
      }
    }
  }
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Pre-resolved ${count} video IDs directly into raga_radio_90.json!`);
}

run();
