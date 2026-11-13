'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Sparkles,
  Music,
  CheckCircle2,
  Radio,
  RefreshCw,
} from 'lucide-react';
import {
  detectPitchYIN,
  quantizePitchToSwara,
  STANDARD_TONICS,
  AudioRagaPrediction,
  SWARA_DEFINITIONS,
} from '@/lib/audioML';
import { RagaProfile } from '@/types/raga';

interface AudioRagaDetectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRaga: (raga: RagaProfile) => void;
}

export default function AudioRagaDetectorModal({
  isOpen,
  onClose,
  onSelectRaga,
}: AudioRagaDetectorModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedTonic, setSelectedTonic] = useState<string>('C');
  const [currentFreq, setCurrentFreq] = useState<number | null>(null);
  const [currentSwara, setCurrentSwara] = useState<string | null>(null);
  const [currentDeviation, setCurrentDeviation] = useState<number>(0);
  const [recordedSwaras, setRecordedSwaras] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<AudioRagaPrediction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordedPcmRef = useRef<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stop recording when closed
  useEffect(() => {
    if (!isOpen) {
      stopRecording();
    }
  }, [isOpen]);

  const startRecording = async () => {
    try {
      setMicError(null);
      setRecordedSwaras([]);
      setPredictions([]);
      recordedPcmRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });

      mediaStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsRecording(true);
      processAudioLoop();
    } catch (err: any) {
      console.error('Microphone error:', err);
      setMicError('Microphone access was denied or is unavailable on this device.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setIsRecording(false);
    setCurrentFreq(null);
    setCurrentSwara(null);
  };

  const processAudioLoop = () => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const analyser = analyserRef.current;
    const sampleRate = audioContextRef.current.sampleRate;
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    // Render Waveform Canvas
    drawWaveform(buffer);

    // Run YIN pitch detector
    const pitch = detectPitchYIN(buffer, sampleRate);
    const tonicHz = STANDARD_TONICS[selectedTonic] || 261.63;

    if (pitch && pitch.clarity > 0.7) {
      setCurrentFreq(Math.round(pitch.frequency));
      const { swara, centsDeviation } = quantizePitchToSwara(pitch.frequency, tonicHz);
      setCurrentSwara(swara.name);
      setCurrentDeviation(centsDeviation);

      // Append to recorded swaras (debounced note changes)
      setRecordedSwaras((prev) => {
        if (prev.length === 0 || prev[prev.length - 1] !== swara.name) {
          const next = [...prev, swara.name];
          return next.slice(-25); // keep last 25 swara transitions
        }
        return prev;
      });
    } else {
      setCurrentFreq(null);
      setCurrentSwara(null);
    }

    animationFrameRef.current = requestAnimationFrame(processAudioLoop);
  };

  const drawWaveform = (buffer: Float32Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f59e0b'; // Amber-500
    ctx.beginPath();

    const sliceWidth = canvas.width / buffer.length;
    let x = 0;

    for (let i = 0; i < buffer.length; i++) {
      const v = buffer[i] * 2.5; // Gain amplification
      const y = (canvas.height / 2) + v * (canvas.height / 2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  const runRagaClassifier = async () => {
    if (recordedSwaras.length === 0) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/audio-ml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tonic: selectedTonic,
          swaras: recordedSwaras,
        }),
      });
      const data = await res.json();
      if (data.candidateRagas) {
        setPredictions(data.candidateRagas);
      }
    } catch (e) {
      console.error('Audio ML classification error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-900 via-amber-950/30 to-stone-900 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                Audio AI/ML Swara & Raga Detector
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Live ML
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Hum or sing a phrase. Real-time YIN autocorrelation estimates pitch and predicts raga.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopRecording();
              onClose();
            }}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Tonic Sa Selector */}
          <div className="p-3.5 rounded-2xl bg-stone-800/60 border border-stone-700/80 flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                Adhara Shadjam (Tonic Sa):
              </span>
              <span className="text-[11px] text-stone-400">
                Align pitch quantization to your vocal pitch ({selectedTonic} = {STANDARD_TONICS[selectedTonic]} Hz)
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['C', 'C#', 'D', 'D#', 'E', 'F', 'G'].map((tonic) => (
                <button
                  key={tonic}
                  type="button"
                  onClick={() => setSelectedTonic(tonic)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedTonic === tonic
                      ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                      : 'bg-stone-700/70 text-stone-300 hover:bg-stone-600'
                  }`}
                >
                  {tonic}
                </button>
              ))}
            </div>
          </div>

          {/* Waveform Visualizer & Live Note Pitch Tracker */}
          <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 flex flex-col items-center justify-center relative overflow-hidden">
            <canvas
              ref={canvasRef}
              width={500}
              height={80}
              className="w-full h-20 opacity-80"
            />

            {/* Live Detected Note Box */}
            <div className="mt-3 flex items-center justify-center gap-4">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                  Detected Pitch
                </span>
                <span className="text-xl font-black font-mono text-white">
                  {currentFreq ? `${currentFreq} Hz` : '---'}
                </span>
              </div>

              <div className="w-px h-8 bg-stone-800" />

              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                  Swara Note
                </span>
                <span className="text-2xl font-black font-mono text-amber-400">
                  {currentSwara || '---'}
                </span>
              </div>

              <div className="w-px h-8 bg-stone-800" />

              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                  Deviation
                </span>
                <span className="text-xs font-mono font-bold text-stone-300">
                  {currentDeviation > 0 ? `+${currentDeviation}¢` : `${currentDeviation}¢`}
                </span>
              </div>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-3">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <Mic className="w-5 h-5 text-stone-950" />
                Start Singing / Humming
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all active:scale-95 animate-pulse"
              >
                <MicOff className="w-5 h-5" />
                Stop Recording
              </button>
            )}

            {recordedSwaras.length > 0 && (
              <button
                type="button"
                onClick={runRagaClassifier}
                disabled={isAnalyzing}
                className="px-5 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                )}
                Analyze Raga ({recordedSwaras.length} notes)
              </button>
            )}
          </div>

          {/* Mic Error Banner */}
          {micError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
              {micError}
            </div>
          )}

          {/* Captured Swara Stream */}
          {recordedSwaras.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-stone-800/40 border border-stone-800">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                Captured Swara Melodic Movement:
              </span>
              <div className="flex flex-wrap gap-1.5 font-mono">
                {recordedSwaras.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI/ML Predictions List */}
          {predictions.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Top AI Raga Matches:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {predictions.map((pred, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      onSelectRaga(pred.raga);
                      stopRecording();
                      onClose();
                    }}
                    className="p-3.5 rounded-2xl bg-stone-800/80 hover:bg-stone-750 border border-stone-700/80 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between gap-4 group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
                          {pred.raga.name}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-700 text-stone-300">
                          {pred.scaleType}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-1 font-mono">
                        Aro: {pred.raga.arohana} • Ava: {pred.raga.avarohana}
                      </p>
                      <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-2">
                        <span className="text-emerald-400">
                          Matched Swaras: {pred.matchedSwaras.join(' ')}
                        </span>
                        {pred.missingSwaras.length > 0 && (
                          <span className="text-rose-400">
                            (Unmatched: {pred.missingSwaras.join(' ')})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-lg font-black text-amber-400">
                        {pred.similarity}%
                      </span>
                      <span className="block text-[10px] text-stone-400 uppercase font-semibold">
                        Confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
