'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Music,
  Search,
  Volume2,
  VolumeX,
  ExternalLink,
  Filter,
  ArrowUpDown,
  ArrowRight,
  Download,
  BookOpen,
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { playSwaraSequence } from '@/lib/audioSynth';
import { JanyaRaga } from '@/types/raga';
import rawJanyaData from '@/data/wikipedia_janya_ragas.json';

const ALL_JANYAS: JanyaRaga[] = rawJanyaData as JanyaRaga[];

const CHAKRAS_LIST = [
  { no: 1, name: 'Indu (Moon)', m: 'M1', range: '1–6' },
  { no: 2, name: 'Netra (Eyes)', m: 'M1', range: '7–12' },
  { no: 3, name: 'Agni (Fire)', m: 'M1', range: '13–18' },
  { no: 4, name: 'Veda (Scriptures)', m: 'M1', range: '19–24' },
  { no: 5, name: 'Bana (Arrows)', m: 'M1', range: '25–30' },
  { no: 6, name: 'Ritu (Seasons)', m: 'M1', range: '31–36' },
  { no: 7, name: 'Rishi (Sages)', m: 'M2', range: '37–42' },
  { no: 8, name: 'Vasu (Gods)', m: 'M2', range: '43–48' },
  { no: 9, name: 'Brahma', m: 'M2', range: '49–54' },
  { no: 10, name: 'Disi (Directions)', m: 'M2', range: '55–60' },
  { no: 11, name: 'Rudra', m: 'M2', range: '61–66' },
  { no: 12, name: 'Aditya (Suns)', m: 'M2', range: '67–72' },
];

function extractPlayableSwaras(scaleStr: string): string[] {
  const withoutParens = scaleStr.replace(/\([^)]*\)/g, ' ');
  return withoutParens.match(/[SRGMPDN][123]?'?,?/g) || [];
}

interface AuthenticJanyaRagaTableProps {
  onSelectRagaInFinder: (swaras: string[], ragaName?: string) => void;
}

