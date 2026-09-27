import { normalizeStationName, stationKey } from './graph';
import type { RawStation, Station, SubwayLine } from './types';

export type StationCatalog = {
  stations: Station[];
  byKey: Record<string, Station>;
};

// 노선별 물리 정류장을 "역 이름" 단위로 묶어 사용자가 고를 수 있는 목록을 만든다.
export const buildStationCatalog = (
  rawStations: RawStation[],
  lines: SubwayLine[],
): StationCatalog => {
  const lineById = new Map(lines.map((l) => [l.id, l]));
  const grouped = new Map<string, RawStation[]>();

  for (const s of rawStations) {
    const key = stationKey(s);
    (grouped.get(key) ?? grouped.set(key, []).get(key)!).push(s);
  }

  const stations: Station[] = [];
  const byKey: Record<string, Station> = {};

  for (const [key, group] of grouped) {
    const lineIds = Array.from(new Set(group.map((s) => s.lineId))).sort(
      (a, b) => Number(a) - Number(b) || a.localeCompare(b),
    );
    // 표시 이름은 가장 짧은 것(예: 이수). 나머지 이름과 별칭은 검색어로만 잡히게 aliases 에 둔다
    const names = Array.from(new Set(group.map((g) => g.name))).sort((a, b) => a.length - b.length);
    const aliases = Array.from(
      new Set([...names.slice(1), ...group.flatMap((g) => g.aliases ?? [])].filter((n) => n !== names[0])),
    );
    const station: Station = {
      key,
      name: names[0],
      aliases,
      lineIds,
      colors: lineIds.map((id) => lineById.get(id)?.color ?? '#9ca3af'),
      latitude: group[0].latitude,
      longitude: group[0].longitude,
      nodeIds: group.map((s) => s.id),
    };
    stations.push(station);
    byKey[key] = station;
  }

  stations.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  return { stations, byKey };
};

// 검색 비교용 키. 괄호·공백·기호를 지워 "강변(동서울터미널)"도 "강변"으로 잡히게 한다
const searchKey = (name: string) => normalizeStationName(name).replace(/[()（）[\]·.\-_\s]/g, '');

// 검색어로 역을 찾는다. 앞글자 일치를 먼저, 그다음 포함 일치를 이름순으로 돌려준다.
export const searchStations = (
  catalog: StationCatalog,
  keyword: string,
  limit = 8,
): Station[] => {
  const q = searchKey(keyword);
  if (!q) return [];

  const starts: Station[] = [];
  const includes: Station[] = [];
  for (const s of catalog.stations) {
    const keys = [s.key, ...s.aliases.map(searchKey)];
    if (keys.some((k) => k.startsWith(q))) starts.push(s);
    else if (keys.some((k) => k.includes(q))) includes.push(s);
  }
  return [...starts, ...includes].slice(0, limit);
};
