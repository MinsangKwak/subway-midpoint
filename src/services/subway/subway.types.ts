// src/services/subway/subway.types.ts

export type SubwayLine = {
  id: string;        // 예: "2"
  name: string;      // 예: "2호선"
  color: string;     // UI용 컬러
};

export type SubwayStation = {
  id: string;        // 고유 ID
  name: string;      // 역 이름 (강남)
  lineId: string;    // 소속 노선 id
  latitude: number;  // 위도
  longitude: number; // 경도
};
