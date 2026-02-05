// src/services/subway/subway.midpoint.ts
//
// 이 파일은 "여러 출발지 기준 중간지점(midpoint)을 계산"하는 로직을 담당한다.
//
// 여기서 말하는 중간지점이란:
// - 모든 출발지에서 도달 가능하고
// - 가장 멀리 이동해야 하는 출발지 기준으로 봤을 때
// - 최대 이동 거리(max distance)가 최소가 되는 역
//
// 즉, 수학적으로는
// "각 출발지에서의 최단 거리 중 최댓값을 최소화하는 지점"
// (minimax 기준)
//
// 이 파일은 좌표, 지도, UI를 전혀 모르며
// 오직 그래프 + 최단 거리 정보만을 사용한다.

import type { RawSubwayStation } from './subway.types';
import type { SubwayGraph } from './subway.graph';
import { dijkstra, restorePath } from './subway.dijkstra';

// 중간지점 계산 결과 타입
type MidpointResult = {
  // 선택된 중간지점의 역 id
  midpointId: string;

  // 각 역별 점수
  // 점수 = 해당 역을 중간지점으로 선택했을 때의 "최대 이동 거리"
  scores: Record<string, number>;

  // 출발지별 실제 이동 경로
  // key: 출발지 id
  // value: 출발지 → 중간지점까지의 역 id 경로 배열
  paths: Record<string, string[]>;
};

// 중간지점 계산 함수
//
// graph:
// - buildSubwayGraph로 생성된 지하철 그래프
//
// startIds:
// - 출발지로 선택된 역 id 배열
// - 예: ['gangnam', 'hongdae', 'jamsil']
export const calculateMidpoint = (
  graph: SubwayGraph,
  startIds: string[]
): MidpointResult => {
  // 각 출발지마다 다익스트라 알고리즘을 실행한다
  //
  // 결과적으로:
  // - startId별로
  //   - 모든 역까지의 최단 거리(dist)
  //   - 이전 노드 정보(prev)
  // 를 확보하게 된다
  const allResults = startIds.map((id) => ({
    startId: id,
    ...dijkstra(graph, id),
  }));

  // 각 역이 중간지점 후보가 되었을 때의 점수 저장용
  const scores: Record<string, number> = {};

  // 현재까지 가장 좋은 중간지점 id
  let bestStationId = '';

  // 현재까지 가장 낮은 점수
  let bestScore = Infinity;

  // 그래프에 존재하는 모든 역을 중간지점 후보로 순회
  for (const targetId of Object.keys(graph.nodes)) {
    let maxDist = 0;
    let reachable = true;

    // 모든 출발지 기준으로
    // 해당 역(targetId)까지의 거리 확인
    for (const r of allResults) {
      const d = r.dist[targetId];

      // 하나라도 도달 불가능한 출발지가 있다면
      // 이 역은 중간지점 후보에서 제외
      if (!isFinite(d)) {
        reachable = false;
        break;
      }

      // 가장 멀리 이동해야 하는 출발지의 거리 기록
      if (d > maxDist) maxDist = d;
    }

    // 모든 출발지에서 도달 가능한 역만 평가 대상
    if (!reachable) continue;

    // 해당 역의 점수 저장
    // 점수 = 최대 이동 거리
    scores[targetId] = maxDist;

    // 지금까지의 최적 후보보다 점수가 낮으면 갱신
    if (maxDist < bestScore) {
      bestScore = maxDist;
      bestStationId = targetId;
    }
  }

  // 최종 선택된 중간지점(bestStationId)을 기준으로
  // 출발지별 실제 이동 경로를 복원한다
  const paths: Record<string, string[]> = {};

  for (const r of allResults) {
    paths[r.startId] = restorePath(
      r.prev,
      r.startId,
      bestStationId
    );
  }

  // 중간지점 id, 점수 테이블, 출발지별 경로 반환
  return {
    midpointId: bestStationId,
    scores,
    paths,
  };
};
