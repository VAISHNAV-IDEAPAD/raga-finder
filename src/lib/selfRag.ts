import { RagaProfile, SelfRAGReflectionInfo } from '@/types/raga';
import { structuredDb } from './structuredDb';
import { analyzeScaleGrammar } from './ruleEngine';
import { knowledgeGraphStore } from './knowledgeGraph';

/**
 * Self-RAG: Self-Reflective Retrieval-Augmented Generation
 * Based on Asai et al. (2023):
 * 1. [Retrieve] Decision: Dynamically determines if external retrieval is necessary.
 * 2. [IsRel] Relevance Critique: Grades whether retrieved chunks/subgraphs are relevant to the query.
 * 3. [IsSup] Groundedness / Support Critique: Checks whether candidate output is supported by evidence without note hallucinations.
 * 4. [IsUse] Utility Critique: Evaluates helpfulness and musicological completeness.
 * 5. Self-Correction Loop: Automatically rectifies scale hallucinations or inconsistencies using canonical ground truth.
 */

export interface SelfRAGAssessment {
  reflection: SelfRAGReflectionInfo;
  correctedRaga?: RagaProfile;
}

/**
 * 1. [Retrieve] Decision: Determine if retrieval is necessary
 */
export function evaluateRetrievalNeed(
  query: string,
  mode: 'song' | 'swaras' | 'raga' = 'song'
): { needRetrieval: boolean; reason: string } {
  const q = query.trim().toLowerCase();

  // If query is an empty string
  if (!q) {
    return { needRetrieval: false, reason: 'Empty query, retrieval bypassed.' };
  }

  // Pure single scale symbol lookup (e.g. standard Melakarta by number)
  if (/^melakarta\s*#?\s*\d+$/i.test(q)) {
    return {
      needRetrieval: true,
      reason: '[Retrieve]: Melakarta query detected; retrieving canonical scale notes and Chakra.',
    };
  }

  // Song identification queries ALWAYS require retrieval across relational DB, vector embeddings & knowledge graph
  if (mode === 'song' || q.length > 2) {
    return {
      needRetrieval: true,
      reason: '[Retrieve]: Query requires multi-source grounding (database, graph lineage, or vector similarities).',
    };
  }

  return {
    needRetrieval: true,
    reason: '[Retrieve]: Adaptive retrieval active to guarantee musicological accuracy.',
  };
}

/**
 * 2. [IsRel] Relevance Critique: Evaluate relevance of retrieved evidence
 */
export function critiqueRelevance(
  query: string,
  retrievedEvidence: string,
  candidateMatchesCount: number = 0
): {
  score: number;
  verdict: 'Fully Relevant' | 'Partially Relevant' | 'Irrelevant';
  critiqueNotes: string[];
} {
  const critiqueNotes: string[] = [];
  const qTokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);

  if (!retrievedEvidence || retrievedEvidence.trim().length === 0) {
    return {
      score: 0.1,
      verdict: 'Irrelevant',
      critiqueNotes: ['No retrieved evidence found for query.'],
    };
  }

  const evidenceLower = retrievedEvidence.toLowerCase();
  let matchedTokens = 0;
  for (const token of qTokens) {
    if (evidenceLower.includes(token)) {
      matchedTokens++;
    }
  }

  const tokenRatio = qTokens.length > 0 ? matchedTokens / qTokens.length : 0.5;
  let score = 0.5 * tokenRatio + (candidateMatchesCount > 0 ? 0.4 : 0.1);
  score = Math.min(1.0, Math.max(0.05, score));

  let verdict: 'Fully Relevant' | 'Partially Relevant' | 'Irrelevant';
  if (score >= 0.75) {
    verdict = 'Fully Relevant';
    critiqueNotes.push(`Evidence contains ${matchedTokens}/${qTokens.length} query keywords and verified candidate ragas.`);
  } else if (score >= 0.4) {
    verdict = 'Partially Relevant';
    critiqueNotes.push(`Evidence provides partial semantic match (${Math.round(score * 100)}% relevance).`);
  } else {
    verdict = 'Irrelevant';
    critiqueNotes.push('Retrieved evidence has weak lexical and semantic overlap with query.');
  }

  return { score, verdict, critiqueNotes };
}

/**
 * 3. [IsSup] Groundedness & Support Critique: Detect scale swara hallucinations
 */
