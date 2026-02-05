import { useEffect, useState } from 'react';

import { Layout } from '../ui/Layout';
import { KakaoMap } from '../ui/Map';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { DepartureInputSection } from './DepartureSection';
import { SelectedStationBadgeList } from '../ui/SelectedStationBadgeList';

import type { SubwayStation } from '../services/subway/subway.types';

import { subwayStations } from '../services/subway/subway.mock';
import { buildSubwayGraph } from '../services/subway/subway.graph';
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

  const [selectedStations, setSelectedStations] = useState<SelectedStation[]>([]);

  const [polylines, setPolylines] = useState<
    { path: { latitude: number; longitude: number }[]; color: string }[]
  >([]);

  const [midpoint, setMidpoint] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // 출발지 선택
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
  };

  // 출발지 삭제
  const handleStationRemoveByField = (fieldId: string) => {
    setSelectedStations((prev) =>
      prev.filter((s) => s.fieldId !== fieldId)
    );
  };

  // 중간장소 찾기 버튼
  const handleCalculateMidpoint = () => {
    if (selectedStations.length < 2) return;

    const graph = buildSubwayGraph(subwayStations);
    const startIds = selectedStations.map((s) => s.id);

    const result = calculateMidpoint(graph, startIds);

    const midNode = graph.nodes[result.midpointId];
    if (!midNode) return;

    setMidpoint({
      latitude: midNode.latitude,
      longitude: midNode.longitude,
    });

    const lines = selectedStations.map((station) => {
      const pathIds = result.paths[station.id] ?? [];
      return {
        color: station.color,
        path: pathIds.map((id) => {
          const node = graph.nodes[id];
          return {
            latitude: node.latitude,
            longitude: node.longitude,
          };
        }),
      };
    });

    setPolylines(lines);

    setIsModalOpen(false);
  };

  // 현 위치 → 실패 시 강남
  useEffect(() => {
    if (!navigator.geolocation) {
      setMapCenter({ latitude: 37.4979, longitude: 127.0276 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {
        setMapCenter({ latitude: 37.4979, longitude: 127.0276 });
      }
    );
  }, []);

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
          onSubmit={handleCalculateMidpoint}
        />
      </BottomSheetModal>
    </Layout>
  );
};
