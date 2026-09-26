# Subway Midpoint

여러 사람의 출발역을 넣으면 **모두에게 공평한 지하철 중간 지점**을 찾아주는 웹 앱입니다.

- 운영: https://minsangkwak.github.io/subway-midpoint/
- dev 미리보기: https://minsangkwak.github.io/subway-midpoint/dev/
- 기준: 가장 오래 걸리는 사람의 소요시간을 최소화하고, 같으면 전체 합계가 작은 역
- 데이터: 수도권 주요 역 샘플. 소요시간은 역 간 거리로 추정한 값입니다

## 동작

1. 출발역을 2곳 이상 검색해 고릅니다. 환승역은 노선 배지로 표시됩니다.
2. `중간지점 찾기`를 누르면 각 출발지에서 다익스트라로 최단 소요시간을 구하고, 모든 역을 후보로 minimax 점수를 매깁니다.
3. 결과 카드에 중간역·1인당 소요시간·환승 횟수·다른 후보 2개가 나오고, 지도에 경로가 그려집니다.

```
출발지 A ─┐
출발지 B ─┼─▶ 각 출발지별 최단시간 표 ─▶ max(시간) 최소인 역 ─▶ 경로 복원
출발지 C ─┘
```

## 구조

```
src/
├─ domain/subway/     계산 로직. React·지도 의존 없음, 단위 테스트 대상
│  ├─ graph.ts        구간(segment) 정의 → 그래프. 거리 기반 소요시간 가중치
│  ├─ dijkstra.ts     이진 힙 다익스트라, 다중 출발점 지원
│  ├─ midpoint.ts     minimax 중간지점 + 상위 후보
│  └─ catalog.ts      역 이름 단위 카탈로그·검색
├─ data/subway/       노선·역·운행 구간 데이터
├─ features/
│  ├─ planner/        출발지 입력(콤보박스)·결과 카드·상태(reducer)
│  └─ map/            카카오맵 로더·타입·마커/경로 렌더링
├─ components/        Button, LineBadge, Icon
└─ styles/            토큰(라이트·다크), reset, 레이아웃
```

설계에서 지킨 것

- 노선 연결은 배열 순서가 아니라 `LINE_SEGMENTS`로 명시합니다. 분기(1호선 구로)와 순환(2호선)을 데이터로 표현합니다.
- 환승역은 노선별 노드로 두고 이름으로 환승 간선을 잇습니다. 환승역에서 출발하면 모든 노선 노드가 출발점이라 첫 환승 비용을 물지 않습니다.
- 화면에 숫자를 그대로 보간하지 않고 `lib/format.ts`를 거칩니다. 값이 없으면 `—`.
- 카카오 앱 키는 환경변수로만 읽습니다. 키가 없어도 계산은 동작하고 지도 자리에 안내가 뜹니다.

## 실행

```bash
npm install
cp .env.example .env   # VITE_KAKAO_MAP_KEY 입력
npm run dev            # http://localhost:5173
```

| 명령 | 내용 |
| --- | --- |
| `npm run lint` | ESLint 9 (flat config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest, 도메인·리듀서·포맷 단위 테스트 |
| `npm run build` | 타입검사 후 Vite 빌드 (루트 경로, Vercel용) |
| `npx vite build --mode pages` | 운영용 `/subway-midpoint/` 경로 빌드 |
| `npx vite build --mode pages-dev` | 미리보기용 `/subway-midpoint/dev/` 경로 빌드. 패널에 `dev preview` 표시 |

카카오 개발자 콘솔 > 앱 > 플랫폼 > Web 에 `http://localhost:5173`과 배포 도메인을 등록해야 지도가 뜹니다.

## 브랜치와 배포

| 브랜치 | 역할 | 주소 |
| --- | --- | --- |
| `dev` | 개발. push·PR 마다 CI(lint·typecheck·test·build). push 시 미리보기 배포 | https://minsangkwak.github.io/subway-midpoint/dev/ |
| `main` | 운영. `dev → main` PR 병합 시 배포 | https://minsangkwak.github.io/subway-midpoint/ |

```
dev push ──▶ CI ──▶ deploy.yml (main + dev 함께 빌드) ──▶ Pages
                │
                └─▶ PR dev → main ──▶ merge ──▶ deploy.yml ──▶ Pages
```

GitHub Pages 배포물은 저장소당 하나라서, `deploy.yml`이 `main`과 `dev`를 모두 체크아웃해 각각 `/`와 `/dev/`에 넣은 뒤 한 번에 올립니다. 어느 브랜치가 바뀌어도 두 주소가 함께 최신이 됩니다. 카카오 키는 저장소 변수 `KAKAO_MAP_KEY`를 `VITE_KAKAO_MAP_KEY`로 주입합니다.

릴리스 순서

1. `dev`에 커밋·푸시 → CI 통과 확인 → 미리보기 주소에서 확인
2. `gh pr create --base main --head dev` → 병합
3. 운영 주소 확인

## 기술 스택

React 19 · TypeScript · Vite 7 · Vitest · ESLint 9 · CSS Modules · Kakao Maps SDK

## 다음 단계

- 수도권 전체 역 데이터 연동 (공공데이터 API)
- 실제 시각표 기반 소요시간
- 결과 URL 공유 (쿼리스트링 상태 복원)
