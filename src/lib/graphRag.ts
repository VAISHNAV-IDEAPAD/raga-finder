/**
 * GraphRAG (Graph Retrieval-Augmented Generation) Orchestrator
 *
 * Combines:
 * 1. Subgraph neighborhood exploration (Knowledge Graph / Neo4j)
 * 2. 1024-dimensional BGE-M3 dense vector retrieval (pgvector)
 * 3. Ontological multi-hop reasoning path extraction
 * 4. Grounded prompt synthesis for zero-hallucination AI generation
 */

import { knowledgeGraphStore, Subgraph, GraphTraversalPath } from './knowledgeGraph';
import { searchRagaByPgVector } from './pgvectorStore';
import { bgem3Engine } from './bgem3Embeddings';
import { RagaProfile, SongRagaEntry } from '@/types/raga';

export interface GraphRAGContext {
  query: string;
  rootEntity: {
    name: string;
    type: string;
  };
  reasoningPath: string; // e.g., "Song ➔ [:COMPOSED_IN] ➔ Raga ➔ [:CHILD_OF_MELAKARTA] ➔ Melakarta #28 ➔ [:BELONGS_TO_CHAKRA] ➔ Bana Chakra"
  subgraph: Subgraph;
  graphFacts: string[];
  vectorCandidates: Array<{
    name: string;
    similarity: number;
    tradition: string;
  }>;
  groundedPromptSnippet: string;
}

export class GraphRAGOrchestrator {
  /**
   * Execute GraphRAG context retrieval for a user query
   */
  public async retrieveGraphRAGContext(query: string): Promise<GraphRAGContext> {
    const cleanQ = query.trim();

    // 1. Extract Multi-Hop Reasoning Path from Knowledge Graph
    const traversalPath = knowledgeGraphStore.getGraphReasoningPath(cleanQ);

    // 2. Fetch 2-Hop Subgraph Neighborhood
    let rootNodeId = '';
    if (traversalPath && traversalPath.nodes.length > 0) {
      rootNodeId = traversalPath.nodes[0].id;
    } else {
      rootNodeId = `raga:${cleanQ.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }

    const subgraph = knowledgeGraphStore.getNeighborhood(rootNodeId, 2);

    // 3. Dense Vector Retrieval via 1024-dim BGE-M3 & pgvector
    const pgVectorMatches = await searchRagaByPgVector(cleanQ, 3);

    // 4. Extract Musicological Graph Facts
    const graphFacts: string[] = [];

    subgraph.nodes.forEach((n) => {
      if (n.type === 'Raga') {
        graphFacts.push(`Raga "${n.label}" exhibits scale Arohana: [${n.properties.arohana}], Avarohana: [${n.properties.avarohana}].`);
      } else if (n.type === 'Melakarta') {
        graphFacts.push(`Parent scale: Melakarta #${n.properties.number}.`);
      } else if (n.type === 'Chakra') {
        graphFacts.push(`Belongs to Sanskrit Chakra #${n.properties.number} (${n.properties.name}).`);
      } else if (n.type === 'Composer') {
        graphFacts.push(`Associated composer: ${n.label}.`);
      } else if (n.type === 'Rasa') {
        graphFacts.push(`Evokes the aesthetic mood of ${n.label}.`);
      }
    });

    const reasoningPathStr = traversalPath
      ? traversalPath.explanation
      : `Query "${cleanQ}" mapped to ontological Knowledge Graph neighborhood (${subgraph.nodes.length} nodes, ${subgraph.edges.length} edges).`;

    // 5. Synthesize Grounded Prompt Snippet for LLM
    const groundedPromptSnippet = `
[GRAPH-RAG GROUNDING CONTEXT - KNOWLEDGE GRAPH & PGVECTOR]
- Query: "${cleanQ}"
- Knowledge Graph Lineage: ${reasoningPathStr}
- Verified Subgraph Facts:
${graphFacts.map((f) => `  * ${f}`).join('\n')}
- BGE-M3 1024-Dim Dense Candidates:
${pgVectorMatches.map((c) => `  * ${c.raga.name} (Similarity: ${(c.similarity * 100).toFixed(1)}%, Tradition: ${c.raga.tradition})`).join('\n')}
[INSTRUCTION]: Enforce strict adherence to the above graph lineage and verified scale swaras. Do not alter Arohana/Avarohana notes.
    `.trim();

    return {
      query: cleanQ,
      rootEntity: {
        name: traversalPath?.nodes[0]?.label || cleanQ,
        type: traversalPath?.nodes[0]?.type || 'MusicEntity',
      },
      reasoningPath: reasoningPathStr,
      subgraph,
      graphFacts,
      vectorCandidates: pgVectorMatches.map((m) => ({
        name: m.raga.name,
        similarity: Number((m.similarity * 100).toFixed(1)),
        tradition: m.raga.tradition,
      })),
      groundedPromptSnippet,
    };
  }
}

export const graphRagOrchestrator = new GraphRAGOrchestrator();
