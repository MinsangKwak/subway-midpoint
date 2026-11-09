import { describe, expect, it } from 'vitest';
import { stationCatalog, subwayGraph } from '@/data/subway';
import { buildSubwayGraph, TRANSFER_MINUTES, type SubwayGraph } from './graph';
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

  it('restores a full path for every returned candidate', () => {
    const result = calculateMidpoint(graph, ['p0', 'p4'], { topN: 3 });
    for (const c of result!.candidates) {
      expect(c.legs).toHaveLength(2);
      for (const leg of c.legs) {
        expect(leg.nodeIds[0]).toBe(leg.fromId);
        expect(leg.nodeIds[leg.nodeIds.length - 1]).toBe(leg.toId);
        expect(leg.points).toHaveLength(leg.nodeIds.length);
      }
    }
  });

  it('breaks a max-time tie by Korean name order', () => {
    // p0·p4 에서 P1 과 P3 는 최대 3구간·합계 4구간으로 같다. 그러면 이름순으로 P1 이 앞선다
    const result = calculateMidpoint(graph, ['p0', 'p4'], { topN: 3 });
    expect(result!.candidates.map((c) => c.name)).toEqual(['P2', 'P1', 'P3']);
    expect(result!.candidates[1].maxMinutes).toBe(result!.candidates[2].maxMinutes);
    expect(result!.candidates[1].totalMinutes).toBe(result!.candidates[2].totalMinutes);
  });
});

describe('calculateMidpoint (ranking rule)', () => {
  // 소요시간을 직접 지정한 그래프. 출발지 s1·s2 와 후보 X·Y·Z
  //   X: 10/10 (max 10, 합 20)   Y: 10/8 (max 10, 합 18)   Z: 8/10 (max 10, 합 18)
  const node = (id: string, name: string) => ({ id, name, lineId: '1', latitude: 0, longitude: 0 });
  const graph: SubwayGraph = {
    nodes: { s1: node('s1', 'S1'), s2: node('s2', 'S2'), x: node('x', 'X'), y: node('y', 'Y'), z: node('z', 'Z') },
    adj: {
      s1: [
        { to: 'x', minutes: 10, kind: 'LINE' },
        { to: 'y', minutes: 10, kind: 'LINE' },
        { to: 'z', minutes: 8, kind: 'LINE' },
      ],
      s2: [
        { to: 'x', minutes: 10, kind: 'LINE' },
        { to: 'y', minutes: 8, kind: 'LINE' },
        { to: 'z', minutes: 10, kind: 'LINE' },
      ],
      x: [
        { to: 's1', minutes: 10, kind: 'LINE' },
        { to: 's2', minutes: 10, kind: 'LINE' },
      ],
      y: [
        { to: 's1', minutes: 10, kind: 'LINE' },
        { to: 's2', minutes: 8, kind: 'LINE' },
      ],
      z: [
        { to: 's1', minutes: 8, kind: 'LINE' },
        { to: 's2', minutes: 10, kind: 'LINE' },
      ],
    },
    nodesByName: { S1: ['s1'], S2: ['s2'], X: ['x'], Y: ['y'], Z: ['z'] },
  };

  it('orders by max, then total, then name', () => {
    const result = calculateMidpoint(graph, ['s1', 's2']);
    expect(result!.candidates.map((c) => c.name)).toEqual(['Y', 'Z', 'X']);
    expect(result!.best.maxMinutes).toBe(10);
    expect(result!.best.totalMinutes).toBe(18);
  });

  it('ignores a candidate that only one start can reach', () => {
    // s1 → w 만 잇고 x·y·z → s1 간선을 빼면 s2 는 w 에 닿지 못한다. 그러면 w 는 아무리 가까워도 후보에서 빠진다
    const withoutBack = (id: string) => graph.adj[id].filter((e) => e.to !== 's1');
    const partial: SubwayGraph = {
      nodes: { ...graph.nodes, w: node('w', 'W') },
      adj: {
        ...graph.adj,
        s1: [...graph.adj.s1, { to: 'w', minutes: 1, kind: 'LINE' }],
        x: withoutBack('x'),
        y: withoutBack('y'),
        z: withoutBack('z'),
        w: [],
      },
      nodesByName: { ...graph.nodesByName, W: ['w'] },
    };
    const result = calculateMidpoint(partial, ['s1', 's2'], { topN: 10 });
    expect(result!.candidates.map((c) => c.name)).toEqual(['Y', 'Z', 'X']);
  });
});

