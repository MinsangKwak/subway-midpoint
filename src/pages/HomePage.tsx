import { useState, useEffect } from 'react';

import { Layout } from '../ui/Layout';
import { KakaoMap } from '../ui/Map';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { DepartureInputSection } from './DepartureSection';
import { SelectedStationBadgeList } from '../ui/SelectedStationBadgeList';

import type { SubwayStation } from '../services/subway/subway.types';



import { subwayStations } from '../services/subway/subway.mock';
import { buildSubwayGraph } from '../services/subway/subway.graph';
import { dijkstra } from '../services/subway/subway.dijkstra';
import { calculateMidpoint } from '../services/subway/subway.midpoint';

type SelectedStation = {
  fieldId: string;
  id: string;
  name: string;
  lineId: string;
  latitude: number;
  longitude: number;
  color: string;
};

// 최소 1개 출발지 보장용 기본값
const DEFAULT_STATION: SelectedStation = {
  fieldId: 'default',
  id: 'gangnam',
  name: '강남',
  lineId: '2',
  latitude: 37.4979,
  longitude: 127.0276,
  color: '#7C3AED',
};

const COLOR_POOL = [
  '#7C3AED',
  '#2563EB',
  '#16A34A',
  '#DC2626',
  '#F59E0B',
];

const getRandomColor = () =>
  COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];

export const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const [mapCenter, setMapCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // 출발지 + 마커 + 색상 단일 상태
  const [selectedStations, setSelectedStations] =
    useState<SelectedStation[]>([DEFAULT_STATION]);

  // 출발지 선택 (fieldId 기준 교체)
  const handleStationSelect = (
    fieldId: string,
    station: SubwayStation
  ) => {
    setSelectedStations((prev) => {
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

    setMapCenter({
      latitude: station.latitude,
      longitude: station.longitude,
    });
  };

  // 출발지 삭제 (최소 1개 보장)
  const handleStationRemoveByField = (fieldId: string) => {
    setSelectedStations((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((s) => s.fieldId !== fieldId);
    });
  };


  useEffect(() => {
    // 1. 그래프 생성
    const graph = buildSubwayGraph(subwayStations);

    console.group('SUBWAY GRAPH DEBUG');

    // 2. 노드 / 간선 수 확인
    console.log('노드 수:', Object.keys(graph.nodes).length);
    console.log(
      '간선 수:',
      Object.values(graph.adj).reduce(
        (acc, edges) => acc + edges.length,
        0
      )
    );

    // 3. 특정 역의 인접 리스트 확인
    console.log('강남 인접 역:', graph.adj['gangnam']);

    // 4. 다익스트라 테스트 (강남 기준)
    const { dist, prev } = dijkstra(graph, 'gangnam');
    console.log('강남 → 시청 hop:', dist['cityhall_2']);
    console.log('강남 prev map:', prev);

    // 5. 중간지점 계산 테스트
    const startIds = selectedStations.map((s) => s.id);
    if (startIds.length >= 2) {
      const midpointResult = calculateMidpoint(graph, startIds);
      console.log('출발지들:', startIds);
      console.log('중간지점:', midpointResult.midpointId);
      console.log('경로들:', midpointResult.paths);
    }

    console.groupEnd();
  }, []);


  return (
    <Layout>
      <KakaoMap
        center={mapCenter ?? undefined}
        stations={selectedStations.map((s) => ({
          id: s.id,
          latitude: s.latitude,
          longitude: s.longitude,
          color: s.color,
        }))}
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
        />
      </BottomSheetModal>
    </Layout>
  );
};
