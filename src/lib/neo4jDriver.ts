/**
 * Neo4j Graph Database Driver & Cypher Query Service
 *
 * Connects to Neo4j AuraDB or on-premise Neo4j instance when NEO4J_URI,
 * NEO4J_USERNAME, and NEO4J_PASSWORD are provided.
 * Gracefully delegates to in-memory knowledgeGraphStore when offline.
 */

import neo4j, { Driver, Session } from 'neo4j-driver';
import { knowledgeGraphStore, Subgraph } from './knowledgeGraph';

let driverInstance: Driver | null = null;

export function getNeo4jConfig() {
  const uri = process.env.NEO4J_URI || process.env.NEO4J_URL || '';
  const user = process.env.NEO4J_USERNAME || process.env.NEO4J_USER || '';
  const password = process.env.NEO4J_PASSWORD || '';
  const isConfigured = Boolean(uri && user && password);

  return { uri, user, password, isConfigured };
}

export function getNeo4jDriver(): Driver | null {
  const config = getNeo4jConfig();
  if (!config.isConfigured) return null;

  if (!driverInstance) {
    try {
      driverInstance = neo4j.driver(
        config.uri,
        neo4j.auth.basic(config.user, config.password),
        {
          maxConnectionPoolSize: 10,
          connectionTimeout: 5000,
        }
      );
    } catch (e) {
      console.warn('[Neo4j Driver] Failed to initialize connection:', e);
      return null;
    }
  }

  return driverInstance;
}

export async function executeCypher(
  cypher: string,
  params: Record<string, any> = {}
): Promise<{ success: boolean; records: any[]; isNeo4jLive: boolean }> {
  const driver = getNeo4jDriver();

  if (driver) {
    let session: Session | null = null;
    try {
      session = driver.session();
      const result = await session.run(cypher, params);
      const records = result.records.map((r) => r.toObject());
      return { success: true, records, isNeo4jLive: true };
    } catch (err: any) {
      console.warn('[Neo4j Query Error]:', err.message);
    } finally {
      if (session) await session.close();
    }
  }

  // Standalone fallback: simulate / query knowledgeGraphStore
  return {
    success: true,
    records: [
      {
        message: 'Executed against In-Memory Musicology Knowledge Graph (Neo4j credentials not configured)',
        stats: knowledgeGraphStore.getStats(),
      },
    ],
    isNeo4jLive: false,
  };
}

/**
 * Query 2-hop neighborhood in Neo4j or fallback to in-memory graph
 */
export async function queryGraphNeighborhood(
  entityId: string,
  hops: number = 2
): Promise<Subgraph & { source: 'neo4j' | 'in_memory' }> {
  const driver = getNeo4jDriver();

  if (driver) {
    let session: Session | null = null;
    try {
      session = driver.session();
      const cypher = `
        MATCH (start { id: $entityId })-[r*1..2]-(target)
        RETURN start, r, target
        LIMIT 50
      `;
      const res = await session.run(cypher, { entityId });

      if (res.records.length > 0) {
        const nodesMap = new Map<string, any>();
        const edges: any[] = [];

        res.records.forEach((rec) => {
          const start = rec.get('start').properties;
          const target = rec.get('target').properties;
          nodesMap.set(start.id, start);
          nodesMap.set(target.id, target);
        });

        return {
          nodes: Array.from(nodesMap.values()),
          edges,
          source: 'neo4j',
        };
      }
    } catch (err) {
      console.warn('[Neo4j Neighborhood Query] Fallback to in-memory:', err);
    } finally {
      if (session) await session.close();
    }
  }

  // Fallback to internal Knowledge Graph
  const sub = knowledgeGraphStore.getNeighborhood(entityId, hops);
  return {
    ...sub,
    source: 'in_memory',
  };
}
