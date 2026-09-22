const fs = require('fs');
const path = require('path');

const downloadsDir = path.join(__dirname, '..', 'public', 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

const CHAKRAS = [
  { no: 1, name: 'Indu (Moon)', m: 'M1', ragas: [
    { no: 1, name: 'Kanakangi', swaras: "S R1 G1 M1 P D1 N1 S'" },
    { no: 2, name: 'Ratnangi', swaras: "S R1 G1 M1 P D1 N2 S'" },
    { no: 3, name: 'Ganamurti', swaras: "S R1 G1 M1 P D1 N3 S'" },
    { no: 4, name: 'Vanaspati', swaras: "S R1 G1 M1 P D2 N2 S'" },
    { no: 5, name: 'Manavati', swaras: "S R1 G1 M1 P D2 N3 S'" },
    { no: 6, name: 'Tanarupi', swaras: "S R1 G1 M1 P D3 N3 S'" },
  ]},
  { no: 2, name: 'Netra (Eyes)', m: 'M1', ragas: [
    { no: 7, name: 'Senavati', swaras: "S R1 G2 M1 P D1 N1 S'" },
    { no: 8, name: 'Hanumatodi', swaras: "S R1 G2 M1 P D1 N2 S'" },
    { no: 9, name: 'Dhenuka', swaras: "S R1 G2 M1 P D1 N3 S'" },
    { no: 10, name: 'Natakapriya', swaras: "S R1 G2 M1 P D2 N2 S'" },
    { no: 11, name: 'Kokilapriya', swaras: "S R1 G2 M1 P D2 N3 S'" },
    { no: 12, name: 'Rupavati', swaras: "S R1 G2 M1 P D3 N3 S'" },
  ]},
  { no: 3, name: 'Agni (Fire)', m: 'M1', ragas: [
    { no: 13, name: 'Gayakapriya', swaras: "S R1 G3 M1 P D1 N1 S'" },
    { no: 14, name: 'Vakulabharanam', swaras: "S R1 G3 M1 P D1 N2 S'" },
    { no: 15, name: 'Mayamalavagowla', swaras: "S R1 G3 M1 P D1 N3 S'" },
    { no: 16, name: 'Chakravakam', swaras: "S R1 G3 M1 P D2 N2 S'" },
    { no: 17, name: 'Suryakantam', swaras: "S R1 G3 M1 P D2 N3 S'" },
    { no: 18, name: 'Hatakambari', swaras: "S R1 G3 M1 P D3 N3 S'" },
  ]},
  { no: 4, name: 'Veda (Scriptures)', m: 'M1', ragas: [
    { no: 19, name: 'Jhankaradhwani', swaras: "S R2 G2 M1 P D1 N1 S'" },
    { no: 20, name: 'Natabhairavi', swaras: "S R2 G2 M1 P D1 N2 S'" },
    { no: 21, name: 'Keeravani', swaras: "S R2 G2 M1 P D1 N3 S'" },
    { no: 22, name: 'Kharaharapriya', swaras: "S R2 G2 M1 P D2 N2 S'" },
    { no: 23, name: 'Gourimanohari', swaras: "S R2 G2 M1 P D2 N3 S'" },
    { no: 24, name: 'Varunapriya', swaras: "S R2 G2 M1 P D3 N3 S'" },
  ]},
  { no: 5, name: 'Bana (Arrows)', m: 'M1', ragas: [
    { no: 25, name: 'Mararanjani', swaras: "S R2 G3 M1 P D1 N1 S'" },
    { no: 26, name: 'Charukesi', swaras: "S R2 G3 M1 P D1 N2 S'" },
    { no: 27, name: 'Sarasangi', swaras: "S R2 G3 M1 P D1 N3 S'" },
    { no: 28, name: 'Harikambhoji', swaras: "S R2 G3 M1 P D2 N2 S'" },
    { no: 29, name: 'Dheerasankarabharanam', swaras: "S R2 G3 M1 P D2 N3 S'" },
    { no: 30, name: 'Naganandini', swaras: "S R2 G3 M1 P D3 N3 S'" },
  ]},
  { no: 6, name: 'Ritu (Seasons)', m: 'M1', ragas: [
    { no: 31, name: 'Yagapriya', swaras: "S R3 G3 M1 P D1 N1 S'" },
    { no: 32, name: 'Ragavardhini', swaras: "S R3 G3 M1 P D1 N2 S'" },
    { no: 33, name: 'Gangeyabhushani', swaras: "S R3 G3 M1 P D1 N3 S'" },
    { no: 34, name: 'Vagadheeswari', swaras: "S R3 G3 M1 P D2 N2 S'" },
    { no: 35, name: 'Sulini', swaras: "S R3 G3 M1 P D2 N3 S'" },
    { no: 36, name: 'Chalanata', swaras: "S R3 G3 M1 P D3 N3 S'" },
  ]},
  { no: 7, name: 'Rishi (Sages)', m: 'M2', ragas: [
    { no: 37, name: 'Salagam', swaras: "S R1 G1 M2 P D1 N1 S'" },
    { no: 38, name: 'Jalarnavam', swaras: "S R1 G1 M2 P D1 N2 S'" },
    { no: 39, name: 'Jhalavarali', swaras: "S R1 G1 M2 P D1 N3 S'" },
    { no: 40, name: 'Navaneetam', swaras: "S R1 G1 M2 P D2 N2 S'" },
    { no: 41, name: 'Pavani', swaras: "S R1 G1 M2 P D2 N3 S'" },
    { no: 42, name: 'Raghupriya', swaras: "S R1 G1 M2 P D3 N3 S'" },
  ]},
  { no: 8, name: 'Vasu (Gods)', m: 'M2', ragas: [
    { no: 43, name: 'Gavambodhi', swaras: "S R1 G2 M2 P D1 N1 S'" },
    { no: 44, name: 'Bhavapriya', swaras: "S R1 G2 M2 P D1 N2 S'" },
    { no: 45, name: 'Subhapantuvarali', swaras: "S R1 G2 M2 P D1 N3 S'" },
    { no: 46, name: 'Shadvidhamargini', swaras: "S R1 G2 M2 P D2 N2 S'" },
    { no: 47, name: 'Suvarnangi', swaras: "S R1 G2 M2 P D2 N3 S'" },
    { no: 48, name: 'Divyamani', swaras: "S R1 G2 M2 P D3 N3 S'" },
  ]},
  { no: 9, name: 'Brahma', m: 'M2', ragas: [
    { no: 49, name: 'Dhavalambari', swaras: "S R1 G3 M2 P D1 N1 S'" },
    { no: 50, name: 'Namanarayani', swaras: "S R1 G3 M2 P D1 N2 S'" },
    { no: 51, name: 'Kamavardhini (Pantuvarali)', swaras: "S R1 G3 M2 P D1 N3 S'" },
    { no: 52, name: 'Ramapriya', swaras: "S R1 G3 M2 P D2 N2 S'" },
    { no: 53, name: 'Gamanashrama', swaras: "S R1 G3 M2 P D2 N3 S'" },
    { no: 54, name: 'Viswambhari', swaras: "S R1 G3 M2 P D3 N3 S'" },
  ]},
  { no: 10, name: 'Disi (Directions)', m: 'M2', ragas: [
    { no: 55, name: 'Syamalangi', swaras: "S R2 G2 M2 P D1 N1 S'" },
    { no: 56, name: 'Shanmukhapriya', swaras: "S R2 G2 M2 P D1 N2 S'" },
    { no: 57, name: 'Simhendramadhyamam', swaras: "S R2 G2 M2 P D1 N3 S'" },
    { no: 58, name: 'Hemavati', swaras: "S R2 G2 M2 P D2 N2 S'" },
    { no: 59, name: 'Dharmavati', swaras: "S R2 G2 M2 P D2 N3 S'" },
    { no: 60, name: 'Neetimati', swaras: "S R2 G2 M2 P D3 N3 S'" },
  ]},
  { no: 11, name: 'Rudra', m: 'M2', ragas: [
    { no: 61, name: 'Kantamani', swaras: "S R2 G3 M2 P D1 N1 S'" },
    { no: 62, name: 'Rishabhapriya', swaras: "S R2 G3 M2 P D1 N2 S'" },
    { no: 63, name: 'Latangi', swaras: "S R2 G3 M2 P D1 N3 S'" },
    { no: 64, name: 'Vachaspati', swaras: "S R2 G3 M2 P D2 N2 S'" },
    { no: 65, name: 'Mechakalyani', swaras: "S R2 G3 M2 P D2 N3 S'" },
    { no: 66, name: 'Chitrambari', swaras: "S R2 G3 M2 P D3 N3 S'" },
  ]},
  { no: 12, name: 'Aditya (Suns)', m: 'M2', ragas: [
    { no: 67, name: 'Sucharitra', swaras: "S R3 G3 M2 P D1 N1 S'" },
    { no: 68, name: 'Jyotiswarupini', swaras: "S R3 G3 M2 P D1 N2 S'" },
    { no: 69, name: 'Dhatuvardhani', swaras: "S R3 G3 M2 P D1 N3 S'" },
    { no: 70, name: 'Nasikabhushani', swaras: "S R3 G3 M2 P D2 N2 S'" },
    { no: 71, name: 'Kosalam', swaras: "S R3 G3 M2 P D2 N3 S'" },
    { no: 72, name: 'Rasikapriya', swaras: "S R3 G3 M2 P D3 N3 S'" },
  ]},
];

const allRagas = [];
CHAKRAS.forEach(c => {
  c.ragas.forEach(r => {
    allRagas.push({
      melakartaNumber: r.no,
      ragaName: r.name,
      chakraNumber: c.no,
      chakraName: c.name,
      madhyamaType: c.m === 'M1' ? 'Shuddha Madhyamam (M1)' : 'Prati Madhyamam (M2)',
      arohana: r.swaras,
      avarohana: r.swaras.split(' ').reverse().join(' '),
      swaras: r.swaras.replace(/'/g, '').split(' ')
    });
  });
});

fs.writeFileSync(
  path.join(downloadsDir, '72_melakartas_carnatic_guide.json'),
  JSON.stringify({
    title: '72 Melakarta Janaka Parent Ragas Reference Guide',
    tradition: 'Carnatic Musicology',
    system: 'Venkatamakhin 72 Melakarta Scheme (Katapayadi Sankhya)',
    count: allRagas.length,
    chakras: CHAKRAS,
    ragas: allRagas
  }, null, 2),
  'utf-8'
);

const swaraGuide = `================================================================================
RAGA FINDER - CARNATIC & HINDUSTANI SWARA FREQUENCY & NOTATION GUIDE
================================================================================

1. CARNATIC 16 SWARASTHANAS (PITCH POSITIONS)
--------------------------------------------------------------------------------
Note  Name                    Western Equivalent (Tonic C)   Semitone Ratio
--------------------------------------------------------------------------------
S     Shadjam                 C                              1/1 (Base Tonic)
R1    Shuddha Rishabham       Db                             16/15 (Minor 2nd)
R2    Chatushruti Rishabham   D                              9/8 (Major 2nd)
R3    Shatshruti Rishabham    D# / Eb                        75/64 (Augmented 2nd)
G1    Shuddha Gandharam       D                              9/8 (Enharmonic to R2)
G2    Sadharana Gandharam     Eb                             6/5 (Minor 3rd)
G3    Antara Gandharam        E                              5/4 (Major 3rd)
M1    Shuddha Madhyamam       F                              4/3 (Perfect 4th)
M2    Prati Madhyamam         F#                             45/32 (Augmented 4th)
P     Panchamam               G                              3/2 (Perfect 5th)
D1    Shuddha Dhaivatam       Ab                             8/5 (Minor 6th)
D2    Chatushruti Dhaivatam   A                              5/3 (Major 6th)
D3    Shatshruti Dhaivatam    A# / Bb                        225/128 (Augmented 6th)
N1    Shuddha Nishadham       A                              5/3 (Enharmonic to D2)
N2    Kaisiki Nishadham       Bb                             9/5 (Minor 7th)
N3    Kakali Nishadham        B                              15/8 (Major 7th)

2. HINDUSTANI 12 SWARAS & THAAT EQUIVALENTS
--------------------------------------------------------------------------------
Sa          Base Shadjam (C)
Komal Re    Shuddha Rishabham (Db)
Shuddha Re  Chatushruti Rishabham (D)
Komal Ga    Sadharana Gandharam (Eb)
Shuddha Ga  Antara Gandharam (E)
Shuddha Ma  Shuddha Madhyamam (F)
Teevra Ma   Prati Madhyamam (F#)
Pa          Panchamam (G)
Komal Dha   Shuddha Dhaivatam (Ab)
Shuddha Dha Chatushruti Dhaivatam (A)
Komal Ni    Kaisiki Nishadham (Bb)
Shuddha Ni  Kakali Nishadham (B)

3. THE 10 HINDUSTANI THAATS & CORRESPONDING CARNATIC MELAKARTAS
--------------------------------------------------------------------------------
1. Bilawal   <-->  29. Dheerasankarabharanam (S R2 G3 M1 P D2 N3 S')
2. Kalyan    <-->  65. Mechakalyani (S R2 G3 M2 P D2 N3 S')
3. Khamaj    <-->  28. Harikambhoji (S R2 G3 M1 P D2 N2 S')
4. Kafi      <-->  22. Kharaharapriya (S R2 G2 M1 P D2 N2 S')
5. Asavari   <-->  20. Natabhairavi (S R2 G2 M1 P D1 N2 S')
6. Bhairav   <-->  15. Mayamalavagowla (S R1 G3 M1 P D1 N3 S')
7. Bhairavi  <-->  08. Hanumatodi (S R1 G2 M1 P D1 N2 S')
8. Poorvi    <-->  51. Kamavardhini / Pantuvarali (S R1 G3 M2 P D1 N3 S')
9. Marwa     <-->  53. Gamanashrama (S R1 G3 M2 P D2 N3 S')
10. Todi     <-->  45. Subhapantuvarali (S R1 G2 M2 P D1 N3 S')

================================================================================
Generated for RagaFinder AI (https://raga-finder-ideapad.vercel.app)
`;

fs.writeFileSync(
  path.join(downloadsDir, 'swara_frequency_notation_guide.txt'),
  swaraGuide,
  'utf-8'
);

console.log('Download files created successfully in public/downloads');
