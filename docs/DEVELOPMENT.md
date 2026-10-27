# 개발 가이드 · 실행부터 계산 규칙까지

[저장소 홈](../README.md) · [구조](STRUCTURE.md) · [운영](OPERATIONS.md) · [검증 기록](VALIDATION.md)

**추천 결과를 재현하고 계산·데이터·화면 상태의 규칙을 확인하는 문서입니다.** 설계 이유는 [프로젝트 설명](PROJECT.md), 실행 결과는 [검증 기록](VALIDATION.md)에서 이어집니다.

## 로컬 실행

Node.js 22 이상에서 저장소 루트 기준으로 실행합니다.

```bash
npm ci
npm run dev
```

[로컬 앱](http://localhost:5173/)에서 출발역을 선택하고 계산합니다. 지도 키가 없어도 검색과 결과 카드는 사용할 수 있습니다. 지도 설정은 [운영 가이드](OPERATIONS.md#지도-설정)를 참고하세요.

## 구현을 읽는 순서

| 단계 | 파일 | 검토할 내용 |
| --- | --- | --- |
| 입력 조건 | [usePlanner](../src/features/planner/model/usePlanner.ts) | 선택 역과 계산 호출, URL 초기 상태 |
| 그래프 | [graph](../src/domain/subway/graph.ts) | 노선 구간과 환승 간선 |
| 최단경로 | [dijkstra](../src/domain/subway/dijkstra.ts) | 출발지별 탐색과 첫 노선 선택 |
| 후보 | [midpoint](../src/domain/subway/midpoint.ts) | 점수 정렬 후 상위 후보 경로 복원 |
| 표시·공유 | [ResultCard](../src/features/planner/ui/ResultCard.tsx) | 후보 전환, 시간 표시, 공유 동작 |

## 계산 기준

각 후보를 아래 순서로 비교합니다.

1. 출발지별 최단 예상 시간의 **최댓값**이 작은 역
2. 최댓값이 같으면 **전체 시간 합계**가 작은 역
3. 둘 다 같으면 **한국어 역 이름순**

출발역 자체와 모든 출발지에서 도달할 수 없는 역은 후보에서 제외합니다. 기본 반환값은 상위 3개이며 추천역도 이 목록에 포함합니다. 동일 출발역은 계산 함수에서 중복 제거하고 UI에서도 중복 선택을 제한합니다.

[calculateMidpoint](../src/domain/subway/midpoint.ts)는 각 출발지의 다익스트라 결과를 만든 뒤 후보별 도착 노드와 최대·합계 시간만 모아 정렬합니다. 경로 복원과 좌표 변환은 상위 N개 후보에만 수행합니다. 후보의 표시 이름은 같은 역의 노선별 이름 중 가장 짧은 것(카탈로그와 같은 규칙), 노선 목록은 역 키로 묶인 모든 노드의 노선입니다.

## 그래프와 시간 가중치

| 요소 | 현재 구현 |
|---|---|
| 역 노드 | 환승역도 노선별 노드로 유지 |
| 운행 간선 | 같은 구간에서 이웃한 역을 양방향 연결 |
| 순환 | 구간에 `loop`가 있으면 끝과 시작 연결; 생성 데이터는 원본 정차 순서도 사용 |
| 환승 간선 | 정규화 이름 또는 `transferName`으로 묶인 다른 노선 연결 |
| 역 간 시간 | `max(1.5, haversine 거리(km) / 32 × 60)`분 |
| 환승 시간 | 노선 변경당 5분 |

그래프 생성 시 중복 ID, 없는 역 참조, 구간과 다른 노선의 역을 검사합니다. 총신대입구·이수처럼 이름이 다른 환승역은 `transferName`으로 연결합니다.

[다익스트라](../src/domain/subway/dijkstra.ts)는 이진 최소 힙을 사용합니다. 환승역의 모든 노선 노드를 비용 0으로 시작해 첫 노선 선택에는 환승 비용을 붙이지 않습니다. 이미 더 짧은 경로가 발견된 힙 항목은 건너뜁니다.

실제 시각표·열차 대기·역별 환승 동선을 반영한 시간은 아닙니다. 이 모델 안에서의 최단 예상 시간을 비교합니다.

## 역 데이터

[stations.ts](../src/data/subway/stations.ts)는 [생성 스크립트](../scripts/fetch-stations.mjs)의 결과입니다. 데이터 갱신은 생성 규칙을 수정한 뒤 재생성합니다.

```bash
npm run data:stations
node scripts/fetch-stations.mjs --cached
npm test
```

두 번째 명령은 원본 캐시 `.cache/overpass-lines.json`을 재사용합니다. 캐시가 없으면 새로 요청합니다. 최초 수집에는 네트워크가 필요하고 실패하면 다른 Overpass 서버로 재시도합니다.

| 원본 조건 | 정제 방법 |
|---|---|
| `route=subway` ref 1~9, `route=train` ref 경의·중앙/수인·분당/신분당/공항철도 | 관계의 정차 순서로 운행 구간 생성 |
| 급행·특급·직통 | 정차역을 건너뛰는 간선을 막기 위해 제외 |
| 괄호 부기 | 표시 이름에서 제거하고 원래 이름을 검색 별칭으로 보존 |
| 같은 노선의 중복 역 | 정규화 이름으로 통합, 연속 중복 정차 노드 정리 |
| 이름이 다른 환승역 | `transferName`으로 묶음 지정 (총신대입구 → 이수) |
| 이름만 같은 다른 역 | 노선별 다른 키를 `transferName`에 지정해 분리 (경의중앙선 신촌·양평). 같은 키의 노드가 800m 이상 떨어지면 스크립트가 경고 |

[데이터 테스트](../src/data/subway/stations.test.ts)는 노선 범위·중복·좌표·참조·종점·주요 환승 묶음·동명이역 분리·환승 묶음 거리·새 노선 연결을 확인합니다. 노선 id와 색·배지 글자는 [lines.ts](../src/data/subway/lines.ts)에 두며, 번호가 아닌 노선은 짧은 이름 배지로 표시합니다. 갱신 후 실패하면 실제 노선 변화인지 원본 누락인지 먼저 확인합니다. 출처와 ODbL 조건은 [OpenStreetMap 저작권 안내](https://www.openstreetmap.org/copyright)에서 확인합니다.

## React 상태와 검색

[usePlanner](../src/features/planner/model/usePlanner.ts)가 계산과 reducer를 연결합니다. 입력칸은 2~6개이며 서로 다른 역이 2곳 이상 선택되면 계산할 수 있습니다. 나머지 입력칸이 비어 있어도 선택한 역을 기준으로 계산합니다.

처음 열 때 주소에 `?from=`이 있으면 [urlState](../src/features/planner/model/urlState.ts)로 출발역을 복원하고, 2곳 이상이면 계산까지 마친 상태로 시작합니다. URL의 `from`에는 표시 이름이 아닌 역 키가 들어갑니다. 예를 들어 경의중앙선 신촌은 `신촌(경의중앙)`으로 2호선 신촌과 구분합니다. `pick`은 0부터 시작하는 후보 인덱스이므로 `pick=1`은 두 번째 후보입니다.

결과가 있는 동안에는 출발역과 선택 후보를 `history.replaceState`로 주소에 반영하고, 결과가 사라지면 쿼리도 지웁니다.

| 조작 | 상태 변화 |
|---|---|
| 출발지 추가·삭제·검색어 변경·선택·지우기 | 출발지 갱신, 결과·오류·선택 후보 초기화 |
| 계산 성공 | 결과 저장, 첫 후보 선택 |
| 계산 실패 | 결과 제거, 오류 저장 |
| 후보 전환 | 결과를 유지하고 선택 인덱스 변경 |

[DepartureField](../src/features/planner/ui/DepartureField.tsx)는 combobox·listbox·option과 ARIA 상태를 사용합니다. 방향키·Enter·Escape를 처리하고 한글 조합 중에는 선택 처리를 건너뜁니다. 검색어 강조는 HTML 삽입 없이 문자열을 React 요소로 나눕니다.

[ResultCard](../src/features/planner/ui/ResultCard.tsx)의 공유 버튼은 Web Share API가 있으면 공유 시트를, 없으면 클립보드를 사용합니다. 결과 텍스트와 함께 같은 조건으로 열리는 주소를 전달합니다. 후보 칩은 ARIA 탭 패턴을 따라 선택된 칩만 Tab 순서에 두고 방향키·Home·End로 옮깁니다.

## 검증

| 명령 | 확인 내용 |
|---|---|
| `npm run check` | lint·타입·테스트·문서 링크·루트 빌드 |
| `npm run docs:check` | Markdown 상대 파일 링크·닫힌 코드 블록 |
| `npm test` | Node 환경의 `.test.ts` 단위·회귀 테스트 |
| `npm run test:e2e` | 지도 키 없는 빌드를 preview 서버로 띄워 Playwright로 검색·계산·후보·주소 복원·공유·모바일 패널 확인 |
| `npx vite build --mode pages` | 운영 `/subway-midpoint/` 경로 빌드 |
| `npx vite build --mode pages-dev` | 개발 `/subway-midpoint/dev/` 경로 빌드 |

Playwright 테스트는 [e2e/](../e2e/)에 있고 설정은 [playwright.config.ts](../playwright.config.ts)입니다. 처음 실행하는 환경에서는 `npx playwright install chromium`으로 브라우저를 받습니다. 실제 한글 IME 조합, 시스템 테마, 지도 키가 있는 렌더링은 수동으로 확인합니다. 실행 범위는 [검증 기록](VALIDATION.md)을 기준으로 읽습니다.
