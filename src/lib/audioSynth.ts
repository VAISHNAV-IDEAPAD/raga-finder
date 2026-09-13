// Web Audio API Synthesizer for Swaras and Tanpura drone
const BASE_SA_FREQ = 261.63; // C4 Middle C

export const SWARA_RATIOS: Record<string, number> = {
  // Lower Octave
  "S,": 0.5,
  "N3,": 15 / 16,
  "N2,": 9 / 10,
  "D2,": 5 / 6,
  "D1,": 4 / 5,
  "P,": 0.75,

  // Middle Octave Carnatic
  "S": 1.0,
  "R1": 16 / 15,
  "R2": 9 / 8,
  "R3": 6 / 5,
  "G1": 9 / 8,
  "G2": 6 / 5,
  "G3": 5 / 4,
  "M1": 4 / 3,
  "M2": 45 / 32,
  "P": 3 / 2,
  "D1": 8 / 5,
  "D2": 5 / 3,
  "D3": 9 / 5,
  "N1": 5 / 3,
  "N2": 9 / 5,
  "N3": 15 / 8,

  // Higher Octave
  "S'": 2.0,
  "R1'": 2.0 * (16 / 15),
  "R2'": 2.0 * (9 / 8),
  "G2'": 2.0 * (6 / 5),
  "G3'": 2.0 * (5 / 4),
  "M1'": 2.0 * (4 / 3),
  "M2'": 2.0 * (45 / 32),
  "P'": 3.0,

  // Hindustani notation
  "Sa": 1.0,
  "re": 16 / 15, // Komal
  "Re": 9 / 8,   // Shuddha
  "ga": 6 / 5,   // Komal
  "Ga": 5 / 4,   // Shuddha
  "ma": 4 / 3,   // Shuddha
  "Ma": 45 / 32, // Teevra
  "Pa": 3 / 2,
  "dha": 8 / 5,  // Komal
  "Dha": 5 / 3,  // Shuddha
  "ni": 9 / 5,   // Komal
  "Ni": 15 / 8,  // Shuddha
  "Sa'": 2.0,
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSingleSwara(swara: string, duration = 0.6): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const cleanSwara = swara.trim();
  const ratio = SWARA_RATIOS[cleanSwara] || 1.0;
  const freq = BASE_SA_FREQ * ratio;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Warm organ/tanpura timbre with soft harmonics
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  // Envelope (soft attack, sustained, smooth exponential decay)
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.05);
}

export async function playSwaraSequence(swaras: string[], noteDuration = 0.55): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;

  for (let i = 0; i < swaras.length; i++) {
    const note = swaras[i].trim();
    if (!note) continue;
    playSingleSwara(note, noteDuration);
    await new Promise(r => setTimeout(r, noteDuration * 1000));
  }
}
