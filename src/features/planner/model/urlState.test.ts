import { describe, expect, it } from 'vitest';
import { stationCatalog } from '@/data/subway';
import { MAX_DEPARTURES } from './plannerReducer';
import { buildPlannerQuery, parsePlannerQuery } from './urlState';

const keysOf = (search: string) => parsePlannerQuery(search, stationCatalog).stations.map((s) => s.key);

describe('parsePlannerQuery', () => {
  it('restores known stations in order and drops unknown or duplicate ones', () => {
    expect(keysOf('?from=강남,없는역,홍대입구,강남')).toEqual(['강남', '홍대입구']);
  });

  it('accepts encoded names, a trailing 역 and surrounding spaces', () => {
    expect(keysOf(`?from=${encodeURIComponent('강남역')},%20홍대입구%20`)).toEqual(['강남', '홍대입구']);
  });

  it('caps the number of departures', () => {
    const many = ['강남', '홍대입구', '종로3가', '왕십리', '고속터미널', '사당', '신촌', '건대입구'];
    expect(keysOf(`?from=${many.join(',')}`)).toHaveLength(MAX_DEPARTURES);
  });

  it('reads the picked candidate and ignores invalid values', () => {
    expect(parsePlannerQuery('?from=강남,홍대입구&pick=2', stationCatalog).pick).toBe(2);
    expect(parsePlannerQuery('?from=강남,홍대입구&pick=-1', stationCatalog).pick).toBe(0);
    expect(parsePlannerQuery('?from=강남,홍대입구&pick=abc', stationCatalog).pick).toBe(0);
    expect(parsePlannerQuery('', stationCatalog)).toEqual({ stations: [], pick: 0 });
  });
});

describe('buildPlannerQuery', () => {
  it('round-trips through parsePlannerQuery', () => {
    const stations = [stationCatalog.byKey['강남'], stationCatalog.byKey['동대문역사문화공원']];
    const query = buildPlannerQuery(stations, 1);
    expect(query.startsWith('?from=')).toBe(true);
    expect(query).toContain('&pick=1');
    const parsed = parsePlannerQuery(query, stationCatalog);
    expect(parsed.stations.map((s) => s.key)).toEqual(['강남', '동대문역사문화공원']);
    expect(parsed.pick).toBe(1);
  });

  it('omits pick=0 and returns an empty string without stations', () => {
    expect(buildPlannerQuery([stationCatalog.byKey['강남']], 0)).not.toContain('pick');
    expect(buildPlannerQuery([])).toBe('');
  });
});
