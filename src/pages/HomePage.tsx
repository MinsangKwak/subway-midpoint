import { useState } from 'react';
import { ButtonContainer } from '../ui/ButtonContainer';
import { Button } from '../ui/Button';
import { Title } from '../ui/Title';
import { InputList } from '../ui/InputList';
import { TextField } from '../ui/Input';
import { Card } from '../ui/Card';
import { FaUserPlus } from 'react-icons/fa';

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

  /** 출발지 input 추가 */
  const addDepartureField = () => {
    setDepartureFields((fields) => [...fields, createDepartureField()]);
  };

  /** 출발지 값 변경 */
  const updateDepartureValue = (id: string, value: string) => {
    setDepartureFields((fields) =>
      fields.map((field) =>
        field.id === id ? { ...field, value } : field
      )
    );
  };

  /**
   * ❌ 버튼 클릭 처리
   * - 1개일 때: 값만 clear
   * - 2개 이상: confirm → 삭제
   */
  const handleRemoveAction = (id: string, index: number) => {
    if (departureFields.length === 1) {
      // 값만 clear
      updateDepartureValue(id, '');
      return;
    }

    const confirmed = window.confirm(
      `${index + 1}. 이렇게 생성된 요소부터 값을 삭제하시겠습니까?`
    );

    if (!confirmed) return;

    setDepartureFields((fields) =>
      fields.filter((field) => field.id !== id)
    );
  };

  const submitMidpointSearch = () => {
    const departureList = departureFields
      .map((field) => field.value)
      .filter(Boolean);

    alert(`출발지 목록: ${departureList.join(', ')}`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F2F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <Card>
        <Title
          icon="😊"
          title="출발지를 입력하고 중간장소를 찾아보세요!"
        />

        <InputList>
          {departureFields.map((field, index) => {
            const hasValue = field.value.trim().length > 0;

            return (
              <TextField
                key={field.id}
                placeholder={`${index + 1}. 출발지를 입력해주세요`}
                value={field.value}
                onChange={(event) =>
                  updateDepartureValue(field.id, event.target.value)
                }
                showRemoveButton={hasValue}
                onRemove={() =>
                  handleRemoveAction(field.id, index)
                }
              />
            );
          })}
        </InputList>

        <ButtonContainer>
          <Button variant="text" size="small" onClick={addDepartureField}>
            <FaUserPlus />
            출발지 추가하기
          </Button>

          <Button fullWidth onClick={submitMidpointSearch}>
            중간장소 찾기
          </Button>

          <Button variant="ghost" size="small">
            랜덤으로 중간장소 찾기
          </Button>
        </ButtonContainer>
      </Card>
    </div>
  );
};