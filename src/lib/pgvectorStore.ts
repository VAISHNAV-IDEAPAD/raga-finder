/**
 * pgvector PostgreSQL Integration for 1024-Dimensional BGE-M3 Embeddings
 *
 * Supports Neon, Supabase, Vercel Postgres, or self-hosted PostgreSQL instances
 * with the `vector` extension.
 * Provides HNSW index creation, cosine distance (`<=>`), and graceful in-memory fallback.
 */

import { Pool } from 'pg';
import { bgem3Engine } from './bgem3Embeddings';
import { structuredDb } from './structuredDb';
import { RagaProfile } from '@/types/raga';

let poolInstance: Pool | null = null;

export function getPgPool(): Pool | null {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    '';

  if (!connectionString) return null;

  if (!poolInstance) {
    try {
      poolInstance = new Pool({
        connectionString,
        ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 3000,
      });
    } catch (e) {
      console.warn('[pgvector] Pool initialization error:', e);
      return null;
    }
  }

  return poolInstance;
}

export interface PgVectorSearchResult {
  raga: RagaProfile;
  similarity: number;
  source: 'pgvector_postgres' | 'pgvector_in_memory';
}

// In-Memory 1024-dimensional cache for zero-config fallback
class InMemoryPgVectorMirror {
  private ragaVectors: Array<{ raga: RagaProfile; vec: Float32Array }> = [];
  private initialized = false;

  public initialize() {
    if (this.initialized) return;
    const ragas = structuredDb.ragas;
    ragas.forEach((raga) => {
      const text = `${raga.name} ${raga.tradition} ${raga.arohana} ${raga.avarohana} ${raga.rasaOrMood || ''}`;
      const vec = bgem3Engine.generateCalibratedEmbedding(text);
      this.ragaVectors.push({ raga, vec });
    });
    this.initialized = true;
  }

  public search(queryVec: Float32Array, topK = 5): PgVectorSearchResult[] {
    this.initialize();
    const scored = this.ragaVectors.map(({ raga, vec }) => ({
      raga,
      similarity: bgem3Engine.cosineSimilarity(queryVec, vec),
      source: 'pgvector_in_memory' as const,
    }));
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  }
}

const inMemoryMirror = new InMemoryPgVectorMirror();

/**
 * Execute Cosine Similarity Search in pgvector or fallback to in-memory mirror
 */
export async function searchRagaByPgVector(
  queryText: string,
  topK = 5
): Promise<PgVectorSearchResult[]> {
  const queryEmbedding = await bgem3Engine.embedText(queryText);
  const pool = getPgPool();

  if (pool) {
    try {
      // Format 1024-dim Float32Array as pgvector string: '[0.123, -0.456, ...]'
      const vectorLiteral = `[${Array.from(queryEmbedding).join(',')}]`;
      const sql = `
        SELECT name, tradition, arohana, avarohana, metadata,
               1 - (embedding <=> $1::vector) AS similarity
        FROM raga_vectors
        ORDER BY embedding <=> $1::vector
        LIMIT $2;
      `;
      const res = await pool.query(sql, [vectorLiteral, topK]);

      if (res.rows.length > 0) {
        return res.rows.map((row) => ({
          raga: {
            name: row.name,
            tradition: row.tradition,
            arohana: row.arohana,
            avarohana: row.avarohana,
            swarasCarnatic: row.metadata?.swarasCarnatic || [],
            swarasHindustani: row.metadata?.swarasHindustani || [],
            melakartaNumber: row.metadata?.melakartaNumber,
            thaat: row.metadata?.thaat,
            rasaOrMood: row.metadata?.rasaOrMood || '',
            timeOfDay: row.metadata?.timeOfDay || '',
            famousSongs: row.metadata?.famousSongs || [],
            explanation: row.metadata?.explanation || '',
          },
          similarity: Number(parseFloat(row.similarity).toFixed(4)),
          source: 'pgvector_postgres',
        }));
      }
    } catch (err: any) {
      console.warn('[pgvector Query Error] Falling back to in-memory mirror:', err.message);
    }
  }

  // Fallback to in-memory 1024-dim mirror
  return inMemoryMirror.search(queryEmbedding, topK);
}

/**
 * Return PostgreSQL DDL statements for users setting up their own database
 */
export function generatePgVectorSchemaSql(): string {
  return `
-- ========================================================
-- Raga Finder AI: pgvector PostgreSQL 1024-Dim Schema
-- ========================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS raga_vectors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  tradition VARCHAR(50) NOT NULL,
  arohana TEXT NOT NULL,
  avarohana TEXT NOT NULL,
  metadata JSONB,
  embedding vector(1024)
);

CREATE TABLE IF NOT EXISTS song_vectors (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  raga VARCHAR(255) NOT NULL,
  composer VARCHAR(255),
  metadata JSONB,
  embedding vector(1024)
);

-- HNSW Vector Cosine Index for ultra-fast ANN search (< 5ms)
CREATE INDEX IF NOT EXISTS idx_raga_vectors_hnsw ON raga_vectors 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_song_vectors_hnsw ON song_vectors 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
  `.trim();
}
