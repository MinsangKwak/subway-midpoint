import { useEffect, useMemo, useState } from 'react';

import { Layout } from '../ui/Layout';
import { KakaoMap } from '../ui/Map';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { DepartureInputSection } from './DepartureSection';
import { SelectedStationBadgeList } from '../ui/SelectedStationBadgeList';

import type { SubwayStation } from '../services/subway/subway.types';

import { subwayStations } from '../services/subway/subway.mock';
import { buildSubwayGraph } from '../services/subway/subway.graph';
import { calculateMidpoint } from '../services/subway/subway.midpoint';
import { pathToLatLngs } from '../services/subway/subway.path';

// 지도 및 UI 전반에서 사용하는 선택된 출발지 상태 타입
// fieldId: 입력 필드 단위 식별자
// color: 출발지별 경로 색상 유지용
type SelectedStation = {
  fieldId: string;
  id: string;
  name: string;
  lineId: string;
  latitude: number;
  longitude: number;
  color: string;
};

// 출발지별 경로 색상 풀
// 같은 입력 필드(fieldId)를 유지하는 동안 색상을 고정하기 위함
const COLOR_POOL = ['#7C3AED', '#2563EB', '#16A34A', '#DC2626', '#F59E0B'];

const getRandomColor = () =>
  COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];

