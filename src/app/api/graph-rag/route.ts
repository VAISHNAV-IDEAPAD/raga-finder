import { NextRequest, NextResponse } from 'next/server';
import { graphRagOrchestrator } from '@/lib/graphRag';
import { knowledgeGraphStore } from '@/lib/knowledgeGraph';
import { executeCypher, getNeo4jConfig, queryGraphNeighborhood } from '@/lib/neo4jDriver';
import { searchRagaByPgVector, generatePgVectorSchemaSql, getPgPool } from '@/lib/pgvectorStore';
import { pytorchEvaluator } from '@/lib/pytorchModel';
import { bgem3Engine } from '@/lib/bgem3Embeddings';

export async function GET() {
  const stats = knowledgeGraphStore.getStats();
  const neo4jConfig = getNeo4jConfig();
  const pgPool = getPgPool();

  return NextResponse.json({
    name: 'raga-finder-graph-rag-engine',
    version: '3.0.0',
    knowledgeGraph: {
      totalNodes: stats.totalNodes,
      totalEdges: stats.totalEdges,
      nodesByType: stats.nodesByType,
    },
    integrations: {
      neo4j: {
        configured: neo4jConfig.isConfigured,
        uri: neo4jConfig.uri || 'Offline / In-Memory Subgraph Engine active',
      },
      pgvector: {
        configured: Boolean(pgPool),
        embeddingDimension: 1024,
        model: 'BAAI/bge-m3',
      },
      pytorch: {
        modelArchitecture: 'RagaPCPNet (12-dim Swara PCP -> Linear -> GELU -> Softmax)',
        numClasses: 72,
        runtime: 'Native TypeScript Engine + PyTorch Exporter',
      },
    },
    supportedActions: ['graph_rag', 'cypher', 'neighborhood', 'export_cypher', 'pytorch_classify'],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'graph_rag', query, entityId, hops = 2, cypher, params, swarasPcp } = body;

    // Action 1: Full GraphRAG Pipeline
    if (action === 'graph_rag') {
      if (!query || typeof query !== 'string') {
        return NextResponse.json({ error: 'Missing or invalid "query" parameter' }, { status: 400 });
      }
      const context = await graphRagOrchestrator.retrieveGraphRAGContext(query);
      return NextResponse.json(context);
    }

    // Action 2: Subgraph Neighborhood Explorer
    if (action === 'neighborhood') {
      const targetId = entityId || (query ? `raga:${query.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : '');
      if (!targetId) {
        return NextResponse.json({ error: 'Provide "entityId" or "query"' }, { status: 400 });
      }
      const neighborhood = await queryGraphNeighborhood(targetId, Number(hops) || 2);
      return NextResponse.json(neighborhood);
    }

    // Action 3: Neo4j Cypher Query Execution
    if (action === 'cypher') {
      if (!cypher) {
        return NextResponse.json({ error: 'Missing "cypher" query parameter' }, { status: 400 });
      }
      const result = await executeCypher(cypher, params || {});
      return NextResponse.json(result);
    }

    // Action 4: Export Cypher DDL & Data for Neo4j import
    if (action === 'export_cypher') {
      const cypherDump = knowledgeGraphStore.exportToCypher(200);
      return NextResponse.json({
        cypher: cypherDump,
        instructions: 'Paste this into Neo4j Browser or Cypher Shell to populate your Neo4j instance.',
      });
    }

    // Action 5: PyTorch Neural Network PCP Classifier
    if (action === 'pytorch_classify') {
      if (!swarasPcp || !Array.isArray(swarasPcp)) {
        return NextResponse.json({ error: 'Missing "swarasPcp" array (12-dim)' }, { status: 400 });
      }
      const predictions = pytorchEvaluator.forward(swarasPcp);
      return NextResponse.json({
        model: 'PyTorch RagaPCPNet',
        inputPcp: swarasPcp,
        predictions,
      });
    }

    // Action 6: pgvector DDL Schema
    if (action === 'pgvector_schema') {
      return NextResponse.json({
        sql: generatePgVectorSchemaSql(),
        dimension: 1024,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'GraphRAG execution failed', details: error?.message },
      { status: 500 }
    );
  }
}
