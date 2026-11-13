import { NextRequest, NextResponse } from 'next/server';
import { identifyRaga } from '@/lib/openai';
import { structuredDb } from '@/lib/structuredDb';
import { vectorStore } from '@/lib/vectorStore';
import {
  calculateKatapayadiMelakarta,
  analyzeScaleGrammar,
  disambiguateRagaRule,
  searchByMusicologicalRule,
} from '@/lib/ruleEngine';
import { hybridSearch } from '@/lib/hybridSearch';

// Standard MCP (Model Context Protocol) JSON-RPC 2.0 Route
// Supports tools/list, tools/call, resources/list, resources/read

const MCP_TOOLS = [
  {
    name: 'identify_raga',
    description:
      'Identifies the Carnatic or Hindustani raga for a given song title, film name, composer, or classical kriti using Hybrid Search (BM25 + 192-dim Dense Vector Embeddings + Relational Database).',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The song name, film, composer, or classical kriti title (e.g., "Vathapi Ganapathim", "Kannamoochi Yenada", "Ennavale Adi Ennavale").',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_raga_details',
    description:
      'Retrieves the complete musicological profile for a raga, including Arohana, Avarohana, Melakarta number, Thaat, Rasa (emotional mood), Prahar (time of day), and representative songs.',
    inputSchema: {
      type: 'object',
      properties: {
        ragaName: {
          type: 'string',
          description: 'The canonical or common name of the raga (e.g., "Kalyani", "Mohanam", "Charukesi", "Bhairavi").',
        },
      },
      required: ['ragaName'],
    },
  },
  {
    name: 'search_songs_by_raga',
    description:
      'Finds compositions (Carnatic kritis, Malayalam film classics, Tamil film songs, Hindi ghazals) composed in a specified raga.',
    inputSchema: {
      type: 'object',
      properties: {
        ragaName: {
          type: 'string',
          description: 'Name of the raga to find songs for.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of songs to return (default 10).',
        },
      },
      required: ['ragaName'],
    },
  },
  {
    name: 'analyze_scale_rules',
    description:
      'Performs rule-based Carnatic musicological grammar analysis: classifies scale type (Audava/Shadava/Sampoorna), identifies Varja (omitted notes), flags Vakra (zig-zag melodic contour), and detects Bhashanga (foreign swaras).',
    inputSchema: {
      type: 'object',
      properties: {
        arohana: {
          type: 'string',
          description: 'Ascending scale swaras separated by spaces (e.g., "S R2 G3 P D2 S").',
        },
        avarohana: {
          type: 'string',
          description: 'Descending scale swaras separated by spaces (e.g., "S D2 P G3 R2 S").',
        },
      },
      required: ['arohana', 'avarohana'],
    },
  },
  {
    name: 'get_melakarta_info',
    description:
      'Calculates the Melakarta parent scale number (1-72) and Chakra from the Sanskrit consonant cipher (Katapayadi Sankhya) based on the "Ankanam Vamato Gati" ancient rule.',
    inputSchema: {
      type: 'object',
      properties: {
        ragaName: {
          type: 'string',
          description: 'Name of the Janaka / Melakarta raga (e.g., "Mayamalavagowla", "Kharaharapriya", "Mechakalyani", "Dheerasankarabharanam").',
        },
      },
      required: ['ragaName'],
    },
  },
  {
    name: 'disambiguate_ragas',
    description:
      'Explains subtle microtonal and phrase differences between confusing raga pairs (e.g., Mohanam vs Shivaranjani, Kalyani vs Yamuna Kalyani, Bilahari vs Shankarabharanam).',
    inputSchema: {
      type: 'object',
      properties: {
        ragaA: { type: 'string', description: 'First raga name' },
        ragaB: { type: 'string', description: 'Second raga name' },
      },
      required: ['ragaA', 'ragaB'],
    },
  },
];

