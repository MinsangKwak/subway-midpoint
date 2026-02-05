import type { RawSubwayStation } from './subway.types';

export type GraphEdge = {
  to: string;
  weight: number;
  kind: 'LINE' | 'TRANSFER';
};

export type GraphNode = {
  id: string;
  name: string;
  lineId: string;
  latitude: number;
  longitude: number;
};

export type SubwayGraph = {
  nodes: Record<string, GraphNode>;
  adj: Record<string, GraphEdge[]>;
};

const LINE_WEIGHT = 1;
const TRANSFER_WEIGHT = 1;

const normalizeName = (name: string) =>
  name.replace(/\s+/g, '').trim();

const addEdge = (
  adj: Record<string, GraphEdge[]>,
  from: string,
  edge: GraphEdge
) => {
  if (!adj[from]) adj[from] = [];
  const exists = adj[from].some(
    (e) => e.to === edge.to && e.kind === edge.kind
  );
  if (!exists) adj[from].push(edge);
};

export const buildSubwayGraph = (
  stations: RawSubwayStation[]
): SubwayGraph => {
  const nodes: Record<string, GraphNode> = {};
  const adj: Record<string, GraphEdge[]> = {};

  for (const s of stations) {
    nodes[s.id] = {
      id: s.id,
      name: s.name,
      lineId: s.lineId,
      latitude: s.latitude,
      longitude: s.longitude,
    };
    adj[s.id] = [];
  }

  const byLine: Record<string, RawSubwayStation[]> = {};
  for (const s of stations) {
    if (!byLine[s.lineId]) byLine[s.lineId] = [];
    byLine[s.lineId].push(s);
  }

  for (const lineId of Object.keys(byLine)) {
    const lineStations = byLine[lineId];
    for (let i = 0; i < lineStations.length - 1; i++) {
      const a = lineStations[i];
      const b = lineStations[i + 1];
      addEdge(adj, a.id, { to: b.id, weight: LINE_WEIGHT, kind: 'LINE' });
      addEdge(adj, b.id, { to: a.id, weight: LINE_WEIGHT, kind: 'LINE' });
    }
  }

  const byName: Record<string, RawSubwayStation[]> = {};
  for (const s of stations) {
    const key = normalizeName(s.name);
    if (!byName[key]) byName[key] = [];
    byName[key].push(s);
  }

  for (const key of Object.keys(byName)) {
    const same = byName[key];
    if (same.length < 2) continue;

    for (let i = 0; i < same.length; i++) {
      for (let j = i + 1; j < same.length; j++) {
        if (same[i].lineId === same[j].lineId) continue;
        addEdge(adj, same[i].id, {
          to: same[j].id,
          weight: TRANSFER_WEIGHT,
          kind: 'TRANSFER',
        });
        addEdge(adj, same[j].id, {
          to: same[i].id,
          weight: TRANSFER_WEIGHT,
          kind: 'TRANSFER',
        });
      }
    }
  }

  return { nodes, adj };
};
