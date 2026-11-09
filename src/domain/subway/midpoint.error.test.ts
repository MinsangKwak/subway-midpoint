import { describe, expect, it, vi } from 'vitest';

// 도달 가능 판정(dist)과 경로 복원(prev)이 어긋나는 상황은 정상 그래프로는 만들 수 없다.
// restorePath 만 빈 배열을 돌려주게 바꿔, 조용히 fromId 가 undefined 인 후보가 나가지 않는지 확인한다
vi.mock('./dijkstra', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./dijkstra')>();
  return { ...actual, restorePath: () => [] };
});

import { buildSubwayGraph } from './graph';
import { calculateMidpoint, PathRestoreError } from './midpoint';
import type { LineSegment, RawStation } from './types';

describe('calculateMidpoint (path restore guard)', () => {
  const stations: RawStation[] = [0, 1, 2].map((i) => ({
    id: `p${i}`,
    name: `P${i}`,
    lineId: '1',
    latitude: 37.5 + i * 0.01,
    longitude: 127,
  }));
  const segments: LineSegment[] = [{ lineId: '1', stationIds: stations.map((s) => s.id) }];
  const graph = buildSubwayGraph(stations, segments);

  it('throws PathRestoreError instead of returning a leg without a path', () => {
    expect(() => calculateMidpoint(graph, ['p0', 'p2'])).toThrow(PathRestoreError);
    expect(() => calculateMidpoint(graph, ['p0', 'p2'])).toThrow(/\[p0\] → p1/);
  });
});
