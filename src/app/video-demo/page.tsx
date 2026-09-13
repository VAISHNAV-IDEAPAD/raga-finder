'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Music,
  ShieldAlert,
  ArrowRight,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { playSingleSwara, playSwaraSequence } from '@/lib/audioSynth';

interface VideoSlide {
  step: number;
  time: string;
  title: string;
  subtitle: string;
  narration: string;
  actionDisplay: string;
  screenType: 'intro' | 'keyboard' | 'result' | 'admin' | 'melakarta' | 'outro';
  highlightNotes?: string[];
}

const SCENES: VideoSlide[] = [
  {
    step: 1,
    time: '0:00 - 0:15',
    title: 'The AI Musicology Revolution',
    subtitle: 'Can Artificial Intelligence truly understand Indian Classical Music?',
    narration:
      'Indian classical music has thousands of intricate ragas, microtonal swaras, and strict grammar. Standard AI models constantly confuse similar ragas. That is why I built RagaFinder AI!',
    actionDisplay: 'Cinematic intro showing the AI Raga Finder platform live on Vercel.',
    screenType: 'intro',
  },
  {
    step: 2,
    time: '0:15 - 0:40',
    title: 'Interactive Swara Keyboard',
    subtitle: 'Tap any swaras to hear pitches and construct scales',
    narration:
      'Let us test the interactive keyboard. We can select Carnatic notes: Sa, Chatushruti Ri, Antara Ga, Panchamam, and Chatushruti Dha. Listen to the built-in acoustic tone synthesis as each note is tapped!',
    actionDisplay: 'Tapping notes S, R2, G3, P, D2 with real-time audio pitch playback.',
    screenType: 'keyboard',
    highlightNotes: ['S', 'R2', 'G3', 'P', 'D2'],
  },
  {
    step: 3,
    time: '0:40 - 1:15',
    title: 'Instant Raga Identification',
    subtitle: 'OpenAI GPT-4o analyzes swaras against Melakartas & Thaats',
    narration:
      'We click "Find Raga". Instantly, OpenAI identifies it as Mohanam in Carnatic and Bhoopali in Hindustani! It breaks down the Arohana, Avarohana, Vadi, Samvadi, Mood, and lists famous classical kritis.',
    actionDisplay: 'Displaying comprehensive Raga result card for Mohanam with audio playback.',
    screenType: 'result',
  },
  {
    step: 4,
    time: '1:15 - 2:00',
    title: 'The Secret Weapon: Admin Teaching Portal',
    subtitle: 'Teaching OpenAI ground-truth rules so it never repeats mistakes',
    narration:
      'What happens if an AI makes a mistake? In traditional apps, you are stuck. In RagaFinder AI, musicologists have an Admin Teaching Portal! Admins can inject verified rules directly into the AI prompt to eliminate false positives forever.',
    actionDisplay: 'Entering Admin Console, reviewing reported mistakes, and teaching a new rule.',
    screenType: 'admin',
  },
  {
    step: 5,
    time: '2:00 - 2:25',
    title: '72 Melakarta Interactive Directory',
    subtitle: 'Explore all 72 Janaka ragas across 12 Chakras',
    narration:
      'Need reference? The 72 Melakarta directory organizes every parent raga from Kanakangi to Rasikapriya with instant scale playback at your fingertips.',
    actionDisplay: 'Scrolling through the 12 Chakras with audio previews.',
    screenType: 'melakarta',
  },
  {
    step: 6,
    time: '2:25 - 2:45',
    title: 'Live on Vercel Worldwide',
    subtitle: 'Try it right now in your browser!',
    narration:
      'RagaFinder AI is open-source and live right now on Vercel at raga-finder-seven.vercel.app. Check the description for links, star the repo on GitHub, and subscribe for more AI music tech projects!',
    actionDisplay: 'Call to Action with GitHub link, live Vercel URL, and Like & Subscribe.',
    screenType: 'outro',
  },
];

