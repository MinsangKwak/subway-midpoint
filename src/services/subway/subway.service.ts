// src/services/subway/subway.service.ts
//
// 이 파일은 "지하철 도메인의 서비스 레이어" 역할을 한다.
// UI 컴포넌트가 직접 mock 데이터나 raw 데이터를 건드리지 않도록
// 중간에서 데이터를 가공해서 제공하는 역할을 담당한다.
//
// 핵심 책임은 다음과 같다.
// 1. 지하철역 검색 기능 제공
// 2. RawSubwayStation(mock / API 원본 형태)을
//    SubwayStation(UI / 지도용 형태)으로 변환
//
// 주의:
// - 이 파일에는 그래프 계산, 경로 탐색 로직이 없다
// - 순수하게 "데이터 조회 + 가공"만 담당한다

import { subwayStations } from './subway.mock';
import type { RawSubwayStation, SubwayStation } from './subway.types';

// 지하철역 검색 함수
//
// keyword:
// - 사용자가 입력한 검색어
// - 자동완성, 출발지 입력창에서 사용된다
//
// 반환값:
// - UI / 지도에서 바로 사용할 수 있는 SubwayStation 배열
// - 검색 결과가 없으면 빈 배열
export const searchSubwayStations = (
  keyword: string
): SubwayStation[] => {
  // 입력값 앞뒤 공백 제거
  const trimmedKeyword = keyword.trim();

  // 공백만 입력된 경우 바로 종료
  if (!trimmedKeyword) return [];

  // 사용자가 "강남역"처럼 입력하는 경우가 많기 때문에
  // 검색 시에는 "역" 글자를 제거해서 비교한다
  //
  // 예:
  // - "강남역" → "강남"
  // - "서울역" → "서울"
  const normalizedKeyword = trimmedKeyword.replace('역', '');

  // mock 데이터(subwayStations)는 RawSubwayStation 형태이므로
  // UI에서 사용하기 전에 SubwayStation 형태로 변환한다
  const result: SubwayStation[] = subwayStations
    // 역 이름에 검색어가 포함된 경우만 필터링
    .filter((station: RawSubwayStation) =>
      station.name.includes(normalizedKeyword)
    )
    // RawSubwayStation → SubwayStation 변환
    .map((station: RawSubwayStation) => ({
      // 지하철역 고유 ID
      // 이후 그래프, 경로 계산, 마커 식별의 기준이 된다
      id: station.id,

      // 지하철역 이름 (화면 표시용)
      name: station.name,

      // 소속 노선 ID
      // 노선 색상, 노선 정보 매칭에 사용된다
      lineId: station.lineId,

      // 위도 (지도 마커 / Polyline 용)
      latitude: station.latitude,

      // 경도 (지도 마커 / Polyline 용)
      longitude: station.longitude,

      // 노선 이름
      //
      // 현재 mock 데이터에는 노선 이름이 없기 때문에
      // 임시로 빈 문자열을 넣어둔다
      //
      // 실제 API 연동 시:
      // - SubwayLine 정보와 조합해서 채워야 한다
      lineName: '',
    }));

  // 디버깅용 로그
  // 검색 결과가 의도대로 나오는지 확인하기 위해 유지
  console.log('[Search] 검색어:', normalizedKeyword);
  console.table(
    result.map((station) => ({
      name: station.name,
      latitude: station.latitude,
      longitude: station.longitude,
    }))
  );

  return result;
};
