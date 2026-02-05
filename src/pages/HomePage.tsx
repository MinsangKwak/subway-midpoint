import { useEffect, useRef, useState } from 'react';

import { Layout } from '../ui/Layout';
import { ButtonContainer } from '../ui/ButtonContainer';
import { Button } from '../ui/Button';
import { Title } from '../ui/Title';
import { InputList } from '../ui/InputList';
import { TextField } from '../ui/Input';
import { FaUserPlus } from 'react-icons/fa';

import { SubwayStationList } from '../ui/SubwayStationList';
import { searchSubwayStations } from '../services/subway/subway.service';
import type { SubwayStation } from '../services/subway/subway.types';

import { KakaoMap } from '../ui/Map';
import { BottomSheetModal } from '../ui/BottomSheetModal';

/**
 * 출발지 입력 필드 타입
 */
type DepartureField = {
  id: string;     // 필드 고유 ID
  value: string;  // 입력된 출발지 값
};

/**
 * 출발지 입력 필드 생성 함수
 */
const createDepartureField = (): DepartureField => ({
  id: crypto.randomUUID(),
  value: '',
});

export const HomePage = () => {
  /** 출발지 입력 필드 목록 */
  const [departureFields, setDepartureFields] = useState<DepartureField[]>([
    createDepartureField(),
  ]);

  /** 현재 활성화된 출발지 필드 ID */
  const [activeDepartureFieldId, setActiveDepartureFieldId] = useState(
    departureFields[0].id
  );

  /** 지하철역 검색 후보 목록 */
  const [stationCandidates, setStationCandidates] = useState<SubwayStation[]>([]);

  /** 자동완성 하이라이트 인덱스 */
  const [highlightIndex, setHighlightIndex] = useState(0);

  /** BottomSheet 열림/접힘 상태 */
  const [isModalOpen, setIsModalOpen] = useState(true);

  /** 지도 중심 좌표 */
  const [mapCenter, setMapCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  /** 자동완성 영역 ref (외부 클릭 감지용) */
  const wrapperRef = useRef<HTMLDivElement>(null);

  /**
   * 자동완성 외부 클릭 시 후보 목록 닫기
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setStationCandidates([]);
      }
    };

    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  /**
   * 출발지 입력 필드 추가
   */
  const addDepartureField = () => {
    const newField = createDepartureField();

    setDepartureFields((fields) => [...fields, newField]);
    setActiveDepartureFieldId(newField.id);
    setStationCandidates([]);
    setHighlightIndex(0);
  };

  /**
   * 출발지 입력 값 업데이트
   */
  const updateDepartureValue = (id: string, value: string) => {
    setDepartureFields((fields) =>
      fields.map((field) =>
        field.id === id ? { ...field, value } : field
      )
    );
  };

  /**
   * 출발지 입력 변경 처리
   */
  const handleDepartureChange = (id: string, value: string) => {
    setActiveDepartureFieldId(id);
    updateDepartureValue(id, value);

    const trimmedKeyword = value.trim();
    if (!trimmedKeyword) {
      setStationCandidates([]);
      return;
    }

    setStationCandidates(searchSubwayStations(trimmedKeyword));
    setHighlightIndex(0);
  };

  /**
   * 지하철역 선택 처리
   */
  const selectStation = (id: string, station: SubwayStation) => {
    console.log('[HomePage] 검색어 선택', {
      name: station.name,
      latitude: station.latitude,
      longitude: station.longitude,
    });

    updateDepartureValue(id, station.name);
    setStationCandidates([]);

    // 지도 중심 좌표 설정
    setMapCenter({
      latitude: station.latitude,
      longitude: station.longitude,
    });
  };

  /**
   * 출발지 입력 필드 삭제
   */
  const handleRemoveAction = (id: string, index: number) => {
    if (departureFields.length === 1) {
      updateDepartureValue(id, '');
      setStationCandidates([]);
      return;
    }

    const confirmed = window.confirm(
      `${index + 1}. 이 입력 필드부터 삭제하시겠습니까?`
    );

    if (!confirmed) return;

    setDepartureFields((fields) => fields.filter((field) => field.id !== id));
    if (activeDepartureFieldId === id) {
      setStationCandidates([]);
    }
  };

  /**
   * 중간 장소 검색 (임시)
   */
  const submitMidpointSearch = () => {
    const departureList = departureFields
      .map((field) => field.value)
      .filter(Boolean);

    alert(`출발지 목록: ${departureList.join(', ')}`);
  };

  return (
    <Layout>
      {/* 지도 영역 */}
      <KakaoMap center={mapCenter ?? undefined} />

      {/* BottomSheet 영역 */}
      <BottomSheetModal
        isOpen={isModalOpen}
        onToggle={() => setIsModalOpen((value) => !value)}
      >
        <div ref={wrapperRef}>
          <Title title="출발지를 입력하고 중간장소를 찾아보세요!" />

          <InputList>
            {departureFields.map((field, index) => {
              const shouldShowCandidates =
                activeDepartureFieldId === field.id &&
                stationCandidates.length > 0;

              return (
                <div key={field.id}>
                  <TextField
                    placeholder={`${index + 1}. 출발지를 입력해주세요`}
                    value={field.value}
                    onChange={(event) =>
                      handleDepartureChange(field.id, event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (!shouldShowCandidates) return;

                      if (event.key === 'ArrowDown') {
                        setHighlightIndex((currentIndex) =>
                          Math.min(
                            currentIndex + 1,
                            stationCandidates.length - 1
                          )
                        );
                      }

                      if (event.key === 'ArrowUp') {
                        setHighlightIndex((currentIndex) =>
                          Math.max(currentIndex - 1, 0)
                        );
                      }

                      if (event.key === 'Enter') {
                        event.preventDefault();
                        selectStation(
                          field.id,
                          stationCandidates[highlightIndex]
                        );
                      }
                    }}
                    showRemoveButton={field.value.length > 0}
                    onRemove={() => handleRemoveAction(field.id, index)}
                  />

                  {shouldShowCandidates && (
                    <SubwayStationList
                      stations={stationCandidates}
                      keyword={field.value}
                      highlightIndex={highlightIndex}
                      onSelect={(station) =>
                        selectStation(field.id, station)
                      }
                    />
                  )}
                </div>
              );
            })}
          </InputList>

          <ButtonContainer>
            <Button variant="text" size="small" onClick={addDepartureField}>
              <FaUserPlus /> 출발지 추가하기
            </Button>

            <Button fullWidth onClick={submitMidpointSearch}>
              중간장소 찾기
            </Button>

            <Button variant="ghost" size="small">
              랜덤으로 중간장소 찾기
            </Button>
          </ButtonContainer>
        </div>
      </BottomSheetModal>
    </Layout>
  );
};
