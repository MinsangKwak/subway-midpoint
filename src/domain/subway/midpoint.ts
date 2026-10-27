import { dijkstra, restorePath } from './dijkstra';
import { sortLineIds, stationDisplayName, stationKey, type SubwayGraph } from './graph';
import type { LatLng } from './types';

export type Leg = {
  // 출발지 인덱스 (calculateMidpoint 에 넘긴 순서)
  index: number;
  // 실제 경로가 시작한 출발 노드 id
  fromId: string;
  // 도착(중간지점) 노드 id. 환승역이면 가장 가까운 노선의 노드
  toId: string;
  minutes: number;
  transfers: number;
  // 경유 노드 id 목록 (출발 포함, 도착 포함)
  nodeIds: string[];
  points: LatLng[];
};

export type MidpointCandidate = {
  // 이름 기준 역 키
  stationKey: string;
  // 화면에 보이는 역 이름. 카탈로그와 같은 규칙(가장 짧은 이름)을 쓴다
  name: string;
  // 이 역을 지나는 노선. 환승 별칭으로 묶인 노선까지 포함한다
  lineIds: string[];
  // 가장 오래 걸리는 사람의 소요시간
  maxMinutes: number;
  // 모든 사람의 소요시간 합
  totalMinutes: number;
  legs: Leg[];
  latitude: number;
  longitude: number;
};

export type MidpointResult = {
  best: MidpointCandidate;
  // best를 포함해 점수순으로 정렬된 상위 후보
  candidates: MidpointCandidate[];
};

const countTransfers = (graph: SubwayGraph, nodeIds: string[]) => {
  let transfers = 0;
  for (let i = 1; i < nodeIds.length; i++) {
    if (graph.nodes[nodeIds[i - 1]].lineId !== graph.nodes[nodeIds[i]].lineId) transfers += 1;
  }
  return transfers;
};

// 출발지 하나는 노드 id 하나이거나, 환승역처럼 같은 역의 노드 id 묶음이다.
export type StartSpec = string | string[];

const toNodeIds = (graph: SubwayGraph, start: StartSpec) =>
  (Array.isArray(start) ? start : [start]).filter((id) => graph.nodes[id]);

type Start = { index: number; nodeIds: string[] };

// 출발지 하나가 후보 역에 닿는 가장 빠른 노드와 시간
type Arrival = { start: Start; prev: Record<string, string | null>; nodeId: string; minutes: number };

// 정렬에 필요한 점수만 먼저 모은다. 경로 복원은 상위 후보에만 한다
type Scored = {
  key: string;
  nodeIds: string[];
  maxMinutes: number;
  totalMinutes: number;
  arrivals: Arrival[];
};

const toCandidate = (graph: SubwayGraph, s: Scored): MidpointCandidate => {
  const legs: Leg[] = s.arrivals.map((a) => {
    const path = restorePath(a.prev, a.start.nodeIds, a.nodeId);
    return {
      index: a.start.index,
      fromId: path[0],
      toId: a.nodeId,
      minutes: a.minutes,
      transfers: countTransfers(graph, path),
      nodeIds: path,
      points: path.map((id) => ({
        latitude: graph.nodes[id].latitude,
        longitude: graph.nodes[id].longitude,
      })),
    };
  });
  const anchor = graph.nodes[s.nodeIds[0]];
  return {
    stationKey: s.key,
    name: stationDisplayName(graph, s.key),
    lineIds: sortLineIds(Array.from(new Set(s.nodeIds.map((id) => graph.nodes[id].lineId)))),
    maxMinutes: s.maxMinutes,
    totalMinutes: s.totalMinutes,
    legs,
    latitude: anchor.latitude,
    longitude: anchor.longitude,
  };
};

// 여러 출발지의 중간지점을 찾는다.
// 기준: 가장 오래 걸리는 사람의 시간(max)을 최소화하고, 같으면 합계가 작은 역.
// 후보는 물리 노드가 아니라 "역" 단위다. 환승역은 어느 노선 노드로 도착해도 같은 역이다.
export const calculateMidpoint = (
  graph: SubwayGraph,
  starts: StartSpec[],
  options: { topN?: number } = {},
): MidpointResult | null => {
  const topN = options.topN ?? 3;

  // 같은 역을 두 번 넣으면 하나로 취급한다. 이름이 아니라 역 키로 비교해야 총신대입구·이수가 같은 역이 된다
  const startKeys = new Set<string>();
  const uniqueStarts: Start[] = [];
  starts.forEach((start, index) => {
    const nodeIds = toNodeIds(graph, start);
    if (nodeIds.length === 0) return;
    const key = stationKey(graph.nodes[nodeIds[0]]);
    if (startKeys.has(key)) return;
    startKeys.add(key);
    uniqueStarts.push({ index, nodeIds });
  });
  if (uniqueStarts.length < 2) return null;

  const results = uniqueStarts.map((start) => ({ start, ...dijkstra(graph, start.nodeIds) }));

  const scored: Scored[] = [];

  for (const [key, nodeIds] of Object.entries(graph.nodesByName)) {
    // 출발지 자체는 중간지점에서 제외한다. 2명이 이웃역이면 어차피 한쪽이 유리해 의미가 없다
    if (startKeys.has(key)) continue;

    let maxMinutes = 0;
    let totalMinutes = 0;
    const arrivals: Arrival[] = [];
    let reachable = true;

    for (const r of results) {
      // 같은 역의 노드 중 가장 빨리 닿는 노드를 도착점으로 삼는다
      let bestNode: string | null = null;
      let bestMinutes = Infinity;
      for (const nodeId of nodeIds) {
        const d = r.dist[nodeId];
        if (d < bestMinutes) {
          bestMinutes = d;
          bestNode = nodeId;
        }
      }
      if (bestNode === null || !Number.isFinite(bestMinutes)) {
        reachable = false;
        break;
      }
      arrivals.push({ start: r.start, prev: r.prev, nodeId: bestNode, minutes: bestMinutes });
      maxMinutes = Math.max(maxMinutes, bestMinutes);
      totalMinutes += bestMinutes;
    }

    if (!reachable) continue;
    scored.push({ key, nodeIds, maxMinutes, totalMinutes, arrivals });
  }

  if (scored.length === 0) return null;

  scored.sort(
    (a, b) =>
      a.maxMinutes - b.maxMinutes ||
      a.totalMinutes - b.totalMinutes ||
      stationDisplayName(graph, a.key).localeCompare(stationDisplayName(graph, b.key), 'ko'),
  );

  const candidates = scored.slice(0, topN).map((s) => toCandidate(graph, s));
  return { best: candidates[0], candidates };
};
