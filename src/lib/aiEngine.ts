import OpenAI from 'openai';
import { IdentifyRequest, IdentifyResponse, AdminRule, Tradition, RagaProfile, SongRagaEntry } from '@/types/raga';

export interface AIAvailability {
  available: boolean;
  provider: 'gemini' | 'openai' | null;
  model: string;
  source: 'client' | 'server' | 'none';
}

/**
 * Check if AI identification is available either via client-supplied key or server environment
 */
export function getAIAvailability(request?: IdentifyRequest): AIAvailability {
  // 1. Client-supplied credentials take first precedence
  if (request?.aiApiKey && request.aiApiKey.trim().length > 5) {
    const provider = request.aiProvider || (request.aiApiKey.startsWith('AIza') ? 'gemini' : 'openai');
    const defaultModel = provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini';
    return {
      available: true,
      provider,
      model: request.aiModel || defaultModel,
      source: 'client',
    };
  }

  // 2. Server-side Gemini / Google API Key
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey && geminiKey.trim().length > 5 && !geminiKey.includes('your_')) {
    return {
      available: true,
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      source: 'server',
    };
  }

  // 3. Server-side OpenAI Key
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey.trim().length > 5 && !openaiKey.includes('your_')) {
    return {
      available: true,
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      source: 'server',
    };
  }

  return {
    available: false,
    provider: null,
    model: '',
    source: 'none',
  };
}

/**
 * Format Admin Rules for musicological prompt injection
 */
function buildAdminKnowledgeBlock(activeRules: AdminRule[]): string {
  if (!activeRules || activeRules.length === 0) {
    return 'No custom admin rules configured yet.';
  }

  return '### VERIFIED GROUND-TRUTH RULES & CORRECTIONS TAUGHT BY MUSICOLOGIST ADMIN:\n' +
    'You MUST follow these rules with HIGHEST PRIORITY. If any condition here applies, obey the rule instruction strictly without hallucination:\n' +
    activeRules.map((r, i) =>
      '[Rule #' + (i + 1) + ': ' + r.title + ']\n' +
      '- Pattern: ' + r.patternType + (r.swaraPattern ? ' [' + r.swaraPattern.join(', ') + ']' : '') + '\n' +
      '- Trigger keywords: ' + (r.triggerKeywords?.join(', ') || 'N/A') + '\n' +
      '- Correct Raga: ' + r.correctRaga + '\n' +
      '- Tradition: ' + r.tradition + '\n' +
      '- Instruction: ' + r.ruleInstruction + '\n' +
      '- Severity: ' + r.severity
    ).join('\n\n') + '\n';
}

