import { NextRequest, NextResponse } from 'next/server';
import {
  classifyAudioStream,
  STANDARD_TONICS,
  quantizePitchToSwara,
  SWARA_DEFINITIONS,
} from '@/lib/audioML';
import { structuredDb } from '@/lib/structuredDb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tonic = 'C', swaras, frequencies, pcmSamples, sampleRate = 44100 } = body;

    const tonicHz = STANDARD_TONICS[tonic] || 261.63;

    // Case 1: Swara sequence passed directly from client-side Web Audio analyzer
    if (swaras && Array.isArray(swaras) && swaras.length > 0) {
      // Build 12-bin histogram from the sequence
      const hist = new Float32Array(12);
      swaras.forEach((s: string) => {
        const def = SWARA_DEFINITIONS.find((d) => d.name === s);
        if (def) hist[def.binIndex] += 1;
      });

      let norm = 0;
      for (let i = 0; i < 12; i++) norm += hist[i] * hist[i];
      norm = Math.sqrt(norm);
      if (norm > 0) {
        for (let i = 0; i < 12; i++) hist[i] /= norm;
      }

      const dominantSwaras = Array.from(new Set(swaras)) as string[];

      // Match against ragas
      const ragas = structuredDb.ragas;
      const candidates = ragas.map((raga) => {
        const scaleStr = `${raga.arohana} ${raga.avarohana}`.toUpperCase();
        const ragaSwaraSet = new Set(
          SWARA_DEFINITIONS.filter((d) => scaleStr.includes(d.name)).map((d) => d.name)
        );

        const matched = dominantSwaras.filter((s) => ragaSwaraSet.has(s));
        const missing = dominantSwaras.filter((s) => !ragaSwaraSet.has(s));

        // Precision & Recall
        const precision = matched.length / Math.max(1, dominantSwaras.length);
        const recall = matched.length / Math.max(1, ragaSwaraSet.size);
        const f1 = (2 * precision * recall) / Math.max(0.001, precision + recall);

        return {
          raga,
          similarity: Number((f1 * 100).toFixed(1)),
          matchedSwaras: matched,
          missingSwaras: missing,
          scaleType: raga.melakartaNumber ? `Melakarta #${raga.melakartaNumber}` : raga.tradition,
        };
      });

      candidates.sort((a, b) => b.similarity - a.similarity);

      return NextResponse.json({
        tonicName: tonic,
        tonicFrequencyHz: tonicHz,
        dominantSwaras,
        candidateRagas: candidates.slice(0, 5),
      });
    }

    // Case 2: Array of raw frequency values passed
    if (frequencies && Array.isArray(frequencies) && frequencies.length > 0) {
      const detectedSwaras: string[] = [];
      frequencies.forEach((f: number) => {
        if (f > 65 && f < 1200) {
          const q = quantizePitchToSwara(f, tonicHz);
          detectedSwaras.push(q.swara.name);
        }
      });

      // Recurse with swaras array
      const hist = new Float32Array(12);
      detectedSwaras.forEach((s) => {
        const def = SWARA_DEFINITIONS.find((d) => d.name === s);
        if (def) hist[def.binIndex] += 1;
      });

      const uniqueSwaras = Array.from(new Set(detectedSwaras));
      const candidates = structuredDb.ragas.map((raga) => {
        const scaleStr = `${raga.arohana} ${raga.avarohana}`.toUpperCase();
        const ragaSwaraSet = new Set(
          SWARA_DEFINITIONS.filter((d) => scaleStr.includes(d.name)).map((d) => d.name)
        );

        const matched = uniqueSwaras.filter((s) => ragaSwaraSet.has(s));
        const missing = uniqueSwaras.filter((s) => !ragaSwaraSet.has(s));

        const score = (matched.length / Math.max(1, uniqueSwaras.length)) * 100 - missing.length * 10;
        return {
          raga,
          similarity: Math.max(0, Math.min(100, Number(score.toFixed(1)))),
          matchedSwaras: matched,
          missingSwaras: missing,
          scaleType: raga.melakartaNumber ? `Melakarta #${raga.melakartaNumber}` : raga.tradition,
        };
      });

      candidates.sort((a, b) => b.similarity - a.similarity);

      return NextResponse.json({
        tonicName: tonic,
        tonicFrequencyHz: tonicHz,
        detectedSwarasSequence: detectedSwaras.slice(0, 30),
        dominantSwaras: uniqueSwaras,
        candidateRagas: candidates.slice(0, 5),
      });
    }

    // Case 3: Raw PCM Samples
    if (pcmSamples && Array.isArray(pcmSamples)) {
      const samples = new Float32Array(pcmSamples);
      const result = classifyAudioStream(samples, sampleRate, tonicHz, tonic);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Provide swaras array, frequencies array, or pcmSamples' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Audio ML classification failed', details: error?.message },
      { status: 500 }
    );
  }
}
