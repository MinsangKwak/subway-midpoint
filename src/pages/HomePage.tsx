import { useState } from 'react';
import { Button } from '../ui/Button';
import { TextField } from '../ui/Input';
import { Card } from '../ui/Card';
import { FaUserPlus } from 'react-icons/fa';

export const HomePage = () => {
  const [start1, setStart1] = useState('');
  const [start2, setStart2] = useState('');

  const handleSubmit = () => {
    alert(`출발지: ${start1}, ${start2}`);
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
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28 }}>😊</div>
          <div style={{ fontWeight: 600, marginTop: 8 }}>
            출발지를 입력하고 중간장소를 찾아보세요!
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TextField
            placeholder="1. 출발지를 입력해주세요"
            value={start1}
            onChange={(e) => setStart1(e.target.value)}
          />
          <TextField
            placeholder="2. 출발지를 입력해주세요"
            value={start2}
            onChange={(e) => setStart2(e.target.value)}
          />
        </div>

        {/* Friend */}
        <div
          style={{
            margin: '16px 0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            color: '#3B82F6',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <FaUserPlus />
          친구 추가하기
        </div>

        {/* Action */}
        <Button fullWidth onClick={handleSubmit}>
          중간장소 찾기
        </Button>

        <div
          style={{
            marginTop: 12,
            textAlign: 'center',
            fontSize: 13,
            color: '#6B7280',
            cursor: 'pointer',
          }}
        >
          랜덤으로 중간장소 찾기
        </div>
      </Card>
    </div>
  );
};
