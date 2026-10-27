import type { StationCatalog } from '@/domain/subway/catalog';
import { normalizeStationName } from '@/domain/subway/graph';
import type { Station } from '@/domain/subway/types';
import { MAX_DEPARTURES } from './plannerReducer';

// ?from=강남,홍대입구&pick=1 — 출발역 키 목록과 보고 있던 후보 인덱스
export const FROM_PARAM = 'from';
export const PICK_PARAM = 'pick';

export type PlannerQuery = {
  stations: Station[];
  pick: number;
};

// 주소의 출발역을 읽는다. 모르는 역·중복은 버리고 최대 입력칸 수까지만 받는다
export const parsePlannerQuery = (search: string, catalog: StationCatalog): PlannerQuery => {
  const params = new URLSearchParams(search);
  const seen = new Set<string>();
  const stations: Station[] = [];
  for (const raw of (params.get(FROM_PARAM) ?? '').split(',')) {
    const key = normalizeStationName(raw.trim());
    const station = catalog.byKey[key];
    if (!station || seen.has(key) || stations.length >= MAX_DEPARTURES) continue;
    seen.add(key);
    stations.push(station);
  }
  const pick = Number.parseInt(params.get(PICK_PARAM) ?? '', 10);
  return { stations, pick: Number.isInteger(pick) && pick > 0 ? pick : 0 };
};

// 출발역과 선택 후보를 쿼리 문자열로 만든다. 출발역이 없으면 빈 문자열
export const buildPlannerQuery = (stations: Station[], pick = 0): string => {
  if (stations.length === 0) return '';
  const parts = [`${FROM_PARAM}=${stations.map((s) => encodeURIComponent(s.key)).join(',')}`];
  if (pick > 0) parts.push(`${PICK_PARAM}=${pick}`);
  return `?${parts.join('&')}`;
};
