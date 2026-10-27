import { describe, expect, it } from 'vitest';
import { stationCatalog, subwayGraph, SUBWAY_LINES } from '@/data/subway';
import { haversineKm } from '@/domain/subway/geo';
import { calculateMidpoint } from '@/domain/subway/midpoint';
import { LINE_SEGMENTS, RAW_STATIONS } from './stations';

// 생성된 데이터가 실제 노선 구조와 맞는지 확인한다. 스크립트를 다시 돌린 뒤 여기서 깨지면 OSM 데이터가 바뀐 것이다.
describe('generated station data', () => {
  it('covers every line defined in lines.ts and nothing else', () => {
    const lines = Array.from(new Set(RAW_STATIONS.map((s) => s.lineId))).sort();
    expect(lines).toEqual(SUBWAY_LINES.map((l) => l.id).sort());
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
      경의중앙: ['도라산', '서울역', '지평'],
      수인분당: ['인천', '청량리'],
      신분당: ['광교', '신사'],
      공항철도: ['서울역', '인천공항2터미널'],
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
    expect(stationCatalog.byKey['왕십리'].lineIds).toEqual(['2', '5', '경의중앙', '수인분당']);
    expect(stationCatalog.byKey['서울'].lineIds).toEqual(['1', '4', '경의중앙', '공항철도']);
    expect(stationCatalog.byKey['강남'].lineIds).toEqual(['2', '신분당']);
    expect(stationCatalog.byKey['김포공항'].lineIds).toEqual(['5', '9', '공항철도']);
    expect(stationCatalog.byKey['이수'].lineIds).toEqual(['4', '7']);
    expect(stationCatalog.byKey['이수'].aliases).toContain('총신대입구');
    expect(Object.values(stationCatalog.byKey).filter((s) => s.lineIds.length > 1).length).toBeGreaterThan(60);
  });

  it('keeps same-named stations in different places apart', () => {
    // 2호선 신촌과 경의중앙선 신촌, 5호선 양평과 경의중앙선 양평은 이름만 같은 다른 역이다
    expect(stationCatalog.byKey['신촌'].lineIds).toEqual(['2']);
    expect(stationCatalog.byKey['신촌(경의중앙)'].lineIds).toEqual(['경의중앙']);
    expect(stationCatalog.byKey['신촌(경의중앙)'].name).toBe('신촌');
    expect(stationCatalog.byKey['양평'].lineIds).toEqual(['5']);
    expect(stationCatalog.byKey['양평(경의중앙)'].lineIds).toEqual(['경의중앙']);
  });

  it('never groups nodes further than 800m apart as one transfer station', () => {
    for (const station of stationCatalog.stations) {
      const nodes = station.nodeIds.map((id) => subwayGraph.nodes[id]);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          expect(haversineKm(nodes[i], nodes[j]), `${station.key}: ${nodes[i].id} ↔ ${nodes[j].id}`).toBeLessThan(0.8);
        }
      }
    }
  });

  it('connects the new lines to the rest of the network', () => {
    const nodesOf = (key: string) => stationCatalog.byKey[key].nodeIds;
    // 신분당 판교 ↔ 경의중앙 일산: 두 노선을 모두 거쳐야 하는 조합
    const result = calculateMidpoint(subwayGraph, [nodesOf('판교'), nodesOf('일산')]);
    expect(result).not.toBeNull();
    expect(result!.best.legs.every((l) => Number.isFinite(l.minutes))).toBe(true);
    // 공항철도 검암 ↔ 수인분당 송도
    expect(calculateMidpoint(subwayGraph, [nodesOf('검암'), nodesOf('송도')])).not.toBeNull();
  });
});
