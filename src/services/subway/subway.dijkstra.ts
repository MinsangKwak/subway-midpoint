// 이 파일은 "지하철 그래프"에서
// 특정 출발 역(startId)을 기준으로
// 모든 역까지의 최단 거리(hop 수)를 계산하는
// 다익스트라(Dijkstra) 알고리즘 구현 파일이다.
//
// 이 파일의 책임은 오직 두 가지다.
// 1. startId 기준으로 최단 거리(dist)와 이전 노드(prev)를 계산
// 2. prev 정보를 이용해 실제 이동 경로(path)를 복원
//
// 지도, 좌표, UI 개념은 전혀 모르며
// 순수하게 "그래프 계산 로직"만 담당한다.

import type { SubwayGraph } from './subway.graph';

// 다익스트라 실행 결과 타입
// dist: 시작점(startId)에서 각 역(id)까지의 최단 거리
// prev: 해당 역으로 오기 직전에 거쳐온 역 id
export type DijkstraResult = {
  dist: Record<string, number>;
  prev: Record<string, string | null>;
};

// 다익스트라 알고리즘 본체
// graph: subway.graph.ts에서 생성된 지하철 그래프
// startId: 최단 경로 계산의 기준이 되는 출발 역 id
export const dijkstra = (
  graph: SubwayGraph,
  startId: string
): DijkstraResult => {
  // dist는 "출발 역 → 해당 역까지의 최소 비용"
  // 초기에는 모두 Infinity(도달 불가)로 설정
  const dist: Record<string, number> = {};

  // prev는 "이 역으로 오기 직전의 역 id"
  // 경로 복원 시 사용된다
  const prev: Record<string, string | null> = {};

  // visited는 이미 최단 거리가 확정된 노드 집합
  // 다익스트라 알고리즘의 핵심 상태
  const visited = new Set<string>();

  // 그래프에 존재하는 모든 노드에 대해 초기값 설정
  for (const id of Object.keys(graph.nodes)) {
    dist[id] = Infinity;
    prev[id] = null;
  }

  // 출발 역은 자기 자신까지의 거리가 0
  dist[startId] = 0;

  // 아직 방문하지 않은 노드 중
  // dist 값이 가장 작은 노드를 찾는 함수
  //
  // 이 구현은 우선순위 큐를 쓰지 않는
  // 단순한 O(N^2) 방식이다.
  // 현재 mock 데이터 규모에서는 충분하다.
  const getNext = () => {
    let min = Infinity;
    let node: string | null = null;

    for (const id of Object.keys(dist)) {
      // 이미 방문한 노드는 제외
      if (visited.has(id)) continue;

      // 가장 짧은 거리의 노드를 선택
      if (dist[id] < min) {
        min = dist[id];
        node = id;
      }
    }

    return node;
  };

  // 더 이상 방문할 노드가 없을 때까지 반복
  while (true) {
    // 현재 단계에서 최단 거리가 확정될 노드 선택
    const current = getNext();

    // 선택할 노드가 없으면 알고리즘 종료
    if (!current) break;

    // 현재 노드는 최단 거리가 확정되었으므로 방문 처리
    visited.add(current);

    // 현재 노드에서 갈 수 있는 모든 인접 간선 순회
    for (const edge of graph.adj[current]) {
      // 이미 방문한 노드는 다시 보지 않는다
      if (visited.has(edge.to)) continue;

      // 현재 노드를 거쳐서 다음 노드로 가는 비용 계산
      const alt = dist[current] + edge.weight;

      // 기존에 알고 있던 거리보다 짧다면 갱신
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = current;
      }
    }
  }

  // 최종적으로
  // dist: 출발지 기준 모든 역까지의 최단 hop 수
  // prev: 각 역의 이전 역 정보
  // 를 반환
  return { dist, prev };
};

// prev 맵을 이용해 실제 이동 경로를 복원하는 함수
//
// prev: 다익스트라 결과로 나온 이전 노드 정보
// startId: 출발 역 id
// endId: 도착 역 id
//
// 반환값:
// - startId → endId 순서의 역 id 배열
// - 경로가 존재하지 않으면 빈 배열
export const restorePath = (
  prev: Record<string, string | null>,
  startId: string,
  endId: string
): string[] => {
  const path: string[] = [];
  let current: string | null = endId;

  // 도착 지점부터 시작해서
  // prev를 따라 거꾸로 이동
  while (current) {
    path.unshift(current);

    // 출발 지점에 도달하면 종료
    if (current === startId) break;

    current = prev[current];
  }

  // 정상적인 경로라면
  // 반드시 path의 첫 요소가 startId여야 한다
  // 그렇지 않으면 연결되지 않은 경로
  return path[0] === startId ? path : [];
};
