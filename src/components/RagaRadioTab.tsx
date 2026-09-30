'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Radio,
  Play,
  Square,
  SkipForward,
  SkipBack,
  Search,
  ExternalLink,
  Volume2,
  Music,
  Disc,
  Calendar,
  User,
  Sparkles,
  ChevronRight,
  Filter,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import radioChannelsData from '@/data/raga_radio_90.json';
import { RagaRadioChannel, RadioSong } from '@/types/radio';

const CHANNELS = radioChannelsData as RagaRadioChannel[];
const INITIAL_CHANNEL = CHANNELS[0] || { id: 'mohanam', name: 'Mohanam', songCount: 0, rank: 1, defaultVideoId: 'BKlsIpDB_QA', songs: [] };
const INITIAL_SONG = INITIAL_CHANNEL.songs?.[0] || null;
const INITIAL_VIDEO = INITIAL_SONG?.videoId || INITIAL_CHANNEL.defaultVideoId || 'BKlsIpDB_QA';

export default function RagaRadioTab() {
  const [selectedChannelId, setSelectedChannelId] = useState<string>(INITIAL_CHANNEL.id);
  const [activeSong, setActiveSong] = useState<RadioSong | null>(INITIAL_SONG);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(INITIAL_VIDEO);
  const [isResolvingStream, setIsResolvingStream] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [channelSearch, setChannelSearch] = useState<string>('');
  const [songSearch, setSongSearch] = useState<string>('');
  const playerRef = useRef<HTMLDivElement | null>(null);

  // Active Channel
  const currentChannel = useMemo(() => {
    return CHANNELS.find((c) => c.id === selectedChannelId) || CHANNELS[0];
  }, [selectedChannelId]);

  // Sync raga from URL param if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ragaParam = params.get('raga') || params.get('channel');
      if (ragaParam) {
        const found = CHANNELS.find(
          (c) =>
            c.id.toLowerCase() === ragaParam.toLowerCase() ||
            c.name.toLowerCase() === ragaParam.toLowerCase()
        );
        if (found) {
          setSelectedChannelId(found.id);
          if (found.songs && found.songs.length > 0) {
            setActiveSong(found.songs[0]);
            setActiveVideoId(found.songs[0].videoId || found.defaultVideoId || 'BKlsIpDB_QA');
          }
        }
      }
    }
  }, []);

  // Pre-select first song of current channel so player is never empty
  useEffect(() => {
    if (currentChannel && currentChannel.songs && currentChannel.songs.length > 0) {
      if (!activeSong || !currentChannel.songs.some((s) => s.id === activeSong.id)) {
        const firstSong = currentChannel.songs[0];
        setActiveSong(firstSong);
        const effectiveVideoId = firstSong.videoId || currentChannel.defaultVideoId || 'BKlsIpDB_QA';
        setActiveVideoId(effectiveVideoId);
      }
    }
  }, [currentChannel]);

  // Filtered Channels for 90 Ragas selector
  const filteredChannels = useMemo(() => {
    if (!channelSearch.trim()) return CHANNELS;
    const q = channelSearch.toLowerCase();
    return CHANNELS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.rank.toString() === q
    );
  }, [channelSearch]);

  // Filtered Songs within active channel
  const filteredSongs = useMemo(() => {
    if (!currentChannel) return [];
    if (!songSearch.trim()) return currentChannel.songs;
    const q = songSearch.toLowerCase();
    return currentChannel.songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.movie.toLowerCase().includes(q) ||
        s.musicDirector.toLowerCase().includes(q) ||
        s.year.includes(q) ||
        s.singers.toLowerCase().includes(q)
    );
  }, [currentChannel, songSearch]);

  const handleTuneSong = async (song: RadioSong, autoScroll: boolean = true) => {
    setActiveSong(song);
    setIsPlaying(true);
    setStreamError(null);

    // Sync channel if song belongs to another raga channel
    if (song.raga) {
      const matchingChannel = CHANNELS.find(
        (c) =>
          c.name.toLowerCase() === song.raga.toLowerCase() ||
          c.id.toLowerCase() === song.raga.toLowerCase()
      );
      if (matchingChannel && matchingChannel.id !== selectedChannelId) {
        setSelectedChannelId(matchingChannel.id);
      }
    }

    // Scroll smoothly to player on mobile so the user sees the video player directly
    if (autoScroll && playerRef.current && typeof window !== 'undefined') {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (song.videoId) {
      setActiveVideoId(song.videoId);
      setIsResolvingStream(false);
      return;
    }

    // Fallback immediately to channel default so player never sits blank or broken
    const fallbackId = currentChannel.defaultVideoId || 'BKlsIpDB_QA';
    setActiveVideoId(fallbackId);
    setIsResolvingStream(true);

    try {
      const cleanTitle = song.title.replace(/\([^)]*\)/g, '').trim();
      const cleanMovie = song.movie.replace(/\([^)]*\)/g, '').trim();
      const q = `${cleanTitle} ${cleanMovie} Malayalam song`;
      const res = await fetch(
        `/api/radio/stream?q=${encodeURIComponent(q)}&raga=${encodeURIComponent(song.raga || currentChannel.name)}`
      );
      const data = await res.json();

      if (data.success && data.videoId) {
        setActiveVideoId(data.videoId);
        if (data.isFallback) {
          setStreamError(`Streaming Raga ${currentChannel.name} Featured Melodies`);
        }
      } else {
        setActiveVideoId(fallbackId);
        setStreamError(`Streaming Raga ${currentChannel.name} Melodies`);
      }
    } catch {
      setActiveVideoId(fallbackId);
      setStreamError(`Streaming Raga ${currentChannel.name} Melodies`);
    } finally {
      setIsResolvingStream(false);
    }
  };

  // Tune to a new Raga Channel and immediately prepare its first song
  const handleSelectChannel = (channelId: string, autoPlay: boolean = false) => {
    const channel = CHANNELS.find((c) => c.id === channelId) || CHANNELS[0];
    setSelectedChannelId(channel.id);
    setSongSearch('');

    if (channel.songs && channel.songs.length > 0) {
      const songToPlay = channel.songs[0];
      setActiveSong(songToPlay);
      const effectiveVideoId = songToPlay.videoId || channel.defaultVideoId || 'BKlsIpDB_QA';
      setActiveVideoId(effectiveVideoId);
      if (autoPlay) {
        setIsPlaying(true);
      }
    } else if (channel.defaultVideoId) {
      setActiveVideoId(channel.defaultVideoId);
      if (autoPlay) setIsPlaying(true);
    }

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'radio');
      url.searchParams.set('raga', channel.id);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleNextRaga = () => {
    const currentIndex = CHANNELS.findIndex((c) => c.id === selectedChannelId);
    const nextIndex = (currentIndex + 1) % CHANNELS.length;
    handleSelectChannel(CHANNELS[nextIndex].id, true);
  };

  const handlePrevRaga = () => {
    const currentIndex = CHANNELS.findIndex((c) => c.id === selectedChannelId);
    const prevIndex = (currentIndex - 1 + CHANNELS.length) % CHANNELS.length;
    handleSelectChannel(CHANNELS[prevIndex].id, true);
  };

  const handleStopRadio = () => {
    setIsPlaying(false);
    setActiveVideoId(null);
  };

  const handleNextSong = () => {
    if (!currentChannel || !activeSong) return;
    const currentIndex = currentChannel.songs.findIndex((s) => s.id === activeSong.id);
    if (currentIndex >= 0 && currentIndex < currentChannel.songs.length - 1) {
      handleTuneSong(currentChannel.songs[currentIndex + 1]);
    } else if (currentChannel.songs.length > 0) {
      handleTuneSong(currentChannel.songs[0]); // Loop back to start
    }
  };

  const handlePrevSong = () => {
    if (!currentChannel || !activeSong) return;
    const currentIndex = currentChannel.songs.findIndex((s) => s.id === activeSong.id);
    if (currentIndex > 0) {
      handleTuneSong(currentChannel.songs[currentIndex - 1]);
    } else if (currentChannel.songs.length > 0) {
      handleTuneSong(currentChannel.songs[currentChannel.songs.length - 1]);
    }
  };


  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Radio Station Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950 via-stone-900 to-amber-900 text-white p-6 sm:p-8 shadow-2xl border border-amber-600/40">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold tracking-wide uppercase">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Live Classical &amp; Film Raga Radio</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-1" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white flex items-center gap-3">
              Raga <span className="text-amber-400">Radio</span>
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
              Explore <strong>90 Classical &amp; Cinema Ragas</strong> with over <strong>3,274 Compositions</strong>. Click any song&apos;s radio button in the last section to start streaming immediately right from the menu!
            </p>
          </div>

          {/* Quick Station Stats Pills */}
          <div className="bg-black/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex flex-wrap sm:flex-col gap-2 shrink-0 text-xs">
            <div className="flex items-center gap-2 text-stone-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <strong className="text-white text-sm">90</strong> Active Raga Channels
            </div>
            <div className="flex items-center gap-2 text-stone-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <strong className="text-white text-sm">3,274</strong> Total Compositions
            </div>
            <div className="flex items-center gap-2 text-stone-300">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Direct In-Menu Stream</span>
            </div>
          </div>
        </div>
      </div>

      {/* STREAMING CONSOLE PLAYER (Streams directly inside the menu) */}
      <div
        ref={playerRef}
        className="relative sm:sticky sm:top-20 z-20 rounded-2xl sm:rounded-3xl bg-stone-900/95 backdrop-blur-md text-white p-3.5 sm:p-5 shadow-2xl border border-amber-500/40 transition-all"
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 sm:gap-5">
          {/* Left: Track Information & Status */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                isPlaying
                  ? 'bg-gradient-to-br from-amber-500 to-rose-600 shadow-lg shadow-amber-500/30 scale-105'
                  : 'bg-stone-800 border border-stone-700'
              }`}
            >
              {isPlaying ? (
                <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
              ) : (
                <Disc className="w-5 h-5 sm:w-6 sm:h-6 text-stone-400" />
              )}
            </div>

            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span
                  className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isPlaying
                      ? 'bg-emerald-500 text-black font-extrabold animate-pulse'
                      : 'bg-stone-700 text-stone-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-black' : 'bg-stone-400'}`} />
                  {isPlaying ? 'ON AIR' : 'STANDBY'}
                </span>

                <div className="inline-flex items-center gap-1 bg-amber-950/90 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl border border-amber-500/50 text-[11px] shadow-inner max-w-full">
                  <Radio className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />
                  <span className="font-bold text-amber-300 shrink-0">Raga:</span>
                  <select
                    value={selectedChannelId}
                    onChange={(e) => handleSelectChannel(e.target.value, false)}
                    className="bg-transparent text-white font-extrabold focus:outline-none cursor-pointer pr-1 text-[11px] truncate max-w-[130px] sm:max-w-none"
                    title="Change Raga Radio Channel"
                  >
                    {CHANNELS.map((ch) => (
                      <option key={ch.id} value={ch.id} className="bg-stone-900 text-stone-100">
                        #{ch.rank} {ch.name} ({ch.songCount} Songs)
                      </option>
                    ))}
                  </select>
                </div>

                {streamError && (
                  <span className="text-[9px] text-amber-300 bg-amber-900/60 px-2 py-0.5 rounded border border-amber-500/30 truncate max-w-full">
                    {streamError}
                  </span>
                )}
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {activeSong ? activeSong.title : 'Select any song below to stream'}
              </h3>

              {activeSong ? (
                <p className="text-[10px] sm:text-xs text-stone-400 truncate">
                  Film: <span className="text-stone-200 font-medium">{activeSong.movie}</span> &bull; Music:{' '}
                  <span className="text-stone-200 font-medium">{activeSong.musicDirector}</span> ({activeSong.year})
                </p>
              ) : (
                <p className="text-[10px] sm:text-xs text-stone-400 truncate">
                  Tune in to any composition using the Tune In button below.
                </p>
              )}
            </div>
          </div>

          {/* Middle: Embedded Streaming Player */}
          <div className="w-full lg:w-80 rounded-xl sm:rounded-2xl overflow-hidden shadow-inner border border-amber-500/40 bg-black shrink-0 relative flex flex-col items-center justify-center">
            <div className="relative w-full aspect-video sm:aspect-auto sm:h-36 bg-black overflow-hidden">
              {activeVideoId ? (
                <iframe
                  key={activeVideoId}
                  src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&playsinline=1&enablejsapi=1&rel=0&origin=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''}`}
                  title={`Streaming ${activeSong?.title || currentChannel.name}`}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-stone-400">
                  <Disc className="w-8 h-8 text-amber-500 mb-2 animate-spin" />
                  <span className="text-xs">Preparing stream...</span>
                </div>
              )}

              {isResolvingStream && (
                <div className="absolute top-2 right-2 bg-black/85 backdrop-blur-sm px-2 py-1 rounded-lg border border-amber-500/40 flex items-center gap-1.5 text-[10px] text-amber-300 pointer-events-none">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                  <span>Matching track...</span>
                </div>
              )}
            </div>

            {/* Mobile Helpful Autoplay & Audio Guidance Notice */}
            <div className="w-full bg-amber-950/95 border-t border-amber-500/40 px-2.5 py-1.5 text-center text-[10px] sm:text-xs text-amber-200 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>
                <strong>Mobile:</strong> Tap <strong>▶</strong> in video for sound &bull; or tap <strong>YouTube App</strong> for background play
              </span>
            </div>
          </div>

          {/* Right: Controls & Actions (Single clean set of buttons) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
            {/* Song Navigation */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevSong}
                disabled={!activeSong}
                className="p-2 sm:p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 disabled:opacity-40 transition-colors touch-manipulation active:scale-95"
                title="Previous Song in Channel"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {isPlaying ? (
                <button
                  type="button"
                  onClick={handleStopRadio}
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all touch-manipulation active:scale-95"
                  title="Stop Streaming"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (activeSong) {
                      handleTuneSong(activeSong, false);
                    } else if (currentChannel.songs.length > 0) {
                      handleTuneSong(currentChannel.songs[0], false);
                    }
                  }}
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/30 transition-all touch-manipulation active:scale-95"
                  title="Play Selected Song"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Play</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNextSong}
                disabled={!activeSong}
                className="p-2 sm:p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 disabled:opacity-40 transition-colors touch-manipulation active:scale-95"
                title="Next Song in Channel"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Raga Channel Switchers */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevRaga}
                className="px-2.5 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1 shadow-sm whitespace-nowrap touch-manipulation active:scale-95"
                title="Switch to Previous Raga Channel"
              >
                <span>&laquo; Prev Raga</span>
              </button>
              <button
                type="button"
                onClick={handleNextRaga}
                className="px-2.5 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1 shadow-sm whitespace-nowrap touch-manipulation active:scale-95"
                title="Switch to Next Raga Channel"
              >
                <span>Next Raga &raquo;</span>
              </button>
            </div>

            {/* 1-Tap YouTube App Direct Watch Link */}
            {activeSong && (
              <a
                href={activeSong.youtubeUrl || (activeVideoId ? `https://www.youtube.com/watch?v=${activeVideoId}` : undefined)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm touch-manipulation active:scale-95 shrink-0"
                title="Open directly in YouTube App"
              >
                <span>YouTube App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: 90 RAGAS RADIO CHANNELS PICKER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-200/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-600" />
              <span>Select Raga Radio Channel (All 90 Ragas)</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Tuned to: <strong className="text-amber-700 font-bold">{currentChannel.name}</strong> ({currentChannel.songCount} Compositions)
            </p>
          </div>

          {/* Search 90 Ragas */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
              placeholder="Search 90 Ragas (e.g. Mohanam)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* 90 Raga Channel Badges Grid */}
        <div className="max-h-56 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {filteredChannels.map((c) => {
              const isSelected = c.id === selectedChannelId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectChannel(c.id, true)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left flex items-center justify-between border ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white border-amber-600 shadow-md font-bold ring-2 ring-amber-400 scale-[1.02]'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                  title={`Tune Radio Station to ${c.name} (${c.songCount} Songs)`}
                >
                  <span className="truncate pr-1 flex items-center gap-1.5">
                    {isSelected && (
                      <Radio className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
                    )}
                    <span>{c.name}</span>
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                      isSelected ? 'bg-white/25 text-white font-extrabold' : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {c.songCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: COMPOSITIONS LIST WITH RADIO STREAMING BUTTON */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-200/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Music className="w-5 h-5 text-amber-600" />
              <span>
                Compositions in Raga <span className="text-amber-700">{currentChannel.name}</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                {filteredSongs.length} Songs
              </span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Select the radio button (🔘) on the right side of any song to stream right here in the menu.
            </p>
          </div>

          {/* Filter songs inside current raga */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={songSearch}
              onChange={(e) => setSongSearch(e.target.value)}
              placeholder="Search in this raga (Song, Movie, Director)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Mobile Compositions Card View (sm:hidden) - Eliminates need to side-scroll to find radio stream button */}
        <div className="block sm:hidden space-y-3">
          {filteredSongs.map((song, idx) => {
            const isCurrentStream = activeSong?.id === song.id && isPlaying;
            return (
              <div
                key={song.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrentStream
                    ? 'bg-amber-50/90 border-amber-400 shadow-md ring-1 ring-amber-300'
                    : 'bg-white border-stone-200/90 shadow-2xs hover:border-amber-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-stone-900 text-sm leading-snug">
                      {song.title}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded shrink-0">
                    {song.year}
                  </span>
                </div>

                <div className="mt-2 text-xs text-stone-600 pl-8 space-y-0.5">
                  <div>
                    <strong className="text-stone-700">Film:</strong> {song.movie}
                  </div>
                  <div>
                    <strong className="text-stone-700">Music:</strong> {song.musicDirector}
                  </div>
                  {song.singers && (
                    <div className="text-[11px] text-stone-500 truncate">
                      <strong className="text-stone-700">Singers:</strong> {song.singers}
                    </div>
                  )}
                </div>

                {/* Mobile Action Row */}
                <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                  <a
                    href={song.videoId ? `https://www.youtube.com/watch?v=${song.videoId}` : song.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-xs touch-manipulation active:scale-95 transition-all"
                    title={`Play "${song.title}" directly in YouTube App`}
                  >
                    <span>▶ Play in YouTube</span>
                    <ExternalLink className="w-3 h-3 text-red-100" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleTuneSong(song, true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs touch-manipulation active:scale-95 ${
                      isCurrentStream
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-amber-100/90 text-amber-950 border border-amber-300 hover:bg-amber-200'
                    }`}
                  >
                    <Radio className={`w-3.5 h-3.5 ${isCurrentStream ? 'animate-pulse text-white' : 'text-amber-700'}`} />
                    <span>{isCurrentStream ? 'In Player ▲' : 'Stream In-App 📺'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredSongs.length === 0 && (
            <div className="p-8 text-center text-stone-500 bg-stone-50 rounded-2xl border border-stone-200 text-xs">
              No songs found matching &ldquo;{songSearch}&rdquo; in Raga {currentChannel.name}.
            </div>
          )}
        </div>

        {/* Desktop Songs Table (hidden on mobile) */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-stone-200 shadow-xs">
          <table className="min-w-full divide-y divide-stone-200 text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="px-3.5 py-3 w-12 text-center">
                  #
                </th>
                <th scope="col" className="px-4 py-3">
                  Song Title &amp; Singers
                </th>
                <th scope="col" className="px-4 py-3">
                  Movie Name
                </th>
                <th scope="col" className="px-4 py-3">
                  Music Director
                </th>
                <th scope="col" className="px-3 py-3 w-20 text-center">
                  Year
                </th>
                <th scope="col" className="px-3 py-3 w-28 text-center">
                  YouTube
                </th>
                {/* LAST SECTION: RADIO BUTTON STREAMING COLUMN */}
                <th
                  scope="col"
                  className="px-4 py-3 text-center bg-amber-100/70 text-amber-950 font-black border-l border-amber-200 w-36"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                    <span>Radio Stream</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {filteredSongs.map((song, idx) => {
                const isCurrentStream = activeSong?.id === song.id && isPlaying;
                return (
                  <tr
                    key={song.id}
                    className={`transition-colors hover:bg-amber-50/60 ${
                      isCurrentStream ? 'bg-amber-50 font-medium' : ''
                    }`}
                  >
                    <td className="px-3.5 py-3 text-center text-stone-400 font-mono text-xs">
                      {idx + 1}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{song.title}</span>
                      </div>
                      {song.singers && (
                        <div className="text-[11px] text-stone-500 truncate max-w-xs mt-0.5">
                          {song.singers}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-stone-700 font-medium">
                      {song.movie}
                    </td>

                    <td className="px-4 py-3 text-stone-600">
                      {song.musicDirector}
                    </td>

                    <td className="px-3 py-3 text-center text-stone-500 font-mono">
                      {song.year}
                    </td>

                    <td className="px-3 py-3 text-center">
                      <a
                        href={song.videoId ? `https://www.youtube.com/watch?v=${song.videoId}` : song.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-red-700 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 transition-colors"
                        title={`Watch "${song.title}" on YouTube`}
                      >
                        <span>Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>

                    {/* LAST SECTION: RADIO BUTTON STREAMING CELL */}
                    <td className="px-4 py-3 text-center bg-amber-50/50 border-l border-amber-200/80">
                      <button
                        type="button"
                        onClick={() => handleTuneSong(song)}
                        className="inline-flex items-center justify-center gap-2 cursor-pointer group px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors"
                        title={`Stream "${song.title}"`}
                      >
                        <input
                          type="radio"
                          name="raga_radio_stream_selection"
                          checked={activeSong?.id === song.id}
                          onChange={() => handleTuneSong(song)}
                          className="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                        />
                        <span
                          className={`text-xs font-bold transition-all px-2 py-0.5 rounded-md ${
                            isCurrentStream
                              ? 'bg-amber-600 text-white shadow-xs animate-pulse'
                              : 'text-stone-700 group-hover:text-amber-800'
                          }`}
                        >
                          {isCurrentStream ? (isResolvingStream ? 'Tuning...' : 'Playing 🎶') : 'Tune In'}
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredSongs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-stone-500">
                    No songs found matching &ldquo;{songSearch}&rdquo; in Raga {currentChannel.name}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Floating Mini-Player Bar (Sticky above bottom nav bar on mobile) */}
      {activeSong && (
        <div className="sm:hidden fixed bottom-14 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-amber-500/50 px-3 py-2 text-white shadow-2xl flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{activeSong.title}</p>
              <p className="text-[10px] text-amber-300 truncate">
                Raga {activeSong.raga || currentChannel.name} &bull; {activeSong.movie}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={activeSong.videoId ? `https://www.youtube.com/watch?v=${activeSong.videoId}` : activeSong.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
              title="Play directly in YouTube App"
            >
              <span>▶ YouTube</span>
            </a>
            <button
              type="button"
              onClick={() => {
                playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/40 text-[11px] font-bold active:scale-95 transition-transform"
              title="Go to In-App Player"
            >
              ▲ Player
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
