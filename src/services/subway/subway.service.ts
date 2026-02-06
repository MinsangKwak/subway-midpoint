// src/services/subway/subway.service.ts
//
// 이 파일은 "지하철 도메인의 서비스 레이어" 역할을 한다.
// UI 컴포넌트가 직접 mock 데이터나 raw 데이터를 건드리지 않도록
// 중간에서 데이터를 가공해서 제공하는 역할을 담당한다.
//
// 핵심 책임은 다음과 같다.
// 1. 지하철역 검색 기능 제공
// 2. RawSubwayStation(mock / API 원본 형태)을
//    SubwayStation(UI / 지도용 형태)으로 변환
// 3. 환승역 여부 판단 및 호선 색상 정보 구성 (중요)
//
// 주의:
// - 이 파일에는 그래프 계산, 경로 탐색 로직이 없다
// - 순수하게 "데이터 조회 + 가공"만 담당한다

import { subwayStations, subwayLines } from './subway.mock';
import type { RawSubwayStation, SubwayStation } from './subway.types';

// 지하철역 검색 함수
export const searchSubwayStations = (keyword: string): SubwayStation[] => {
  // 입력값 정리
  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) return [];

  // 사용자가 "강남역"처럼 입력하는 경우가 많아 "역" 제거
  const normalizedKeyword = trimmedKeyword.replace('역', '');

  // 1️⃣ 이름 기준으로 후보 역 필터링
  const matchedStations = subwayStations.filter((station) =>
    station.name.includes(normalizedKeyword)
  );

  // 2️⃣ 같은 이름을 가진 역들을 묶어서 환승 여부 판단
  const stationMap = new Map<string, RawSubwayStation[]>();

  matchedStations.forEach((station) => {
    const list = stationMap.get(station.name) ?? [];
    list.push(station);
    stationMap.set(station.name, list);
  });

  // 3️⃣ UI에서 사용할 SubwayStation 형태로 변환
  const result: SubwayStation[] = [];

  stationMap.forEach((stationsWithSameName) => {
    // 이 역이 속한 모든 노선 ID (중복 제거)
    const lineIds = Array.from(
      new Set(stationsWithSameName.map((s) => s.lineId))
    );

    // 노선 ID → 노선 색상 매핑
    // 단일역: ['#00A84D']
    // 환승역: ['#0052A4', '#00A84D']
    const colors = lineIds
      .map(
        (lineId) =>
          subwayLines.find((line) => line.id === lineId)?.color
      )
      .filter((color): color is string => Boolean(color));

    // 기준 좌표는 첫 번째 역 사용
    const base = stationsWithSameName[0];

    result.push({
      id: base.id, // 대표 ID (그래프는 Raw 기준으로 관리)
      name: base.name,

      lineIds,
      latitude: base.latitude,
      longitude: base.longitude,

      color: colors, // 2026-02-06 타입 정의에 맞게 'color'로 통일
    });
  });

  return result;
};
