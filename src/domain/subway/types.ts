// 지하철 도메인 공통 타입. 로직은 두지 않는다.

export type LineId = string;

export type SubwayLine = {
  id: LineId;
  name: string;
  color: string;
};

// 노선별 물리 정류장. 환승역은 노선마다 별도 노드를 가진다.
export type RawStation = {
  id: string;
  name: string;
  lineId: LineId;
  latitude: number;
  longitude: number;
  // 노선마다 이름이 다른 환승역일 때, 같은 역으로 묶을 이름 (예: 4호선 총신대입구 → 이수)
  transferName?: string;
  // 검색에만 쓰는 다른 표기 (예: 강변(동서울터미널))
  aliases?: string[];
};

// 노선의 한 구간. 배열 순서가 운행 순서이며, 분기·순환은 구간을 나눠 표현한다.
export type LineSegment = {
  lineId: LineId;
  stationIds: string[];
  // true면 마지막 역과 첫 역을 잇는다 (2호선 순환)
  loop?: boolean;
};

// 사용자가 고르는 "역" 단위. 같은 이름의 노선별 노드를 하나로 묶은 것.
export type Station = {
  // 이름 기반 안정 키 (예: "종로3가")
  key: string;
  name: string;
  // 다른 노선에서 쓰는 다른 이름 (예: 총신대입구(이수))
  aliases: string[];
  lineIds: LineId[];
  colors: string[];
  latitude: number;
  longitude: number;
  // 그래프 노드 id 목록
  nodeIds: string[];
};

export type LatLng = {
  latitude: number;
  longitude: number;
};
