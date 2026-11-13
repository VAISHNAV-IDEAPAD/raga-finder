/**
 * Indian Classical Musicology Knowledge Graph Engine
 *
 * Implements an ontological graph database representing entities and relationships:
 * - Nodes: Raga, Melakarta, Chakra, Thaat, Swara, Composer, Singer, Song, Rasa
 * - Edges: CHILD_OF_MELAKARTA, BELONGS_TO_CHAKRA, BELONGS_TO_THAAT, HAS_SWARA,
 *          EVOKES_RASA, ALLIED_TO, COMPOSED_IN, COMPOSED_BY, SUNG_BY
 */

import { structuredDb } from './structuredDb';
import { RagaProfile, SongRagaEntry } from '@/types/raga';

export type NodeType =
  | 'Raga'
  | 'Melakarta'
  | 'Chakra'
  | 'Thaat'
  | 'Swara'
  | 'Composer'
  | 'Singer'
  | 'Song'
  | 'Rasa';

export type EdgeType =
  | 'CHILD_OF_MELAKARTA'
  | 'BELONGS_TO_CHAKRA'
  | 'BELONGS_TO_THAAT'
  | 'HAS_AROHANA_SWARA'
  | 'HAS_AVAROHANA_SWARA'
  | 'EVOKES_RASA'
  | 'ALLIED_TO'
  | 'COMPOSED_IN'
  | 'COMPOSED_BY'
  | 'SUNG_BY';

export interface GraphNode {
  id: string; // e.g. "raga:mohanam", "composer:devarajan"
  type: NodeType;
  label: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  properties?: Record<string, any>;
}

export interface Subgraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphTraversalPath {
  nodes: GraphNode[];
  relationships: string[];
  explanation: string;
}

const CHAKRA_INFO: Record<number, string> = {
  1: 'Indu (Moon)',
  2: 'Netra (Eyes)',
  3: 'Agni (Fire)',
  4: 'Veda (Scriptures)',
  5: 'Bana (Arrows)',
  6: 'Ritu (Seasons)',
  7: 'Rishi (Sages)',
  8: 'Vasu (Deities)',
  9: 'Brahma (Creators)',
  10: 'Disi (Directions)',
  11: 'Rudra (Roarers)',
  12: 'Aditya (Suns)',
};

export class MusicologyKnowledgeGraph {
  public nodes: Map<string, GraphNode> = new Map();
  public edges: GraphEdge[] = [];

  // Adjacency lists for high-speed graph traversal
  private outgoing: Map<string, GraphEdge[]> = new Map();
  private incoming: Map<string, GraphEdge[]> = new Map();

  private initialized = false;

  constructor() {
    this.initialize();
  }

