'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Radio,
  Play,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Flame,
  Music2,
  Maximize2,
  Minimize2,
  Search,
  Share2,
  Calendar,
  Disc,
  ArrowRight
} from 'lucide-react';
import playlistsData from '@/data/updates_playlists.json';

interface UpdatesTabProps {
  onFindRaga?: (songName: string) => void;
}

export default function UpdatesTab({ onFindRaga }: UpdatesTabProps) {
  const [activePlaylistId, setActivePlaylistId] = useState<string>(playlistsData[0].id);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  const activePlaylist = playlistsData.find((p) => p.id === activePlaylistId) || playlistsData[0];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/?tab=updates`;
      navigator.clipboard.writeText(shareUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const categories = [
    'All',
    'Official Editorial',
    'Viral & Trending',
    'Cinema Hits',
    'Top 50',
    'Top 100',
    'Indie & Pop',
  ];

  const filteredPlaylists = playlistsData.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 text-white p-6 sm:p-10 overflow-hidden border border-stone-800 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-96 h-96 bg-raga-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-semibold tracking-wide uppercase shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Live Malayalam Film Songs</span>
            <span className="text-stone-500">•</span>
            <span className="text-stone-300 font-normal">Spotify Live Synced</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            New Malayalam Film Songs & <span className="text-amber-400">Live Updates</span>
          </h1>

          <p className="text-sm sm:text-base text-stone-300 max-w-2xl font-light leading-relaxed">
            Real-time live streaming hub for newly released Malayalam cinema tracks, trending Mollywood chartbusters, movie singles, and independent songs directly from Spotify.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('spotify-player-container');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm hover:bg-amber-300 transition-all shadow-md cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Listen Live Stream</span>
            </button>

            <a
              href={`https://open.spotify.com/playlist/${activePlaylist.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#1DB954] text-white font-semibold text-xs sm:text-sm hover:bg-[#1ed760] transition-all shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Spotify</span>
            </a>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              title="Share Live Updates Feed"
            >
              <Share2 className="w-4 h-4" />
              <span>{copyFeedback ? 'Link Copied!' : 'Share Feed'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Spotify Player Section */}
      <div id="spotify-player-container" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                Live Broadcast: <span className="text-raga-600">{activePlaylist.title}</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              {activePlaylist.tagline} • Updates in real-time as new Malayalam film tracks drop
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors cursor-pointer"
              title={isExpanded ? 'Switch to Compact View' : 'Show full tracklist'}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Compact View</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Show Full Tracklist</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors cursor-pointer ${
                isRefreshing ? 'opacity-50 pointer-events-none' : ''
              }`}
              title="Force sync player"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Live Sync'}</span>
            </button>
          </div>
        </div>

        {/* Quick Switch Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {playlistsData.map((playlist) => {
            const isSelected = playlist.id === activePlaylistId;
            return (
              <button
                key={playlist.id}
                type="button"
                onClick={() => setActivePlaylistId(playlist.id)}
                className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-sm ring-2 ring-stone-900/20'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-amber-50 hover:text-stone-900 hover:border-amber-300'
                }`}
              >
                <span>{playlist.title}</span>
                {playlist.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                      isSelected ? 'bg-stone-800 text-amber-300' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {playlist.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Spotify Iframe Embed */}
        <div className="relative rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 shadow-xl p-2 sm:p-3">
          <div className="flex items-center justify-between px-3 py-1.5 text-xs text-stone-400 border-b border-stone-800/80 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-medium text-stone-200">Spotify Live Stream</span>
              <span className="hidden sm:inline text-stone-500">• Direct Edge CDN</span>
            </div>
            <a
              href={`https://open.spotify.com/playlist/${activePlaylist.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <span>Open on Spotify</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <iframe
            key={`${activePlaylist.id}-${refreshKey}`}
            style={{ borderRadius: '12px' }}
            src={`https://open.spotify.com/embed/playlist/${activePlaylist.id}?utm_source=generator&theme=0`}
            width="100%"
            height={isExpanded ? 640 : 380}
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="w-full transition-all duration-300"
          />
        </div>
      </div>

      {/* Curated Playlist Catalog */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
              Malayalam Cinema & Playlist Hub
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Select any curated feed to immediately stream or launch in Spotify
            </p>
          </div>

          {/* Filter search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search playlists..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-raga-500 focus:ring-1 focus:ring-raga-500 transition-all text-stone-800"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Playlist Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlaylists.map((playlist) => {
            const isCurrent = playlist.id === activePlaylistId;
            return (
              <div
                key={playlist.id}
                className={`group rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden bg-white ${
                  isCurrent
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                    : 'border-stone-200 hover:border-amber-400 hover:shadow-md'
                }`}
              >
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start gap-3.5">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-900 shrink-0 border border-stone-100 shadow-sm">
                      {playlist.thumbnail ? (
                        <Image
                          src={playlist.thumbnail}
                          alt={playlist.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-amber-500">
                          <Music2 className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
                          {playlist.badge}
                        </span>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            Playing
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-stone-900 group-hover:text-raga-600 transition-colors line-clamp-1">
                        {playlist.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-stone-500 line-clamp-1">
                        {playlist.tagline}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                    {playlist.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {playlist.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-50 text-stone-600 border border-stone-100"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePlaylistId(playlist.id);
                      const el = document.getElementById('spotify-player-container');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-stone-900 text-white'
                        : 'bg-white border border-stone-200 text-stone-800 hover:bg-amber-50 hover:text-stone-900 hover:border-amber-300'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isCurrent ? 'Playing In Feed' : 'Stream Live'}</span>
                  </button>

                  <a
                    href={`https://open.spotify.com/playlist/${playlist.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-[#1DB954] hover:border-[#1DB954] transition-colors"
                    title="Open on Spotify"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Raga Finder AI Bridge: Identify the Raga of New Songs */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50/40 to-stone-50 border border-amber-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-raga-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-raga-500/20 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              Want to Find the Raga of a New Malayalam Film Song?
            </h3>
            <p className="text-xs sm:text-sm text-stone-600">
              Many new Malayalam film songs are crafted on classical ragas (Mohanam, Kalyani, Charukesi, Sindhubhairavi). Use Raga Finder AI to analyze any song instantly!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('switch_top_tab', { detail: { tab: 'home' } }));
              window.history.pushState({}, '', '/');
            }
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs sm:text-sm hover:bg-stone-800 transition-colors shrink-0 shadow-md cursor-pointer"
        >
          <span>Identify Song in Raga Finder</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Malayalam Music Industry Releases Info */}
      <div className="bg-gradient-to-br from-stone-50 via-white to-amber-50/40 rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-amber-600" />
          <h4 className="text-base font-bold text-stone-900">
            Malayalam Cinema Song Release Schedule
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-600">
          <div className="bg-white p-4 rounded-xl border border-stone-200/80 space-y-1.5">
            <div className="font-bold text-stone-900 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-raga-600" />
              <span>Singles & Promo Tracks</span>
            </div>
            <p className="leading-relaxed">
              New movie singles and lyric videos drop mid-week (Wednesdays & Thursdays) leading up to theatrical premieres.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200/80 space-y-1.5">
            <div className="font-bold text-stone-900 flex items-center gap-1">
              <Disc className="w-3.5 h-3.5 text-raga-600" />
              <span>Midnight Album Drops</span>
            </div>
            <p className="leading-relaxed">
              Full original soundtracks and movie albums usually publish to Spotify at 12:00 AM on film release Fridays.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200/80 space-y-1.5">
            <div className="font-bold text-stone-900 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-raga-600" />
              <span>Auto Live Updates</span>
            </div>
            <p className="leading-relaxed">
              Because this player connects straight to Spotify&apos;s editorial CDN, freshly released songs appear automatically without refreshing the app!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
