export type Tradition = 'Carnatic' | 'Hindustani' | 'Both';

export interface Raga {
  id: string;
  name: string;
  alternateNames?: string[];
  tradition: Tradition;
  melakartaNumber?: number; // 1 - 72 for Carnatic
  thaat?: string; // e.g. Bilawal, Kafi, Bhairav for Hindustani
  parentRaga?: string; // Melakarta or Janaka raga
  arohana: string; // e.g. "S R2 G3 M1 P D2 N3 S'"
  avarohana: string; // e.g. "S' N3 D2 P M1 G3 R2 S"
  swaras: string[]; // ['S', 'R2', 'G3', 'M1', 'P', 'D2', 'N3']
  hindustaniNotes?: string; // e.g. "Sa Re Ga Ma Pa Dha Ni"
  westernScale?: string; // e.g. "C D E F G A B C"
  vadi?: string;
  samvadi?: string;
  pakad?: string; // Characteristic phrase
  rasa?: string; // Mood (Bhakti, Shringara, Veera, Karuna, Shanta)
  timeOfDay?: string; // Prahar/Samay e.g. "Morning", "Late Night", "Anytime"
  famousSongs?: {
    title: string;
    type: 'Carnatic Kriti' | 'Hindustani Bandish' | 'Film Song' | 'Devotional';
    composerOrFilm?: string;
  }[];
  description?: string;
}

export interface IdentifyRequest {
  mode: 'swaras' | 'song' | 'description';
  swaras?: string[]; // Selected swaras e.g. ['S', 'R1', 'G3', 'M1', 'P', 'D1', 'N3']
  arohana?: string;
  avarohana?: string;
  songQuery?: string;
  description?: string;
  traditionPreference?: Tradition;
  aiApiKey?: string;
  aiProvider?: 'gemini' | 'openai';
  aiModel?: string;
}

export interface SongRagaEntry {
  title: string;
  alternateTitles?: string[];
  filmOrAlbum?: string;
  composer?: string;
  lyricist?: string;
  singers?: string;
  year?: string;
  language: string;
  raga: string;
  ragas?: string[];
  songUrl?: string;
  source: string;
}

export interface RagaProfile {
  name: string;
  alternateNames?: string[];
  tradition: Tradition;
  melakartaNumber?: number;
  thaat?: string;
  parentRaga?: string;
  arohana: string;
  avarohana: string;
  swarasCarnatic: string[];
  swarasHindustani: string[];
  vadi?: string;
  samvadi?: string;
  pakadOrSignature?: string;
  rasaOrMood: string;
  timeOfDay: string;
  famousSongs: Array<{
    title: string;
    composerOrFilm?: string;
    type: string;
  }>;
  explanation: string;
  closelyRelatedRagas?: string[];
}

export interface IdentifyResponse {
  success: boolean;
  source: 'openai' | 'gemini' | 'admin_rule' | 'database' | 'ai_musicologist';
  confidence: 'Exact Match' | 'High' | 'Moderate' | 'Low';
  raga: RagaProfile;
  isMultiRaga?: boolean;
  ragas?: RagaProfile[];
  matchedSong?: SongRagaEntry;
  appliedAdminRule?: {
    id: string;
    title: string;
    reason: string;
  };
  rawQuery: any;
  needsAiActivation?: boolean;
  aiProvider?: 'gemini' | 'openai' | 'none';
  unindexedSongTitle?: string;
}

export interface AdminRule {
  id: string;
  createdAt: string;
  title: string; // e.g., "Keeravani vs Simhendramadhyamam differentiation"
  patternType: 'swaras' | 'song' | 'phrase' | 'correction';
  swaraPattern?: string[]; // notes involved
  triggerKeywords?: string[]; // e.g. ['Keeravani', 'Shuddha Madhyamam']
  correctRaga: string;
  tradition: Tradition;
  ruleInstruction: string; // Specific musicology instruction for OpenAI
  severity: 'strict_override' | 'disambiguation_hint';
  active: boolean;
}

export interface MistakeReport {
  id: string;
  timestamp: string;
  query: any;
  aiSuggestedRaga: string;
  userCorrection: {
    correctRaga: string;
    correctSwaras?: string;
    notesOrExplanation: string;
    reporterName?: string;
  };
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedAsRuleId?: string;
}

export interface JanyaRaga {
  id: string;
  name: string;
  originalName: string;
  parentMelakartaNo: number;
  parentMelakartaName: string;
  chakraNo: number;
  chakraName: string;
  madhyama: string;
  arohana: string;
  avarohana: string;
  swaras: string[];
  aroCount: number;
  avaCount: number;
  scaleType: string;
  isVakra: boolean;
  isBhashanga: boolean;
  anyaSwaras?: string;
  extraNote?: string;
  wikiUrl: string;
}

