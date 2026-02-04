import { subwayStations } from './subway.mock';
import type { SubwayStation } from './subway.types';

/**
 * 지하철역 검색 (mock 기반)
 */
export const searchSubwayStations = (
  keyword: string
): SubwayStation[] => {
  if (!keyword.trim()) return [];

  return subwayStations.filter((station) =>
    station.name.includes(keyword)
  );
};
