import { describe, expect, it } from 'vitest';
import { dijkstra, restorePath } from './dijkstra';
import type { SubwayGraph } from './graph';

// 소요시간을 직접 지정한 작은 그래프
//   a -1- b -1- c
//   a ------5-- c
const graph: SubwayGraph = {
  nodes: {
    a: { id: 'a', name: 'a', lineId: '1', latitude: 0, longitude: 0 },
    b: { id: 'b', name: 'b', lineId: '1', latitude: 0, longitude: 0 },
    c: { id: 'c', name: 'c', lineId: '1', latitude: 0, longitude: 0 },
    z: { id: 'z', name: 'z', lineId: '9', latitude: 0, longitude: 0 },
  },
  adj: {
    a: [
      { to: 'b', minutes: 1, kind: 'LINE' },
      { to: 'c', minutes: 5, kind: 'LINE' },
    ],
    b: [
      { to: 'a', minutes: 1, kind: 'LINE' },
      { to: 'c', minutes: 1, kind: 'LINE' },
    ],
    c: [
      { to: 'b', minutes: 1, kind: 'LINE' },
      { to: 'a', minutes: 5, kind: 'LINE' },
    ],
    z: [],
  },
  nodesByName: { a: ['a'], b: ['b'], c: ['c'], z: ['z'] },
};

describe('dijkstra', () => {
  it('prefers the cheaper multi-hop route over a direct expensive edge', () => {
    const { dist, prev } = dijkstra(graph, 'a');
    expect(dist.c).toBe(2);
    expect(restorePath(prev, 'a', 'c')).toEqual(['a', 'b', 'c']);
  });

  it('marks unreachable nodes as Infinity and returns an empty path', () => {
    const { dist, prev } = dijkstra(graph, 'a');
    expect(dist.z).toBe(Infinity);
    expect(restorePath(prev, 'a', 'z')).toEqual([]);
  });

  it('accepts several start nodes at distance zero', () => {
    const { dist, prev } = dijkstra(graph, ['a', 'c']);
    expect(dist.a).toBe(0);
    expect(dist.c).toBe(0);
    expect(dist.b).toBe(1);
    expect(restorePath(prev, ['a', 'c'], 'b')).toHaveLength(2);
  });

  it('handles an unknown start id without throwing', () => {
    const { dist } = dijkstra(graph, 'nope');
    expect(dist.a).toBe(Infinity);
  });
});
