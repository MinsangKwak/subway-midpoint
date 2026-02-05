// src/services/subway/subway.mock.ts
import type { RawSubwayStation, SubwayLine } from './subway.types';

/**
 * 지하철 노선 mock 데이터
 */
export const subwayLines: SubwayLine[] = [
  { id: '1', name: '1호선', color: '#0052A4' },
  { id: '2', name: '2호선', color: '#00A84D' },
  { id: '4', name: '4호선', color: '#00A5DE' },
];

/**
 * 지하철역 mock 데이터 (원본 형태)
 * - API 응답을 가정한 구조
 * - service에서 UI용으로 변환해서 사용
 */
export const subwayStations: RawSubwayStation[] = [
  /* =========================
   * 1호선 (서울 핵심 구간)
   * ========================= */
  { id: 'seoul', name: '서울역', lineId: '1', latitude: 37.5563, longitude: 126.9723 },
  { id: 'cityhall_1', name: '시청', lineId: '1', latitude: 37.5657, longitude: 126.9769 },
  { id: 'jonggak', name: '종각', lineId: '1', latitude: 37.5704, longitude: 126.9826 },
  { id: 'jongno3', name: '종로3가', lineId: '1', latitude: 37.5716, longitude: 126.9918 },
  { id: 'jongno5', name: '종로5가', lineId: '1', latitude: 37.5709, longitude: 127.0016 },
  { id: 'dongdaemun_1', name: '동대문', lineId: '1', latitude: 37.5714, longitude: 127.0090 },
  { id: 'sinseol_1', name: '신설동', lineId: '1', latitude: 37.5760, longitude: 127.0257 },

  /* =========================
   * 2호선 (순환선 – 이전과 동일)
   * ========================= */
  { id: 'gangnam', name: '강남', lineId: '2', latitude: 37.4979, longitude: 127.0276 },
  { id: 'jamsil', name: '잠실', lineId: '2', latitude: 37.5133, longitude: 127.1000 },
  { id: 'hongdae', name: '홍대입구', lineId: '2', latitude: 37.5572, longitude: 126.9245 },
  { id: 'seolleung', name: '선릉', lineId: '2', latitude: 37.5045, longitude: 127.0489 },
  { id: 'sindorim', name: '신도림', lineId: '2', latitude: 37.5090, longitude: 126.8912 },
  { id: 'cityhall_2', name: '시청', lineId: '2', latitude: 37.5647, longitude: 126.9771 },

  /* =========================
   * 4호선 (서울 핵심 구간)
   * ========================= */
  { id: 'sookmyung', name: '숙대입구', lineId: '4', latitude: 37.5446, longitude: 126.9723 },
  { id: 'samgakji', name: '삼각지', lineId: '4', latitude: 37.5346, longitude: 126.9726 },
  { id: 'sinyongsan', name: '신용산', lineId: '4', latitude: 37.5292, longitude: 126.9679 },
  { id: 'ichon', name: '이촌', lineId: '4', latitude: 37.5224, longitude: 126.9737 },
  { id: 'dongjak', name: '동작', lineId: '4', latitude: 37.5029, longitude: 126.9803 },
  { id: 'sadang_4', name: '사당', lineId: '4', latitude: 37.4766, longitude: 126.9816 },
  { id: 'seoulNatUniv4', name: '서울대입구', lineId: '4', latitude: 37.4812, longitude: 126.9527 },
  { id: 'sillim4', name: '신림', lineId: '4', latitude: 37.4844, longitude: 126.9297 },
];
