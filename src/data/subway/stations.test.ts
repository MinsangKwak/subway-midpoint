import { describe, expect, it } from 'vitest';
import { stationCatalog, subwayGraph } from '@/data/subway';
import { LINE_SEGMENTS, RAW_STATIONS } from './stations';

// 생성된 데이터가 실제 노선 구조와 맞는지 확인한다. 스크립트를 다시 돌린 뒤 여기서 깨지면 OSM 데이터가 바뀐 것이다.
describe('generated station data', () => {
  it('covers lines 1 to 9', () => {
    const lines = new Set(RAW_STATIONS.map((s) => s.lineId));
    expect(Array.from(lines).sort()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
  });

  it('has no duplicate station per line and no annotation left in names', () => {
    const seen = new Set<string>();
    for (const s of RAW_STATIONS) {
      const key = `${s.lineId}:${s.name}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
      expect(s.name).not.toMatch(/[()（）]/);
    }
  });

  it('keeps every segment inside the map bbox and referencing known stations', () => {
    const ids = new Set(RAW_STATIONS.map((s) => s.id));
    for (const seg of LINE_SEGMENTS) {
      expect(seg.stationIds.length).toBeGreaterThanOrEqual(2);
      for (const id of seg.stationIds) expect(ids.has(id), id).toBe(true);
    }
    for (const s of RAW_STATIONS) {
      expect(s.latitude).toBeGreaterThan(36.5);
      expect(s.latitude).toBeLessThan(38.3);
      expect(s.longitude).toBeGreaterThan(126.3);
      expect(s.longitude).toBeLessThan(127.8);
    }
  });

  it('ends each line only at real termini', () => {
    // 노선 안에서 이웃이 하나뿐인 역 = 종점. 지선 끝이 아닌 역이 나오면 구간 데이터가 끊긴 것이다
    const expected: Record<string, string[]> = {
      '1': ['광명', '서동탄', '신창', '연천', '인천'],
      '2': ['까치산', '신설동'],
      '3': ['대화', '오금'],
      '4': ['오이도', '진접'],
      '5': ['마천', '방화', '하남검단산'],
      '6': ['신내'],
      '7': ['석남', '장암'],
      '8': ['모란', '별내'],
      '9': ['개화', '중앙보훈병원'],
    };
    for (const [lineId, termini] of Object.entries(expected)) {
      const ends = RAW_STATIONS.filter(
        (s) =>
          s.lineId === lineId &&
          (subwayGraph.adj[s.id] ?? []).filter((e) => e.kind === 'LINE').length <= 1,
      )
        .map((s) => s.name)
        .sort((a, b) => a.localeCompare(b, 'ko'));
      expect(ends, `${lineId}호선`).toEqual(termini);
    }
  });

  it('merges well-known transfer stations', () => {
    expect(stationCatalog.byKey['종로3가'].lineIds).toEqual(['1', '3', '5']);
    expect(stationCatalog.byKey['고속터미널'].lineIds).toEqual(['3', '7', '9']);
    expect(stationCatalog.byKey['왕십리'].lineIds).toEqual(['2', '5']);
    expect(stationCatalog.byKey['이수'].lineIds).toEqual(['4', '7']);
    expect(stationCatalog.byKey['이수'].aliases).toContain('총신대입구');
    expect(Object.values(stationCatalog.byKey).filter((s) => s.lineIds.length > 1).length).toBeGreaterThan(40);
  });
});
