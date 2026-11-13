/**
 * Audio AI/ML Engine for Carnatic and Hindustani Raga Detection
 *
 * Implements:
 * 1. Monophonic Pitch Tracking (YIN Autocorrelation Algorithm)
 * 2. Swara Ratio Quantization against Adhara Shadjam (Tonic Sa)
 * 3. Pitch Class Profile (PCP / Swara Energy Histogram)
 * 4. Dense Vector Cosine Similarity Classifier against 190+ Raga Profiles
 */

import { structuredDb } from './structuredDb';
import { RagaProfile } from '@/types/raga';

// Standard 12-Tone Equal Temperament / Shruti Ratios relative to Tonic Sa
export interface SwaraPitchDefinition {
  name: string;
  carnaticName: string;
  hindustaniName: string;
  ratio: number;
  cents: number;
  binIndex: number;
}

export const SWARA_DEFINITIONS: SwaraPitchDefinition[] = [
  { name: 'S', carnaticName: 'Shadjam', hindustaniName: 'Sa', ratio: 1.0, cents: 0, binIndex: 0 },
  { name: 'R1', carnaticName: 'Shuddha Rishabham', hindustaniName: 'Komal Re', ratio: 16 / 15, cents: 112, binIndex: 1 },
  { name: 'R2', carnaticName: 'Chatusruti Rishabham', hindustaniName: 'Shuddha Re', ratio: 9 / 8, cents: 204, binIndex: 2 },
  { name: 'G2', carnaticName: 'Sadharana Gandharam', hindustaniName: 'Komal Ga', ratio: 6 / 5, cents: 316, binIndex: 3 },
  { name: 'G3', carnaticName: 'Antara Gandharam', hindustaniName: 'Shuddha Ga', ratio: 5 / 4, cents: 386, binIndex: 4 },
  { name: 'M1', carnaticName: 'Shuddha Madhyamam', hindustaniName: 'Shuddha Ma', ratio: 4 / 3, cents: 498, binIndex: 5 },
  { name: 'M2', carnaticName: 'Prati Madhyamam', hindustaniName: 'Teevra Ma', ratio: 45 / 32, cents: 590, binIndex: 6 },
  { name: 'P', carnaticName: 'Panchamam', hindustaniName: 'Pa', ratio: 3 / 2, cents: 702, binIndex: 7 },
  { name: 'D1', carnaticName: 'Shuddha Dhaivatham', hindustaniName: 'Komal Dha', ratio: 8 / 5, cents: 814, binIndex: 8 },
  { name: 'D2', carnaticName: 'Chatusruti Dhaivatham', hindustaniName: 'Shuddha Dha', ratio: 5 / 3, cents: 906, binIndex: 9 },
  { name: 'N2', carnaticName: 'Kaisiki Nishadham', hindustaniName: 'Komal Ni', ratio: 9 / 5, cents: 1018, binIndex: 10 },
  { name: 'N3', carnaticName: 'Kakali Nishadham', hindustaniName: 'Shuddha Ni', ratio: 15 / 8, cents: 1088, binIndex: 11 },
];

export const STANDARD_TONICS: Record<string, number> = {
  C: 261.63,
  'C#': 277.18,
  D: 293.66,
  'D#': 311.13,
  E: 329.63,
  F: 349.23,
  'F#': 369.99,
  G: 392.0,
  'G#': 415.3,
  A: 440.0,
  'A#': 466.16,
  B: 493.88,
};

export interface AudioPitchFrame {
  frequency: number;
  clarity: number; // confidence 0.0 - 1.0
  swara: SwaraPitchDefinition | null;
  centsDeviation: number;
}

export interface AudioRagaPrediction {
  raga: RagaProfile;
  similarity: number; // 0.0 - 1.0 (percentage)
  matchedSwaras: string[];
  missingSwaras: string[];
  scaleType: string;
}

export interface AudioMLAnalysisResult {
  tonicName: string;
  tonicFrequencyHz: number;
  detectedSwarasSequence: string[];
  dominantSwaras: string[];
  swaraHistogram: number[]; // 12-bin energy distribution
  candidateRagas: AudioRagaPrediction[];
  voicedDurationMs: number;
}

/**
 * YIN Pitch Detection Algorithm
 * Computes fundamental frequency (F0) with sub-sample parabolic interpolation.
 */
