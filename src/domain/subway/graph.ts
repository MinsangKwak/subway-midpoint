import { haversineKm } from './geo';
import type { LineSegment, RawStation } from './types';

export type EdgeKind = 'LINE' | 'TRANSFER';

export type GraphEdge = {
  to: string;
  // 예상 소요시간(분)
  minutes: number;
  kind: EdgeKind;
};

export type GraphNode = RawStation;

export type SubwayGraph = {
  nodes: Record<string, GraphNode>;
  adj: Record<string, GraphEdge[]>;
  // 정규화된 역 이름 → 노선별 노드 id 목록. 환승 판단과 이름 단위 집계에 쓴다.
  nodesByName: Record<string, string[]>;
};

// 소요시간 추정 상수. 실제 시각표가 아니라 거리 기반 근사치다.
// 도시철도 표정속도(정차 포함) 약 32km/h, 역 간 최소 1.5분, 환승 5분(이동+대기).
export const AVERAGE_SPEED_KMH = 32;
export const MIN_HOP_MINUTES = 1.5;
export const TRANSFER_MINUTES = 5;

export const normalizeStationName = (name: string) =>
  name.replace(/\s+/g, '').replace(/역$/, '');

// 환승 판단과 이름 단위 집계에 쓰는 키. transferName 이 있으면 그것을 우선한다
export const stationKey = (s: Pick<RawStation, 'name' | 'transferName'>) =>
  normalizeStationName(s.transferName ?? s.name);

const addEdge = (adj: Record<string, GraphEdge[]>, from: string, edge: GraphEdge) => {
  const list = (adj[from] ??= []);
  if (list.some((e) => e.to === edge.to && e.kind === edge.kind)) return;
  list.push(edge);
};

const hopMinutes = (a: RawStation, b: RawStation) =>
  Math.max(MIN_HOP_MINUTES, (haversineKm(a, b) / AVERAGE_SPEED_KMH) * 60);

export const buildSubwayGraph = (
  stations: RawStation[],
  segments: LineSegment[],
): SubwayGraph => {
  const nodes: Record<string, GraphNode> = {};
  const adj: Record<string, GraphEdge[]> = {};
  const nodesByName: Record<string, string[]> = {};

  for (const s of stations) {
    if (nodes[s.id]) throw new Error(`duplicate station id: ${s.id}`);
    nodes[s.id] = s;
    adj[s.id] = [];
    (nodesByName[stationKey(s)] ??= []).push(s.id);
  }

  // 같은 구간 안에서 이웃한 역끼리 양방향 연결
  for (const seg of segments) {
    const ids = seg.stationIds;
    const pairs: [string, string][] = [];
    for (let i = 0; i < ids.length - 1; i++) pairs.push([ids[i], ids[i + 1]]);
    if (seg.loop && ids.length > 2) pairs.push([ids[ids.length - 1], ids[0]]);

    for (const [aId, bId] of pairs) {
      const a = nodes[aId];
      const b = nodes[bId];
      if (!a || !b) throw new Error(`segment refers to unknown station: ${aId} → ${bId}`);
      if (a.lineId !== seg.lineId || b.lineId !== seg.lineId) {
        throw new Error(`segment of line ${seg.lineId} contains ${aId}/${bId} of another line`);
      }
      const minutes = hopMinutes(a, b);
      addEdge(adj, aId, { to: bId, minutes, kind: 'LINE' });
      addEdge(adj, bId, { to: aId, minutes, kind: 'LINE' });
    }
  }

  // 같은 이름·다른 노선 노드끼리 환승 간선
  for (const ids of Object.values(nodesByName)) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        if (nodes[ids[i]].lineId === nodes[ids[j]].lineId) continue;
        addEdge(adj, ids[i], { to: ids[j], minutes: TRANSFER_MINUTES, kind: 'TRANSFER' });
        addEdge(adj, ids[j], { to: ids[i], minutes: TRANSFER_MINUTES, kind: 'TRANSFER' });
      }
    }
  }

  return { nodes, adj, nodesByName };
};
