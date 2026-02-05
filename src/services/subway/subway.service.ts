// src/services/subway/subway.service.ts

import { subwayStations } from './subway.mock';
import type { RawSubwayStation, SubwayStation } from './subway.types';

/**
 * 지하철역 검색 함수 (mock 데이터 기반)
 *
 * - 사용자가 입력한 검색어를 기준으로 지하철역을 필터링한다.
 * - mock 데이터(RawSubwayStation)를
 *   UI / 지도에서 사용하기 좋은 형태(SubwayStation)로 변환한다.
 */
export const searchSubwayStations = (
  keyword: string
): SubwayStation[] => {
  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) return [];

  // "강남역" → "강남" 형태로 정규화
  const normalizedKeyword = trimmedKeyword.replace('역', '');

  const result: SubwayStation[] = subwayStations
    .filter((station: RawSubwayStation) =>
      station.name.includes(normalizedKeyword)
    )
    .map((station: RawSubwayStation) => ({
      id: station.id,                     // 지하철역 고유 ID
      name: station.name,                 // 지하철역 이름
      lineId: station.lineId,             // 소속 노선 ID
      latitude: station.latitude,         // 위도 (WGS84)
      longitude: station.longitude,       // 경도 (WGS84)
      lineName: '',                       // 노선 이름 (현재 mock에는 없으므로 임시 빈 값)
    }));

  // 디버깅용 로그
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
