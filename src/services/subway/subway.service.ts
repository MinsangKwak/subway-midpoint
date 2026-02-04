// src/services/subway/subway.service.ts
import { subwayStations } from './subway.mock';
import type { SubwayStation } from './subway.types';

/** 역 이름으로 검색 */
export const searchStationByName = (
  keyword: string
): SubwayStation[] => {
  if (!keyword.trim()) return [];

  return subwayStations.filter((station) =>
    station.name.includes(keyword)
  );
};

/** 정확히 일치하는 역 찾기 */
export const findExactStation = (
  name: string
): SubwayStation | undefined => {
  return subwayStations.find(
    (station) => station.name === name
  );
};