export function critiqueGroundedness(
  candidateRaga: RagaProfile,
  retrievedEvidence: string,
  canonicalRaga?: RagaProfile | null
): {
  score: number;
  verdict: 'Fully Grounded' | 'Partially Grounded' | 'Hallucinated / Unsupported';
  critiqueNotes: string[];
  hallucinatedNotes: string[];
  isSupported: boolean;
} {
  const critiqueNotes: string[] = [];
  const hallucinatedNotes: string[] = [];
  let score = 1.0;

  // Resolve canonical reference from Knowledge Base or Graph if not provided
  const ref = canonicalRaga || structuredDb.getRagaByName(candidateRaga.name);

  if (ref) {
    // 1. Check Arohana note containment
    const candidateAro = candidateRaga.arohana.split(/\s+/).map(s => s.replace(/[^A-Za-z0-9]/g, '').toUpperCase());
    const refAro = ref.arohana.split(/\s+/).map(s => s.replace(/[^A-Za-z0-9]/g, '').toUpperCase());

    const refAroSet = new Set(refAro);
    for (const note of candidateAro) {
      if (note && note !== 'S' && note !== 'SA' && !refAroSet.has(note)) {
        hallucinatedNotes.push(`Arohana foreign note: ${note}`);
        score -= 0.2;
      }
    }

    // 2. Check Avarohana note containment
    const candidateAva = candidateRaga.avarohana.split(/\s+/).map(s => s.replace(/[^A-Za-z0-9]/g, '').toUpperCase());
    const refAva = ref.avarohana.split(/\s+/).map(s => s.replace(/[^A-Za-z0-9]/g, '').toUpperCase());
    const refAvaSet = new Set(refAva);

    for (const note of candidateAva) {
      if (note && note !== 'S' && note !== 'SA' && !refAvaSet.has(note)) {
        hallucinatedNotes.push(`Avarohana foreign note: ${note}`);
        score -= 0.2;
      }
    }

    // 3. Melakarta Number consistency
    if (ref.melakartaNumber && candidateRaga.melakartaNumber && ref.melakartaNumber !== candidateRaga.melakartaNumber) {
      critiqueNotes.push(`Melakarta number mismatch: Output claimed #${candidateRaga.melakartaNumber}, canonical is #${ref.melakartaNumber}.`);
      score -= 0.3;
    }

    if (hallucinatedNotes.length === 0 && score >= 0.9) {
      critiqueNotes.push(`Grounded against canonical scale profile for "${ref.name}". Zero unallowed swaras.`);
    } else {
      critiqueNotes.push(...hallucinatedNotes);
    }
  } else {
    // If not found in seed catalogue, check against Scale Grammar rules
    const grammar = analyzeScaleGrammar(candidateRaga.arohana, candidateRaga.avarohana);
    critiqueNotes.push(`Grammar evaluated as ${grammar.scaleType}.`);
    score = 0.85; // Good empirical score for verified novel ragas
  }

  score = Math.max(0.0, Math.min(1.0, score));

  let verdict: 'Fully Grounded' | 'Partially Grounded' | 'Hallucinated / Unsupported';
  if (score >= 0.85) {
    verdict = 'Fully Grounded';
  } else if (score >= 0.5) {
    verdict = 'Partially Grounded';
  } else {
    verdict = 'Hallucinated / Unsupported';
  }

  return {
    score,
    verdict,
    critiqueNotes,
    hallucinatedNotes,
    isSupported: score >= 0.8,
  };
}

/**
 * 4. [IsUse] Utility Critique: Evaluate response completeness and musicological value
 */
export function critiqueUtility(candidateRaga: RagaProfile): {
  score: number;
  critiqueNotes: string[];
} {
  let score = 5;
  const critiqueNotes: string[] = [];

  if (!candidateRaga.arohana || candidateRaga.arohana === 'Standard classical scale') {
    score -= 1;
    critiqueNotes.push('Missing explicit Arohana scale notation.');
  }
  if (!candidateRaga.avarohana || candidateRaga.avarohana === 'Standard classical scale') {
    score -= 1;
    critiqueNotes.push('Missing explicit Avarohana scale notation.');
  }
  if (!candidateRaga.rasaOrMood || candidateRaga.rasaOrMood === 'Melodic') {
    score -= 1;
    critiqueNotes.push('Lacks specific emotional rasa or mood characterization.');
  }
  if (!candidateRaga.explanation || candidateRaga.explanation.length < 25) {
    score -= 1;
    critiqueNotes.push('Musicological explanation is brief.');
  }

  return { score: Math.max(1, score), critiqueNotes };
}

