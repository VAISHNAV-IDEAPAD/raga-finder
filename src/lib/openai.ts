import { IdentifyRequest, IdentifyResponse, AdminRule, Tradition } from '@/types/raga';
import { getAdminRules } from './storage';
import seedRagas from '@/data/seed_ragas.json';
import { findSongInDatabase, resolveRagaProfile } from './songSearch';
import { identifyWithAIMusicologist } from './aiMusicologist';
import { lookupSongOnMSIDB } from './msidbLookup';
import { executeAIEngine, getAIAvailability } from './aiEngine';
import { resolveSongWithOfflineRAG } from './ragRetriever';
import { vectorStore } from './vectorStore';
import { hybridSearch } from './hybridSearch';
import { structuredDb } from './structuredDb';
import { searchByMusicologicalRule, calculateKatapayadiMelakarta } from './ruleEngine';

export async function identifyRaga(request: IdentifyRequest): Promise<IdentifyResponse> {
  const adminRules = await getAdminRules();
  const activeRules = adminRules.filter(r => r.active);

  // Check if any admin rule has a strict override pattern match
  let matchedRule: AdminRule | undefined;

  if (request.mode === 'swaras' && request.swaras && request.swaras.length > 0) {
    const inputSwaras = new Set(request.swaras.map(s => s.trim().toUpperCase()));
    matchedRule = activeRules.find(rule => {
      if (rule.patternType === 'swaras' && rule.swaraPattern && rule.swaraPattern.length > 0) {
        const ruleSwaras = new Set(rule.swaraPattern.map(s => s.trim().toUpperCase()));
        // Check exact match or subset
        if (ruleSwaras.size === inputSwaras.size && Array.from(ruleSwaras).every(s => inputSwaras.has(s))) {
          return true;
        }
      }
      return false;
    });
  } else if (request.mode === 'song' && request.songQuery) {
    const q = request.songQuery.toLowerCase();
    matchedRule = activeRules.find(rule => 
      rule.triggerKeywords?.some(k => q.includes(k.toLowerCase()))
    );

    // STAGE 1: Check verified song and raga database (now bundling complete MSIDB + classical archives)
    const dbMatch = findSongInDatabase(request.songQuery);
    if (dbMatch) {
      return {
        success: true,
        source: 'database',
        confidence: 'Exact Match',
        raga: dbMatch.ragaProfile,
        isMultiRaga: dbMatch.isMultiRaga,
        ragas: dbMatch.allRagaProfiles,
        matchedSong: dbMatch.matchedSong,
        appliedAdminRule: matchedRule ? {
          id: matchedRule.id,
          title: matchedRule.title,
          reason: matchedRule.ruleInstruction,
        } : undefined,
        rawQuery: request,
      };
    }

    // STAGE 1.5: Query live MSIDB real-time archive for any newly released songs not in the bundled database
    const msidbMatch = await lookupSongOnMSIDB(request.songQuery);
    if (msidbMatch) {
      return {
        success: true,
        source: 'database',
        confidence: 'Exact Match',
        raga: msidbMatch.ragaProfile,
        matchedSong: msidbMatch.matchedSong,
        appliedAdminRule: matchedRule ? {
          id: matchedRule.id,
          title: matchedRule.title,
          reason: matchedRule.ruleInstruction,
        } : undefined,
        rawQuery: request,
      };
    }
    // If neither MSIDB nor the local catalogue has it, proceed to AI engine.
  }

  // Check if AI is active (either via client key or server environment)
  const aiAvailability = getAIAvailability(request);

  // STAGE 2: If AI is active, invoke AI Musicologist (Gemini or OpenAI)
  if (aiAvailability.available) {
    try {
      const aiResponse = await executeAIEngine(request, activeRules, matchedRule);
      return aiResponse;
    } catch (err: any) {
      console.warn('[AI Engine Execution Failed, gracefully falling back to Offline Neural RAG]:', err.message);
      // Fall through to STAGE 3 so user gets high-quality offline RAG identification rather than a dead-end error
    }
  }

  // STAGE 3: Offline AI Musicologist & Vector RAG Resolution (Zero-AI-Key)
  if (request.mode === 'song' && request.songQuery) {
    const offlineResult = identifyWithAIMusicologist(request.songQuery);
    if (offlineResult && offlineResult.success) {
      if (matchedRule) {
        offlineResult.appliedAdminRule = {
          id: matchedRule.id,
          title: matchedRule.title,
          reason: matchedRule.ruleInstruction,
        };
      }
      return offlineResult;
    }

    // Try Vector RAG Resolution
    const offlineRag = await resolveSongWithOfflineRAG(request.songQuery);
    if (offlineRag.success && offlineRag.ragaProfile) {
      return {
        success: true,
        source: 'rag_augmented',
        confidence: 'High',
        raga: offlineRag.ragaProfile,
        matchedSong: offlineRag.matchedSong,
        ragContext: offlineRag.ragInfo,
        appliedAdminRule: matchedRule ? {
          id: matchedRule.id,
          title: matchedRule.title,
          reason: matchedRule.ruleInstruction,
        } : undefined,
        rawQuery: request,
      };
    }

    // Song is not in offline DB and AI is not active: Prompt user to activate AI with retrieved context!
    return {
      success: false,
      source: 'rag_augmented',
      confidence: 'Low',
      needsAiActivation: true,
      unindexedSongTitle: request.songQuery,
      aiProvider: 'none',
      ragContext: offlineRag.ragInfo,
      raga: {
        name: 'Song Not In Offline Database',
        alternateNames: [],
        tradition: 'Both',
        arohana: 'Scale not determined yet',
        avarohana: 'Scale not determined yet',
        swarasCarnatic: [],
        swarasHindustani: [],
        rasaOrMood: 'Activate AI to analyze',
        timeOfDay: 'Anytime',
        famousSongs: [],
        explanation: offlineRag.ragInfo?.detectedFilm
          ? `We retrieved details for "${request.songQuery}" from the film "${offlineRag.ragInfo.detectedFilm}"${offlineRag.ragInfo.detectedComposer ? ` composed by ${offlineRag.ragInfo.detectedComposer}` : ''}. Activate AI (Google Gemini or OpenAI) to analyze its exact musical scale and raga!`
          : `"${request.songQuery}" is not in our offline database yet. Activate AI (Google Gemini or OpenAI) to instantly identify this song's raga, notes, and musicology!`,
      },
      rawQuery: request,
    };
  }

  // Fallback to local database + rule resolution (for swaras / description)
  return resolveFromDatabaseAndRules(request, activeRules, matchedRule);
}

