import type { SubwayGraph } from './graph';

export type DijkstraResult = {
  // 출발 노드에서 각 노드까지의 최소 소요시간(분). 도달 불가면 Infinity
  dist: Record<string, number>;
  // 최단 경로에서 바로 직전 노드
  prev: Record<string, string | null>;
};

// 최소 힙. 노드 수가 늘어도 O((V+E) log V)를 유지하려고 직접 구현한다.
class MinHeap {
  private items: { id: string; cost: number }[] = [];

  get size() {
    return this.items.length;
  }

  push(id: string, cost: number) {
    this.items.push({ id, cost });
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[parent].cost <= this.items[i].cost) break;
      [this.items[parent], this.items[i]] = [this.items[i], this.items[parent]];
      i = parent;
    }
  }

  pop() {
    const top = this.items[0];
    const last = this.items.pop();
    if (last && this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < this.items.length && this.items[l].cost < this.items[m].cost) m = l;
        if (r < this.items.length && this.items[r].cost < this.items[m].cost) m = r;
        if (m === i) break;
        [this.items[m], this.items[i]] = [this.items[i], this.items[m]];
        i = m;
      }
    }
    return top;
  }
}

// 출발점은 하나 또는 여러 노드다. 환승역에서 출발하면 그 역의 모든 노선 노드가
// 동시에 출발점이 되어 첫 환승 비용을 물지 않는다.
export const dijkstra = (graph: SubwayGraph, start: string | string[]): DijkstraResult => {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};

  for (const id of Object.keys(graph.nodes)) {
    dist[id] = Infinity;
    prev[id] = null;
  }

  const heap = new MinHeap();
  for (const id of Array.isArray(start) ? start : [start]) {
    if (!(id in dist)) continue;
    dist[id] = 0;
    heap.push(id, 0);
  }

  while (heap.size > 0) {
    const { id, cost } = heap.pop()!;
    // 더 짧은 경로로 이미 확정된 노드의 오래된 항목은 건너뛴다
    if (cost > dist[id]) continue;

    for (const edge of graph.adj[id] ?? []) {
      const alt = cost + edge.minutes;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = id;
        heap.push(edge.to, alt);
      }
    }
  }

  return { dist, prev };
};

// prev 맵으로 출발점 → end 노드 id 경로를 복원한다. 연결이 없으면 빈 배열.
export const restorePath = (
  prev: Record<string, string | null>,
  start: string | string[],
  endId: string,
): string[] => {
  const starts = new Set(Array.isArray(start) ? start : [start]);
  const path: string[] = [];
  let cur: string | null = endId;
  while (cur) {
    path.unshift(cur);
    if (starts.has(cur)) return path;
    cur = prev[cur] ?? null;
  }
  return [];
};