export function detectPitchYIN(
  buffer: Float32Array,
  sampleRate: number,
  threshold: number = 0.15
): { frequency: number; clarity: number } | null {
  const bufferSize = buffer.length;
  const halfBufferSize = Math.floor(bufferSize / 2);
  const diff = new Float32Array(halfBufferSize);

  // Step 1: Difference Function
  for (let tau = 0; tau < halfBufferSize; tau++) {
    let sum = 0;
    for (let i = 0; i < halfBufferSize; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    diff[tau] = sum;
  }

  // Step 2: Cumulative Mean Normalized Difference Function (CMNDF)
  const cmndf = new Float32Array(halfBufferSize);
  cmndf[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfBufferSize; tau++) {
    runningSum += diff[tau];
    cmndf[tau] = runningSum === 0 ? 1 : (diff[tau] * tau) / runningSum;
  }

  // Step 3: Absolute Thresholding
  let tauCandidate = -1;
  for (let tau = 2; tau < halfBufferSize; tau++) {
    if (cmndf[tau] < threshold) {
      while (tau + 1 < halfBufferSize && cmndf[tau + 1] < cmndf[tau]) {
        tau++;
      }
      tauCandidate = tau;
      break;
    }
  }

  if (tauCandidate === -1) {
    // Find global minimum if no valley below threshold
    let minVal = Infinity;
    for (let tau = 2; tau < halfBufferSize; tau++) {
      if (cmndf[tau] < minVal) {
        minVal = cmndf[tau];
        tauCandidate = tau;
      }
    }
    if (minVal > 0.45) {
      return null; // Unvoiced / noisy
    }
  }

  // Step 4: Parabolic Interpolation for accurate sub-sample resolution
  let betterTau = tauCandidate;
  if (tauCandidate > 0 && tauCandidate < halfBufferSize - 1) {
    const s0 = cmndf[tauCandidate - 1];
    const s1 = cmndf[tauCandidate];
    const s2 = cmndf[tauCandidate + 1];
    const delta = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
    betterTau = tauCandidate + delta;
  }

  const frequency = sampleRate / betterTau;
  const clarity = 1 - Math.min(1, cmndf[tauCandidate]);

  // Human vocal range filtering (approx. 65 Hz to 1200 Hz)
  if (frequency < 65 || frequency > 1200) {
    return null;
  }

  return { frequency, clarity };
}

/**
 * Quantize a raw continuous frequency into the closest Carnatic Swara
 * relative to the selected Adhara Shadjam (Tonic Sa).
 */
export function quantizePitchToSwara(
  freqHz: number,
  tonicHz: number
): { swara: SwaraPitchDefinition; centsDeviation: number } {
  // Fold into octave [1.0, 2.0)
  const octavesFromTonic = Math.log2(freqHz / tonicHz);
  const normalizedOctave = octavesFromTonic - Math.floor(octavesFromTonic);
  const ratio = Math.pow(2, normalizedOctave);
  const currentCents = normalizedOctave * 1200;

  let closestSwara = SWARA_DEFINITIONS[0];
  let minDiff = Infinity;
  let signedDeviation = 0;

  for (const s of SWARA_DEFINITIONS) {
    // Distance in cents
    let diff = currentCents - s.cents;
    if (diff > 600) diff -= 1200;
    if (diff < -600) diff += 1200;

    const absDiff = Math.abs(diff);
    if (absDiff < minDiff) {
      minDiff = absDiff;
      closestSwara = s;
      signedDeviation = Math.round(diff);
    }
  }

  return { swara: closestSwara, centsDeviation: signedDeviation };
}

/**
 * Build a 12-dimensional Swara binary mask for a Raga's scale.
 */
function buildRagaSwaraVector(raga: RagaProfile): Float32Array {
  const vec = new Float32Array(12);
  const scaleStr = `${raga.arohana} ${raga.avarohana}`.toUpperCase();

  // Mapping rules for swara symbols
  if (scaleStr.includes('S')) vec[0] = 1.0;
  if (scaleStr.includes('R1')) vec[1] = 1.0;
  if (scaleStr.includes('R2')) vec[2] = 1.0;
  if (scaleStr.includes('G2')) vec[3] = 1.0;
  if (scaleStr.includes('G3')) vec[4] = 1.0;
  if (scaleStr.includes('M1')) vec[5] = 1.0;
  if (scaleStr.includes('M2')) vec[6] = 1.0;
  if (scaleStr.includes('P')) vec[7] = 1.0;
  if (scaleStr.includes('D1')) vec[8] = 1.0;
  if (scaleStr.includes('D2')) vec[9] = 1.0;
  if (scaleStr.includes('N2')) vec[10] = 1.0;
  if (scaleStr.includes('N3')) vec[11] = 1.0;

  // Normalize to unit vector
  let norm = 0;
  for (let i = 0; i < 12; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < 12; i++) vec[i] /= norm;
  }

  return vec;
}

