import { Button } from './ui/button';
import { TextField } from './ui/input/TextField.web';
import { Card } from './ui/layout/Card';
import { FaUserPlus } from 'react-icons/fa';

export default function App() {
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
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          😊
          <div style={{ fontWeight: 600, marginTop: 8 }}>
            출발지를 입력하고 중간장소를 찾아보세요!
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TextField placeholder="1. 출발지를 입력해주세요" />
          <TextField placeholder="2. 출발지를 입력해주세요" />
        </div>

        <div
          style={{
            margin: '16px 0',
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            color: '#3B82F6',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <FaUserPlus /> 친구 추가하기
        </div>

        <Button fullWidth>중간장소 찾기</Button>

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
}