export default function AuthenticJanyaRagaTable({ onSelectRagaInFinder }: AuthenticJanyaRagaTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChakra, setSelectedChakra] = useState<number | null>(null);
  const [selectedMelakarta, setSelectedMelakarta] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'bhashanga' | 'vakra' | 'audava' | 'shadava' | 'sampurna' | 'hindustani'>('all');
  const [layoutMode, setLayoutMode] = useState<'table' | 'grouped'>('table');
  const [sortField, setSortField] = useState<'name' | 'melakarta' | 'type'>('melakarta');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [expandedMelaGroups, setExpandedMelaGroups] = useState<Record<number, boolean>>({});

  // Active audio playback state
  const [activePlayback, setActivePlayback] = useState<{
    ragaId: string;
    mode: 'arohana' | 'avarohana' | 'both';
  } | null>(null);
  const cancelRef = useRef(false);

  // Unique Melakartas present in dataset
  const melakartasSummary = useMemo(() => {
    const map = new Map<number, { no: number; name: string; chakraNo: number; chakraName: string; count: number }>();
    ALL_JANYAS.forEach((j) => {
      if (!map.has(j.parentMelakartaNo)) {
        map.set(j.parentMelakartaNo, {
          no: j.parentMelakartaNo,
          name: j.parentMelakartaName,
          chakraNo: j.chakraNo,
          chakraName: j.chakraName,
          count: 0,
        });
      }
      map.get(j.parentMelakartaNo)!.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.no - b.no);
  }, []);

  // Filter logic
  const filteredRagas = useMemo(() => {
    return ALL_JANYAS.filter((j) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = j.name.toLowerCase().includes(q) || j.originalName.toLowerCase().includes(q);
        const matchesMela =
          j.parentMelakartaName.toLowerCase().includes(q) ||
          j.parentMelakartaNo.toString() === q ||
          `#${j.parentMelakartaNo}` === q;
        const matchesAro = j.arohana.toLowerCase().includes(q);
        const matchesAva = j.avarohana.toLowerCase().includes(q);
        const matchesExtra = j.extraNote ? j.extraNote.toLowerCase().includes(q) : false;
        const matchesType = j.scaleType.toLowerCase().includes(q);
        if (!matchesName && !matchesMela && !matchesAro && !matchesAva && !matchesExtra && !matchesType) {
          return false;
        }
      }

      // Chakra filter
      if (selectedChakra !== null && j.chakraNo !== selectedChakra) {
        return false;
      }

      // Melakarta filter
      if (selectedMelakarta !== null && j.parentMelakartaNo !== selectedMelakarta) {
        return false;
      }

      // Type filter
      if (filterType === 'bhashanga' && !j.isBhashanga) return false;
      if (filterType === 'vakra' && !j.isVakra) return false;
      if (filterType === 'audava' && !j.scaleType.toLowerCase().includes('audava')) return false;
      if (filterType === 'shadava' && !j.scaleType.toLowerCase().includes('shadava')) return false;
      if (filterType === 'sampurna' && !j.scaleType.toLowerCase().includes('sampurna')) return false;
      if (filterType === 'hindustani' && (!j.extraNote || !j.extraNote.toLowerCase().includes('hindustani'))) return false;

      return true;
    });
  }, [searchQuery, selectedChakra, selectedMelakarta, filterType]);

  // Sort logic
  const sortedRagas = useMemo(() => {
    const list = [...filteredRagas];
    list.sort((a, b) => {
      if (sortField === 'name') {
        const cmp = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      if (sortField === 'melakarta') {
        if (a.parentMelakartaNo !== b.parentMelakartaNo) {
          return sortOrder === 'asc'
            ? a.parentMelakartaNo - b.parentMelakartaNo
            : b.parentMelakartaNo - a.parentMelakartaNo;
        }
        return a.name.localeCompare(b.name);
      }
      if (sortField === 'type') {
        const cmp = a.scaleType.localeCompare(b.scaleType);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      return 0;
    });
    return list;
  }, [filteredRagas, sortField, sortOrder]);

  // Pagination calculations
  const totalItems = sortedRagas.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRagas = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return sortedRagas.slice(start, start + pageSize);
  }, [sortedRagas, validCurrentPage, pageSize]);

  // Grouped by Melakarta for grouped view
  const groupedByMelakarta = useMemo(() => {
    const groups: Record<number, { melaNo: number; melaName: string; chakraNo: number; chakraName: string; ragas: JanyaRaga[] }> = {};
    sortedRagas.forEach((r) => {
      if (!groups[r.parentMelakartaNo]) {
        groups[r.parentMelakartaNo] = {
          melaNo: r.parentMelakartaNo,
          melaName: r.parentMelakartaName,
          chakraNo: r.chakraNo,
          chakraName: r.chakraName,
          ragas: [],
        };
      }
      groups[r.parentMelakartaNo].ragas.push(r);
    });
    return Object.values(groups).sort((a, b) => a.melaNo - b.melaNo);
  }, [sortedRagas]);

  const handleSort = (field: 'name' | 'melakarta' | 'type') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Playback handler for Arohana, Avarohana, or Both
  const handleAudition = async (raga: JanyaRaga, mode: 'arohana' | 'avarohana' | 'both') => {
    // If clicking the same active button, stop it
    if (activePlayback && activePlayback.ragaId === raga.id && activePlayback.mode === mode) {
      cancelRef.current = true;
      setActivePlayback(null);
      return;
    }

    // Cancel any ongoing playback
    cancelRef.current = true;
    await new Promise((r) => setTimeout(r, 60));
    cancelRef.current = false;

    setActivePlayback({ ragaId: raga.id, mode });

    const aroNotes = extractPlayableSwaras(raga.arohana);
    const avaNotes = extractPlayableSwaras(raga.avarohana);

    try {
      if (mode === 'arohana') {
        await playSwaraSequence(aroNotes, 0.42, () => cancelRef.current);
      } else if (mode === 'avarohana') {
        await playSwaraSequence(avaNotes, 0.42, () => cancelRef.current);
      } else if (mode === 'both') {
        // 1. Play Arohana
        await playSwaraSequence(aroNotes, 0.40, () => cancelRef.current);
        if (!cancelRef.current) {
          // Brief pause between ascending and descending
          await new Promise((r) => setTimeout(r, 320));
        }
        // 2. Play Avarohana
        if (!cancelRef.current) {
          await playSwaraSequence(avaNotes, 0.40, () => cancelRef.current);
        }
      }
    } catch (err) {
      console.error('Audio playback error', err);
    } finally {
      setActivePlayback((curr) =>
        curr && curr.ragaId === raga.id && curr.mode === mode ? null : curr
      );
    }
  };

  const toggleMelaGroup = (no: number) => {
    setExpandedMelaGroups((prev) => ({
      ...prev,
      [no]: !prev[no],
    }));
  };

  const expandAllGroups = () => {
    const allExp: Record<number, boolean> = {};
    groupedByMelakarta.forEach((g) => {
      allExp[g.melaNo] = true;
    });
    setExpandedMelaGroups(allExp);
  };

  const collapseAllGroups = () => {
    setExpandedMelaGroups({});
  };

  // Export CSV
  const handleExportCsv = useCallback(() => {
    const headers = [
      'ID',
      'Name',
      'Original_Name',
      'Melakarta_No',
      'Melakarta_Name',
      'Chakra_No',
      'Chakra_Name',
      'Arohana',
      'Avarohana',
      'Scale_Type',
      'Is_Bhashanga',
      'Anya_Swaras',
      'Is_Vakra',
      'Extra_Note',
      'Wikipedia_URL',
    ];

    const rows = sortedRagas.map((r) => [
      `"${r.id}"`,
      `"${r.name}"`,
      `"${r.originalName}"`,
      r.parentMelakartaNo,
      `"${r.parentMelakartaName}"`,
      r.chakraNo,
      `"${r.chakraName}"`,
      `"${r.arohana}"`,
      `"${r.avarohana}"`,
      `"${r.scaleType}"`,
      r.isBhashanga ? 'Yes' : 'No',
      `"${r.anyaSwaras || ''}"`,
      r.isVakra ? 'Yes' : 'No',
      `"${r.extraNote || ''}"`,
      `"${r.wikiUrl}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wikipedia_janya_ragas_${sortedRagas.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [sortedRagas]);

  // Export JSON
  const handleExportJson = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sortedRagas, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `wikipedia_janya_ragas_${sortedRagas.length}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  }, [sortedRagas]);

  return (
    <div className="space-y-6">
      {/* Authentic Wikipedia Badge & Overview Banner */}
      <div className="rounded-3xl glass-panel p-5 sm:p-7 border border-amber-300/80 shadow-md bg-gradient-to-br from-amber-50/90 via-white to-orange-50/50 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-600 text-white shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Authentic Wikipedia Source</span>
              </span>
              <a
                href="https://en.wikipedia.org/wiki/List_of_Janya_ragas"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 underline decoration-amber-400 decoration-2"
              >
                <span>List of Janya ragas (Wikipedia)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Authentic <span className="text-raga-600">Janya Ragas Table</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-3xl">
              Explore all <strong>{ALL_JANYAS.length} authentic Janya ragas</strong> categorized systematically under their 72 parent Melakartas across the 12 Chakras. Sourced directly from Wikipedia with independent audio playback for <strong>ascending (arohanam)</strong> and <strong>descending (avarohanam)</strong> scales, foreign swara (Bhashanga) annotations, and one-click Raga Finder loading.
            </p>
          </div>

          {/* Action buttons (Export CSV / JSON) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-stone-800 border border-stone-300 hover:bg-amber-50 hover:border-amber-400 shadow-xs transition-all flex items-center gap-1.5"
              title="Download CSV table of filtered ragas"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-stone-800 border border-stone-300 hover:bg-amber-50 hover:border-amber-400 shadow-xs transition-all flex items-center gap-1.5"
              title="Download raw JSON data"
            >
              <Download className="w-3.5 h-3.5 text-raga-600" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Quick Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-amber-200/60 text-xs">
          <div className="p-2.5 rounded-2xl bg-white/80 border border-amber-200/80 shadow-2xs">
            <div className="text-stone-500 font-medium text-[11px]">Total Janya Ragas</div>
            <div className="text-lg font-black text-stone-900">{ALL_JANYAS.length}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/80 border border-amber-200/80 shadow-2xs">
            <div className="text-stone-500 font-medium text-[11px]">Parent Melakartas</div>
            <div className="text-lg font-black text-amber-800">72 Janaka Ragas</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/80 border border-amber-200/80 shadow-2xs">
            <div className="text-stone-500 font-medium text-[11px]">Bhashanga (Anya Swara)</div>
            <div className="text-lg font-black text-rose-600">50 Ragas</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/80 border border-amber-200/80 shadow-2xs">
            <div className="text-stone-500 font-medium text-[11px]">Audio Playback</div>
            <div className="text-lg font-black text-emerald-700">Aro + Ava + Both</div>
          </div>
        </div>
      </div>

      {/* Control Panel: Search, Filters & View Switches */}
      <div className="p-4 sm:p-5 rounded-3xl glass-panel shadow-sm border border-stone-200 space-y-4">
        {/* Top row: Search input & View toggles */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search 908 Janya ragas by name, Melakarta (#28, Harikambhoji), swara (G3, M2)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-inner"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
              >
                Clear
              </button>
            )}
          </div>

          {/* Layout switcher & Page Size */}
          <div className="flex items-center gap-2 justify-between lg:justify-end">
            <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-bold text-stone-600">
              <button
                type="button"
                onClick={() => setLayoutMode('table')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  layoutMode === 'table' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('grouped')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  layoutMode === 'grouped' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Group by Melakarta</span>
              </button>
            </div>

            {layoutMode === 'table' && (
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <span className="hidden sm:inline">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={9999}>All ({totalItems})</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Filter categories pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-stone-500 font-bold shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-amber-600" />
            <span>Category:</span>
          </span>
          {[
            { id: 'all', label: 'All Ragas', count: ALL_JANYAS.length },
            { id: 'bhashanga', label: 'Bhashanga (Anya Swara)', count: 50 },
            { id: 'vakra', label: 'Vakra (Crooked)', count: 280 },
            { id: 'audava', label: 'Audava (5 Notes)', count: 326 },
            { id: 'shadava', label: 'Shadava (6 Notes)', count: 384 },
            { id: 'sampurna', label: 'Sampurna (7 Notes)', count: 198 },
            { id: 'hindustani', label: 'Hindustani Equivalent', count: 28 },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilterType(f.id as any);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                filterType === f.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  filterType === f.id ? 'bg-amber-700 text-amber-100' : 'bg-stone-200/80 text-stone-600'
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Chakra & Parent Melakarta Filters */}
        <div className="pt-2 border-t border-stone-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Chakra Dropdown */}
          <div className="flex items-center gap-2">
            <label className="font-bold text-stone-600 shrink-0">Chakra:</label>
            <select
              value={selectedChakra === null ? '' : selectedChakra}
              onChange={(e) => {
                const val = e.target.value === '' ? null : Number(e.target.value);
                setSelectedChakra(val);
                setSelectedMelakarta(null);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All 12 Chakras</option>
              {CHAKRAS_LIST.map((c) => (
                <option key={c.no} value={c.no}>
                  {c.no}. {c.name} ({c.m}) [Melakartas {c.range}]
                </option>
              ))}
            </select>
          </div>

          {/* Melakarta Dropdown */}
          <div className="flex items-center gap-2">
            <label className="font-bold text-stone-600 shrink-0">Parent Melakarta:</label>
            <select
              value={selectedMelakarta === null ? '' : selectedMelakarta}
              onChange={(e) => {
                const val = e.target.value === '' ? null : Number(e.target.value);
                setSelectedMelakarta(val);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All 72 Melakartas ({melakartasSummary.length})</option>
              {melakartasSummary
                .filter((m) => (selectedChakra === null ? true : m.chakraNo === selectedChakra))
                .map((m) => (
                  <option key={m.no} value={m.no}>
                    #{m.no} {m.name} ({m.count} Janyas)
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Results summary bar */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <div>
            Showing <strong className="text-stone-900">{totalItems}</strong> matching Janya ragas
            {selectedMelakarta && (
              <span>
                {' '}
                under <strong className="text-amber-800">Melakarta #{selectedMelakarta}</strong>
              </span>
            )}
            {selectedChakra && !selectedMelakarta && (
              <span>
                {' '}
                in <strong className="text-amber-800">Chakra {selectedChakra}</strong>
              </span>
            )}
          </div>

          {(searchQuery || selectedChakra !== null || selectedMelakarta !== null || filterType !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedChakra(null);
                setSelectedMelakarta(null);
                setFilterType('all');
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* TABLE VIEW */}
      {layoutMode === 'table' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-stone-200 glass-panel shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-100/90 border-b border-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                  <th scope="col" className="p-3 w-12 text-center">
                    #
                  </th>
                  <th
                    scope="col"
                    className="p-3 cursor-pointer hover:bg-stone-200/80 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Janya Raga Name</span>
                      <ArrowUpDown className="w-3 h-3 text-stone-400" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="p-3 cursor-pointer hover:bg-stone-200/80 transition-colors"
                    onClick={() => handleSort('melakarta')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Parent Melakarta</span>
                      <ArrowUpDown className="w-3 h-3 text-stone-400" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="p-3 cursor-pointer hover:bg-stone-200/80 transition-colors"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Scale Classification</span>
                      <ArrowUpDown className="w-3 h-3 text-stone-400" />
                    </div>
                  </th>
                  <th scope="col" className="p-3 min-w-[210px]">
                    Ascending (Arohanam)
                  </th>
                  <th scope="col" className="p-3 min-w-[210px]">
                    Descending (Avarohanam)
                  </th>
                  <th scope="col" className="p-3 text-center w-28">
                    Full Audition
                  </th>
                  <th scope="col" className="p-3 text-right w-24">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/80 bg-white">
                {paginatedRagas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-500">
                      <Music className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                      <p className="font-semibold text-stone-700">No Janya ragas match the current search or filters.</p>
                      <p className="text-xs text-stone-400 mt-1">Try clearing your filters or changing search keywords.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedRagas.map((raga, index) => {
                    const rowNumber = (validCurrentPage - 1) * pageSize + index + 1;
                    const isAroPlaying = activePlayback?.ragaId === raga.id && activePlayback?.mode === 'arohana';
                    const isAvaPlaying = activePlayback?.ragaId === raga.id && activePlayback?.mode === 'avarohana';
                    const isBothPlaying = activePlayback?.ragaId === raga.id && activePlayback?.mode === 'both';

                    return (
                      <tr
                        key={raga.id}
                        className="hover:bg-amber-50/50 transition-colors group text-stone-800"
                      >
                        {/* Index */}
                        <td className="p-3 text-center text-stone-400 font-mono text-[11px]">
                          {rowNumber}
                        </td>

                        {/* Raga Name */}
                        <td className="p-3">
                          <div className="flex items-start gap-1.5">
                            <div>
                              <div className="font-bold text-stone-900 group-hover:text-raga-600 transition-colors flex items-center gap-1.5">
                                <span>{raga.name}</span>
                                {raga.wikiUrl && (
                                  <a
                                    href={raga.wikiUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="View on Wikipedia"
                                    className="text-stone-400 hover:text-amber-700"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                              {raga.originalName && raga.originalName !== raga.name && (
                                <div className="text-[10px] text-stone-400 italic">
                                  {raga.originalName}
                                </div>
                              )}
                              {raga.extraNote && (
                                <div className="mt-0.5 inline-block text-[10px] font-medium text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-200">
                                  {raga.extraNote}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Parent Melakarta */}
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMelakarta(raga.parentMelakartaNo);
                              setCurrentPage(1);
                            }}
                            className="text-left group/btn"
                            title={`Filter to Melakarta #${raga.parentMelakartaNo} ${raga.parentMelakartaName}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 font-black text-[10px] flex items-center justify-center border border-amber-300">
                                {raga.parentMelakartaNo}
                              </span>
                              <span className="font-semibold text-stone-900 group-hover/btn:text-raga-600 underline-offset-2 hover:underline">
                                {raga.parentMelakartaName}
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-500 pl-6">
                              Chakra {raga.chakraNo}: {raga.chakraName.split(' ')[0]} ({raga.madhyama})
                            </div>
                          </button>
                        </td>

                        {/* Scale Classification */}
                        <td className="p-3">
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-200">
                              {raga.scaleType}
                            </span>
                            <div className="flex items-center gap-1 flex-wrap">
                              {raga.isBhashanga && (
                                <span
                                  className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300"
                                  title={`Bhashanga raga (Uses Anya swaras: ${raga.anyaSwaras || 'foreign notes'})`}
                                >
                                  Bhashanga
                                </span>
                              )}
                              {raga.isVakra && (
                                <span
                                  className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                                  title="Vakra (Crooked / non-linear scale progression)"
                                >
                                  Vakra
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Arohanam with Direct Play Option */}
                        <td className="p-3 font-mono text-stone-800">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div
                              className={`font-semibold px-2 py-1 rounded-lg border text-xs transition-all ${
                                isAroPlaying || (isBothPlaying && !isAvaPlaying)
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                  : 'text-raga-700 bg-amber-50/60 border-amber-200/60'
                              }`}
                            >
                              {raga.arohana}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAudition(raga, 'arohana')}
                              className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition-all inline-flex items-center gap-1 shadow-2xs ${
                                isAroPlaying
                                  ? 'bg-amber-600 text-white border-amber-700 animate-pulse'
                                  : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-300 hover:border-amber-400'
                              }`}
                              title="Play Ascending Scale (Arohanam)"
                            >
                              {isAroPlaying ? (
                                <>
                                  <VolumeX className="w-3 h-3 text-white" />
                                  <span className="text-[10px]">Aro ↗</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3 text-amber-700" />
                                  <span className="text-[10px]">Aro ↗</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Avarohanam with Direct Play Option */}
                        <td className="p-3 font-mono text-stone-800">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <div
                                className={`font-semibold px-2 py-1 rounded-lg border text-xs transition-all ${
                                  isAvaPlaying
                                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                    : 'text-stone-700 bg-stone-50 border-stone-200/80'
                                }`}
                              >
                                {raga.avarohana}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAudition(raga, 'avarohana')}
                                className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition-all inline-flex items-center gap-1 shadow-2xs ${
                                  isAvaPlaying
                                    ? 'bg-amber-600 text-white border-amber-700 animate-pulse'
                                    : 'bg-white hover:bg-stone-100 text-stone-800 border-stone-300 hover:border-stone-400'
                                }`}
                                title="Play Descending Scale (Avarohanam)"
                              >
                                {isAvaPlaying ? (
                                  <>
                                    <VolumeX className="w-3 h-3 text-white" />
                                    <span className="text-[10px]">Ava ↘</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3 h-3 text-stone-600" />
                                    <span className="text-[10px]">Ava ↘</span>
                                  </>
                                )}
                              </button>
                            </div>
                            {raga.anyaSwaras && (
                              <div className="text-[10px] font-sans font-bold text-rose-700 flex items-center gap-1">
                                <span>* Anya Swara:</span>
                                <span className="font-mono bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                                  {raga.anyaSwaras}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Full Scale Audition (Both Arohana & Avarohana) */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleAudition(raga, 'both')}
                            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all inline-flex items-center gap-1 shadow-2xs ${
                              isBothPlaying
                                ? 'bg-gradient-to-r from-amber-600 to-raga-600 text-white border-amber-700 animate-pulse'
                                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                            }`}
                            title="Play Complete Scale: Ascending then Descending"
                          >
                            {isBothPlaying ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5" />
                                <span className="text-[10px]">Playing Full</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                                <span className="text-[10px]">Both ⇄</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Action: Load in Finder */}
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => onSelectRagaInFinder(raga.swaras, raga.name)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-raga-700 bg-white hover:bg-amber-100 border border-amber-300 hover:border-amber-400 shadow-2xs transition-all inline-flex items-center gap-1"
                            title="Load swaras directly into Raga Finder"
                          >
                            <span>Find</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pageSize < 9999 && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl glass-panel border border-stone-200 text-xs">
              <div className="text-stone-500">
                Page <strong className="text-stone-900">{validCurrentPage}</strong> of{' '}
                <strong className="text-stone-900">{totalPages}</strong> ({totalItems} ragas)
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={validCurrentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 font-semibold"
                >
                  First
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 font-semibold"
                >
                  Prev
                </button>

                {/* Page number indicators */}
                <div className="px-2 font-mono font-bold text-amber-900">
                  {validCurrentPage} / {totalPages}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 font-semibold"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={validCurrentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 font-semibold"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GROUPED BY MELAKARTA VIEW */}
      {layoutMode === 'grouped' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-stone-600 font-semibold">
              Showing <strong>{groupedByMelakarta.length}</strong> Melakartas with matching Janya ragas
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAllGroups}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAllGroups}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {groupedByMelakarta.map((group) => {
              const isExpanded = !!expandedMelaGroups[group.melaNo];

              return (
                <div
                  key={group.melaNo}
                  className="rounded-2xl border border-amber-200/80 glass-panel shadow-2xs overflow-hidden transition-all"
                >
                  {/* Melakarta Group Header */}
                  <div
                    onClick={() => toggleMelaGroup(group.melaNo)}
                    className="p-3.5 bg-gradient-to-r from-amber-100/60 to-orange-50/40 hover:from-amber-200/60 hover:to-orange-100/60 cursor-pointer flex items-center justify-between gap-3 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-raga-500 to-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {group.melaNo}
                      </span>
                      <div>
                        <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                          <span>{group.melaName}</span>
                          <span className="text-xs font-normal text-stone-500">
                            (Chakra {group.chakraNo}: {group.chakraName})
                          </span>
                        </div>
                        <div className="text-[11px] text-amber-900 font-semibold">
                          {group.ragas.length} Janya {group.ragas.length === 1 ? 'Raga' : 'Ragas'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-500 hidden sm:inline">
                        {isExpanded ? 'Hide' : 'Show'} Janyas
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-stone-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-stone-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Janya items grid */}
                  {isExpanded && (
                    <div className="p-3 bg-white divide-y divide-stone-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
                        {group.ragas.map((raga) => {
                          const isAroPlaying = activePlayback?.ragaId === raga.id && activePlayback?.mode === 'arohana';
                          const isAvaPlaying = activePlayback?.ragaId === raga.id && activePlayback?.mode === 'avarohana';
                          const isBothPlaying = activePlayback?.ragaId === raga.id && activePlayback?.mode === 'both';

                          return (
                            <div
                              key={raga.id}
                              className="p-3 rounded-xl border border-stone-200/80 bg-stone-50/40 hover:bg-amber-50/40 transition-colors flex flex-col justify-between space-y-2"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
                                      <span>{raga.name}</span>
                                      {raga.wikiUrl && (
                                        <a
                                          href={raga.wikiUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-stone-400 hover:text-amber-700"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                    {raga.originalName && raga.originalName !== raga.name && (
                                      <div className="text-[10px] text-stone-400 italic">
                                        {raga.originalName}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white text-stone-700 border border-stone-300">
                                      {raga.scaleType}
                                    </span>
                                    {raga.isBhashanga && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                        Bhashanga
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Arohana & Avarohana with individual play buttons */}
                                <div className="p-2.5 rounded-lg bg-white border border-stone-200 text-xs font-mono space-y-2">
                                  {/* Arohana */}
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-stone-400 uppercase font-sans">
                                        Aro:
                                      </span>
                                      <span className="text-raga-600 font-semibold">{raga.arohana}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleAudition(raga, 'arohana')}
                                      className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-all inline-flex items-center gap-1 ${
                                        isAroPlaying
                                          ? 'bg-amber-600 text-white border-amber-700 animate-pulse'
                                          : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                                      }`}
                                      title="Play Ascending Scale"
                                    >
                                      {isAroPlaying ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
                                      <span>Play Aro ↗</span>
                                    </button>
                                  </div>

                                  {/* Avarohana */}
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-stone-400 uppercase font-sans">
                                        Ava:
                                      </span>
                                      <span className="text-stone-800">{raga.avarohana}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleAudition(raga, 'avarohana')}
                                      className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-all inline-flex items-center gap-1 ${
                                        isAvaPlaying
                                          ? 'bg-amber-600 text-white border-amber-700 animate-pulse'
                                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                                      }`}
                                      title="Play Descending Scale"
                                    >
                                      {isAvaPlaying ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
                                      <span>Play Ava ↘</span>
                                    </button>
                                  </div>
                                </div>

                                {raga.anyaSwaras && (
                                  <div className="text-[10px] font-bold text-rose-700">
                                    * Anya Swara: {raga.anyaSwaras}
                                  </div>
                                )}

                                {raga.extraNote && (
                                  <div className="text-[10px] text-amber-800 italic">
                                    {raga.extraNote}
                                  </div>
                                )}
                              </div>

                              {/* Footer Actions: Play Both & Load in Finder */}
                              <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => handleAudition(raga, 'both')}
                                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all inline-flex items-center gap-1 ${
                                    isBothPlaying
                                      ? 'bg-gradient-to-r from-amber-600 to-raga-600 text-white border-amber-700 animate-pulse'
                                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                                  }`}
                                  title="Play Full Scale: Ascending + Descending"
                                >
                                  {isBothPlaying ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 text-amber-700" />}
                                  <span>Full Scale (Both ⇄)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onSelectRagaInFinder(raga.swaras, raga.name)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-raga-700 bg-white hover:bg-amber-50 border border-amber-300 transition-colors inline-flex items-center gap-1"
                                >
                                  <span>Load in Finder</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