function buildSystemPrompt(activeRules: AdminRule[]): string {
  const adminKnowledgeBlock = buildAdminKnowledgeBlock(activeRules);

  return 'You are a world-class Indian Classical & Cinema Musicologist with encyclopedic knowledge of:\n' +
    '1. Carnatic Classical Music (72 Melakarta system, Katapayadi sankhya, Janya ragas, Vakra/Varja/Bhashanga sancharas).\n' +
    '2. Hindustani Classical Music (10 Thaats, Ragas, Vadi, Samvadi, Pakad, Samay/Prahar).\n' +
    '3. Indian Cinema Soundtrack Musicology (Tamil, Malayalam, Hindi, Telugu, Kannada) composed by legends like Ilaiyaraaja, A. R. Rahman, Raveendran, Johnson, M. S. Viswanathan, M. M. Keeravani, K. V. Mahadevan, Salil Chowdhury, R. D. Burman, Pritam, etc.\n\n' +
    adminKnowledgeBlock + '\n\n' +
    'CRITICAL MUSICOLOGICAL RULES:\n' +
    '1. Analyze the song\'s primary melodic scale, key transitions, and distinctive sancharas (phrases) to determine its base Raga.\n' +
    '2. If it is a film song, you MUST identify the movie name, composer / music director, singer(s), language, and year of release.\n' +
    '3. Clearly provide the Arohana (Ascent) and Avarohana (Descent) using standard swara notation:\n' +
    '   Carnatic: S, R1/R2/R3, G1/G2/G3, M1/M2, P, D1/D2/D3, N1/N2/N3.\n' +
    '   Hindustani: Sa, Komal/Shuddha Re, Komal/Shuddha Ga, Shuddha/Teevra Ma, Pa, Komal/Shuddha Dha, Komal/Shuddha Ni.\n' +
    '4. Give a thoughtful, authentic musicological explanation of how the song\'s melody embodies the raga\'s aesthetics and emotional mood.\n' +
    '5. If the song is based on multiple ragas (Ragamalika), specify the primary raga first and mention transitions in the explanation.\n\n' +
    'RESPONSE FORMAT:\n' +
    'You MUST respond with valid, parseable JSON ONLY with no conversational markdown wrappers, adhering strictly to this schema:\n' +
    '{\n' +
    '  "name": "Raga Name (e.g. Kalyani / Yaman)",\n' +
    '  "alternateNames": ["Alternative spellings or Hindustani/Carnatic equivalent"],\n' +
    '  "tradition": "Carnatic" | "Hindustani" | "Both",\n' +
    '  "melakartaNumber": 65, // integer 1-72 if Melakarta or Janaka raga, else null\n' +
    '  "thaat": "Kalyan", // Hindustani thaat if applicable, else null\n' +
    '  "parentRaga": "Parent / Melakarta raga name",\n' +
    '  "arohana": "S R2 G3 M2 P D2 N3 S\'",\n' +
    '  "avarohana": "S\' N3 D2 P M2 G3 R2 S",\n' +
    '  "swarasCarnatic": ["S", "R2", "G3", "M2", "P", "D2", "N3"],\n' +
    '  "swarasHindustani": ["Sa", "Shuddha Re", "Shuddha Ga", "Teevra Ma", "Pa", "Shuddha Dha", "Shuddha Ni"],\n' +
    '  "vadi": "G3",\n' +
    '  "samvadi": "N3",\n' +
    '  "pakadOrSignature": "Key signature phrase",\n' +
    '  "rasaOrMood": "Bhakti, Shringara, etc.",\n' +
    '  "timeOfDay": "Evening / Night",\n' +
    '  "filmOrAlbum": "Movie / Album name if applicable",\n' +
    '  "composer": "Composer / Music Director name",\n' +
    '  "singers": "Singers name(s)",\n' +
    '  "language": "Language of the song",\n' +
    '  "famousSongs": [\n' +
    '    { "title": "Other famous song in this raga", "composerOrFilm": "Film or Composer", "type": "Film Song / Carnatic Kriti" }\n' +
    '  ],\n' +
    '  "closelyRelatedRagas": ["Related raga 1", "Related raga 2"],\n' +
    '  "explanation": "Detailed musicological analysis of this specific song or scale, highlighting the signature swaras and emotional feel."\n' +
    '}';
}

function buildUserQuery(request: IdentifyRequest): string {
  if (request.mode === 'song') {
    return 'Identify the classical Raga of this Indian song, composition, or film track:\n' +
      'Title / Query: "' + request.songQuery + '"\n' +
      'Preferred Tradition: ' + (request.traditionPreference || 'Both') + '\n\n' +
      'Please accurately determine the exact raga, film/album context, composer, singers, scale notes (Arohana and Avarohana), and detailed musical explanation.';
  }

  if (request.mode === 'swaras') {
    return 'Identify the Raga for this scale:\n' +
      'Swaras: ' + (request.swaras?.join(' ') || '') + '\n' +
      'Arohana: ' + (request.arohana || 'Not specified') + '\n' +
      'Avarohana: ' + (request.avarohana || 'Not specified') + '\n' +
      'Preferred Tradition: ' + (request.traditionPreference || 'Both');
  }

  return 'Identify the Raga based on this description or scale notes:\n' +
    '"' + request.description + '"\n' +
    'Preferred Tradition: ' + (request.traditionPreference || 'Both');
}

/**
 * Call Google Gemini API directly via REST endpoint
 */
async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userQuery: string
): Promise<any> {
  const targetModel = model || 'gemini-2.0-flash';
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + targetModel + ':generateContent?key=' + encodeURIComponent(apiKey);

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userQuery }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    let errorMsg = 'Gemini API error (' + res.status + ')';
    try {
      const errJson = JSON.parse(errorBody);
      if (errJson.error?.message) errorMsg = errJson.error.message;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await res.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error('Gemini returned an empty response.');
  }

  return JSON.parse(textContent);
}

/**
 * Call OpenAI API using OpenAI SDK
 */
async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userQuery: string
): Promise<any> {
  const openai = new OpenAI({ apiKey });
  const targetModel = model || 'gpt-4o-mini';

  const completion = await openai.chat.completions.create({
    model: targetModel,
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuery },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }

  return JSON.parse(content);
}

/**
 * Unified AI Engine Execution for Raga Identification
 */