  public initialize() {
    if (this.initialized) return;

    // 1. Ingest Chakras (#1 - 12)
    for (let c = 1; c <= 12; c++) {
      const cId = `chakra:${c}`;
      this.addNode({
        id: cId,
        type: 'Chakra',
        label: `Chakra #${c} - ${CHAKRA_INFO[c]}`,
        properties: { number: c, name: CHAKRA_INFO[c] },
      });
    }

    // 2. Ingest Standard 12 Swara Nodes
    const swaras = [
      { sym: 'S', name: 'Shadjam' },
      { sym: 'R1', name: 'Shuddha Rishabham' },
      { sym: 'R2', name: 'Chatusruti Rishabham' },
      { sym: 'G2', name: 'Sadharana Gandharam' },
      { sym: 'G3', name: 'Antara Gandharam' },
      { sym: 'M1', name: 'Shuddha Madhyamam' },
      { sym: 'M2', name: 'Prati Madhyamam' },
      { sym: 'P', name: 'Panchamam' },
      { sym: 'D1', name: 'Shuddha Dhaivatham' },
      { sym: 'D2', name: 'Chatusruti Dhaivatham' },
      { sym: 'N2', name: 'Kaisiki Nishadham' },
      { sym: 'N3', name: 'Kakali Nishadham' },
    ];

    swaras.forEach((s) => {
      this.addNode({
        id: `swara:${s.sym}`,
        type: 'Swara',
        label: `${s.sym} (${s.name})`,
        properties: s,
      });
    });

    // 3. Ingest Ragas and Melakartas from structuredDb
    const ragas = structuredDb.ragas;

    ragas.forEach((raga) => {
      const rId = `raga:${this.normalize(raga.name)}`;

      this.addNode({
        id: rId,
        type: 'Raga',
        label: raga.name,
        properties: {
          name: raga.name,
          tradition: raga.tradition,
          arohana: raga.arohana,
          avarohana: raga.avarohana,
          melakartaNumber: raga.melakartaNumber,
          thaat: raga.thaat,
          rasa: raga.rasaOrMood,
          timeOfDay: raga.timeOfDay,
        },
      });

      // Link to Melakarta & Chakra
      if (raga.melakartaNumber) {
        const mId = `melakarta:${raga.melakartaNumber}`;
        const chakraNum = Math.ceil(raga.melakartaNumber / 6);
        const cId = `chakra:${chakraNum}`;

        if (!this.nodes.has(mId)) {
          this.addNode({
            id: mId,
            type: 'Melakarta',
            label: `Melakarta #${raga.melakartaNumber}`,
            properties: { number: raga.melakartaNumber },
          });

          this.addEdge({
            id: `edge:${mId}->${cId}`,
            source: mId,
            target: cId,
            type: 'BELONGS_TO_CHAKRA',
          });
        }

        this.addEdge({
          id: `edge:${rId}->${mId}`,
          source: rId,
          target: mId,
          type: 'CHILD_OF_MELAKARTA',
        });
      }

      // Link to Thaat
      if (raga.thaat) {
        const tId = `thaat:${this.normalize(raga.thaat)}`;
        if (!this.nodes.has(tId)) {
          this.addNode({
            id: tId,
            type: 'Thaat',
            label: `${raga.thaat} Thaat`,
            properties: { name: raga.thaat },
          });
        }
        this.addEdge({
          id: `edge:${rId}->${tId}`,
          source: rId,
          target: tId,
          type: 'BELONGS_TO_THAAT',
        });
      }

      // Link to Swaras
      const extractSwaras = (scaleStr: string) =>
        scaleStr
          .replace(/['\,]/g, '')
          .split(/[\s\/]+/)
          .map((s) => s.trim().toUpperCase())
          .filter((s) => s.length > 0 && s !== '-' && s !== 'S');

      const aroSwaras = extractSwaras(raga.arohana);
      aroSwaras.forEach((sSym, idx) => {
        const sId = `swara:${sSym}`;
        if (this.nodes.has(sId)) {
          this.addEdge({
            id: `edge:${rId}->${sId}:aro:${idx}`,
            source: rId,
            target: sId,
            type: 'HAS_AROHANA_SWARA',
            properties: { order: idx + 1 },
          });
        }
      });

      // Link to Rasa
      if (raga.rasaOrMood) {
        const rasaId = `rasa:${this.normalize(raga.rasaOrMood.split(/[,/]/)[0])}`;
        if (!this.nodes.has(rasaId)) {
          this.addNode({
            id: rasaId,
            type: 'Rasa',
            label: raga.rasaOrMood.split(/[,/]/)[0].trim(),
            properties: { mood: raga.rasaOrMood },
          });
        }
        this.addEdge({
          id: `edge:${rId}->${rasaId}`,
          source: rId,
          target: rasaId,
          type: 'EVOKES_RASA',
        });
      }
    });

    // 4. Ingest Representative Songs and Composers
    const songs = structuredDb.songs.slice(0, 500); // Index key compositions

    songs.forEach((song, idx) => {
      const songId = `song:${this.normalize(song.title)}_${idx}`;
      this.addNode({
        id: songId,
        type: 'Song',
        label: song.title,
        properties: {
          title: song.title,
          filmOrAlbum: song.filmOrAlbum,
          year: song.year,
          language: song.language,
        },
      });

      // Link Song -> Raga
      const rList = song.ragas && song.ragas.length > 0
        ? song.ragas
        : song.raga ? song.raga.split(/[\/,]+/).map((r) => r.trim()).filter(Boolean) : [];

      rList.forEach((rName) => {
        const rId = `raga:${this.normalize(rName)}`;
        if (this.nodes.has(rId)) {
          this.addEdge({
            id: `edge:${songId}->${rId}`,
            source: songId,
            target: rId,
            type: 'COMPOSED_IN',
          });
        }
      });

      // Link Song -> Composer
      if (song.composer) {
        const compId = `composer:${this.normalize(song.composer)}`;
        if (!this.nodes.has(compId)) {
          this.addNode({
            id: compId,
            type: 'Composer',
            label: song.composer,
            properties: { name: song.composer },
          });
        }
        this.addEdge({
          id: `edge:${songId}->${compId}`,
          source: songId,
          target: compId,
          type: 'COMPOSED_BY',
        });
      }

      // Link Song -> Singer
      if (song.singers) {
        const singerTokens = song.singers.split(/[,&]/).map((s) => s.trim()).filter((s) => s.length > 2);
        singerTokens.forEach((sName) => {
          const singerId = `singer:${this.normalize(sName)}`;
          if (!this.nodes.has(singerId)) {
            this.addNode({
              id: singerId,
              type: 'Singer',
              label: sName,
              properties: { name: sName },
            });
          }
          this.addEdge({
            id: `edge:${songId}->${singerId}`,
            source: songId,
            target: singerId,
            type: 'SUNG_BY',
          });
        });
      }
    });

    this.initialized = true;
  }

  public addNode(node: GraphNode) {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node);
      this.outgoing.set(node.id, []);
      this.incoming.set(node.id, []);
    }
  }

