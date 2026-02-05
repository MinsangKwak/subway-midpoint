// src/services/subway/subway.path.ts
//
// 이 파일은 "경로 계산 결과(ID 배열)"를
// "지도에서 사용할 수 있는 좌표 배열"로 변환하는 역할을 한다.
//
// 즉,
// - subway.graph.ts / subway.dijkstra.ts / subway.midpoint.ts
//   → 모두 역 id 기준으로 계산을 수행하고
// - 이 파일은 그 결과를 UI(지도) 계층으로 전달하기 위한
//   변환(adaptor) 역할을 담당한다.
//
// 이 파일이 존재함으로써
// - 계산 로직과 지도/좌표 로직이 완전히 분리된다
// - 그래프 계산은 좌표를 몰라도 된다
// - 지도 구현은 그래프 구조를 몰라도 된다

import type { SubwayGraph } from './subway.graph';

// 위도 / 경도 좌표 타입
// 지도 라이브러리(Kakao Map 등)에 전달하기 위한 최소 단위
export type LatLng = {
  // 위도 (WGS84 좌표계)
  latitude: number;

  // 경도 (WGS84 좌표계)
  longitude: number;
};

// 역 ID 경로 배열을 좌표 배열로 변환하는 함수
//
// graph:
// - buildSubwayGraph로 생성된 지하철 그래프
// - 각 역의 좌표 정보(latitude, longitude)를 가지고 있다
//
// path:
// - restorePath 결과
// - ["gangnam", "seolleung", "sadang_2"] 같은 역 id 배열
//
// 반환값:
// - 지도 Polyline에 바로 사용할 수 있는 좌표 배열
// - [{ latitude, longitude }, ...] 형태
export const pathToLatLngs = (
  graph: SubwayGraph,
  path: string[]
): LatLng[] => {
  return (
    path
      // 역 id를 이용해 그래프 노드 정보 조회
      .map((id) => graph.nodes[id])

      // 방어 코드:
      // - 존재하지 않는 id가 path에 포함된 경우 제거
      // - 그래프와 경로 계산 결과의 불일치로 인한 오류 방지
      .filter(Boolean)

      // 노드 정보에서 좌표만 추출
      .map((node) => ({
        latitude: node.latitude,
        longitude: node.longitude,
      }))
  );
};
