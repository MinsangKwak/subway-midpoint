// src/services/subway/subway.types.ts

/**
 * 지하철 노선 정보
 */
export type SubwayLine = {
  id: string;          // 노선 고유 ID (예: "2")
  name: string;        // 노선 이름 (예: "2호선")
  color: string;       // UI 표시용 노선 색상 (예: "#00A84D")
};

/**
 * 지하철역 정보 (UI / 지도에서 사용하는 형태)
 */
export type SubwayStation = {
  id: string;          // 지하철역 고유 ID (예: "gangnam")
  name: string;        // 지하철역 이름 (예: "강남")
  lineId: string;      // 소속 노선 ID (SubwayLine.id 참조)

  latitude: number;    // 위도 (WGS84 기준)
  longitude: number;   // 경도 (WGS84 기준)

  lineName: string;    // 노선 이름 (예: "2호선")
};