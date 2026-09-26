import type { SubwayLine } from '@/domain/subway/types';

// 서울교통공사 노선 상징색
export const SUBWAY_LINES: SubwayLine[] = [
  { id: '1', name: '1호선', color: '#0052A4' },
  { id: '2', name: '2호선', color: '#00A84D' },
  { id: '3', name: '3호선', color: '#EF7C1C' },
  { id: '4', name: '4호선', color: '#00A5DE' },
  { id: '5', name: '5호선', color: '#996CAC' },
  { id: '6', name: '6호선', color: '#CD7C2F' },
  { id: '7', name: '7호선', color: '#747F00' },
  { id: '8', name: '8호선', color: '#E6186C' },
  { id: '9', name: '9호선', color: '#BDB092' },
];

export const lineById = new Map(SUBWAY_LINES.map((line) => [line.id, line]));