async function handleMcpToolCall(name: string, args: any) {
  switch (name) {
    case 'identify_raga': {
      const query = args?.query || '';
      if (!query) throw new Error('Missing query parameter');
      const result = await identifyRaga({ mode: 'song', songQuery: query });
      return {
        raga: result.raga.name,
        tradition: result.raga.tradition,
        arohana: result.raga.arohana,
        avarohana: result.raga.avarohana,
        melakartaNumber: result.raga.melakartaNumber || null,
        thaat: result.raga.thaat || null,
        confidence: result.confidence,
        source: result.source,
        isMultiRaga: result.isMultiRaga || false,
        ragasInSong: result.ragas?.map((r) => r.name) || [result.raga.name],
        matchedSong: result.matchedSong
          ? {
              title: result.matchedSong.title,
              filmOrAlbum: result.matchedSong.filmOrAlbum,
              composer: result.matchedSong.composer,
              singers: result.matchedSong.singers,
              language: result.matchedSong.language,
            }
          : null,
      };
    }

    case 'get_raga_details': {
      const ragaName = args?.ragaName || '';
      const raga = structuredDb.getRagaByName(ragaName);
      if (!raga) {
        // Fallback to dense vector similarity
        const vectorCandidates = vectorStore.searchRagas(ragaName, [], 1);
        if (vectorCandidates.length > 0) {
          return {
            ...vectorCandidates[0].raga,
            note: 'Retrieved via dense semantic vector embedding match',
          };
        }
        return { error: `Raga "${ragaName}" not found in catalogue.` };
      }
      return raga;
    }

    case 'search_songs_by_raga': {
      const ragaName = args?.ragaName || '';
      const limit = Number(args?.limit) || 10;
      const songs = structuredDb.getSongsForRaga(ragaName, limit);
      return {
        raga: ragaName,
        totalFound: songs.length,
        songs: songs.map((s) => ({
          title: s.title,
          filmOrAlbum: s.filmOrAlbum,
          composer: s.composer,
          singers: s.singers,
          language: s.language,
          year: s.year,
        })),
      };
    }

    case 'analyze_scale_rules': {
      const arohana = args?.arohana || '';
      const avarohana = args?.avarohana || '';
      return analyzeScaleGrammar(arohana, avarohana);
    }

    case 'get_melakarta_info': {
      const ragaName = args?.ragaName || '';
      const kataResult = calculateKatapayadiMelakarta(ragaName);
      if (!kataResult) {
        return {
          ragaName,
          error: `Could not derive Melakarta via Katapayadi cipher for "${ragaName}". Ensure it is a Janaka/parent raga with classic Sanskrit nomenclature prefix.`,
        };
      }
      return kataResult;
    }

    case 'disambiguate_ragas': {
      const ragaA = args?.ragaA || '';
      const ragaB = args?.ragaB || '';
      const explanation = disambiguateRagaRule(ragaA, ragaB);
      if (!explanation) {
        return {
          ragaA,
          ragaB,
          message: `No specific microtonal confusion rule recorded between "${ragaA}" and "${ragaB}".`,
        };
      }
      return { ragaA, ragaB, distinction: explanation };
    }

    default:
      throw new Error(`Tool not found: ${name}`);
  }
}

// GET handler: Returns server status & MCP documentation
export async function GET() {
  return NextResponse.json({
    name: 'raga-finder-mcp-server',
    version: '2.0.0',
    description: 'Model Context Protocol (MCP) server for Indian Classical & Film Raga Identification.',
    protocol: 'json-rpc-2.0',
    toolsCount: MCP_TOOLS.length,
    tools: MCP_TOOLS.map((t) => ({ name: t.name, description: t.description })),
    usage: {
      request: 'POST /api/mcp with standard JSON-RPC 2.0 payload',
      methods: ['tools/list', 'tools/call'],
    },
  });
}

// POST handler: JSON-RPC 2.0 implementation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jsonrpc, id, method, params } = body;

    if (jsonrpc !== '2.0') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: id ?? null,
          error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
        },
        { status: 400 }
      );
    }

    if (method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS,
        },
      });
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArguments = params?.arguments || {};

      if (!toolName) {
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Invalid params: tool name is required' },
          },
          { status: 400 }
        );
      }

      try {
        const toolResult = await handleMcpToolCall(toolName, toolArguments);
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(toolResult, null, 2),
              },
            ],
          },
        });
      } catch (toolError: any) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32000,
            message: toolError?.message || 'Tool execution error',
          },
        });
      }
    }

    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error', details: err?.message },
      },
      { status: 500 }
    );
  }
}
