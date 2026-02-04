// src/services/subway/subway.mock.ts
import type { SubwayLine, SubwayStation } from './subway.types';

export const subwayLines: SubwayLine[] = [
  {
    id: '2',
    name: '2호선',
    color: '#00A84D',
  },
];

export const subwayStations: SubwayStation[] = [
  {
    id: 'gangnam',
    name: '강남',
    lineId: '2',
    latitude: 37.4979,
    longitude: 127.0276,
  },
  {
    id: 'hongdae',
    name: '홍대입구',
    lineId: '2',
    latitude: 37.5572,
    longitude: 126.9245,
  },
  {
    id: 'jamsil',
    name: '잠실',
    lineId: '2',
    latitude: 37.5133,
    longitude: 127.1000,
  },
];