  public addEdge(edge: GraphEdge) {
    this.edges.push(edge);

    if (!this.outgoing.has(edge.source)) this.outgoing.set(edge.source, []);
    this.outgoing.get(edge.source)!.push(edge);

    if (!this.incoming.has(edge.target)) this.incoming.set(edge.target, []);
    this.incoming.get(edge.target)!.push(edge);
  }

  /**
   * Traverse k-hop neighborhood from an entity node
   */
  public getNeighborhood(startNodeId: string, maxHops: number = 2): Subgraph {
    const visitedNodes = new Set<string>();
    const visitedEdges = new Set<string>();
    const resultNodes: GraphNode[] = [];
    const resultEdges: GraphEdge[] = [];

    const queue: Array<{ id: string; depth: number }> = [{ id: startNodeId, depth: 0 }];
    visitedNodes.add(startNodeId);

    const startNode = this.nodes.get(startNodeId);
    if (startNode) resultNodes.push(startNode);

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (depth >= maxHops) continue;

      // Follow outgoing edges
      const outEdges = this.outgoing.get(id) || [];
      for (const e of outEdges) {
        if (!visitedEdges.has(e.id)) {
          visitedEdges.add(e.id);
          resultEdges.push(e);
        }
        if (!visitedNodes.has(e.target)) {
          visitedNodes.add(e.target);
          const targetNode = this.nodes.get(e.target);
          if (targetNode) {
            resultNodes.push(targetNode);
            queue.push({ id: e.target, depth: depth + 1 });
          }
        }
      }

      // Follow incoming edges
      const inEdges = this.incoming.get(id) || [];
      for (const e of inEdges) {
        if (!visitedEdges.has(e.id)) {
          visitedEdges.add(e.id);
          resultEdges.push(e);
        }
        if (!visitedNodes.has(e.source)) {
          visitedNodes.add(e.source);
          const srcNode = this.nodes.get(e.source);
          if (srcNode) {
            resultNodes.push(srcNode);
            queue.push({ id: e.source, depth: depth + 1 });
          }
        }
      }
    }

