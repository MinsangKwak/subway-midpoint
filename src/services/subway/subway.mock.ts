// src/services/subway/subway.mock.ts
//
// 이 파일은 "수도권 지하철 노선과 역에 대한 mock 데이터"를 정의한다.
// 실제 API가 없거나 초기 개발 단계에서
// - 검색
// - 그래프 생성
// - 경로 계산
// - 중간지점 산출
// 을 검증하기 위해 사용된다.
//
// 매우 중요한 점:
// - 이 데이터의 "순서"와 "id 규칙"이 그래프 정확도에 직접적인 영향을 준다
// - 아무 생각 없이 수정하면 경로 계산이 깨질 수 있다

import type { RawSubwayStation, SubwayLine } from './subway.types';

// 지하철 노선 mock 데이터
//
// 노선의 메타 정보이며
// - UI에서 노선 이름/색상 표시
// - 향후 API 연동 시 기준 테이블 역할
// 을 한다
export const subwayLines: SubwayLine[] = [
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

// 지하철역 mock 데이터 (RawSubwayStation 형태)
//
// 이 데이터는 "그래프 생성의 원본 데이터"다.
// 즉, buildSubwayGraph 함수는 이 배열을 그대로 입력으로 받는다.
//
// 반드시 지켜야 할 규칙:
// 1. 같은 노선(lineId)의 역들은 실제 운행 순서대로 정렬되어 있어야 한다
//    → 그래프에서 인접 역 연결을 이 순서로 생성하기 때문
// 2. 환승역은 노선별로 다른 id를 가져야 한다
//    → 같은 이름이라도 노선이 다르면 다른 노드로 취급
// 3. 환승 연결은 이름(name) 기준으로 자동 생성된다
export const subwayStations: RawSubwayStation[] = [
  // =========================
  // 1호선 (서울 핵심 구간)
  // =========================
  { id: 'seoul_1', name: '서울역', lineId: '1', latitude: 37.5563, longitude: 126.9723 },
  { id: 'cityhall_1', name: '시청', lineId: '1', latitude: 37.5657, longitude: 126.9769 },
  { id: 'jonggak', name: '종각', lineId: '1', latitude: 37.5704, longitude: 126.9826 },
  { id: 'jongno3_1', name: '종로3가', lineId: '1', latitude: 37.5716, longitude: 126.9918 },
  { id: 'jongno5', name: '종로5가', lineId: '1', latitude: 37.5709, longitude: 127.0016 },
  { id: 'dongdaemun_1', name: '동대문', lineId: '1', latitude: 37.5714, longitude: 127.0090 },
  { id: 'sinseol_1', name: '신설동', lineId: '1', latitude: 37.5760, longitude: 127.0257 },

  // =========================
  // 2호선 (순환선)
  //
  // 주의:
  // 실제 2호선은 순환선이지만,
  // 현재 mock에서는 "일부 구간만 선형으로" 표현한다
  // =========================
  { id: 'cityhall_2', name: '시청', lineId: '2', latitude: 37.5647, longitude: 126.9771 },
  { id: 'euljiro3', name: '을지로3가', lineId: '2', latitude: 37.5663, longitude: 126.9923 },
  { id: 'dongdaemunHist', name: '동대문역사문화공원', lineId: '2', latitude: 37.5651, longitude: 127.0091 },
  { id: 'wangsimni_2', name: '왕십리', lineId: '2', latitude: 37.5615, longitude: 127.0370 },
  { id: 'seolleung', name: '선릉', lineId: '2', latitude: 37.5045, longitude: 127.0489 },
  { id: 'gangnam', name: '강남', lineId: '2', latitude: 37.4979, longitude: 127.0276 },
  { id: 'sadang_2', name: '사당', lineId: '2', latitude: 37.4766, longitude: 126.9816 },
  { id: 'sindorim', name: '신도림', lineId: '2', latitude: 37.5090, longitude: 126.8912 },
  { id: 'hongdae', name: '홍대입구', lineId: '2', latitude: 37.5572, longitude: 126.9245 },

  // =========================
  // 3호선
  // =========================
  { id: 'gyeongbokgung', name: '경복궁', lineId: '3', latitude: 37.5759, longitude: 126.9736 },
  { id: 'jongno3_3', name: '종로3가', lineId: '3', latitude: 37.5716, longitude: 126.9918 },
  { id: 'euljiro3_3', name: '을지로3가', lineId: '3', latitude: 37.5663, longitude: 126.9923 },
  { id: 'chungmuro_3', name: '충무로', lineId: '3', latitude: 37.5612, longitude: 126.9946 },
  { id: 'expressBus_3', name: '고속터미널', lineId: '3', latitude: 37.5048, longitude: 127.0049 },

  // =========================
  // 4호선
  // =========================
  { id: 'seoul_4', name: '서울역', lineId: '4', latitude: 37.5563, longitude: 126.9723 },
  { id: 'sookmyung', name: '숙대입구', lineId: '4', latitude: 37.5446, longitude: 126.9723 },
  { id: 'samgakji_4', name: '삼각지', lineId: '4', latitude: 37.5346, longitude: 126.9726 },
  { id: 'dongjak_4', name: '동작', lineId: '4', latitude: 37.5029, longitude: 126.9803 },
  { id: 'sadang_4', name: '사당', lineId: '4', latitude: 37.4766, longitude: 126.9816 },

  // =========================
  // 5호선
  // =========================
  { id: 'gwanghwamun_5', name: '광화문', lineId: '5', latitude: 37.5716, longitude: 126.9769 },
  { id: 'jongno3_5', name: '종로3가', lineId: '5', latitude: 37.5716, longitude: 126.9918 },
  { id: 'dongdaemunHist_5', name: '동대문역사문화공원', lineId: '5', latitude: 37.5651, longitude: 127.0091 },
  { id: 'wangsimni_5', name: '왕십리', lineId: '5', latitude: 37.5615, longitude: 127.0370 },

  // =========================
  // 6호선
  // =========================
  { id: 'itaewon_6', name: '이태원', lineId: '6', latitude: 37.5345, longitude: 126.9946 },
  { id: 'samgakji_6', name: '삼각지', lineId: '6', latitude: 37.5346, longitude: 126.9726 },
  { id: 'hyochang_6', name: '효창공원앞', lineId: '6', latitude: 37.5392, longitude: 126.9610 },

  // =========================
  // 7호선
  // =========================
  { id: 'expressBus_7', name: '고속터미널', lineId: '7', latitude: 37.5048, longitude: 127.0049 },
  { id: 'konkuk_7', name: '건대입구', lineId: '7', latitude: 37.5404, longitude: 127.0692 },

  // =========================
  // 8호선
  // =========================
  { id: 'jamsil_8', name: '잠실', lineId: '8', latitude: 37.5133, longitude: 127.1000 },
  { id: 'seongnae_8', name: '성내', lineId: '8', latitude: 37.4935, longitude: 127.1225 },

  // =========================
  // 9호선
  // =========================
  { id: 'dangsan_9', name: '당산', lineId: '9', latitude: 37.5338, longitude: 126.9020 },
  { id: 'yeouido_9', name: '여의도', lineId: '9', latitude: 37.5216, longitude: 126.9244 },
  { id: 'expressBus_9', name: '고속터미널', lineId: '9', latitude: 37.5048, longitude: 127.0049 },
];

// 이 mock 데이터는 다음 로직에서 사용된다.
//
// - searchSubwayStations (검색 / 자동완성)
// - buildSubwayGraph (그래프 생성)
// - dijkstra / midpoint (경로 계산)
//
// 따라서 이 파일은 "단순한 더미 데이터"가 아니라
// 전체 로직의 정확도를 좌우하는 핵심 입력 데이터다.
