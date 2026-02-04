import { useState } from 'react';
import { ButtonContainer } from '../ui/ButtonContainer';
import { Button } from '../ui/Button';
import { Title } from '../ui/Title';
import { InputList } from '../ui/InputList';
import { TextField } from '../ui/Input';
import { Card } from '../ui/Card';
import { FaUserPlus } from 'react-icons/fa';

export const HomePage = () => {
  const [starts, setStarts] = useState<string[]>(['']);

  const addFriend = () => {
    setStarts((prev) => [...prev, '']);
  };

  const updateStart = (index: number, value: string) => {
    setStarts((prev) =>
      prev.map((item, i) => (i === index ? value : item))
    );
  };

  const handleSubmit = () => {
    alert(`출발지 목록: ${starts.join(', ')}`);
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
        {/* Header */}

        <Title
          icon="😊"
          title="출발지를 입력하고 중간장소를 찾아보세요!"
        />

        {/* Inputs */}
        <InputList>
          {starts.map((value, index) => (
            <TextField
              key={index}
              placeholder={`${index + 1}. 출발지를 입력해주세요`}
              value={value}
              onChange={(e) => updateStart(index, e.target.value)}
            />
          ))}
        </InputList>

        {/* Add Friend */}
        <ButtonContainer>
          <Button variant="text" size="small" onClick={addFriend}>
            <FaUserPlus />
            친구 추가하기
          </Button>

          <Button fullWidth onClick={handleSubmit}>
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
