'use client';

import React, { useState } from 'react';
import {
  X,
  Bot,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  Search,
  ArrowRight,
  ShieldCheck,
  Share2,
  Terminal,
  Activity,
  Play,
  RotateCcw,
} from 'lucide-react';
import { RagaProfile, IdentifyResponse, AgentTrajectoryInfo, SelfRAGReflectionInfo } from '@/types/raga';

interface AgenticRagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRaga?: (raga: RagaProfile) => void;
}

export default function AgenticRagModal({ isOpen, onClose, onSelectRaga }: AgenticRagModalProps) {
  const [activeTab, setActiveTab] = useState<'agentic' | 'self_rag' | 'tools'>('agentic');

  // Agentic RAG State
  const [query, setQuery] = useState('Enna Thavam Seithenai');
  const [mode, setMode] = useState<'song' | 'raga' | 'swaras'>('song');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    response: IdentifyResponse;
    trajectory: AgentTrajectoryInfo;
    reflection: SelfRAGReflectionInfo;
  } | null>(null);

  // Self-RAG State
  const [selfRagQuery, setSelfRagQuery] = useState('Kalyani');
  const [selfRagLoading, setSelfRagLoading] = useState(false);
  const [selfRagData, setSelfRagData] = useState<{
    query: string;
    raga: RagaProfile;
    reflection: SelfRAGReflectionInfo;
  } | null>(null);

  // Tools Playground State
  const [activeTool, setActiveTool] = useState<string>('tool_structured_db');
  const [toolQuery, setToolQuery] = useState('Vathapi');
  const [toolLoading, setToolLoading] = useState(false);
  const [toolResult, setToolResult] = useState<any>(null);

  if (!isOpen) return null;

  // Run Agentic RAG
  const handleRunAgenticRAG = async (targetQuery?: string) => {
    const q = targetQuery || query;
    if (!q.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/agentic-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'agentic_rag', query: q.trim(), mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to execute Agentic RAG');
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Execution error');
    } finally {
      setIsLoading(false);
    }
  };

  // Run Self-RAG Reflection
  const handleRunSelfRAG = async (targetQuery?: string) => {
    const q = targetQuery || selfRagQuery;
    if (!q.trim()) return;

    setSelfRagLoading(true);
    try {
      const res = await fetch('/api/agentic-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'self_rag', query: q.trim(), mode: 'song' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run Self-RAG');
      setSelfRagData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSelfRagLoading(false);
    }
  };

  // Run Individual Tool
  const handleRunTool = async (toolName: string, paramVal?: string) => {
    const p = paramVal || toolQuery;
    setActiveTool(toolName);
    setToolLoading(true);
    try {
      const bodyPayload: any = { action: 'tool_call', toolName };
      if (toolName === 'tool_structured_db') bodyPayload.toolParams = { query: p };
      if (toolName === 'tool_knowledge_graph') bodyPayload.toolParams = { entity: p };
      if (toolName === 'tool_rule_engine') bodyPayload.toolParams = { ragaOrScale: p };
      if (toolName === 'tool_disambiguate_pair') bodyPayload.toolParams = { raga1: 'Mohanam', raga2: 'Shivaranjani' };
      if (toolName === 'tool_pytorch_classifier') {
        bodyPayload.toolParams = { swarasPcp: [1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0] };
      }

      const res = await fetch('/api/agentic-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      setToolResult(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setToolLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100 flex items-center gap-2">
                Agentic RAG &amp; Self-RAG
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-violet-950 border border-violet-500/40 text-violet-300">
                  Autonomous Multi-Step
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Self-Reflective Retrieval, Groundedness Critic &amp; Autonomous ReAct Tool Execution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('agentic')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'agentic'
                ? 'border-violet-400 text-violet-300'
                : 'border-transparent text-stone-400 hover:text-stone-300'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Agentic Orchestrator</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('self_rag');
              if (!selfRagData) handleRunSelfRAG('Kalyani');
            }}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'self_rag'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-stone-400 hover:text-stone-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Self-RAG Reflection</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('tools');
              if (!toolResult) handleRunTool('tool_structured_db', 'Vathapi');
            }}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'tools'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-stone-400 hover:text-stone-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Agent Tools (7)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* ==================================================== */}
          {/* TAB 1: Agentic Orchestrator                          */}
          {/* ==================================================== */}
          {activeTab === 'agentic' && (
            <div className="space-y-5">
              {/* Query Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                  <span>Input Song, Composition, or Raga Query:</span>
                  <div className="flex items-center gap-2 text-[11px] text-stone-400">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={mode === 'song'}
                        onChange={() => setMode('song')}
                        className="text-violet-500"
                      />
                      Song
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={mode === 'raga'}
                        onChange={() => setMode('raga')}
                        className="text-violet-500"
                      />
                      Raga
                    </label>
                  </div>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRunAgenticRAG()}
                      placeholder="e.g., Enna Thavam Seithenai, Vathapi Ganapathim, Mohanam..."
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-violet-500/70"
                    />
                  </div>
                  <button
                    onClick={() => handleRunAgenticRAG()}
                    disabled={isLoading || !query.trim()}
                    className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin" />
                        <span>Reasoning...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Run Agent</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-stone-500">Quick Test:</span>
                  {[
                    'Enna Thavam Seithenai',
                    'Vathapi Ganapathim',
                    'Chinnanjiru Kiliye',
                    'Krishna Nee Begane',
                    'Mohanam',
                    'Charukesi',
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setQuery(s);
                        handleRunAgenticRAG(s);
                      }}
                      className="text-[10px] px-2.5 py-1 rounded-md bg-stone-800/80 hover:bg-stone-700/80 text-stone-300 border border-stone-700/60 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Agent Results Display */}
              {result && (
                <div className="space-y-4 pt-2 border-t border-stone-800">
                  {/* Plan Card */}
                  <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-violet-300">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-violet-400" />
                        Autonomous Agent Plan
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {result.trajectory.steps.length} cycles completed in {result.trajectory.totalLatencyMs}ms
                      </span>
                    </div>
                    <ul className="text-[11px] text-stone-300 space-y-1 font-mono">
                      {result.trajectory.plan.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-violet-400 font-bold">{idx + 1}.</span>
                          <span>{p.replace(/^\d+\.\s*/, '')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* ReAct Execution Steps */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold text-stone-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <Terminal className="w-3.5 h-3.5 text-violet-400" />
                      Execution Scratchpad &amp; Observations
                    </h3>
                    <div className="space-y-2">
                      {result.trajectory.steps.map((st) => (
                        <div
                          key={st.stepNumber}
                          className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80 space-y-1.5 text-xs font-mono"
                        >
                          <div className="flex items-center justify-between border-b border-stone-800/60 pb-1 font-sans">
                            <span className="font-bold text-violet-300 flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-violet-900/60 border border-violet-500/50 text-[10px] flex items-center justify-center text-violet-300">
                                {st.stepNumber}
                              </span>
                              {st.toolName || 'Reasoning'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">
                              Confidence: {Math.round(st.confidenceAfterStep * 100)}%
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-400 font-sans leading-relaxed">
                            <span className="text-stone-300 font-semibold">Thought: </span>
                            {st.thought}
                          </div>
                          <div className="text-[11px] text-amber-200/90 bg-stone-900/70 p-2 rounded-lg border border-stone-800 leading-relaxed">
                            <span className="text-amber-400 font-semibold">Observation: </span>
                            {st.observation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Final Discovered Raga Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-violet-950/40 via-stone-900 to-stone-950 border border-violet-500/40 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-violet-400 font-bold block">
                          Discovered &amp; Verified Raga
                        </span>
                        <h4 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                          {result.response.raga.name}
                          {result.response.raga.melakartaNumber && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono">
                              Melakarta #{result.response.raga.melakartaNumber}
                            </span>
                          )}
                        </h4>
                      </div>
                      {onSelectRaga && (
                        <button
                          onClick={() => {
                            onSelectRaga(result.response.raga);
                            onClose();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                        >
                          <span>Inspect Full Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-stone-950/70 border border-stone-800">
                        <span className="text-stone-500 text-[10px] block">Arohana (Ascent):</span>
                        <span className="text-stone-200 font-bold">{result.response.raga.arohana}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-stone-950/70 border border-stone-800">
                        <span className="text-stone-500 text-[10px] block">Avarohana (Descent):</span>
                        <span className="text-stone-200 font-bold">{result.response.raga.avarohana}</span>
                      </div>
                    </div>

                    {/* Self-RAG Reflection Summary Badge */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-medium">
                        [IsSup]: {result.reflection.groundednessVerdict} ({Math.round(result.reflection.groundednessScore * 100)}%)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-medium">
                        [IsRel]: {result.reflection.retrievalRelevanceVerdict}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/40 text-amber-300 font-medium">
                        [IsUse]: {result.reflection.utilityScore}/5 Utility
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: Self-RAG Reflection Inspector                 */}
          {/* ==================================================== */}
          {activeTab === 'self_rag' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Self-RAG Reflection &amp; Groundedness Framework
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Self-RAG dynamically determines whether retrieval is needed ([Retrieve]), critiques the relevance of retrieved evidence ([IsRel]), verifies output groundedness against canonical Swara varieties ([IsSup]), and measures musicological utility ([IsUse]). If hallucinations are detected, an automatic self-correction loop restores scale integrity.
                </p>
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={selfRagQuery}
                  onChange={(e) => setSelfRagQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunSelfRAG()}
                  placeholder="Enter Raga name or song to inspect Self-RAG tokens..."
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-emerald-500/70"
                />
                <button
                  onClick={() => handleRunSelfRAG()}
                  disabled={selfRagLoading || !selfRagQuery.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
                >
                  {selfRagLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>Inspect Critique</span>
                </button>
              </div>

              {selfRagData && (
                <div className="space-y-4">
                  {/* Token Gauges */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    {/* [Retrieve] */}
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                      <span className="text-[10px] text-stone-400 uppercase font-mono block">
                        [Retrieve] Decision
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        {selfRagData.reflection.needRetrieval ? 'Active (Required)' : 'Bypassed'}
                      </span>
                      <span className="text-[10px] text-stone-500 block">Adaptive threshold</span>
                    </div>

                    {/* [IsRel] */}
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                      <span className="text-[10px] text-stone-400 uppercase font-mono block">
                        [IsRel] Relevance
                      </span>
                      <span className="text-sm font-bold text-cyan-400">
                        {selfRagData.reflection.retrievalRelevanceVerdict}
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        Score: {Math.round(selfRagData.reflection.retrievalRelevanceScore * 100)}%
                      </span>
                    </div>

                    {/* [IsSup] */}
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                      <span className="text-[10px] text-stone-400 uppercase font-mono block">
                        [IsSup] Groundedness
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        {selfRagData.reflection.groundednessVerdict}
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        Score: {Math.round(selfRagData.reflection.groundednessScore * 100)}%
                      </span>
                    </div>

                    {/* [IsUse] */}
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                      <span className="text-[10px] text-stone-400 uppercase font-mono block">
                        [IsUse] Utility
                      </span>
                      <span className="text-sm font-bold text-amber-400">
                        {selfRagData.reflection.utilityScore} / 5
                      </span>
                      <span className="text-[10px] text-stone-500 block">Completeness metric</span>
                    </div>
                  </div>

                  {/* Critique & Reflection Audit Notes */}
                  <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                    <h4 className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Self-RAG Reflection Critique Log
                    </h4>
                    <ul className="text-xs text-stone-300 space-y-1 font-mono">
                      {selfRagData.reflection.critiqueNotes.map((note, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400">•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: Agent Tools Directory & Sandbox               */}
          {/* ==================================================== */}
          {activeTab === 'tools' && (
            <div className="space-y-5">
              <p className="text-xs text-stone-300">
                The Autonomous Agent uses these 7 specialized musicological tools during multi-hop reasoning:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'tool_structured_db', name: '1. Structured DB Tool', desc: 'Relational query across 33,000+ compositions.' },
                  { id: 'tool_knowledge_graph', name: '2. Knowledge Graph Tool', desc: 'Multi-hop traversal across 1,283 nodes.' },
                  { id: 'tool_vector_search', name: '3. BGE-M3 Vector Tool', desc: '1024-dim dense semantic embeddings.' },
                  { id: 'tool_rule_engine', name: '4. Rule Engine Tool', desc: 'Katapayadi Sanskrit cipher & Audava grammar.' },
                  { id: 'tool_pytorch_classifier', name: '5. PyTorch PCP Tool', desc: 'RagaPCPNet neural forward pass.' },
                  { id: 'tool_disambiguate_pair', name: '6. Disambiguation Tool', desc: 'Allied raga pair microtonal differentiation.' },
                  { id: 'tool_web_archive', name: '7. Live Web Archive Tool', desc: 'External archive fallback for newly released songs.' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleRunTool(t.id, toolQuery)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      activeTool === t.id
                        ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200'
                        : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{t.name}</span>
                      {activeTool === t.id && (
                        <span className="text-[10px] text-cyan-400 font-mono">Active</span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>

              {/* Tool Execution Sandbox View */}
              {toolResult && (
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold">
                    <span>Tool Output Sandbox: {activeTool}</span>
                    {toolLoading && <Activity className="w-3.5 h-3.5 animate-spin" />}
                  </div>
                  <pre className="text-[11px] text-stone-300 bg-stone-900/80 p-3 rounded-lg overflow-x-auto max-h-56 font-mono">
                    {JSON.stringify(toolResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-stone-800 bg-stone-950/70 text-xs text-stone-400">
          <span>7 Agent Tools • Self-RAG Reflection Tokens • Zero-Hallucination Grounding</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
