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

type SelectedStation = {
  fieldId: string;
  id: string;
  name: string;
  lineId: string;
  latitude: number;
  longitude: number;
  color: string;
};

const COLOR_POOL = ['#7C3AED', '#2563EB', '#16A34A', '#DC2626', '#F59E0B'];

const getRandomColor = () =>
  COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];

export const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const [mapCenter, setMapCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [selectedStations, setSelectedStations] = useState<SelectedStation[]>(
    []
  );

  // 버튼을 눌렀을 때만 그릴 선/중간지점
  const [polylines, setPolylines] = useState<
    { path: { latitude: number; longitude: number }[]; color: string }[]
  >([]);
  const [midpoint, setMidpoint] = useState<{ latitude: number; longitude: number } | null>(
    null
  );

  // 그래프는 1번만 생성
  const graph = useMemo(() => buildSubwayGraph(subwayStations), []);

  // 현 위치 탐지 실패 시 강남 fallback
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

  // 출발지 선택 (fieldId 기준 교체, 중복 방지)
  const handleStationSelect = (fieldId: string, station: SubwayStation) => {
    setSelectedStations((prev) => {
      const duplicated = prev.find((s) => s.id === station.id && s.fieldId !== fieldId);
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

    // 출발지 선택 단계에서는 선/중간지점 초기화
    setPolylines([]);
    setMidpoint(null);
  };

  // 출발지 삭제
  const handleStationRemoveByField = (fieldId: string) => {
    setSelectedStations((prev) => prev.filter((s) => s.fieldId !== fieldId));

    setPolylines([]);
    setMidpoint(null);
  };

  // 중간장소 찾기 버튼 클릭
  const handleFindMidpoint = () => {
    const startIds = selectedStations.map((s) => s.id);
    if (startIds.length < 2) return;

    console.log('[HomePage] 중간장소 계산 시작', startIds);

    const result = calculateMidpoint(graph, startIds);
    const midpointNode = graph.nodes[result.midpointId];

    if (!midpointNode) return;

    // 중간지점 좌표
    const nextMidpoint = {
      latitude: midpointNode.latitude,
      longitude: midpointNode.longitude,
    };
    setMidpoint(nextMidpoint);

    // 출발지별 경로 -> 좌표 배열 변환
    const nextPolylines = selectedStations
      .map((s) => {
        const pathIds = result.paths[s.id] ?? [];
        const pathPoints = pathToLatLngs(graph, pathIds);

        // 경로가 계산되더라도 마지막 점이 midpoint와 다를 수 있어
        // 지도에서 "연결된 선"이 끊겨 보이지 않도록 midpoint를 강제로 종점으로 붙인다.
        const connectedPath = [...pathPoints];
        const lastPoint = connectedPath[connectedPath.length - 1];

        if (
          !lastPoint ||
          lastPoint.latitude !== nextMidpoint.latitude ||
          lastPoint.longitude !== nextMidpoint.longitude
        ) {
          connectedPath.push(nextMidpoint);
        }

        // 예외 상황(그래프 경로 누락 등)에서도 최소한 출발지↔중간지점 직선은 보이게 한다.
        if (connectedPath.length < 2) {
          connectedPath.unshift({
            latitude: s.latitude,
            longitude: s.longitude,
          });
        }

        console.log('[Polyline]', s.name, connectedPath);

        return {
          path: connectedPath,
          color: s.color,
        };
      })
      .filter((p) => p.path.length >= 2);

    setPolylines(nextPolylines);

    // 버튼 누르면 모달 닫기
    setIsModalOpen(false);
  };

  return (
    <Layout>
      <KakaoMap
        center={mapCenter ?? undefined}
        stations={selectedStations.map((s) => ({
          id: s.id,
          latitude: s.latitude,
          longitude: s.longitude,
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

      <BottomSheetModal isOpen={isModalOpen} onToggle={() => setIsModalOpen((v) => !v)}>
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
