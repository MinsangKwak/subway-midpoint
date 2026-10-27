import type { SubwayLine } from '@/domain/subway/types';

// 서울교통공사·코레일·운영사 노선 상징색. 숫자 노선은 번호 원, 나머지는 짧은 이름 배지로 표시한다
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
  { id: '경의중앙', name: '경의중앙선', color: '#77C4A3', badge: '경의' },
  { id: '공항철도', name: '공항철도', color: '#0090D2', badge: '공항' },
  { id: '수인분당', name: '수인분당선', color: '#F5A200', badge: '수인' },
  { id: '신분당', name: '신분당선', color: '#D4003B', badge: '신분당' },
];

export const lineById = new Map(SUBWAY_LINES.map((line) => [line.id, line]));

// 노선 id 목록을 화면용 이름·배지 정보로 바꾼다. 모르는 id 는 그대로 보여준다
export const linesOf = (lineIds: string[]): SubwayLine[] =>
  lineIds.map((id) => lineById.get(id) ?? { id, name: id, color: '#9ca3af' });
