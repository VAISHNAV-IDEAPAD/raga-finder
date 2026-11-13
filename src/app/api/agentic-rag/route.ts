import { NextRequest, NextResponse } from 'next/server';
import { agenticRagOrchestrator, AGENT_TOOLS } from '@/lib/agenticRag';
import { executeSelfRAGPipeline } from '@/lib/selfRag';
import { structuredDb } from '@/lib/structuredDb';
import { graphRagOrchestrator } from '@/lib/graphRag';
import { pytorchEvaluator } from '@/lib/pytorchModel';
import { calculateKatapayadiMelakarta, analyzeScaleGrammar, disambiguateRagas } from '@/lib/ruleEngine';

export async function GET() {
  return NextResponse.json({
    name: 'raga-finder-agentic-self-rag-engine',
    version: '4.0.0',
    capabilities: {
      agenticRag: {
        architecture: 'Autonomous ReAct (Reasoning + Acting) Multi-Hop Agent',
        toolsCount: AGENT_TOOLS.length,
        tools: AGENT_TOOLS,
      },
      selfRag: {
        architecture: 'Self-Reflective RAG (Asai et al.)',
        reflectionTokens: [
          '[Retrieve]: Adaptive query evaluation',
          '[IsRel]: Evidence relevance critique',
          '[IsSup]: Scale groundedness & note hallucination critique',
          '[IsUse]: Utility & completeness critique',
        ],
        selfCorrection: 'Automatic scale rectification against verified ground-truth',
      },
    },
    supportedActions: ['agentic_rag', 'self_rag', 'tool_call'],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'agentic_rag', query, mode = 'song', swarasPcp, ragaName, toolName, toolParams } = body;

    // Action 1: Autonomous Agentic RAG Loop
    if (action === 'agentic_rag') {
      if (!query && !swarasPcp) {
        return NextResponse.json({ error: 'Missing "query" or "swarasPcp" parameter' }, { status: 400 });
      }

      const result = await agenticRagOrchestrator.execute({
        query: query || '',
        mode,
        swarasPcp,
      });

      return NextResponse.json(result);
    }

    // Action 2: Self-RAG Reflection Inspector
    if (action === 'self_rag') {
      const targetQuery = query || ragaName || 'Mohanam';
      const targetRaga: any = structuredDb.getRagaByName(targetQuery) || {
        name: targetQuery,
        alternateNames: [],
        tradition: 'Both',
        arohana: 'S R2 G3 P D2 S\'',
        avarohana: 'S\' D2 P G3 R2 S',
        swarasCarnatic: ['S', 'R2', 'G3', 'P', 'D2'],
        swarasHindustani: [],
        rasaOrMood: 'Joyful, Peace',
        timeOfDay: 'Anytime',
        famousSongs: [],
        explanation: 'Direct Self-RAG inspection query.',
      };

      const graphContext = await graphRagOrchestrator.retrieveGraphRAGContext(targetRaga.name);
      const assessment = executeSelfRAGPipeline(
        targetQuery,
        targetRaga,
        graphContext.groundedPromptSnippet,
        1,
        mode
      );

      return NextResponse.json({
        query: targetQuery,
        raga: assessment.correctedRaga || targetRaga,
        reflection: assessment.reflection,
      });
    }

    // Action 3: Individual Agent Tool Execution
    if (action === 'tool_call') {
      if (!toolName) {
        return NextResponse.json({ error: 'Missing "toolName" parameter' }, { status: 400 });
      }

      switch (toolName) {
        case 'tool_structured_db': {
          const songs = structuredDb.searchSongs(toolParams?.query || query || '', {}, 10);
          return NextResponse.json({ tool: toolName, results: songs });
        }
        case 'tool_knowledge_graph': {
          const graphContext = await graphRagOrchestrator.retrieveGraphRAGContext(toolParams?.entity || query || '');
          return NextResponse.json({ tool: toolName, results: graphContext });
        }
        case 'tool_rule_engine': {
          const raga = toolParams?.ragaOrScale || query || '';
          const katapayadi = calculateKatapayadiMelakarta(raga);
          const grammar = analyzeScaleGrammar(toolParams?.arohana || 'S R2 G3 P D2 S\'', toolParams?.avarohana || 'S\' D2 P G3 R2 S');
          return NextResponse.json({ tool: toolName, katapayadi, grammar });
        }
        case 'tool_pytorch_classifier': {
          const pcp = toolParams?.swarasPcp || swarasPcp || [1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0];
          const predictions = pytorchEvaluator.forward(pcp);
          return NextResponse.json({ tool: toolName, predictions });
        }
        case 'tool_disambiguate_pair': {
          const r1 = toolParams?.raga1 || 'Mohanam';
          const r2 = toolParams?.raga2 || 'Shivaranjani';
          const diff = disambiguateRagas(r1, r2);
          return NextResponse.json({ tool: toolName, difference: diff });
        }
        default:
          return NextResponse.json({ error: `Unknown tool "${toolName}"` }, { status: 400 });
      }
    }

    return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 });
  } catch (err: any) {
    console.error('[API /api/agentic-rag Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
