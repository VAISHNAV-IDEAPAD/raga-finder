'use client';

import React, { useState } from 'react';
import {
  X,
  Network,
  Share2,
  Sparkles,
  Database,
  Cpu,
  ArrowRight,
  Copy,
  Check,
  Search,
  Layers,
} from 'lucide-react';
import { RagaProfile } from '@/types/raga';

interface KnowledgeGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRaga: (raga: RagaProfile) => void;
}

export default function KnowledgeGraphModal({
  isOpen,
  onClose,
  onSelectRaga,
}: KnowledgeGraphModalProps) {
  const [activeTab, setActiveTab] = useState<'graphrag' | 'cypher' | 'pytorch'>('graphrag');

  // GraphRAG state
  const [graphQuery, setGraphQuery] = useState('Mohanam');
  const [graphRagData, setGraphRagData] = useState<any | null>(null);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);

  // Cypher state
  const [cypherQuery, setCypherQuery] = useState('MATCH (r:Raga)-[:CHILD_OF_MELAKARTA]->(m:Melakarta) RETURN r, m LIMIT 10');
  const [cypherOutput, setCypherOutput] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // PyTorch PCP Classifier state
  const [selectedPcp, setSelectedPcp] = useState<number[]>([1.0, 0, 1.0, 0, 1.0, 0, 0, 1.0, 0, 1.0, 0, 0]); // Mohanam preset: S, R2, G3, P, D2
  const [pytorchResults, setPytorchResults] = useState<any[]>([]);
  const [isEvaluatingPytorch, setIsEvaluatingPytorch] = useState(false);

  const SWARA_LABELS = ['S', 'R1', 'R2', 'G2', 'G3', 'M1', 'M2', 'P', 'D1', 'D2', 'N2', 'N3'];

  const runGraphRag = async (q: string) => {
    if (!q.trim()) return;
    setIsLoadingGraph(true);
    try {
      const res = await fetch('/api/graph-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'graph_rag', query: q.trim() }),
      });
      const data = await res.json();
      setGraphRagData(data);
    } catch (e) {
      console.error('GraphRAG fetch failed:', e);
    } finally {
      setIsLoadingGraph(false);
    }
  };

  const handleExportCypher = async () => {
    try {
      const res = await fetch('/api/graph-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export_cypher' }),
      });
      const data = await res.json();
      setCypherOutput(data.cypher);
    } catch (e) {
      console.error('Cypher export error:', e);
    }
  };

  const runPyTorchEval = async (pcp: number[]) => {
    setIsEvaluatingPytorch(true);
    try {
      const res = await fetch('/api/graph-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pytorch_classify', swarasPcp: pcp }),
      });
      const data = await res.json();
      if (data.predictions) {
        setPytorchResults(data.predictions);
      }
    } catch (e) {
      console.error('PyTorch inference error:', e);
    } finally {
      setIsEvaluatingPytorch(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                Knowledge Graph, GraphRAG &amp; Neural AI
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Neo4j • pgvector • BGE-M3 • PyTorch
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Multi-hop ontological reasoning, 1024-dim dense embeddings, and neural inference.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="px-6 pt-4 border-b border-stone-800 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('graphrag');
              if (!graphRagData) runGraphRag(graphQuery);
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'graphrag'
                ? 'border-amber-400 text-amber-300 bg-stone-800/60 font-black'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Share2 className="w-4 h-4" />
            GraphRAG Reasoning
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('cypher');
              if (!cypherOutput) handleExportCypher();
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'cypher'
                ? 'border-amber-400 text-amber-300 bg-stone-800/60 font-black'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Database className="w-4 h-4" />
            Neo4j Cypher &amp; pgvector
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('pytorch');
              if (pytorchResults.length === 0) runPyTorchEval(selectedPcp);
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'pytorch'
                ? 'border-amber-400 text-amber-300 bg-stone-800/60 font-black'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            PyTorch Neural Network
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* TAB 1: GRAPHRAG REASONING */}
          {activeTab === 'graphrag' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={graphQuery}
                  onChange={(e) => setGraphQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runGraphRag(graphQuery)}
                  placeholder="Enter Song, Kriti, or Raga name (e.g. Mohanam, Pramadavanam, Kalyani)..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => runGraphRag(graphQuery)}
                  disabled={isLoadingGraph}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  Traverse Graph
                </button>
              </div>

              {/* Preset Chips */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-stone-400 mr-1">Quick Traversal:</span>
                {['Mohanam', 'Kalyani', 'Pramadavanam', 'Mayamalavagowla', 'Kharaharapriya'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setGraphQuery(item);
                      runGraphRag(item);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700"
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* Graph Reasoning Lineage Banner */}
              {graphRagData && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-800 to-amber-950/30 border border-amber-500/40 space-y-2">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Multi-Hop Graph Reasoning Path:
                    </span>
                    <div className="p-3 rounded-xl bg-stone-900/90 text-xs font-mono text-amber-200 border border-stone-800 break-words leading-relaxed">
                      {graphRagData.reasoningPath}
                    </div>
                  </div>

                  {/* 2-Hop Subgraph Neighborhood Cards */}
                  <div>
                    <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block mb-2">
                      Retrieved Subgraph Entities ({graphRagData.subgraph?.nodes?.length || 0} nodes):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {graphRagData.subgraph?.nodes?.slice(0, 9).map((node: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-stone-800/80 border border-stone-700 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white truncate">{node.label}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                  node.type === 'Raga'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : node.type === 'Melakarta'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : node.type === 'Chakra'
                                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                    : 'bg-stone-700 text-stone-300'
                                }`}
                              >
                                {node.type}
                              </span>
                            </div>
                            {node.properties?.arohana && (
                              <p className="text-[10px] text-stone-400 font-mono truncate">
                                Aro: {node.properties.arohana}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 1024-Dim BGE-M3 & pgvector Matches */}
                  {graphRagData.vectorCandidates?.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-stone-800/50 border border-stone-800">
                      <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                        BGE-M3 (1024-Dim) &amp; pgvector Dense Similarity Matches:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {graphRagData.vectorCandidates.map((c: any, i: number) => (
                          <div
                            key={i}
                            className="px-3 py-1.5 rounded-xl bg-stone-800 border border-stone-700 text-xs flex items-center gap-2"
                          >
                            <span className="font-bold text-white">{c.name}</span>
                            <span className="text-amber-400 font-mono">{c.similarity}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NEO4J CYPHER & PGVECTOR */}
          {activeTab === 'cypher' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-stone-800/60 border border-stone-700 text-xs text-stone-300 space-y-1.5">
                <span className="font-bold text-amber-300 block">Neo4j &amp; pgvector Architecture</span>
                <p>
                  Full support for native Neo4j AuraDB instances via <code>neo4j-driver</code> and PostgreSQL <code>vector(1024)</code> via pgvector.
                  In production serverless environments, an internal in-memory Graph Store mirrors the entire ontology.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Exportable Neo4j Cypher Statements (Schema + Nodes + Edges):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (cypherOutput) {
                        navigator.clipboard.writeText(cypherOutput);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs text-stone-300 flex items-center gap-1.5 border border-stone-700 transition-colors"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied!' : 'Copy Cypher'}</span>
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-[11px] font-mono text-stone-300 max-h-64 overflow-y-auto">
                  {cypherOutput || 'Loading Cypher statements...'}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: PYTORCH NEURAL NETWORK */}
          {activeTab === 'pytorch' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-stone-800/60 border border-stone-700 text-xs text-stone-300 space-y-1">
                <span className="font-bold text-amber-300 block">
                  PyTorch Neural Network Forward Pass (RagaPCPNet)
                </span>
                <p>
                  12-dimensional Swara energy distribution is passed through a multi-layer neural network with GELU activations and Softmax normalization to predict parent Melakartas and Ragas.
                </p>
              </div>

              {/* Swara Toggle Buttons */}
              <div>
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-2">
                  Active Swara PCP Vector:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {SWARA_LABELS.map((label, idx) => {
                    const isActive = selectedPcp[idx] > 0;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          const next = [...selectedPcp];
                          next[idx] = isActive ? 0 : 1.0;
                          setSelectedPcp(next);
                          runPyTorchEval(next);
                        }}
                        className={`p-2.5 rounded-xl text-xs font-mono font-bold transition-all text-center ${
                          isActive
                            ? 'bg-amber-500 text-stone-950 shadow-md font-black scale-102'
                            : 'bg-stone-800 text-stone-400 border border-stone-700 hover:bg-stone-750'
                        }`}
                      >
                        <span className="block text-sm">{label}</span>
                        <span className="text-[10px] opacity-75">{isActive ? '1.0' : '0.0'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Predictions */}
              {pytorchResults.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                    PyTorch Neural Classifier Predictions:
                  </span>
                  <div className="space-y-2">
                    {pytorchResults.map((res, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          onSelectRaga(res.raga);
                          onClose();
                        }}
                        className="p-3.5 rounded-2xl bg-stone-800/80 hover:bg-stone-750 border border-stone-700 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{res.raga.name}</span>
                            {res.melakartaNumber && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                Melakarta #{res.melakartaNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                            {res.raga.arohana}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-amber-400">
                            {res.confidencePct}%
                          </span>
                          <span className="block text-[9px] text-stone-400 uppercase font-semibold">
                            Probability
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
