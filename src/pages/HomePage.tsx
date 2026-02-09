// src/pages/HomePage.tsx
//
// 핵심 수정 요약
// 1️⃣ 중간지점 계산 후 mapCenter를 midpoint로 강제 갱신
// 2️⃣ KakaoMap은 center 변경에만 반응 → 이 흐름을 HomePage에서 보장
// 3️⃣ 기존 색상 / 뱃지 / 환승 로직 전부 유지

import { useEffect, useMemo, useState } from 'react';

import { Layout } from '../ui/Layout';
import { KakaoMap } from '../ui/Map';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { DepartureSection } from './DepartureSection';
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
  latitude: number;
  longitude: number;

  stationColors: string[];
  lineIds: string[];
  pathColor: string;
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

  const [selectedStations, setSelectedStations] = useState<SelectedStation[]>([]);

  const [polylines, setPolylines] = useState<
    { path: { latitude: number; longitude: number }[]; color: string }[]
  >([]);

  const [midpoint, setMidpoint] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [midpointName, setMidpointName] = useState<string | null>(null);

  const graph = useMemo(() => buildSubwayGraph(subwayStations), []);

  // 초기 지도 중심 (현재 위치)
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

  // 출발지 선택
  const handleStationSelect = (fieldId: string, station: SubwayStation) => {
    setSelectedStations((prev) => {
      const duplicated = prev.find(
        (s) => s.id === station.id && s.fieldId !== fieldId
      );
      if (duplicated) return prev;

      const existing = prev.find((s) => s.fieldId === fieldId);
      const pathColor = existing?.pathColor ?? getRandomColor();

      const filtered = prev.filter((s) => s.fieldId !== fieldId);

      return [
        ...filtered,
        {
          fieldId,
          id: station.id,
          name: station.name,
          latitude: station.latitude,
          longitude: station.longitude,
          stationColors: station.color ?? [],
          lineIds: station.lineIds ?? [],
          pathColor,
        },
      ];
    });

    setPolylines([]);
    setMidpoint(null);
    setMidpointName(null);
  };

  const handleStationRemoveByField = (fieldId: string) => {
    setSelectedStations((prev) => prev.filter((s) => s.fieldId !== fieldId));
    setPolylines([]);
    setMidpoint(null);
    setMidpointName(null);
  };

  // 중간지점 찾기 (핵심 수정)
  const handleFindMidpoint = () => {
    const startIds = selectedStations.map((s) => s.id);
    if (startIds.length < 2) return;

    const result = calculateMidpoint(graph, startIds);
    const midpointNode = graph.nodes[result.midpointId];
    if (!midpointNode) return;

    const nextMidpoint = {
      latitude: midpointNode.latitude,
      longitude: midpointNode.longitude,
    };

    // 여기 중요
    setMidpoint(nextMidpoint);
    setMapCenter(nextMidpoint); // ← 이 줄이 없어서 지도/마커가 안 움직였음
    setMidpointName(midpointNode.name);

    const nextPolylines = selectedStations
      .map((s) => {
        const pathIds = result.paths[s.id] ?? [];
        const pathPoints = pathToLatLngs(graph, pathIds);

        const connectedPath = [...pathPoints];
        const lastPoint = connectedPath[connectedPath.length - 1];

        if (
          !lastPoint ||
          lastPoint.latitude !== midpointNode.latitude ||
          lastPoint.longitude !== midpointNode.longitude
        ) {
          connectedPath.push(nextMidpoint);
        }

        if (connectedPath.length < 2) {
          connectedPath.unshift({
            latitude: s.latitude,
            longitude: s.longitude,
          });
        }

        return {
          path: connectedPath,
          color: s.pathColor,
        };
      })
      .filter((p) => p.path.length >= 2);

    setPolylines(nextPolylines);
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (!midpoint || !midpointName) return;
    alert(`중간지점은 "${midpointName}" 역입니다.`);
  }, [midpoint, midpointName]);

  return (
    <Layout>
      <KakaoMap
        center={mapCenter ?? undefined}
        stations={selectedStations.map((s) => ({
          id: s.id,
          latitude: s.latitude,
          longitude: s.longitude,
          color: s.stationColors[0] ?? '#111111',
        }))}
        polylines={polylines}
        midpoint={midpoint}
      >
        <SelectedStationBadgeList
          stations={selectedStations.map((s) => ({
            id: s.id,
            name: s.name,
            colors: s.stationColors,
            lineIds: s.lineIds,
          }))}
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
        <DepartureSection
          selectedStations={selectedStations.map((s) => ({
            fieldId: s.fieldId,
            id: s.id,
            color: s.stationColors,
          }))}
          onStationSelect={handleStationSelect}
          onStationRemove={handleStationRemoveByField}
          onSubmit={handleFindMidpoint}
        />
      </BottomSheetModal>
    </Layout>
  );
};