export const HomePage = () => {
  // 하단 BottomSheet(출발지 입력 영역) 열림 여부
  const [isModalOpen, setIsModalOpen] = useState(true);

  // 출발지 1개만 선택된 상태에서 지도 중심 이동에 사용하는 center
  // 중간지점 계산 이후에는 사용하지 않음
  const [mapCenter, setMapCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // 사용자가 선택한 출발지 목록
  // 이 페이지에서 가장 핵심이 되는 도메인 상태
  const [selectedStations, setSelectedStations] = useState<SelectedStation[]>(
    []
  );

  // 중간장소 찾기 버튼을 눌렀을 때만 지도에 그릴 경로 정보
  const [polylines, setPolylines] = useState<
    { path: { latitude: number; longitude: number }[]; color: string }[]
  >([]);

  // 계산된 중간지점 좌표
  // KakaoMap은 이 값만 보고 마커 이동과 zoom을 처리
  const [midpoint, setMidpoint] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // 중간지점 역 이름
  // 알럿을 “마커 이동 이후”에 띄우기 위한 보조 상태
  const [midpointName, setMidpointName] = useState<string | null>(null);

  // 지하철 그래프는 앱 실행 중 1번만 생성
  // 출발지 변경과 무관하게 재사용
  const graph = useMemo(() => buildSubwayGraph(subwayStations), []);

  // 초기 진입 시 사용자 위치를 지도 중심으로 설정
  // 위치 권한 거부 또는 실패 시 강남역 좌표로 fallback
  useEffect(() => {
    const fallback = () =>
      setMapCenter({
        latitude: 37.4979,
        longitude: 127.0276,
      });

    if (!navigator.geolocation) {
      fallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => fallback()
    );
  }, []);

  // 출발지 선택 처리
  // fieldId 기준으로 기존 출발지를 교체하며
  // 다른 필드에 동일한 역이 이미 선택된 경우 중복 선택 방지
  const handleStationSelect = (fieldId: string, station: SubwayStation) => {
    setSelectedStations((prev) => {
      const duplicated = prev.find(
        (s) => s.id === station.id && s.fieldId !== fieldId
      );
      if (duplicated) return prev;

      const existing = prev.find((s) => s.fieldId === fieldId);
      const color = existing?.color ?? getRandomColor();

      const filtered = prev.filter((s) => s.fieldId !== fieldId);

      return [
        ...filtered,
        {
          fieldId,
          id: station.id,
          name: station.name,
          lineId: station.lineId,
          latitude: station.latitude,
          longitude: station.longitude,
          color,
        },
      ];
    });

    // 출발지 선택 단계로 돌아오면
    // 이전에 계산된 경로와 중간지점은 모두 초기화
    setPolylines([]);
    setMidpoint(null);
    setMidpointName(null);
  };

  // 특정 입력 필드(fieldId)에 해당하는 출발지 제거
  // 제거 시 지도에 표시된 경로와 중간지점도 함께 초기화
  const handleStationRemoveByField = (fieldId: string) => {
    setSelectedStations((prev) =>
      prev.filter((s) => s.fieldId !== fieldId)
    );

    setPolylines([]);
    setMidpoint(null);
    setMidpointName(null);
  };

  // 중간장소 찾기 버튼 클릭 시 실행되는 핵심 로직
  const handleFindMidpoint = () => {
    const startIds = selectedStations.map((s) => s.id);
    if (startIds.length < 2) return;

    const result = calculateMidpoint(graph, startIds);
    const midpointNode = graph.nodes[result.midpointId];
    if (!midpointNode) return;

    // 지도 이동 및 마커 표시를 위한 중간지점 좌표 설정
    setMidpoint({
      latitude: midpointNode.latitude,
      longitude: midpointNode.longitude,
    });

    // 알럿에 사용할 중간지점 역 이름 저장
    // 실제 알럿 호출은 useEffect에서 수행
    setMidpointName(midpointNode.name);

    // 출발지별 경로를 좌표 배열로 변환
    const nextPolylines = selectedStations
      .map((s) => {
        const pathIds = result.paths[s.id] ?? [];
        const pathPoints = pathToLatLngs(graph, pathIds);

        // 경로 끝이 중간지점이 아닐 경우 강제로 연결
        const connectedPath = [...pathPoints];
        const lastPoint = connectedPath[connectedPath.length - 1];

        if (
          !lastPoint ||
          lastPoint.latitude !== midpointNode.latitude ||
          lastPoint.longitude !== midpointNode.longitude
        ) {
          connectedPath.push({
            latitude: midpointNode.latitude,
            longitude: midpointNode.longitude,
          });
        }

        // 예외 상황에서도 최소한 출발지 ↔ 중간지점 직선은 보이도록 보정
        if (connectedPath.length < 2) {
          connectedPath.unshift({
            latitude: s.latitude,
            longitude: s.longitude,
          });
        }

        return {
          path: connectedPath,
          color: s.color,
        };
      })
      .filter((p) => p.path.length >= 2);

    setPolylines(nextPolylines);

    // 중간장소 계산 완료 후 입력용 BottomSheet 닫기
    setIsModalOpen(false);
  };

  // midpoint가 실제로 지도에 반영된 이후 실행되는 effect
  // 마커 이동 및 zoom 처리 이후 알럿을 띄우기 위함
  useEffect(() => {
    if (!midpoint || !midpointName) return;

    alert(`중간지점은 "${midpointName}" 역입니다.`);
  }, [midpoint]);

  return (
    <Layout>
      <KakaoMap
        center={mapCenter ?? undefined}
        stations={selectedStations.map((s) => ({
          id: s.id,
          latitude: s.latitude,
          longitude: s.longitude,
          color: s.color, // 호선 색 전달
        }))}
        polylines={polylines}
        midpoint={midpoint}
      >
        <SelectedStationBadgeList
          stations={selectedStations}
          onSelect={(id) => {
            const target = selectedStations.find((s) => s.id === id);
            if (!target) return;

            setMapCenter({
              latitude: target.latitude,
              longitude: target.longitude,
            });
          }}
          onRemove={(id) => {
            const target = selectedStations.find((s) => s.id === id);
            if (!target) return;
            handleStationRemoveByField(target.fieldId);
          }}
        />
      </KakaoMap>

      <BottomSheetModal
        isOpen={isModalOpen}
        onToggle={() => setIsModalOpen((v) => !v)}
      >
        <DepartureInputSection
          selectedStations={selectedStations.map((s) => ({
            fieldId: s.fieldId,
            id: s.id,
            color: s.color,
          }))}
          onStationSelect={handleStationSelect}
          onStationRemove={handleStationRemoveByField}
          onSubmit={handleFindMidpoint}
        />
      </BottomSheetModal>
    </Layout>
  );
};
