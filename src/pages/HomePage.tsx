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

import { KakaoMap } from '../ui/Map/KakaoMap';
import { BottomSheetModal } from '../ui/BottomSheetModal';

type DepartureField = {
  id: string;
  value: string;
};

const createDepartureField = (): DepartureField => ({
  id: crypto.randomUUID(),
  value: '',
});

export const HomePage = () => {
  const [departureFields, setDepartureFields] = useState<DepartureField[]>([
    createDepartureField(),
  ]);

  const [activeDepartureFieldId, setActiveDepartureFieldId] = useState(
    departureFields[0].id
  );

  const [stationCandidates, setStationCandidates] = useState<SubwayStation[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(0);

  /** BottomSheet 열림/접힘 상태 */
  const [isModalOpen, setIsModalOpen] = useState(true);

  const wrapperRef = useRef<HTMLDivElement>(null);

  /** 외부 클릭 시 후보 닫기 */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setStationCandidates([]);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  /** 출발지 추가 */
  const addDepartureField = () => {
    const newField = createDepartureField();
    setDepartureFields((fields) => [...fields, newField]);
    setActiveDepartureFieldId(newField.id);
    setStationCandidates([]);
    setHighlightIndex(0);
  };

  const updateDepartureValue = (id: string, value: string) => {
    setDepartureFields((fields) =>
      fields.map((f) => (f.id === id ? { ...f, value } : f))
    );
  };

  const handleDepartureChange = (id: string, value: string) => {
    setActiveDepartureFieldId(id);
    updateDepartureValue(id, value);

    const keyword = value.trim();
    if (!keyword) {
      setStationCandidates([]);
      return;
    }

    setStationCandidates(searchSubwayStations(keyword));
    setHighlightIndex(0);
  };

  const selectStation = (id: string, station: SubwayStation) => {
    updateDepartureValue(id, station.name);
    setStationCandidates([]);
  };

  const handleRemoveAction = (id: string, index: number) => {
    if (departureFields.length === 1) {
      updateDepartureValue(id, '');
      setStationCandidates([]);
      return;
    }

    const confirmed = window.confirm(
      `${index + 1}. 이렇게 생성된 요소부터 값을 삭제하시겠습니까?`
    );

    if (!confirmed) return;

    setDepartureFields((fields) => fields.filter((f) => f.id !== id));
    if (activeDepartureFieldId === id) setStationCandidates([]);
  };

  const submitMidpointSearch = () => {
    const list = departureFields.map((f) => f.value).filter(Boolean);
    alert(`출발지 목록: ${list.join(', ')}`);
  };

  return (
    <Layout>
      {/* 지도는 항상 바닥 */}
      <KakaoMap />

      {/* BottomSheet Modal */}
      <BottomSheetModal
        isOpen={isModalOpen}
        onToggle={() => setIsModalOpen((v) => !v)}
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
                    onChange={(e) =>
                      handleDepartureChange(field.id, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (!shouldShowCandidates) return;

                      if (e.key === 'ArrowDown') {
                        setHighlightIndex((i) =>
                          Math.min(i + 1, stationCandidates.length - 1)
                        );
                      }

                      if (e.key === 'ArrowUp') {
                        setHighlightIndex((i) => Math.max(i - 1, 0));
                      }

                      if (e.key === 'Enter') {
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
