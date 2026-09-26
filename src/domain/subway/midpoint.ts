import { dijkstra, restorePath } from './dijkstra';
import type { SubwayGraph } from './graph';
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
  name: string;
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

// 여러 출발지의 중간지점을 찾는다.
// 기준: 가장 오래 걸리는 사람의 시간(max)을 최소화하고, 같으면 합계가 작은 역.
// 후보는 물리 노드가 아니라 "역 이름" 단위다. 환승역은 어느 노선 노드로 도착해도 같은 역이다.
export const calculateMidpoint = (
  graph: SubwayGraph,
  starts: StartSpec[],
  options: { topN?: number } = {},
): MidpointResult | null => {
  const topN = options.topN ?? 3;

  // 같은 역(이름)을 두 번 넣으면 하나로 취급한다
  const seenNames = new Set<string>();
  const uniqueStarts: { index: number; nodeIds: string[]; name: string }[] = [];
  starts.forEach((start, index) => {
    const nodeIds = toNodeIds(graph, start);
    if (nodeIds.length === 0) return;
    const name = graph.nodes[nodeIds[0]].name;
    if (seenNames.has(name)) return;
    seenNames.add(name);
    uniqueStarts.push({ index, nodeIds, name });
  });
  if (uniqueStarts.length < 2) return null;

  const results = uniqueStarts.map((s) => ({ ...s, ...dijkstra(graph, s.nodeIds) }));
  const startNames = seenNames;

  const candidates: MidpointCandidate[] = [];

  for (const [key, nodeIds] of Object.entries(graph.nodesByName)) {
    const name = graph.nodes[nodeIds[0]].name;
    // 출발지 자체는 중간지점에서 제외한다. 2명이 이웃역이면 어차피 한쪽이 유리해 의미가 없다
    if (startNames.has(name)) continue;

    let maxMinutes = 0;
    let totalMinutes = 0;
    const legs: Leg[] = [];
    let reachable = true;

    for (const r of results) {
      // 같은 이름의 노드 중 가장 빨리 닿는 노드를 도착점으로 삼는다
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
      const path = restorePath(r.prev, r.nodeIds, bestNode);
      legs.push({
        index: r.index,
        fromId: path[0],
        toId: bestNode,
        minutes: bestMinutes,
        transfers: countTransfers(graph, path),
        nodeIds: path,
        points: path.map((id) => ({
          latitude: graph.nodes[id].latitude,
          longitude: graph.nodes[id].longitude,
        })),
      });
      maxMinutes = Math.max(maxMinutes, bestMinutes);
      totalMinutes += bestMinutes;
    }

    if (!reachable) continue;

    const anchor = graph.nodes[nodeIds[0]];
    candidates.push({
      stationKey: key,
      name,
      maxMinutes,
      totalMinutes,
      legs,
      latitude: anchor.latitude,
      longitude: anchor.longitude,
    });
  }

  if (candidates.length === 0) return null;

  candidates.sort(
    (a, b) =>
      a.maxMinutes - b.maxMinutes ||
      a.totalMinutes - b.totalMinutes ||
      a.name.localeCompare(b.name, 'ko'),
  );

  return { best: candidates[0], candidates: candidates.slice(0, topN) };
};