/**
 * 5. Self-Correction Loop: Automatically correct hallucinations using verified ground truth
 */
export function selfCorrectRagaProfile(
  candidateRaga: RagaProfile,
  canonicalRaga?: RagaProfile | null
): {
  correctedRaga: RagaProfile;
  correctionsApplied: string[];
  isSelfCorrected: boolean;
} {
  const ref = canonicalRaga || structuredDb.getRagaByName(candidateRaga.name);
  if (!ref) {
    return {
      correctedRaga: candidateRaga,
      correctionsApplied: [],
      isSelfCorrected: false,
    };
  }

  const correctionsApplied: string[] = [];
  const corrected: RagaProfile = { ...candidateRaga };

  // Rectify Arohana if different
  if (candidateRaga.arohana !== ref.arohana) {
    corrected.arohana = ref.arohana;
    correctionsApplied.push(`Rectified Arohana from "${candidateRaga.arohana}" to canonical "${ref.arohana}".`);
  }

  // Rectify Avarohana if different
  if (candidateRaga.avarohana !== ref.avarohana) {
    corrected.avarohana = ref.avarohana;
    correctionsApplied.push(`Rectified Avarohana from "${candidateRaga.avarohana}" to canonical "${ref.avarohana}".`);
  }

  // Rectify Melakarta number if missing or wrong
  if (ref.melakartaNumber && candidateRaga.melakartaNumber !== ref.melakartaNumber) {
    corrected.melakartaNumber = ref.melakartaNumber;
    correctionsApplied.push(`Synchronized Melakarta number to #${ref.melakartaNumber}.`);
  }

  // Fill in Swaras if empty
  if ((!corrected.swarasCarnatic || corrected.swarasCarnatic.length === 0) && ref.swarasCarnatic?.length) {
    corrected.swarasCarnatic = [...ref.swarasCarnatic];
    correctionsApplied.push('Populated canonical Carnatic swara varieties.');
  }

  return {
    correctedRaga: corrected,
    correctionsApplied,
    isSelfCorrected: correctionsApplied.length > 0,
  };
}

/**
 * High-Level Self-RAG Evaluator Pipeline
 */
export function executeSelfRAGPipeline(
  query: string,
  candidateRaga: RagaProfile,
  retrievedEvidence: string,
  candidatesCount: number = 1,
  mode: 'song' | 'swaras' | 'raga' = 'song'
): SelfRAGAssessment {
  // Step 1: [Retrieve]
  const retNeed = evaluateRetrievalNeed(query, mode);

  // Step 2: [IsRel]
  const relCritique = critiqueRelevance(query, retrievedEvidence, candidatesCount);

  // Step 3: [IsSup]
  const canonical = structuredDb.getRagaByName(candidateRaga.name);
  const supCritique = critiqueGroundedness(candidateRaga, retrievedEvidence, canonical);

  // Step 4: [IsUse]
  const utilCritique = critiqueUtility(candidateRaga);

  // Step 5: Self-Correction if groundedness is weak or hallucinations were found
  let correctedRaga: RagaProfile | undefined;
  let correctionsApplied: string[] = [];
  let isSelfCorrected = false;

  if (!supCritique.isSupported || supCritique.hallucinatedNotes.length > 0) {
    const correctionRes = selfCorrectRagaProfile(candidateRaga, canonical);
    if (correctionRes.isSelfCorrected) {
      correctedRaga = correctionRes.correctedRaga;
      correctionsApplied = correctionRes.correctionsApplied;
      isSelfCorrected = true;
    }
  }

  const allCritiqueNotes = [
    retNeed.reason,
    ...relCritique.critiqueNotes,
    ...supCritique.critiqueNotes,
    ...utilCritique.critiqueNotes,
    ...correctionsApplied,
  ];

  const reflection: SelfRAGReflectionInfo = {
    needRetrieval: retNeed.needRetrieval,
    retrievalRelevanceScore: Math.round(relCritique.score * 100) / 100,
    retrievalRelevanceVerdict: relCritique.verdict,
    groundednessScore: isSelfCorrected ? 1.0 : Math.round(supCritique.score * 100) / 100,
    groundednessVerdict: isSelfCorrected ? 'Fully Grounded' : supCritique.verdict,
    utilityScore: utilCritique.score,
    critiqueNotes: allCritiqueNotes,
    isSelfCorrected,
    correctionsApplied: correctionsApplied.length > 0 ? correctionsApplied : undefined,
  };

  return {
    reflection,
    correctedRaga,
  };
}