/**
 * Perform Audio AI/ML Raga Classification from sampled PCM audio
 */
export function classifyAudioStream(
  pcmSamples: Float32Array,
  sampleRate: number,
  tonicHz: number = 261.63, // Default C4
  tonicName: string = 'C'
): AudioMLAnalysisResult {
  const frameSize = 2048;
  const hopSize = 1024;
  const totalFrames = Math.floor((pcmSamples.length - frameSize) / hopSize);

  const swaraHistogram = new Float32Array(12);
  const sequence: string[] = [];
  let voicedFramesCount = 0;

  for (let i = 0; i < totalFrames; i++) {
    const frame = pcmSamples.subarray(i * hopSize, i * hopSize + frameSize);
    const pitch = detectPitchYIN(frame, sampleRate);

    if (pitch && pitch.clarity > 0.65) {
      voicedFramesCount++;
      const { swara } = quantizePitchToSwara(pitch.frequency, tonicHz);
      swaraHistogram[swara.binIndex] += pitch.clarity;

      if (sequence.length === 0 || sequence[sequence.length - 1] !== swara.name) {
        sequence.push(swara.name);
      }
    }
  }

  // Compute L2 norm of the histogram
  let histNorm = 0;
  for (let i = 0; i < 12; i++) histNorm += swaraHistogram[i] * swaraHistogram[i];
  histNorm = Math.sqrt(histNorm);

  const normalizedHist = new Float32Array(12);
  if (histNorm > 0) {
    for (let i = 0; i < 12; i++) normalizedHist[i] = swaraHistogram[i] / histNorm;
  }

  // Dominant swaras (energy > 15% of peak)
  const dominantIndices = Array.from({ length: 12 }, (_, i) => i)
    .filter((i) => normalizedHist[i] > 0.15)
    .sort((a, b) => normalizedHist[b] - normalizedHist[a]);

  const dominantSwaras = dominantIndices.map((idx) => SWARA_DEFINITIONS[idx].name);

  // Match against all Ragas in structuredDb
  const ragas = structuredDb.ragas;
  const candidateScores: AudioRagaPrediction[] = [];

  for (const raga of ragas) {
    const ragaVec = buildRagaSwaraVector(raga);

    // Cosine similarity between normalizedHist and ragaVec
    let dot = 0;
    for (let i = 0; i < 12; i++) {
      dot += normalizedHist[i] * ragaVec[i];
    }

    // Swara set overlap
    const ragaSwaraSet = new Set(
      Array.from({ length: 12 }, (_, i) => (ragaVec[i] > 0 ? SWARA_DEFINITIONS[i].name : null)).filter(
        Boolean
      ) as string[]
    );

    const matchedSwaras = dominantSwaras.filter((s) => ragaSwaraSet.has(s));
    const missingSwaras = dominantSwaras.filter((s) => !ragaSwaraSet.has(s));

    // Penalty for singing swaras that are strictly forbidden in this raga
    const penalty = missingSwaras.length * 0.12;
    const finalSimilarity = Math.max(0, Math.min(1, dot - penalty));

    candidateScores.push({
      raga,
      similarity: Number((finalSimilarity * 100).toFixed(1)),
      matchedSwaras,
      missingSwaras,
      scaleType: raga.melakartaNumber ? `Melakarta #${raga.melakartaNumber}` : raga.tradition,
    });
  }

  // Sort descending by similarity
  candidateScores.sort((a, b) => b.similarity - a.similarity);

  return {
    tonicName,
    tonicFrequencyHz: tonicHz,
    detectedSwarasSequence: sequence.slice(0, 30),
    dominantSwaras,
    swaraHistogram: Array.from(normalizedHist),
    candidateRagas: candidateScores.slice(0, 5),
    voicedDurationMs: Math.round((voicedFramesCount * hopSize * 1000) / sampleRate),
  };
}