    return { nodes: resultNodes, edges: resultEdges };
  }

  /**
   * Find multi-hop reasoning path for GraphRAG
   * Example: Song -> Raga -> Melakarta -> Chakra
   */
  public getGraphReasoningPath(queryText: string): GraphTraversalPath | null {
    const normQ = this.normalize(queryText);

    // Try finding starting node
    let startNodeId: string | null = null;

    // Check song
    for (const [id, node] of this.nodes.entries()) {
      if (node.type === 'Song' && this.normalize(node.label).includes(normQ)) {
        startNodeId = id;
        break;
      }
    }

    // Check raga
    if (!startNodeId) {
      for (const [id, node] of this.nodes.entries()) {
        if (node.type === 'Raga' && (this.normalize(node.label) === normQ || normQ.includes(this.normalize(node.label)))) {
          startNodeId = id;
          break;
        }
      }
    }

    if (!startNodeId) return null;

    const pathNodes: GraphNode[] = [];
    const rels: string[] = [];

    const root = this.nodes.get(startNodeId)!;
    pathNodes.push(root);

    let currId = startNodeId;
    let explanation = `Root Entity: [${root.type}] "${root.label}"`;

    // 1-hop traversal
    const outEdges = this.outgoing.get(currId) || [];
    for (const edge of outEdges) {
      const target = this.nodes.get(edge.target);
      if (target && (edge.type === 'COMPOSED_IN' || edge.type === 'CHILD_OF_MELAKARTA' || edge.type === 'COMPOSED_BY')) {
        pathNodes.push(target);
        rels.push(edge.type);
        explanation += ` ➔ (:${edge.type}) ➔ [${target.type}] "${target.label}"`;

        // 2-hop traversal
        const nextOut = this.outgoing.get(target.id) || [];
        for (const nextEdge of nextOut) {
          const nextTarget = this.nodes.get(nextEdge.target);
          if (nextTarget && (nextEdge.type === 'BELONGS_TO_CHAKRA' || nextEdge.type === 'CHILD_OF_MELAKARTA')) {
            pathNodes.push(nextTarget);
            rels.push(nextEdge.type);
            explanation += ` ➔ (:${nextEdge.type}) ➔ [${nextTarget.type}] "${nextTarget.label}"`;
            break;
          }
        }
        break;
      }
    }

    return {
      nodes: pathNodes,
      relationships: rels,
      explanation,
    };
  }

  /**
   * Export the entire knowledge graph as Neo4j Cypher statements
   */
  public exportToCypher(limitNodes: number = 300): string {
    const lines: string[] = [
      '// ==========================================',
      '// Neo4j Cypher Schema & Knowledge Graph Data',
      '// Auto-generated by Raga Finder AI Graph Engine',
      '// ==========================================\n',
      'CREATE CONSTRAINT FOR (r:Raga) REQUIRE r.id IS UNIQUE;',
      'CREATE CONSTRAINT FOR (m:Melakarta) REQUIRE m.id IS UNIQUE;',
      'CREATE CONSTRAINT FOR (c:Chakra) REQUIRE c.id IS UNIQUE;',
      'CREATE CONSTRAINT FOR (s:Song) REQUIRE s.id IS UNIQUE;\n',
    ];

    let count = 0;
    for (const node of this.nodes.values()) {
      if (count++ >= limitNodes) break;
      const props = JSON.stringify(node.properties).replace(/"([^"]+)":/g, '$1:');
      lines.push(`MERGE (n:${node.type} { id: "${node.id}", label: "${node.label}" }) SET n += ${props};`);
    }

    lines.push('\n// Relationships');
    for (const edge of this.edges.slice(0, limitNodes * 2)) {
      lines.push(
        `MATCH (a { id: "${edge.source}" }), (b { id: "${edge.target}" }) MERGE (a)-[:${edge.type}]->(b);`
      );
    }

    return lines.join('\n');
  }

  public getStats() {
    const byType: Record<string, number> = {};
    for (const node of this.nodes.values()) {
      byType[node.type] = (byType[node.type] || 0) + 1;
    }
    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      nodesByType: byType,
    };
  }

  private normalize(str: string): string {
    return (str || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}

export const knowledgeGraphStore = new MusicologyKnowledgeGraph();
