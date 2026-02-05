import { useEffect, useMemo, useRef, useState } from 'react';
import { FaUserPlus } from 'react-icons/fa';

import { Title } from '../ui/Title';
import { InputList } from '../ui/InputList';
import { TextField } from '../ui/Input';
import { ButtonContainer } from '../ui/ButtonContainer';
import { Button } from '../ui/Button';
import { SubwayStationList } from '../ui/SubwayStationList';

import { searchSubwayStations } from '../services/subway/subway.service';
import type { SubwayStation } from '../services/subway/subway.types';

type DepartureField = {
  id: string;    // 입력 필드 ID
  value: string; // 입력 값
};

const createDepartureField = (): DepartureField => ({
  id: crypto.randomUUID(),
  value: '',
});

type Props = {
  selectedStations: { fieldId: string; id: string }[];
  onStationSelect: (fieldId: string, station: SubwayStation) => void;
};

export const DepartureInputSection = ({
  selectedStations,
  onStationSelect,
}: Props) => {
  const [departureFields, setDepartureFields] = useState<DepartureField[]>([
    createDepartureField(),
  ]);

  const [activeFieldId, setActiveFieldId] = useState(
    departureFields[0].id
  );

  const [stationCandidates, setStationCandidates] = useState<SubwayStation[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // 이미 선택된 역 ID 목록
  const selectedStationIds = useMemo(
    () => selectedStations.map((s) => s.id),
    [selectedStations]
  );

  // 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setStationCandidates([]);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const addDepartureField = () => {
    const newField = createDepartureField();
    setDepartureFields((prev) => [...prev, newField]);
    setActiveFieldId(newField.id);
    setStationCandidates([]);
    setHighlightIndex(0);
  };

  const updateValue = (fieldId: string, value: string) => {
    setDepartureFields((fields) =>
      fields.map((f) =>
        f.id === fieldId ? { ...f, value } : f
      )
    );
  };

  const handleChange = (fieldId: string, value: string) => {
    setActiveFieldId(fieldId);
    updateValue(fieldId, value);

    const keyword = value.trim();
    if (!keyword) {
      setStationCandidates([]);
      return;
    }

    setStationCandidates(searchSubwayStations(keyword));
    setHighlightIndex(0);
  };

  const selectStation = (fieldId: string, station: SubwayStation) => {
    updateValue(fieldId, station.name);
    setStationCandidates([]);
    setHighlightIndex(0);

    onStationSelect(fieldId, station);
  };

  return (
    <div ref={wrapperRef}>
      <Title title="출발지를 입력하고 중간장소를 찾아보세요!" />

      <InputList>
        {departureFields.map((field, index) => {
          const showCandidates =
            activeFieldId === field.id && stationCandidates.length > 0;

          return (
            <div key={field.id}>
              <TextField
                placeholder={`${index + 1}. 출발지를 입력해주세요`}
                value={field.value}
                onChange={(e) =>
                  handleChange(field.id, e.target.value)
                }
                onKeyDown={(e) => {
                  if (!showCandidates) return;

                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightIndex((i) =>
                      Math.min(i + 1, stationCandidates.length - 1)
                    );
                  }

                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightIndex((i) => Math.max(i - 1, 0));
                  }

                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const picked = stationCandidates[highlightIndex];
                    if (!picked) return;
                    selectStation(field.id, picked);
                  }
                }}
                showRemoveButton={field.value.length > 0}
                onRemove={() => updateValue(field.id, '')}
              />

              {showCandidates && (
                <SubwayStationList
                  stations={stationCandidates}
                  keyword={field.value}
                  highlightIndex={highlightIndex}
                  selectedStationIds={selectedStationIds}
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

        <Button fullWidth>중간장소 찾기</Button>
      </ButtonContainer>
    </div>
  );
};
