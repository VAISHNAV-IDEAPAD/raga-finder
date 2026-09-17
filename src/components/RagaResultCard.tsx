'use client';

import React, { useState } from 'react';
import {
  Volume2,
  Sparkles,
  ShieldCheck,
  Music,
  Clock,
  Heart,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { IdentifyResponse } from '@/types/raga';
import { playSwaraSequence } from '@/lib/audioSynth';
import ReportMistakeModal from './ReportMistakeModal';

interface RagaResultCardProps {
  result: IdentifyResponse;
  rawQuery: any;
}

export default function RagaResultCard({ result, rawQuery }: RagaResultCardProps) {
  const { appliedAdminRule, confidence, source } = result;

  const isMultiRaga = Boolean(result.isMultiRaga && result.ragas && result.ragas.length > 1);
  const ragasList = isMultiRaga && result.ragas ? result.ragas : [result.raga];
  const [selectedRagaIdx, setSelectedRagaIdx] = useState(0);

  // Active raga being viewed in deep detail
  const raga = ragasList[selectedRagaIdx] || result.raga;

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingScaleId, setPlayingScaleId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Helper to extract swaras from Arohana/Avarohana string
  const parseNotes = (scaleStr: string): string[] => {
    if (!scaleStr) return [];
    return scaleStr
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s !== '-' && s !== '/');
  };

  const handlePlayScale = async (scaleStr: string, scaleId: string) => {
    if (isPlayingAudio) return;
    const notes = parseNotes(scaleStr);
    if (notes.length === 0) return;

    setIsPlayingAudio(true);
    setPlayingScaleId(scaleId);
    try {
      await playSwaraSequence(notes, 0.45);
    } catch (e) {
      console.error('Audio playback failed:', e);
    } finally {
      setIsPlayingAudio(false);
      setPlayingScaleId(null);
    }
  };

  return (
    <div className="rounded-3xl glass-panel shadow-xl border border-amber-200/80 overflow-hidden transition-all">
      {/* Top Banner */}
      <div className="px-6 py-5 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {raga.tradition} Tradition
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {confidence}
              </span>
              {isMultiRaga && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-stone-950 border border-amber-300 shadow-sm flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3" /> Ragamalika ({ragasList.length} Ragas)
                </span>
              )}
              {source === 'gemini' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-300" /> Google Gemini AI
                </span>
              )}
              {source === 'openai' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> OpenAI GPT
                </span>
              )}
              {source === 'ai_musicologist' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Musicologist
                </span>
              )}
              {source === 'database' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  Verified Archive
                </span>
              )}
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-2">
              {raga.name}
            </h2>

            {raga.alternateNames && raga.alternateNames.length > 0 && (
              <p className="text-xs sm:text-sm text-amber-200/80 mt-1 font-medium">
                Also known as: {raga.alternateNames.join(' • ')}
              </p>
            )}
          </div>

          <div className="text-right">
            {raga.melakartaNumber && (
              <div className="inline-block p-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-center">
                <span className="block text-[10px] text-amber-300 uppercase font-bold tracking-wider">
                  Melakarta
                </span>
                <span className="text-xl font-black text-white">#{raga.melakartaNumber}</span>
              </div>
            )}
            {raga.thaat && (
              <div className="inline-block ml-2 p-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-center">
                <span className="block text-[10px] text-amber-300 uppercase font-bold tracking-wider">
                  Thaat
                </span>
                <span className="text-sm font-bold text-white">{raga.thaat}</span>
              </div>
            )}
          </div>
        </div>

        {/* Multi-Raga Pill Navigator (Interactive Switcher) */}
        {isMultiRaga && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/40 backdrop-blur-md">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Select Raga Movement to Inspect:
              </span>
              <span className="text-[11px] text-stone-300">
                Viewing {selectedRagaIdx + 1} of {ragasList.length}: <strong className="text-amber-300">{raga.name}</strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {ragasList.map((rItem, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedRagaIdx(idx);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedRagaIdx === idx
                      ? 'bg-amber-400 text-stone-950 shadow-md font-black scale-105 ring-2 ring-white/50'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                  }`}
                >
                  <span className="opacity-70 text-[10px]">{idx + 1}.</span>
                  <span>{rItem.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Highlight if Matched Song was found */}
        {result.matchedSong && (
          <div className="mt-4 p-3.5 rounded-2xl bg-stone-800/80 border border-stone-700/80 backdrop-blur-md">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Music className="w-4 h-4 text-amber-400" />
                Matched Composition: {result.matchedSong.title}
              </span>
            </div>

            <div className="text-xs text-stone-200 flex flex-wrap gap-x-5 gap-y-1.5 mt-2">
              {result.matchedSong.filmOrAlbum && (
                <span><strong className="text-amber-300">Film / Album:</strong> {result.matchedSong.filmOrAlbum}</span>
              )}
              {result.matchedSong.composer && (
                <span><strong className="text-amber-300">Composer / Music:</strong> {result.matchedSong.composer}</span>
              )}
              {result.matchedSong.lyricist && (
                <span><strong className="text-amber-300">Lyricist:</strong> {result.matchedSong.lyricist}</span>
              )}
              {result.matchedSong.singers && (
                <span><strong className="text-amber-300">Singers:</strong> {result.matchedSong.singers}</span>
              )}
              {result.matchedSong.language && (
                <span><strong className="text-amber-300">Language:</strong> {result.matchedSong.language}</span>
              )}
            </div>

            {/* List of all ragas documented in this song */}
            {result.matchedSong.ragas && result.matchedSong.ragas.length > 1 && (
              <div className="mt-2.5 pt-2 border-t border-stone-700/60 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Ragas in this song:
                </span>
                <div className="flex flex-wrap gap-1">
                  {result.matchedSong.ragas.map((rName, i) => (
                    <span
                      key={i}
                      onClick={() => {
                        const targetIdx = ragasList.findIndex(
                          (r) => r.name.toLowerCase() === rName.toLowerCase()
                        );
                        if (targetIdx >= 0) setSelectedRagaIdx(targetIdx);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                        raga.name.toLowerCase() === rName.toLowerCase()
                          ? 'bg-amber-400 text-stone-950 font-bold'
                          : 'bg-stone-700 text-stone-200 hover:bg-stone-600'
                      }`}
                    >
                      {rName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Highlight if Admin Ground-Truth rule was applied */}
        {appliedAdminRule && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/70 border border-amber-500/50 flex items-start gap-2.5 animate-fadeIn">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-300 block">
                Verified Ground-Truth Rule Applied: {appliedAdminRule.title}
              </span>
              <span className="text-stone-300 text-[11px] leading-relaxed">
                {appliedAdminRule.reason}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Details Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Arohana & Avarohana Scales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Arohana */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-amber-600" />
                  Arohana (Ascent) - {raga.name}
                </span>
                <button
                  type="button"
                  onClick={() => handlePlayScale(raga.arohana, `${raga.name}-main-arohana`)}
                  disabled={isPlayingAudio}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{playingScaleId === `${raga.name}-main-arohana` ? 'Playing...' : 'Play'}</span>
                </button>
              </div>
              <div className="text-lg sm:text-xl font-mono font-bold text-stone-900 tracking-wide mt-1">
                {raga.arohana}
              </div>
            </div>
            <p className="text-[11px] text-stone-500 mt-2">
              Ascending scale pattern of swaras
            </p>
          </div>

          {/* Avarohana */}
          <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-900 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-orange-600" />
                  Avarohana (Descent) - {raga.name}
                </span>
                <button
                  type="button"
                  onClick={() => handlePlayScale(raga.avarohana, `${raga.name}-main-avarohana`)}
                  disabled={isPlayingAudio}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-700 text-white shadow-sm flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{playingScaleId === `${raga.name}-main-avarohana` ? 'Playing...' : 'Play'}</span>
                </button>
              </div>
              <div className="text-lg sm:text-xl font-mono font-bold text-stone-900 tracking-wide mt-1">
                {raga.avarohana}
              </div>
            </div>
            <p className="text-[11px] text-stone-500 mt-2">
              Descending scale pattern of swaras
            </p>
          </div>
        </div>

        {/* Musicological Characteristics Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-white border border-stone-200">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Vadi / Samvadi
            </span>
            <span className="text-sm font-bold text-stone-800 mt-1 block">
              {raga.vadi ? `${raga.vadi} / ${raga.samvadi || '-'}` : 'P / S'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-stone-200">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Rasa / Mood
            </span>
            <span className="text-sm font-bold text-stone-800 mt-1 block flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{raga.rasaOrMood || 'Devotional'}</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-stone-200">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Time / Samay
            </span>
            <span className="text-sm font-bold text-stone-800 mt-1 block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{raga.timeOfDay || 'Anytime'}</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-stone-200">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Parent / Type
            </span>
            <span className="text-sm font-bold text-stone-800 mt-1 block truncate">
              {raga.parentRaga || (raga.melakartaNumber ? `Melakarta #${raga.melakartaNumber}` : 'Sampoorna')}
            </span>
          </div>
        </div>

        {/* Pakad / Characteristic Phrase */}
        {raga.pakadOrSignature && (
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1">
              Signature Phrase (Pakad / Chalan):
            </span>
            <span className="font-mono text-sm font-bold text-stone-800">
              {raga.pakadOrSignature}
            </span>
          </div>
        )}

        {/* Deep Musicological Analysis */}
        <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/60 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>Musicologist Analysis & Notes: {raga.name}</span>
          </div>
          <p className="text-sm text-stone-700 leading-relaxed">
            {raga.explanation}
          </p>
          {raga.closelyRelatedRagas && raga.closelyRelatedRagas.length > 0 && (
            <div className="pt-2 text-xs text-stone-500">
              <span className="font-semibold text-stone-700">Closely Related Ragas: </span>
              {raga.closelyRelatedRagas.join(', ')}
            </div>
          )}
        </div>

        {/* ALL RAGAS IN ONE PLACE SECTION (for multi-raga songs) */}
        {isMultiRaga && (
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-stone-50 border-2 border-amber-300 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-amber-200/80">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900">
                    All {ragasList.length} Ragas in this Song (In One Place)
                  </h3>
                  <p className="text-xs text-stone-600">
                    Compare scales and play notes for each constituent raga in this composition:
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-200/80 text-amber-900 border border-amber-300">
                {ragasList.length} Ragas Documented
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {ragasList.map((rItem, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    selectedRagaIdx === idx
                      ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-400/40'
                      : 'bg-white/80 border-stone-200 hover:border-amber-300 hover:bg-white shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600">
                            #{idx + 1}
                          </span>
                          <h4 className="text-base font-bold text-stone-900">
                            {rItem.name}
                          </h4>
                        </div>
                        <span className="text-[11px] text-stone-500 block mt-0.5">
                          {rItem.parentRaga || (rItem.melakartaNumber ? `Melakarta #${rItem.melakartaNumber}` : rItem.tradition)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedRagaIdx(idx)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          selectedRagaIdx === idx
                            ? 'bg-amber-500 text-white font-bold'
                            : 'bg-stone-100 text-stone-700 hover:bg-amber-100 hover:text-amber-900'
                        }`}
                      >
                        {selectedRagaIdx === idx ? 'Selected' : 'View Full'}
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200/70">
                      <div>
                        <span className="text-stone-400 text-[10px] uppercase font-sans font-bold block">Arohana:</span>
                        <span className="font-bold text-stone-800 text-sm block">{rItem.arohana}</span>
                      </div>
                      <div className="pt-1 border-t border-stone-200/60">
                        <span className="text-stone-400 text-[10px] uppercase font-sans font-bold block">Avarohana:</span>
                        <span className="font-bold text-stone-800 text-sm block">{rItem.avarohana}</span>
                      </div>
                    </div>

                    {rItem.rasaOrMood && (
                      <p className="text-[11px] text-stone-500 mt-2 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-400 shrink-0" />
                        <span className="italic truncate">{rItem.rasaOrMood}</span>
                      </p>
                    )}
                  </div>

                  {/* Audio Controls for this specific raga */}
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => handlePlayScale(rItem.arohana, `grid-${idx}-arohana`)}
                      disabled={isPlayingAudio}
                      className="flex-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{playingScaleId === `grid-${idx}-arohana` ? 'Playing...' : 'Play Ascent'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlayScale(rItem.avarohana, `grid-${idx}-avarohana`)}
                      disabled={isPlayingAudio}
                      className="flex-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-700 text-white shadow-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{playingScaleId === `grid-${idx}-avarohana` ? 'Playing...' : 'Play Descent'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Famous Compositions & Songs */}
        {raga.famousSongs && raga.famousSongs.length > 0 && (
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-3">
              Notable Compositions in Raga {raga.name}:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {raga.famousSongs.map((song, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between"
                >
                  <span className="text-sm font-bold text-stone-900 line-clamp-1">
                    {song.title}
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
                    <span className="truncate">{song.composerOrFilm || 'Traditional'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium text-[10px]">
                      {song.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Bar: Teach AI / Report Mistake */}
        <div className="pt-4 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-stone-500 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Spotted an inaccuracy in notes or raga classification?</span>
          </div>

          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/80 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <span>Teach AI / Report Mistake</span>
          </button>
        </div>
      </div>

      {/* Mistake Report Modal */}
      <ReportMistakeModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        query={rawQuery}
        aiResult={raga}
      />
    </div>
  );
}