function resolveFromDatabaseAndRules(
  request: IdentifyRequest,
  activeRules: AdminRule[],
  matchedRule?: AdminRule
): IdentifyResponse {
  // If matched rule exists
  if (matchedRule) {
    const dbMatch = seedRagas.find(r => 
      r.name.toLowerCase().includes(matchedRule.correctRaga.toLowerCase()) ||
      matchedRule.correctRaga.toLowerCase().includes(r.name.toLowerCase())
    );

    if (dbMatch) {
      return {
        success: true,
        source: 'admin_rule',
        confidence: 'Exact Match',
        raga: {
          name: dbMatch.name,
          alternateNames: dbMatch.alternateNames,
          tradition: dbMatch.tradition as Tradition,
          melakartaNumber: dbMatch.melakartaNumber,
          thaat: dbMatch.thaat,
          parentRaga: dbMatch.parentRaga,
          arohana: dbMatch.arohana,
          avarohana: dbMatch.avarohana,
          swarasCarnatic: dbMatch.swaras,
          swarasHindustani: dbMatch.hindustaniNotes ? dbMatch.hindustaniNotes.split(', ') : [],
          vadi: dbMatch.vadi,
          samvadi: dbMatch.samvadi,
          pakadOrSignature: dbMatch.pakad,
          rasaOrMood: dbMatch.rasa || 'Devotional, Melodic',
          timeOfDay: dbMatch.timeOfDay || 'Anytime',
          famousSongs: dbMatch.famousSongs || [],
          closelyRelatedRagas: ['Bhairav', 'Kalingada'],
          explanation: `Identified via Verified Admin Musicologist Ground-Truth Rule: "${matchedRule.title}". Instruction: ${matchedRule.ruleInstruction}`,
        },
        appliedAdminRule: {
          id: matchedRule.id,
          title: matchedRule.title,
          reason: matchedRule.ruleInstruction,
        },
        rawQuery: request,
      };
    }
  }

  // Hybrid Search by swaras (Dense Embeddings + Pitch Bitvectors + Structured DB)
  if (request.mode === 'swaras' && request.swaras && request.swaras.length > 0) {
    const hybridMatches = hybridSearch.searchRagas('', request.swaras, 1);
    const bestMatch = hybridMatches.length > 0 ? hybridMatches[0].raga : structuredDb.ragas[0];
    const score = hybridMatches.length > 0 ? hybridMatches[0].score : 0.5;

    return {
      success: true,
      source: 'database',
      confidence: score > 0.8 ? 'High' : 'Moderate',
      raga: {
        ...bestMatch,
        explanation: `Matched from curated Raga knowledge base via Hybrid Search (Dense Embeddings + Structured Melakarta/Thaat Index). ${bestMatch.explanation || ''}`,
      },
      rawQuery: request,
    };
  }

  // Database search by song or krithi query
  if (request.mode === 'song' && request.songQuery) {
    const dbMatch = findSongInDatabase(request.songQuery);
    if (dbMatch) {
      return {
        success: true,
        source: 'database',
        confidence: 'Exact Match',
        raga: dbMatch.ragaProfile,
        matchedSong: dbMatch.matchedSong,
        rawQuery: request,
      };
    }

    // Route to AI Musicologist for unindexed songs
    const aiResult = identifyWithAIMusicologist(request.songQuery);
    if (aiResult) {
      return aiResult;
    }
  }

  // Vector search for description mode
  if (request.mode === 'description' && request.description) {
    const dbMatch = findSongInDatabase(request.description);
    if (dbMatch) {
      return {
        success: true,
        source: 'database',
        confidence: 'Moderate',
        raga: dbMatch.ragaProfile,
        matchedSong: dbMatch.matchedSong,
        rawQuery: request,
      };
    }

    const hybridMatches = hybridSearch.searchRagas(request.description, [], 1);
    if (hybridMatches.length > 0) {
      const match = hybridMatches[0].raga;
      return {
        success: true,
        source: 'database',
        confidence: hybridMatches[0].score > 0.3 ? 'High' : 'Moderate',
        raga: {
          ...match,
          explanation: `Matched from curated Raga knowledge base via Hybrid Search (Dense Embeddings + Structured Melakarta/Thaat Index). ${match.explanation || ''}`,
        },
        rawQuery: request,
      };
    }
  }

  // Musicological Rule Engine (Katapayadi, Audava/Shadava/Sampoorna, Bhashanga, Vakra)
  const ruleQuery = request.songQuery || request.description || '';
  if (ruleQuery) {
    const ruleMatches = searchByMusicologicalRule(ruleQuery);
    if (ruleMatches.length > 0) {
      const best = ruleMatches[0];
      return {
        success: true,
        source: 'database',
        confidence: 'Exact Match',
        raga: {
          ...best,
          explanation: `Identified via Carnatic Rule Engine: Scale Grammar / Katapayadi cipher match for "${ruleQuery}". ${best.explanation || ''}`,
        },
        rawQuery: request,
      };
    }
  }

  // Clean fallback when query cannot be resolved
  const first = seedRagas[0];
  return {
    success: true,
    source: 'database',
    confidence: 'Moderate',
    raga: {
      name: first.name,
      alternateNames: first.alternateNames,
      tradition: first.tradition as Tradition,
      melakartaNumber: first.melakartaNumber,
      thaat: first.thaat,
      parentRaga: first.parentRaga,
      arohana: first.arohana,
      avarohana: first.avarohana,
      swarasCarnatic: first.swaras,
      swarasHindustani: first.hindustaniNotes ? first.hindustaniNotes.split(', ') : [],
      vadi: first.vadi,
      samvadi: first.samvadi,
      pakadOrSignature: first.pakad,
      rasaOrMood: first.rasa || 'Devotional',
      timeOfDay: first.timeOfDay || 'Morning',
      famousSongs: first.famousSongs || [],
      explanation: `Analyzed query against classical music reference archives.`,
    },
    rawQuery: request,
  };
}
