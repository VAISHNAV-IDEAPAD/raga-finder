const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function processCsv() {
  const csvPath = 'C:\\Users\\Tilak\\Downloads\\msidb_songs_with_raga.csv';
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isHeader = true;
  let header = [];
  const songs = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    
    // Parse CSV line handling commas inside quotes
    const parts = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

    if (isHeader) {
      header = parts.map(p => p.trim());
      isHeader = false;
      continue;
    }

    const row = {};
    header.forEach((h, i) => {
      row[h] = parts[i] || '';
    });

    const song = (row['Song'] || '').trim();
    const movie = (row['Movie'] || '').trim();
    const raga = (row['Raga'] || '').trim();
    const musician = (row['Musician'] || '').trim();
    const year = (row['Year'] || '').trim();
    const lyricist = (row['Lyricist'] || '').trim();
    const singers = (row['Singers'] || '').trim();

    if (raga && song) {
      songs.push({ song, movie, raga, musician, year, lyricist, singers });
    }
  }

  // Group by raga
  const ragaMap = new Map();
  songs.forEach(s => {
    if (!ragaMap.has(s.raga)) {
      ragaMap.set(s.raga, []);
    }
    ragaMap.get(s.raga).push(s);
  });

  // Sort ragas by song count descending
  const sortedRagas = Array.from(ragaMap.entries())
    .map(([name, list]) => ({ name, count: list.length, songs: list }))
    .sort((a, b) => b.count - a.count);

  const top90 = sortedRagas.slice(0, 90);

  const result = top90.map((r, rIdx) => {
    const ragaSlug = r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return {
      id: ragaSlug,
      name: r.name,
      songCount: r.count,
      rank: rIdx + 1,
      songs: r.songs.map((s, sIdx) => {
        const query = `${s.song} ${s.movie} ${s.musician} Malayalam song`.replace(/\s+/g, ' ').trim();
        const ytQuery = encodeURIComponent(query);
        return {
          id: `${ragaSlug}-${sIdx + 1}`,
          title: s.song,
          movie: s.movie,
          musicDirector: s.musician || 'Unknown',
          year: s.year || 'N/A',
          singers: s.singers || '',
          lyricist: s.lyricist || '',
          raga: r.name,
          youtubeUrl: `https://www.youtube.com/results?search_query=${ytQuery}`,
          searchQuery: query
        };
      })
    };
  });

  const outDir = path.join(__dirname, '..', 'src', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'raga_radio_90.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`Successfully generated raga_radio_90.json with ${result.length} ragas and ${result.reduce((a, b) => a + b.songs.length, 0)} songs.`);
}

processCsv().catch(err => {
  console.error('Error generating raga radio data:', err);
  process.exit(1);
});
