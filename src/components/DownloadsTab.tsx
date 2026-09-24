'use client';

import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  Globe,
  FileText,
  CheckCircle,
  Eye,
  ExternalLink,
  Search,
  Sparkles,
  Info,
  Music,
} from 'lucide-react';

interface DatasetItem {
  id: string;
  title: string;
  filename: string;
  format: string;
  fileSize: string;
  recordsCount: string;
  badgeColor: string;
  icon: React.ReactNode;
  tags: string[];
  description: string;
  previewType: 'csv' | 'json' | 'html' | 'text';
  previewData?: any;
}

const DATASETS: DatasetItem[] = [
  {
    id: 'janyas-csv',
    title: 'Authentic Carnatic Janya Ragas Dataset (Wikipedia)',
    filename: 'wikipedia_janya_ragas_908.csv',
    format: 'CSV (Spreadsheet)',
    fileSize: '115 KB',
    recordsCount: '908 Janya Ragas',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: <FileSpreadsheet className="w-6 h-6 text-amber-700" />,
    tags: ['Wikipedia Sourced', 'Carnatic', '72 Melakartas', '12 Chakras', 'Arohana & Avarohana'],
    description:
      'Complete authentic dataset of 908 Carnatic Janya ragas extracted from Wikipedia, systematically classified under all 72 Melakarta parent ragas with Arohana, Avarohana, scale classification, Bhashanga Anya swaras, and links.',
    previewType: 'csv',
    previewData: [
      { Raga: 'Kanakambari', Melakarta_No: 1, Melakarta: 'Kanakangi', Scale_Type: 'Audava-Sampurna', Arohana: "S R1 M1 P D1 S'", Avarohana: "S' N1 D1 P M1 G1 R1 S", Bhashanga: 'No' },
      { Raga: 'Revati', Melakarta_No: 2, Melakarta: 'Ratnangi', Scale_Type: 'Audava', Arohana: "S R1 M1 P N2 S'", Avarohana: "S' N2 P M1 R1 S", Bhashanga: 'No' },
      { Raga: 'Ahiri', Melakarta_No: 8, Melakarta: 'Hanumatodi', Scale_Type: 'Audava-Sampurna', Arohana: "S R1 S G2 M1 P D1 S'", Avarohana: "S' N2 D1 P M1 G3 R1 S", Bhashanga: 'Yes (Anya: R2 G2/G3 D2 N3)' },
      { Raga: 'Mohanam', Melakarta_No: 28, Melakarta: 'Harikambhoji', Scale_Type: 'Audava', Arohana: "S R2 G3 P D2 S'", Avarohana: "S' D2 P G3 R2 S", Bhashanga: 'No' },
      { Raga: 'Hamsadhwani', Melakarta_No: 29, Melakarta: 'Dheerasankarabharanam', Scale_Type: 'Audava', Arohana: "S R2 G3 P N3 S'", Avarohana: "S' N3 P G3 R2 S", Bhashanga: 'No' },
    ],
  },
  {
    id: 'janyas-json',
    title: 'Complete Janya Ragas JSON Database (Wikipedia)',
    filename: 'wikipedia_janya_ragas_908.json',
    format: 'JSON (Hierarchical)',
    fileSize: '582 KB',
    recordsCount: '908 Raga Objects',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
    icon: <FileCode className="w-6 h-6 text-orange-600" />,
    tags: ['JSON', 'Wikipedia', 'Carnatic Musicology', 'Full Swaras Array'],
    description:
      'Structured JSON database of all 908 Janya ragas with swara arrays, chakra metadata, scale counts, Vakra/Bhashanga flags, and Wikipedia article references.',
    previewType: 'json',
    previewData: [
      {
        id: 'mohanam',
        name: 'Mohanam',
        parentMelakartaNo: 28,
        parentMelakartaName: 'Harikambhoji',
        chakraNo: 5,
        chakraName: 'Bana (Arrows)',
        arohana: "S R2 G3 P D2 S'",
        avarohana: "S' D2 P G3 R2 S",
        swaras: ['R2', 'G3', 'P', 'D2'],
        scaleType: 'Audava',
        isBhashanga: false,
        wikiUrl: 'https://en.wikipedia.org/wiki/Mohanam',
      },
      {
        id: 'hamsadhwani',
        name: 'Hamsadhwani',
        parentMelakartaNo: 29,
        parentMelakartaName: 'Dheerasankarabharanam',
        chakraNo: 5,
        chakraName: 'Bana (Arrows)',
        arohana: "S R2 G3 P N3 S'",
        avarohana: "S' N3 P G3 R2 S",
        swaras: ['R2', 'G3', 'P', 'N3'],
        scaleType: 'Audava',
        isBhashanga: false,
        wikiUrl: 'https://en.wikipedia.org/wiki/Hamsadhvani',
      },
    ],
  },
  {
    id: 'songs-csv',
    title: 'Classical & Cinema Songs with Raga Dataset',
    filename: 'classical_cinema_songs_with_raga.csv',
    format: 'CSV (Comma Separated)',
    fileSize: '601 KB',
    recordsCount: '3,469+ Songs',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: <FileSpreadsheet className="w-6 h-6 text-emerald-600" />,
    tags: ['Carnatic', 'Cinema Songs', 'Soundtracks', 'Excel Ready'],
    description:
      'Extensive verified database linking Malayalam, Tamil, and Indian film songs to their parent classical ragas, including composer, lyricist, year, singer, and audio source identifiers.',
    previewType: 'csv',
    previewData: [
      { Song: 'Nakshathra Deepangal', Movie: 'Nirakudam', Year: '1977', Raga: 'Aabhogi', Musician: 'Jaya Vijaya', Singers: 'KJ Yesudas' },
      { Song: 'Sapthaswarangalaadum', Movie: 'Sankhupushpam', Year: '1977', Raga: 'Aabhogi', Musician: 'MK Arjunan', Singers: 'Vani Jairam' },
      { Song: 'Devasabhaathalam', Movie: 'His Highness Abdulla', Year: '1990', Raga: 'Aabhogi', Musician: 'Raveendran', Singers: 'KJ Yesudas, MG Sreekumar' },
      { Song: 'Pramadavanam', Movie: 'His Highness Abdulla', Year: '1990', Raga: 'Jog', Musician: 'Raveendran', Singers: 'KJ Yesudas' },
      { Song: 'Aadiparaashakthi', Movie: 'Devaasuram', Year: '1993', Raga: 'Ragamalika (6 Ragas)', Musician: 'MG Radhakrishnan', Singers: 'KJ Yesudas' },
    ],
  },
  {
    id: 'songs-json',
    title: 'Complete Songs to Classical Raga Database',
    filename: 'classical_cinema_songs_with_raga.json',
    format: 'JSON (Structured)',
    fileSize: '1.34 MB',
    recordsCount: '3,469 Objects',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: <FileCode className="w-6 h-6 text-amber-600" />,
    tags: ['JSON', 'API Ready', 'Full Metadata', 'Machine Learning'],
    description:
      'Structured hierarchical dataset optimized for developers, machine learning models, music apps, and indexing systems. Contains complete song metadata and direct classical references.',
    previewType: 'json',
    previewData: [
      {
        Song: 'Nakshathra Deepangal',
        Movie: 'Nirakudam',
        Year: 1977,
        Raga: 'Aabhogi',
        Musician: 'Jaya Vijaya',
        Lyricist: 'Bichu Thirumala',
        Singers: 'KJ Yesudas',
        Song_ID: '4293',
      },
      {
        Song: 'Devasabhaathalam',
        Movie: 'His Highness Abdulla',
        Year: 1990,
        Raga: 'Aabhogi',
        Musician: 'Raveendran',
        Lyricist: 'Kaithapram',
        Singers: 'KJ Yesudas, Raveendran, Sharreth',
        Song_ID: '5492',
      },
    ],
  },
  {
    id: 'songs-html',
    title: 'Offline Searchable Songs & Ragas Portal',
    filename: 'offline_searchable_songs_ragas_portal.html',
    format: 'Standalone Web App (HTML)',
    fileSize: '1.13 MB',
    recordsCount: 'Interactive Client Table',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: <Globe className="w-6 h-6 text-blue-600" />,
    tags: ['Offline Portal', 'Instant Search', 'Zero Setup', 'Browser Ready'],
    description:
      'Self-contained single-page web app with instant fuzzy search, column sorting, and song-to-raga exploration. Run completely offline without internet or backend server.',
    previewType: 'html',
  },
  {
    id: 'melakartas-json',
    title: '72 Melakarta Janaka Parent Ragas Reference Chart',
    filename: '72_melakartas_carnatic_guide.json',
    format: 'JSON Reference',
    fileSize: '6.6 KB',
    recordsCount: '72 Melakartas (12 Chakras)',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: <Music className="w-6 h-6 text-purple-600" />,
    tags: ['72 Melakarta', 'Venkatamakhin', 'Swaras', 'Chakras'],
    description:
      'The complete 72 Melakarta scheme organized into the 12 classical Chakras (Indu, Netra, Agni, Veda, Bana, Ritu, Rishi, Vasu, Brahma, Disi, Rudra, Aditya) with exact Arohana and Avarohana notation.',
    previewType: 'json',
    previewData: {
      chakras: 12,
      totalMelakartas: 72,
      sampleChakra1: {
        name: 'Indu (Moon)',
        ragas: ['1. Kanakangi', '2. Ratnangi', '3. Ganamurti', '4. Vanaspati', '5. Manavati', '6. Tanarupi'],
      },
      sampleChakra3: {
        name: 'Agni (Fire)',
        ragas: ['15. Mayamalavagowla (S R1 G3 M1 P D1 N3 S\')'],
      },
    },
  },
  {
    id: 'swara-guide-txt',
    title: 'Carnatic 16 Swaras & Hindustani 12 Swaras Notation Guide',
    filename: 'swara_frequency_notation_guide.txt',
    format: 'Plain Text (UTF-8)',
    fileSize: '3.2 KB',
    recordsCount: 'Complete Tuning Table',
    badgeColor: 'bg-stone-200 text-stone-800 border-stone-300',
    icon: <FileText className="w-6 h-6 text-stone-700" />,
    tags: ['Swara Ratios', 'Thaats', 'Western Tuning', 'Musicology'],
    description:
      'Complete musicological reference sheet defining all 16 Carnatic swarasthanas with their Western pitch equivalents and semitone ratios, Hindustani 12 swaras, and the 10 Hindustani Thaat to Melakarta mappings.',
    previewType: 'text',
    previewData:
      '1. CARNATIC 16 SWARASTHANAS:\nS  (Shadjam) -> C (1/1)\nR1 (Shuddha Rishabham) -> Db (16/15)\nR2 (Chatushruti Rishabham) -> D (9/8)\nG3 (Antara Gandharam) -> E (5/4)\nM1 (Shuddha Madhyamam) -> F (4/3)\nM2 (Prati Madhyamam) -> F# (45/32)\nP  (Panchamam) -> G (3/2)\nD1 (Shuddha Dhaivatam) -> Ab (8/5)\nN3 (Kakali Nishadham) -> B (15/8)',
  },
];

