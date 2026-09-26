import { buildStationCatalog } from '@/domain/subway/catalog';
import { buildSubwayGraph } from '@/domain/subway/graph';
import { SUBWAY_LINES } from './lines';
import { LINE_SEGMENTS, RAW_STATIONS } from './stations';

// 앱 전체가 공유하는 그래프·카탈로그. 데이터가 정적이므로 모듈 로드 시 한 번만 만든다.
export const subwayGraph = buildSubwayGraph(RAW_STATIONS, LINE_SEGMENTS);
export const stationCatalog = buildStationCatalog(RAW_STATIONS, SUBWAY_LINES);

export { SUBWAY_LINES, lineById } from './lines';
