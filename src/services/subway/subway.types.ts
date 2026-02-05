// src/services/subway/subway.types.ts
//
// 이 파일은 "지하철 도메인에서 공통으로 사용하는 타입 정의"를 모아둔 파일이다.
// 실제 로직(graph, dijkstra, midpoint)에서는 이 타입들을 기반으로 계산만 수행하고,
// UI, 지도, mock 데이터, 서비스 계층에서 동일한 타입을 공유하기 위해 존재한다.
//
// 중요한 원칙:
// - 이 파일에는 로직이 없다
// - 오직 타입 정의만 있다
// - 그래프 계산용 타입과 UI 표시용 타입을 명확히 구분한다

// 지하철 노선 정보 타입
// 노선 자체의 메타 정보로, UI 표시(색상, 이름)에 주로 사용된다
export type SubwayLine = {
  // 노선 고유 ID
  // 내부 식별자이며 숫자를 문자열로 사용한다 (예: "2", "9")
  id: string;

  // 사용자에게 보여지는 노선 이름
  // UI, 검색 결과, 라벨 등에 사용된다
  name: string;

  // UI에서 사용하는 노선 색상
  // 지도, 배지, 라인 강조 등에 사용된다
  color: string;
};

// 지하철역 정보 타입 (UI / 지도 기준)
// 이 타입은 "사용자가 보는 지하철역" 기준의 형태다
// 지도 마커, 자동완성 리스트, 선택된 출발지 등에 사용된다
export type SubwayStation = {
  // 지하철역 고유 ID
  // 그래프, 경로 계산, 마커, 출발지 식별의 기준이 된다
  id: string;

  // 지하철역 이름
  // 화면에 표시되는 이름이며, 환승 판단 시에도 사용될 수 있다
  name: string;

  // 이 역이 소속된 노선의 ID
  // SubwayLine.id를 참조한다
  lineId: string;

  // 지하철역의 위도 (WGS84 좌표계)
  // 지도 마커, Polyline 계산에 사용된다
  latitude: number;

  // 지하철역의 경도 (WGS84 좌표계)
  // 지도 마커, Polyline 계산에 사용된다
  longitude: number;

  // 노선 이름 (예: "2호선")
  // UI 표시 전용 필드이며, 그래프 계산에는 사용되지 않는다
  //
  // 주의:
  // - RawSubwayStation에는 없는 필드다
  // - mock 데이터나 API 응답을 UI용으로 가공할 때 채워진다
  lineName: string;
};

// 이 파일에서 정의하지 않은 타입에 대한 설명
//
// RawSubwayStation
// - mock 데이터, API 응답, 그래프 생성(buildSubwayGraph)의 입력으로 사용되는 "원본 형태"
// - lineName 같은 UI 전용 필드가 없다
//
// 권장 구조:
// - RawSubwayStation  → 계산 / 그래프 / 알고리즘
// - SubwayStation     → UI / 지도 / 사용자 인터랙션
//
// 이 두 타입을 섞지 않는 것이 중요하다
