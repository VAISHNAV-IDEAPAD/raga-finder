// Web Audio API Synthesizer for Swaras and Tanpura drone
const BASE_SA_FREQ = 261.63; // C4 Middle C

export const SWARA_RATIOS: Record<string, number> = {
  // Lower Octave
  "S,": 0.5,
  "R1,": 0.5 * (16 / 15),
  "R2,": 0.5 * (9 / 8),
  "G2,": 0.5 * (6 / 5),
  "G3,": 0.5 * (5 / 4),
  "M1,": 0.5 * (4 / 3),
  "M2,": 0.5 * (45 / 32),
  "P,": 0.75,
  "D1,": 4 / 5,
  "D2,": 5 / 6,
  "N2,": 9 / 10,
  "N3,": 15 / 16,
  "N,": 15 / 16,

  // Middle Octave Carnatic
  "S": 1.0,
  "R": 9 / 8,
  "R1": 16 / 15,
  "R2": 9 / 8,
  "R3": 6 / 5,
  "G": 5 / 4,
  "G1": 9 / 8,
  "G2": 6 / 5,
  "G3": 5 / 4,
  "M": 4 / 3,
  "M1": 4 / 3,
  "M2": 45 / 32,
  "P": 3 / 2,
  "D": 5 / 3,
  "D1": 8 / 5,
  "D2": 5 / 3,
  "D3": 9 / 5,
  "N": 15 / 8,
  "N1": 5 / 3,
  "N2": 9 / 5,
  "N3": 15 / 8,

  // Higher Octave
  "S'": 2.0,
  "R'": 2.0 * (9 / 8),
  "R1'": 2.0 * (16 / 15),
  "R2'": 2.0 * (9 / 8),
  "R3'": 2.0 * (6 / 5),
  "G'": 2.0 * (5 / 4),
  "G1'": 2.0 * (9 / 8),
  "G2'": 2.0 * (6 / 5),
  "G3'": 2.0 * (5 / 4),
  "M'": 2.0 * (4 / 3),
  "M1'": 2.0 * (4 / 3),
  "M2'": 2.0 * (45 / 32),
  "P'": 3.0,
  "D'": 2.0 * (5 / 3),
  "D1'": 2.0 * (8 / 5),
  "D2'": 2.0 * (5 / 3),
  "D3'": 2.0 * (9 / 5),
  "N'": 2.0 * (15 / 8),
  "N1'": 2.0 * (5 / 3),
  "N2'": 2.0 * (9 / 5),
  "N3'": 2.0 * (15 / 8),

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

export function getSwaraRatio(swara: string): number {
  const clean = swara.trim();
  if (SWARA_RATIOS[clean] !== undefined) {
    return SWARA_RATIOS[clean];
  }

  // Handle trailing lower octave marker
  if (clean.endsWith(',')) {
    const base = clean.slice(0, -1);
    const baseRatio = SWARA_RATIOS[base] || getBaseSwaraRatio(base);
    return baseRatio * 0.5;
  }

  // Handle trailing higher octave marker
  if (clean.endsWith("'")) {
    const base = clean.slice(0, -1);
    const baseRatio = SWARA_RATIOS[base] || getBaseSwaraRatio(base);
    return baseRatio * 2.0;
  }

  return getBaseSwaraRatio(clean);
}

function getBaseSwaraRatio(swara: string): number {
  if (SWARA_RATIOS[swara] !== undefined) return SWARA_RATIOS[swara];
  if (swara.startsWith('S')) return 1.0;
  if (swara.startsWith('R')) return 9 / 8;
  if (swara.startsWith('G')) return 5 / 4;
  if (swara.startsWith('M')) return 4 / 3;
  if (swara.startsWith('P')) return 3 / 2;
  if (swara.startsWith('D')) return 5 / 3;
  if (swara.startsWith('N')) return 15 / 8;
  return 1.0;
}

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

export function playSingleSwara(swara: string, duration = 0.55): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const ratio = getSwaraRatio(swara);
  const freq = BASE_SA_FREQ * ratio;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Warm organ/tanpura timbre with soft harmonics
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  // Envelope (soft attack, sustained, smooth exponential decay)
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.05);
}

export async function playSwaraSequence(
  swaras: string[],
  noteDuration = 0.45,
  isCancelled?: () => boolean
): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;

  for (let i = 0; i < swaras.length; i++) {
    if (isCancelled && isCancelled()) {
      break;
    }
    const note = swaras[i].trim();
    if (!note) continue;
    playSingleSwara(note, noteDuration);
    await new Promise((r) => setTimeout(r, noteDuration * 1000));
  }
}
