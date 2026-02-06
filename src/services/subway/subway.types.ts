// src/services/subway/subway.types.ts
//
// 이 파일은 "지하철 도메인에서 공통으로 사용하는 타입 정의"를 담당한다.
// - 그래프 / 경로 계산용 타입
// - 서비스 레이어 가공용 타입
// - UI / 지도 표시용 타입
//
// ⚠️ 이 파일에는 로직이 없다
// ⚠️ 타입만 정의한다
// ⚠️ 이름과 필드는 절대 애매하게 두지 않는다

// =========================
// 지하철 노선 정보 타입
// =========================
export type SubwayLine = {
  // 노선 고유 ID (문자열 숫자)
  id: string;

  // 노선 이름 (예: "2호선")
  name: string;

  // 노선 대표 색상 (UI 기준)
  color: string;
};

// =========================
// Raw 지하철역 타입 (그래프 / mock / API 원본)
// =========================
// 그래프 생성(buildSubwayGraph)의 입력으로 사용된다
// ⚠️ UI 전용 필드 없음
export type RawSubwayStation = {
  // 노선별 고유 ID
  // 환승역은 노선마다 다른 id를 가진다
  id: string;

  // 지하철역 이름
  // 환승 연결 판단 기준
  name: string;

  // 단일 노선 ID
  lineId: string;

  // 위도
  latitude: number;

  // 경도
  longitude: number;
};

// =========================
// 지하철역 타입 (UI / 지도 / 사용자 인터랙션)
// =========================
// 서비스 레이어(searchSubwayStations)에서 생성된다
// UI 컴포넌트는 이 타입만 사용한다
export type SubwayStation = {
  // 대표 ID (Raw 중 하나)
  id: string;

  // 지하철역 이름
  name: string;

  // 포함된 모든 노선 ID
  // 단일역: ["2"]
  // 환승역: ["1", "2"]
  lineIds: string[];

  // 위도
  latitude: number;

  // 경도
  longitude: number;

  // UI 표현용 색상 배열
  // 단일역: ["#00A84D"]
  // 환승역: ["#0052A4", "#00A84D"]
  color: string[];
};
