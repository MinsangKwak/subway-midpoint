import { describe, expect, it } from 'vitest';
import { buildSubwayGraph, TRANSFER_MINUTES } from './graph';
import type { LineSegment, RawStation } from './types';

const stations: RawStation[] = [
  { id: 'a1', name: 'A', lineId: '1', latitude: 37.5, longitude: 127.0 },
  { id: 'b1', name: 'B', lineId: '1', latitude: 37.51, longitude: 127.0 },
  { id: 'c1', name: 'C', lineId: '1', latitude: 37.52, longitude: 127.0 },
  { id: 'b2', name: 'B', lineId: '2', latitude: 37.51, longitude: 127.0 },
  { id: 'd2', name: 'D', lineId: '2', latitude: 37.51, longitude: 127.02 },
  { id: 'e2', name: 'E', lineId: '2', latitude: 37.52, longitude: 127.02 },
];

const segments: LineSegment[] = [
  { lineId: '1', stationIds: ['a1', 'b1', 'c1'] },
  { lineId: '2', stationIds: ['b2', 'd2', 'e2'], loop: true },
];

describe('buildSubwayGraph', () => {
  const graph = buildSubwayGraph(stations, segments);

  it('connects neighbouring stations in both directions', () => {
    expect(graph.adj.a1.map((e) => e.to)).toEqual(['b1']);
    expect(graph.adj.b1.map((e) => e.to)).toContain('a1');
    expect(graph.adj.b1.map((e) => e.to)).toContain('c1');
  });

  it('closes a loop segment', () => {
    expect(graph.adj.e2.map((e) => e.to)).toContain('b2');
  });

  it('adds transfer edges between same-name nodes of different lines', () => {
    const transfer = graph.adj.b1.find((e) => e.kind === 'TRANSFER');
    expect(transfer?.to).toBe('b2');
    expect(transfer?.minutes).toBe(TRANSFER_MINUTES);
  });

  it('weights line edges by distance', () => {
    const ab = graph.adj.a1.find((e) => e.to === 'b1')!;
    const bd = graph.adj.b2.find((e) => e.to === 'd2')!;
    // a→b는 위도 0.01(약 1.1km), b→d는 경도 0.02(약 1.8km)라 더 오래 걸린다
    expect(bd.minutes).toBeGreaterThan(ab.minutes);
  });

  it('rejects segments that reference stations of another line', () => {
    expect(() =>
      buildSubwayGraph(stations, [{ lineId: '1', stationIds: ['a1', 'd2'] }]),
    ).toThrow(/another line/);
  });

  it('rejects unknown station ids', () => {
    expect(() =>
      buildSubwayGraph(stations, [{ lineId: '1', stationIds: ['a1', 'zz'] }]),
    ).toThrow(/unknown station/);
  });
});
