import { describe, expect, it } from 'vitest';
import { stationCatalog, subwayGraph } from '@/data/subway';
import { buildSubwayGraph } from './graph';
import { calculateMidpoint } from './midpoint';
import type { LineSegment, RawStation } from './types';

describe('calculateMidpoint (synthetic line)', () => {
  // 등간격 5개 역: p0 - p1 - p2 - p3 - p4
  const stations: RawStation[] = [0, 1, 2, 3, 4].map((i) => ({
    id: `p${i}`,
    name: `P${i}`,
    lineId: '1',
    latitude: 37.5 + i * 0.01,
    longitude: 127,
  }));
  const segments: LineSegment[] = [{ lineId: '1', stationIds: stations.map((s) => s.id) }];
  const graph = buildSubwayGraph(stations, segments);

  it('picks the geometric middle for two endpoints', () => {
    const result = calculateMidpoint(graph, ['p0', 'p4']);
    expect(result?.best.name).toBe('P2');
    expect(result?.best.legs).toHaveLength(2);
    expect(result?.best.legs[0].minutes).toBeCloseTo(result!.best.legs[1].minutes, 5);
  });

  it('never returns one of the departure stations', () => {
    const result = calculateMidpoint(graph, ['p0', 'p1']);
    expect(result?.best.name).not.toBe('P0');
    expect(result?.best.name).not.toBe('P1');
  });

  it('returns null for fewer than two distinct starts', () => {
    expect(calculateMidpoint(graph, ['p0'])).toBeNull();
    expect(calculateMidpoint(graph, ['p0', 'p0'])).toBeNull();
    expect(calculateMidpoint(graph, ['p0', 'unknown'])).toBeNull();
    expect(calculateMidpoint(graph, [[], ['p4']])).toBeNull();
  });

  it('limits candidates to topN and keeps them sorted', () => {
    const result = calculateMidpoint(graph, ['p0', 'p4'], { topN: 2 });
    expect(result?.candidates).toHaveLength(2);
    expect(result?.candidates[0].maxMinutes).toBeLessThanOrEqual(result!.candidates[1].maxMinutes);
  });
});

describe('calculateMidpoint (real dataset)', () => {
  const nodeOf = (name: string) => stationCatalog.byKey[name].nodeIds[0];
  const nodesOf = (name: string) => stationCatalog.byKey[name].nodeIds;

  it('does not charge a transfer when departing from a transfer station', () => {
    // 종로3가(1·3·5호선)에서 경복궁(3호선)으로: 노드 묶음으로 출발하면 3호선 노드에서 바로 출발한다
    const result = calculateMidpoint(subwayGraph, [nodesOf('종로3가'), nodesOf('고속터미널')]);
    const leg = result!.best.legs.find((l) => l.index === 0)!;
    expect(subwayGraph.nodes[leg.fromId].name).toBe('종로3가');
    const single = calculateMidpoint(subwayGraph, [nodeOf('종로3가'), nodeOf('고속터미널')]);
    expect(result!.best.maxMinutes).toBeLessThanOrEqual(single!.best.maxMinutes);
  });

  it('finds a reachable midpoint for 강남 and 홍대입구 on line 2', () => {
    const result = calculateMidpoint(subwayGraph, [nodeOf('강남'), nodeOf('홍대입구')]);
    expect(result).not.toBeNull();
    expect(result!.best.legs.every((l) => Number.isFinite(l.minutes))).toBe(true);
  });

  it('treats a transfer station as one candidate and counts transfers', () => {
    // 의정부(1호선) ↔ 고속터미널(3·7·9호선): 도심 환승역이 후보가 된다
    const result = calculateMidpoint(subwayGraph, [nodeOf('의정부'), nodeOf('고속터미널')]);
    expect(result).not.toBeNull();
    const names = result!.candidates.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    expect(result!.best.legs.some((l) => l.transfers >= 1)).toBe(true);
  });

  it('routes 의정부 → 천안 through 구로 instead of a phantom direct edge', () => {
    const result = calculateMidpoint(subwayGraph, [nodeOf('의정부'), nodeOf('천안')]);
    const leg = result!.best.legs.find((l) => l.fromId === nodeOf('의정부'))!;
    // 예전 데이터는 의정부↔가산디지털단지가 직결돼 있었다. 지금은 반드시 구로를 거친다
    const i = leg.nodeIds.indexOf('l1_가산디지털단지');
    expect(i).toBeGreaterThan(0);
    expect(leg.nodeIds[i - 1]).toBe('l1_구로');
    expect(leg.nodeIds).toContain('l1_의정부');
  });
});
