import { describe, expect, it } from 'vitest';
import { stationCatalog } from '@/data/subway';
import { searchStations } from './catalog';

describe('stationCatalog', () => {
  it('merges transfer stations into one entry with sorted line ids', () => {
    const jongno3 = stationCatalog.byKey['종로3가'];
    expect(jongno3.lineIds).toEqual(['1', '3', '5']);
    expect(jongno3.colors).toHaveLength(3);
    expect(jongno3.nodeIds).toHaveLength(3);
  });
});

describe('searchStations', () => {
  it('ignores a trailing 역 and whitespace', () => {
    expect(searchStations(stationCatalog, '강남역')[0].name).toBe('강남');
    expect(searchStations(stationCatalog, ' 강남 ')[0].name).toBe('강남');
  });

  it('ranks prefix matches before substring matches', () => {
    const names = searchStations(stationCatalog, '동대문').map((s) => s.name);
    expect(names[0]).toBe('동대문');
    expect(names).toContain('동대문역사문화공원');
  });

  it('returns nothing for empty or regex-looking input', () => {
    expect(searchStations(stationCatalog, '')).toEqual([]);
    expect(searchStations(stationCatalog, '(')).toEqual([]);
  });

  it('respects the limit', () => {
    expect(searchStations(stationCatalog, '동', 2)).toHaveLength(2);
  });
});