export async function executeAIEngine(
  request: IdentifyRequest,
  activeRules: AdminRule[] = [],
  matchedRule?: AdminRule
): Promise<IdentifyResponse> {
  const availability = getAIAvailability(request);

  if (!availability.available || !availability.provider) {
    throw new Error('No AI provider available. Please activate AI by entering a Gemini or OpenAI API key.');
  }

  // Resolve API Key
  let apiKey = '';
  if (availability.source === 'client') {
    apiKey = request.aiApiKey!.trim();
  } else if (availability.provider === 'gemini') {
    apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  } else {
    apiKey = (process.env.OPENAI_API_KEY || '').trim();
  }

  if (!apiKey) {
    throw new Error('Missing API key for AI provider ' + availability.provider);
  }

  const systemPrompt = buildSystemPrompt(activeRules);
  const userQuery = buildUserQuery(request);

  let parsed: any;
  if (availability.provider === 'gemini') {
    parsed = await callGemini(apiKey, availability.model, systemPrompt, userQuery);
  } else {
    parsed = await callOpenAI(apiKey, availability.model, systemPrompt, userQuery);
  }

  // Build RagaProfile
  const ragaProfile: RagaProfile = {
    name: parsed.name || 'Unidentified Raga',
    alternateNames: parsed.alternateNames || [],
    tradition: (parsed.tradition as Tradition) || 'Both',
    melakartaNumber: parsed.melakartaNumber || undefined,
    thaat: parsed.thaat || undefined,
    parentRaga: parsed.parentRaga || undefined,
    arohana: parsed.arohana || 'Standard classical scale',
    avarohana: parsed.avarohana || 'Standard classical scale',
    swarasCarnatic: parsed.swarasCarnatic || [],
    swarasHindustani: parsed.swarasHindustani || [],
    vadi: parsed.vadi || undefined,
    samvadi: parsed.samvadi || undefined,
    pakadOrSignature: parsed.pakadOrSignature || undefined,
    rasaOrMood: parsed.rasaOrMood || 'Melodic',
    timeOfDay: parsed.timeOfDay || 'Anytime',
    famousSongs: parsed.famousSongs || [],
    closelyRelatedRagas: parsed.closelyRelatedRagas || [],
    explanation: parsed.explanation || ('Identified via ' + (availability.provider === 'gemini' ? 'Google Gemini AI' : 'OpenAI GPT') + '.'),
  };

  // If this was a song query, build matchedSong entry
  let matchedSong: SongRagaEntry | undefined;
  if (request.mode === 'song' && request.songQuery) {
    matchedSong = {
      title: request.songQuery,
      filmOrAlbum: parsed.filmOrAlbum || (parsed.language ? parsed.language + ' Composition' : 'Indian Cinema'),
      composer: parsed.composer || 'Traditional / Film Composer',
      singers: parsed.singers || '',
      language: parsed.language || 'Indian Soundtrack',
      raga: ragaProfile.name,
      source: availability.provider === 'gemini' ? 'Google Gemini AI' : 'OpenAI GPT',
    };
  }

  return {
    success: true,
    source: availability.provider,
    confidence: matchedRule ? 'Exact Match' : 'High',
    raga: ragaProfile,
    matchedSong,
    appliedAdminRule: matchedRule ? {
      id: matchedRule.id,
      title: matchedRule.title,
      reason: matchedRule.ruleInstruction,
    } : undefined,
    rawQuery: request,
    aiProvider: availability.provider,
  };
}

/**
 * Health check / verification tool to test a user's API key
 */
export async function testAIKey(
  apiKey: string,
  provider: 'gemini' | 'openai',
  model?: string
): Promise<{ success: boolean; message: string; modelUsed: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { success: false, message: 'API key is required', modelUsed: '' };
  }

  const testPrompt = 'Respond with JSON ONLY: {"test": "ok", "provider": "' + provider + '"}';

  try {
    if (provider === 'gemini') {
      const targetModel = model || 'gemini-2.0-flash';
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + targetModel + ':generateContent?key=' + encodeURIComponent(cleanKey);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: testPrompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        let msg = 'Gemini API returned HTTP ' + res.status;
        try {
          const j = JSON.parse(err);
          if (j.error?.message) msg = j.error.message;
        } catch {}
        return { success: false, message: msg, modelUsed: targetModel };
      }

      const data = await res.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return { success: true, message: 'Google Gemini API key verified successfully!', modelUsed: targetModel };
      }
      return { success: false, message: 'Empty response from Gemini', modelUsed: targetModel };
    } else {
      const targetModel = model || 'gpt-4o-mini';
      const openai = new OpenAI({ apiKey: cleanKey });
      const resp = await openai.chat.completions.create({
        model: targetModel,
        messages: [{ role: 'user', content: testPrompt }],
        max_tokens: 20,
      });

      if (resp.choices?.[0]?.message?.content) {
        return { success: true, message: 'OpenAI API key verified successfully!', modelUsed: targetModel };
      }
      return { success: false, message: 'Empty response from OpenAI', modelUsed: targetModel };
    }
  } catch (error: any) {
    return { success: false, message: error.message || 'Connection failed', modelUsed: model || '' };
  }
}
