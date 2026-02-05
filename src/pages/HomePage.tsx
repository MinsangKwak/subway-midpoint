import { useState } from 'react';

import { Layout } from '../ui/Layout';
import { KakaoMap } from '../ui/Map';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { DepartureInputSection } from './DepartureSection';
import { SelectedStationBadgeList } from '../ui/SelectedStationBadgeList';

import type { SubwayStation } from '../services/subway/subway.types';

type SelectedStation = {
  fieldId: string;  // 출발지 필드 ID
  id: string;       // 역 ID
  name: string;     // 역 이름
  lineId: string;   // 노선 ID
  latitude: number;
  longitude: number;
};

export const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const [mapCenter, setMapCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [selectedStations, setSelectedStations] =
    useState<SelectedStation[]>([]);

  // 출발지 필드 기준으로 항상 교체
  const handleStationSelect = (
    fieldId: string,
    station: SubwayStation
  ) => {
    setSelectedStations((prev) => {
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
        },
      ];
    });

    setMapCenter({
      latitude: station.latitude,
      longitude: station.longitude,
    });
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
            setSelectedStations((prev) =>
              prev.filter((s) => s.id !== id)
            );
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
          }))}
          onStationSelect={handleStationSelect}
        />
      </BottomSheetModal>
    </Layout>
  );
};