export default function VideoDemoPage() {
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSynthSupported, setSpeechSynthSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthSupported(true);
    }
  }, []);

  const currentScene = SCENES[currentSceneIdx];

  const speakNarration = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      speakNarration(currentScene.narration);

      // Play swaras if scene has notes
      if (currentScene.highlightNotes) {
        playSwaraSequence(currentScene.highlightNotes, 0.4);
      }

      timer = setTimeout(() => {
        if (currentSceneIdx < SCENES.length - 1) {
          setCurrentSceneIdx((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 12000); // 12 seconds per scene
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentSceneIdx]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentSceneIdx(0);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold mb-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span>YouTube Video Showcase & Walkthrough Generator</span>
          </div>
          <h1 className="text-3xl font-black text-stone-900">
            Automated Video Presentation Mode
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Hit <strong>Play Presentation</strong> to watch the self-guided narrated demo or screen-record it for your YouTube video!
          </p>
        </div>

        {/* Video Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/25'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Presentation</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Play Video Presentation</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            title="Reset to start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Screen Frame (16:9 Aspect Ratio) */}
      <div className="relative aspect-video w-full rounded-3xl bg-stone-950 text-white overflow-hidden shadow-2xl border-4 border-stone-800 flex flex-col justify-between p-6 sm:p-10">
        {/* Top Video Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-red-600/90 text-white font-black text-xs uppercase tracking-wider">
              Scene {currentScene.step} of {SCENES.length}
            </span>
            <span className="text-xs text-stone-400 font-mono">{currentScene.time}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>RagaFinder AI</span>
          </div>
        </div>

        {/* Center Stage Content */}
        <div className="my-auto text-center max-w-3xl mx-auto space-y-4 z-10 animate-fadeIn">
          {currentScene.screenType === 'intro' && (
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-raga-500 to-amber-600 flex items-center justify-center text-white shadow-2xl shadow-raga-500/50">
                <Music className="w-10 h-10" />
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                RagaFinder <span className="text-raga-500">AI</span>
              </h2>
              <p className="text-sm sm:text-lg text-amber-200/90 font-medium">
                Indian Classical Music Meets OpenAI Intelligence
              </p>
            </div>
          )}

          {currentScene.screenType === 'keyboard' && (
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Auditory Swara Synth
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white">
                Live Swara Audition & Scale Construction
              </h2>
              <div className="flex justify-center gap-2 py-4">
                {['S', 'R2', 'G3', 'P', 'D2'].map((note) => (
                  <span
                    key={note}
                    className="w-12 h-14 rounded-xl bg-raga-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-raga-500/40 animate-bounce"
                  >
                    {note}
                  </span>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-stone-300">
                Pentatonic Scale (Audav-Audav): Sa, Chatushruti Ri, Antara Ga, Pa, Chatushruti Dha
              </p>
            </div>
          )}

          {currentScene.screenType === 'result' && (
            <div className="space-y-3 bg-stone-900/80 p-6 rounded-2xl border border-amber-400/30 text-left max-w-xl mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-white">Mohanam / Bhoopali</span>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300">
                  Exact Match
                </span>
              </div>
              <div className="text-xs font-mono text-amber-300">
                Arohana: S R2 G3 P D2 S&apos; • Avarohana: S&apos; D2 P G3 R2 S
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Universal pentatonic raga omitting Ma and Ni. Expresses Shringara and serenity.
                Famous compositions: Nannu Palimpa, Giridhara Gopala.
              </p>
            </div>
          )}

          {currentScene.screenType === 'admin' && (
            <div className="space-y-3 bg-stone-900/80 p-6 rounded-2xl border border-amber-400/30 max-w-xl mx-auto">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm justify-center">
                <ShieldAlert className="w-5 h-5" />
                <span>Admin Teaching Console (/admin)</span>
              </div>
              <h3 className="text-lg font-bold text-white">Dynamic Ground-Truth Rule Injection</h3>
              <p className="text-xs text-stone-300">
                Musicologists can teach OpenAI specific rules to prevent confusing Carnatic Hanumatodi with
                Hindustani Miyan ki Todi or Keeravani with Simhendramadhyamam.
              </p>
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-left text-[11px] font-mono text-emerald-300">
                ✓ Rule Active: When only 5 notes S R2 G3 P D2 are present, strictly identify as Mohanam/Bhoopali.
              </div>
            </div>
          )}

          {currentScene.screenType === 'melakarta' && (
            <div className="space-y-3 max-w-xl mx-auto">
              <h3 className="text-xl sm:text-3xl font-black text-white">
                All 72 Melakarta Ragas Cataloged
              </h3>
              <p className="text-xs sm:text-sm text-stone-300">
                12 Chakras (Indu, Netra, Agni, Veda, Bana, Ritu, Rishi, Vasu, Brahma, Disi, Rudra, Aditya)
                with complete swara formulas and instant audio tone playback.
              </p>
            </div>
          )}

          {currentScene.screenType === 'outro' && (
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-4xl font-black text-white">
                Try It Live Right Now!
              </h2>
              <p className="text-base text-amber-300 font-mono">
                https://raga-finder-seven.vercel.app
              </p>
              <div className="flex items-center justify-center gap-4 pt-2">
                <span className="px-4 py-2 rounded-xl bg-white text-stone-900 font-bold text-xs">
                  ⭐ Star on GitHub
                </span>
                <span className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs">
                  👍 Like & Subscribe
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Subtitle / Narration Bar */}
        <div className="bg-stone-900/90 backdrop-blur border border-stone-800 p-4 rounded-2xl z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1 text-left">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> Voiceover Narration:
              </span>
              <p className="text-xs sm:text-sm text-stone-200 leading-snug font-medium">
                &quot;{currentScene.narration}&quot;
              </p>
            </div>

            {/* Scene Selector Dots */}
            <div className="flex items-center gap-1.5 shrink-0">
              {SCENES.map((s, idx) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setCurrentSceneIdx(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === currentSceneIdx ? 'bg-amber-400 scale-125' : 'bg-stone-700 hover:bg-stone-500'
                  }`}
                  title={`Jump to Scene ${s.step}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links Below */}
      <div className="mt-6 flex flex-wrap items-center justify-between text-xs text-stone-500">
        <p>💡 Tip: Use Windows Game Bar (<code>Win + Alt + R</code>) or OBS to record this screen directly for YouTube!</p>
        <Link href="/" className="text-raga-600 hover:text-raga-700 font-bold flex items-center gap-1">
          <span>Back to Raga Finder</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