describe('calculateMidpoint (transfer penalty)', () => {
  // 1호선 a-b-c, 2호선 b-d. B 는 두 노선의 환승역이다
  const stations: RawStation[] = [
    { id: 'a1', name: 'A', lineId: '1', latitude: 37.5, longitude: 127.0 },
    { id: 'b1', name: 'B', lineId: '1', latitude: 37.51, longitude: 127.0 },
    { id: 'c1', name: 'C', lineId: '1', latitude: 37.52, longitude: 127.0 },
    { id: 'b2', name: 'B', lineId: '2', latitude: 37.51, longitude: 127.0 },
    { id: 'd2', name: 'D', lineId: '2', latitude: 37.51, longitude: 127.02 },
  ];
  const segments: LineSegment[] = [
    { lineId: '1', stationIds: ['a1', 'b1', 'c1'] },
    { lineId: '2', stationIds: ['b2', 'd2'] },
  ];
  const graph = buildSubwayGraph(stations, segments);
  const minutesOf = (from: string, to: string) => graph.adj[from].find((e) => e.to === to)!.minutes;

  it('adds TRANSFER_MINUTES once per line change and counts it in leg.transfers', () => {
    const result = calculateMidpoint(graph, ['a1', 'd2'], { topN: 5 });
    const c = result!.candidates.find((x) => x.name === 'C')!;
    const fromD = c.legs.find((l) => l.index === 1)!;
    expect(fromD.transfers).toBe(1);
    expect(fromD.nodeIds).toEqual(['d2', 'b2', 'b1', 'c1']);
    expect(fromD.minutes).toBeCloseTo(minutesOf('d2', 'b2') + TRANSFER_MINUTES + minutesOf('b1', 'c1'), 10);
  });

  it('arrives at a transfer station without paying the transfer', () => {
    const result = calculateMidpoint(graph, ['a1', 'd2']);
    expect(result!.best.name).toBe('B');
    expect(result!.best.lineIds).toEqual(['1', '2']);
    for (const leg of result!.best.legs) expect(leg.transfers).toBe(0);
    expect(result!.best.maxMinutes).toBeCloseTo(Math.max(minutesOf('a1', 'b1'), minutesOf('d2', 'b2')), 10);
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

  it('shows the short display name and every line for an aliased transfer station', () => {
    // 4호선 총신대입구와 7호선 이수는 transferName 으로 묶인 같은 역이다
    const result = calculateMidpoint(subwayGraph, [nodesOf('사당'), nodesOf('내방')], { topN: 10 });
    const isu = result!.candidates.find((c) => c.stationKey === '이수')!;
    expect(isu.name).toBe('이수');
    expect(isu.lineIds).toEqual(['4', '7']);
    expect(stationCatalog.byKey['이수'].name).toBe(isu.name);
  });

  it('excludes an aliased transfer station from candidates when it is a departure', () => {
    const result = calculateMidpoint(subwayGraph, [nodesOf('이수'), nodesOf('강남')], { topN: 50 });
    expect(result!.candidates.some((c) => c.stationKey === '이수')).toBe(false);
    // 같은 역을 두 노선 노드로 각각 넣어도 하나의 출발지로 본다
    const dup = calculateMidpoint(subwayGraph, [nodeOf('이수'), nodesOf('이수')[1]]);
    expect(dup).toBeNull();
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