export default function DownloadsTab() {
  const [searchFilter, setSearchFilter] = useState('');
  const [activePreview, setActivePreview] = useState<DatasetItem | null>(null);
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);

  const filteredDatasets = DATASETS.filter((item) => {
    const q = searchFilter.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q)) ||
      item.format.toLowerCase().includes(q)
    );
  });

  const handleDownloadClick = (item: DatasetItem) => {
    if (!downloadedIds.includes(item.id)) {
      setDownloadedIds((prev) => [...prev, item.id]);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto px-4 sm:px-6">
      {/* Title & Introduction */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
          Musicology &amp; Songs <span className="text-raga-600">Download Center</span>
        </h2>
        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto">
          Download curated offline datasets, verified film songs mapped to classical ragas, the complete 72 Melakarta scheme, and notation reference guides.
        </p>
      </div>

      {/* Search & Stats Bar */}
      <div className="p-4 rounded-2xl glass-panel shadow-sm border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Filter datasets by name, format, or tag..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-inner"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-600 flex-wrap justify-center sm:justify-end">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-900 font-semibold border border-amber-300">
            <Sparkles className="w-3 h-3 text-raga-600" />
            <span>5 Verified Datasets</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-medium border border-stone-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Free &amp; Open for Musicologists</span>
          </span>
        </div>
      </div>

      {/* Dataset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDatasets.map((item) => {
          const isDownloaded = downloadedIds.includes(item.id);

          return (
            <div
              key={item.id}
              className="p-6 rounded-3xl glass-panel border border-amber-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-0.5"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${item.badgeColor}`}
                    >
                      {item.format}
                    </span>
                    <span className="text-[11px] font-semibold text-stone-500">
                      {item.fileSize} &bull; {item.recordsCount}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-raga-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-amber-100/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActivePreview(item)}
                  className="px-3 py-2 text-xs font-semibold text-stone-700 hover:text-raga-600 hover:bg-amber-50 rounded-xl transition-colors flex items-center gap-1.5 border border-stone-200 hover:border-amber-300"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <div className="flex items-center gap-2">
                  {item.previewType === 'html' && (
                    <a
                      href={`/downloads/${item.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors flex items-center gap-1 border border-stone-200"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </a>
                  )}

                  <a
                    href={`/downloads/${item.filename}`}
                    download={item.filename}
                    onClick={() => handleDownloadClick(item)}
                    className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 ${
                      isDownloaded
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-gradient-to-r from-raga-600 to-amber-600 hover:from-raga-700 hover:to-amber-700 text-white shadow-raga-500/20'
                    }`}
                  >
                    {isDownloaded ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Downloaded</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </>
                    )}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dataset License & Citation Notice */}
      <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-xs text-stone-600">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-stone-800">
            Open Musicology &amp; Academic Dataset Usage
          </p>
          <p>
            The classical and cinema song catalog is curated from classical traditions and verified soundtrack databases. Free to use for research, education, music practice, and software development with attribution to RagaFinder AI.
          </p>
        </div>
      </div>

      {/* Modal / Preview Drawer */}
      {activePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-amber-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  {activePreview.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    {activePreview.title}
                  </h3>
                  <span className="text-xs text-stone-500">
                    File: <code className="font-mono text-amber-700">{activePreview.filename}</code> ({activePreview.fileSize})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePreview(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              <p className="text-xs text-stone-600">
                Sample preview of contents:
              </p>

              {activePreview.previewType === 'csv' && (
                <div className="overflow-x-auto border border-stone-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-amber-50/80 text-stone-800 font-bold border-b border-stone-200">
                      <tr>
                        <th className="p-2.5">Song</th>
                        <th className="p-2.5">Movie</th>
                        <th className="p-2.5">Year</th>
                        <th className="p-2.5">Raga</th>
                        <th className="p-2.5">Musician</th>
                        <th className="p-2.5">Singers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-700">
                      {activePreview.previewData.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-amber-50/40">
                          <td className="p-2.5 font-semibold text-stone-900">{row.Song}</td>
                          <td className="p-2.5">{row.Movie}</td>
                          <td className="p-2.5">{row.Year}</td>
                          <td className="p-2.5 font-bold text-raga-600">{row.Raga}</td>
                          <td className="p-2.5">{row.Musician}</td>
                          <td className="p-2.5">{row.Singers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activePreview.previewType === 'json' && (
                <div className="bg-stone-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72">
                  <pre>{JSON.stringify(activePreview.previewData, null, 2)}</pre>
                </div>
              )}

              {activePreview.previewType === 'text' && (
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap text-stone-800 max-h-72 overflow-y-auto">
                  {activePreview.previewData}
                </div>
              )}

              {activePreview.previewType === 'html' && (
                <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200 text-center space-y-3">
                  <Globe className="w-10 h-10 text-blue-600 mx-auto" />
                  <p className="text-sm font-semibold text-stone-800">
                    Standalone Searchable HTML Table (1.13 MB)
                  </p>
                  <p className="text-xs text-stone-600 max-w-md mx-auto">
                    Contains the full verified songs and ragas database embedded directly inside an offline HTML page with instantaneous filtering by title, singer, raga, and composer.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs text-stone-500">
                Ready for instant download
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActivePreview(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl"
                >
                  Close
                </button>
                <a
                  href={`/downloads/${activePreview.filename}`}
                  download={activePreview.filename}
                  onClick={() => handleDownloadClick(activePreview)}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-raga-600 to-amber-600 hover:from-raga-700 hover:to-amber-700 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {activePreview.filename}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
