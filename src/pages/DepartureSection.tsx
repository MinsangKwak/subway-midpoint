// src/pages/DepartureSection.tsx
//
// export 이름이 DepartureSection 이어도
// "파일명(DepartureSection.tsx)" 기준으로 너가 준 파일을 수정한 게 맞다
// 지금은 파일명/컴포넌트명이 달라서 헷갈린 거고, 내용은 네가 붙여준 코드 그대로 수정본이다

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
  id: string;
  value: string;
};

const createDepartureField = (): DepartureField => ({
  id: crypto.randomUUID(),
  value: '',
});

type Props = {
  selectedStations: {
    fieldId: string;
    id: string;
    color: string[];
  }[];
  onStationSelect: (fieldId: string, station: SubwayStation) => void;
  onStationRemove: (fieldId: string) => void;
  onSubmit: () => void;
};

export const DepartureSection = ({
  selectedStations,
  onStationSelect,
  onStationRemove,
  onSubmit,
}: Props) => {
  const [departureFields, setDepartureFields] = useState<DepartureField[]>([
    createDepartureField(),
  ]);

  // 초기값을 departureFields[0].id에 의존하면,
  // 리렌더/상태 타이밍에 불안정해질 수 있어서 첫 렌더 후 세팅으로 고정한다
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  const [stationCandidates, setStationCandidates] = useState<SubwayStation[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedStationIds = useMemo(
    () => selectedStations.map((s) => s.id),
    [selectedStations]
  );

  // 첫 렌더 후 첫 input을 active로 지정
  useEffect(() => {
    if (!activeFieldId && departureFields[0]?.id) {
      setActiveFieldId(departureFields[0].id);
    }
  }, [activeFieldId, departureFields]);

  // 바깥 클릭 시 자동완성 닫기
  // click 대신 mousedown을 써서 리스트 클릭과 충돌을 줄인다
  useEffect(() => {
    const handlePointerDownOutside = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setStationCandidates([]);
        setHighlightIndex(0);
        setActiveFieldId(null); // 포커스 해제
      }
    };

    window.addEventListener('mousedown', handlePointerDownOutside, true);
    return () =>
      window.removeEventListener('mousedown', handlePointerDownOutside, true);
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
      fields.map((f) => (f.id === fieldId ? { ...f, value } : f))
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

    // 선택 직후 active를 유지해도 되지만,
    // 자동완성 닫힘/포커스 UX가 안정적이도록 null 처리
    setActiveFieldId(null);

    onStationSelect(fieldId, station);
  };

  return (
    <div ref={wrapperRef}>
      <Title
        title="출발지를 입력하고 중간장소를 찾아보세요!"
        subtitle="출발지를 2곳 이상 입력해야 중간지점을 찾을 수 있어요."
      />

      <InputList>
        {departureFields.map((field, index) => {
          const isActive = activeFieldId === field.id;
          const showCandidates = isActive && stationCandidates.length > 0;

          const matched = selectedStations.find((s) => s.fieldId === field.id);
          const colors = matched?.color ?? [];

          // 기본 스타일
          // 비포커스일 때는 색상을 보여주고, 포커스일 때는 검정으로 통일 (요구사항)
          let style: React.CSSProperties = {
            border: '2px solid #E5E7EB',
            borderRadius: '12px',
          };

          // 비포커스 + 환승역(그라데이션)
          if (!isActive && colors.length > 1) {
            style = {
              border: '2px solid transparent',
              borderRadius: '12px',
              background: `
                linear-gradient(#ffffff, #ffffff) padding-box,
                linear-gradient(
                  90deg,
                  ${colors[0]} 0%,
                  ${colors[0]} 50%,
                  ${colors[1]} 50%,
                  ${colors[1]} 100%
                ) border-box
              `,
            };
          }

          // 비포커스 + 단일역(단색)
          if (!isActive && colors.length === 1) {
            style = {
              border: '2px solid ' + (colors[0] ?? '#E5E7EB'),
              borderRadius: '12px',
            };
          }

          // 포커스 상태는 항상 검정
          if (isActive) {
            style = {
              border: '2px solid #000000',
              borderRadius: '12px',
            };
          }

          return (
            <div key={field.id}>
              <TextField
                placeholder={`${index + 1}. 출발지를 입력해주세요`}
                value={field.value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                onFocus={() => setActiveFieldId(field.id)}
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
                onRemove={() => {
                  updateValue(field.id, '');
                  onStationRemove(field.id);
                }}
                style={style}
              />

              {showCandidates && (
                <SubwayStationList
                  stations={stationCandidates}
                  keyword={field.value}
                  highlightIndex={highlightIndex}
                  selectedStationIds={selectedStationIds}
                  onSelect={(station) => selectStation(field.id, station)}
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

        <Button fullWidth disabled={selectedStations.length < 2} onClick={onSubmit}>
          중간장소 찾기
        </Button>
      </ButtonContainer>
    </div>
  );
};
