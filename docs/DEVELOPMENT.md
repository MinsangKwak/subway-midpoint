# 개발 가이드

[프로젝트 소개](../README.md) · [운영·배포](OPERATIONS.md)

계산 기준, 데이터 구조와 화면 상태를 코드와 함께 설명합니다. 문서 기준은 2026-09-27입니다.

## 계산 흐름

1. 선택한 역을 노선별 노드 ID 묶음으로 변환합니다.
2. 각 출발지에서 다익스트라로 모든 노드까지의 최단 예상 시간을 계산합니다.
3. 모든 출발지에서 도달할 수 있는 역을 후보로 모읍니다. 출발역 자체는 제외합니다.
4. 최대 예상 시간 → 전체 시간 합계 → 역 이름순으로 정렬합니다.
5. 상위 3개 후보의 경로를 복원하고 시간·환승 횟수·좌표를 결과로 반환합니다.

예를 들어 두 후보의 예상 시간이 각각 `20분·40분`, `32분·32분`이라면 최댓값이 더 작은 두 번째 후보를 먼저 추천합니다. 합계보다 가장 오래 이동하는 사람의 부담을 우선하는 **minimax** 기준입니다.

구현: [midpoint.ts](../src/domain/subway/midpoint.ts)

## 그래프와 시간 가중치

| 요소 | 표현과 역할 |
| --- | --- |
| 역 노드 | 같은 환승역이라도 노선별 노드 유지 |
| 운행 구간 | `LINE_SEGMENTS`의 인접 역을 양방향으로 연결. 분기를 별도 구간으로 표현 |
| 순환 | 구간의 `loop`가 지정되면 끝과 시작을 연결. 생성 데이터는 원본 정차 순서의 연결을 사용 |
| 환승 간선 | 정규화된 역 이름 또는 `transferName`으로 묶인 서로 다른 노선 연결 |
| 이동 비용 | `max(1.5, haversine 거리(km) / 32 × 60)`분 |
| 환승 비용 | 노선 변경당 5분 |

그래프 생성 시 중복 노드 ID, 존재하지 않는 역 참조, 구간과 다른 노선의 역을 검사합니다. 입력 배열의 정렬 순서가 노선 연결을 결정하지 않습니다.

다익스트라는 이진 최소 힙을 사용하며, 이미 더 짧은 경로가 발견된 오래된 힙 항목은 건너뜁니다. 환승역 출발 시 모든 노선 노드를 비용 0의 출발점으로 넣어 첫 노선 선택에 환승 비용을 부과하지 않습니다. 후보에 도착할 때도 해당 역의 노드 중 가장 빨리 도달하는 노드를 선택합니다.

구현: [graph.ts](../src/domain/subway/graph.ts) · [dijkstra.ts](../src/domain/subway/dijkstra.ts) · [geo.ts](../src/domain/subway/geo.ts)

## 역 데이터

[stations.ts](../src/data/subway/stations.ts)는 생성 파일입니다. 데이터를 바꿀 때는 [생성 스크립트](../scripts/fetch-stations.mjs)의 정제 규칙을 수정하고 다시 생성합니다.

```bash
npm run data:stations
# 마지막으로 받은 원본 응답을 재사용할 때
node scripts/fetch-stations.mjs --cached
npm test
```

캐시는 `.cache/overpass-lines-1-9.json`에 저장합니다. 캐시가 없으면 `--cached`를 사용해도 새로 요청합니다. 최초 수집에는 네트워크가 필요하며, 실패 시 다른 Overpass 서버로 재시도합니다.

| 원본 데이터의 조건 | 정제 방식 |
| --- | --- |
| 노선별 운행 순서 | OSM `route=subway`, ref 1~9 관계의 정차 순서로 구간 생성 |
| 급행·특급 관계 | 일반 노선에 정차역을 건너뛰는 간선이 생기지 않도록 제외 |
| 괄호가 붙은 역 이름 | 표시 이름에서는 부기를 제거하고 원래 표기는 검색 별칭으로 보존 |
| 같은 노선의 중복 역 | 정규화 이름으로 통합하고 연속된 중복 정차 노드는 한 번만 반영 |
| 총신대입구·이수 | `transferName`으로 환승 묶음 구성 |

생성 스크립트는 노선별 끝 역을 출력합니다. [데이터 테스트](../src/data/subway/stations.test.ts)는 노선 범위, 중복 이름, 좌표·참조 무결성, 종점과 주요 환승역을 검사합니다. 원본 갱신 후 실패하면 정답 목록부터 바꾸지 말고 실제 노선 변경인지 데이터 누락인지 먼저 확인합니다.

출처는 [OpenStreetMap](https://www.openstreetmap.org/copyright), 데이터 라이선스는 ODbL입니다. 화면의 기여자 표기를 유지하고 데이터 재배포 시 해당 이용 조건을 확인합니다.

## 화면 상태와 접근성

계산은 `domain/subway`, 데이터는 `data/subway`, 화면은 `features`로 분리합니다. [usePlanner](../src/features/planner/usePlanner.ts)가 계산과 화면 상태를 연결합니다.

- [reducer](../src/features/planner/plannerReducer.ts)는 출발지 추가·삭제·입력·선택·후보 변경을 처리합니다. 입력 조건이 바뀌면 결과와 오류를 초기화합니다.
- 출발지는 최소 2칸, 최대 6칸입니다. 선택된 서로 다른 역이 2곳 이상일 때 계산할 수 있습니다.
- [검색 입력](../src/features/planner/DepartureField.tsx)은 combobox·listbox·option과 ARIA 상태를 사용합니다. 방향키, Enter, Escape를 지원하며 한글 조합 중 Enter는 역 선택으로 처리하지 않습니다.
- 검색어 강조는 문자열을 분리한 React 요소로 표현합니다. 사용자 검색어를 HTML로 삽입하지 않습니다.
- [표시 함수](../src/lib/format.ts)는 유효하지 않은 시간·환승 값을 `—`로 표시합니다.
- [지도 로더](../src/features/map/kakaoLoader.ts)는 공유 Promise로 SDK 로딩 요청을 모읍니다. 지도 표시 실패와 중간지점 계산은 별도 흐름입니다.

## 검증

| 명령 | 확인 내용 |
| --- | --- |
| `npm run lint` | ESLint 9 flat config 기반 검사 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest 단위·회귀 테스트 |
| `npm run build` | 타입 검사 후 루트 경로 Vite 빌드 |
| `npm run check` | lint·타입·테스트·루트 경로 빌드 |
| `npx vite build --mode pages` | `/subway-midpoint/` 운영 경로 빌드 |
| `npx vite build --mode pages-dev` | `/subway-midpoint/dev/` 미리보기 경로 빌드 |

대표 회귀 사례는 의정부 경로가 가산디지털단지로 바로 연결되지 않고 구로를 거치는지, 환승역 출발 비용이 불필요하게 추가되지 않는지, 생성 데이터의 종점과 환승 묶음이 유지되는지입니다.

브라우저에서는 다음 흐름을 별도로 확인합니다.

1. 키보드와 한글 입력으로 역 검색·선택·지우기
2. 출발지 추가·삭제와 입력 변경 후 이전 결과 초기화
3. 후보 전환 시 시간·환승 횟수·지도 경로 동기화
4. 모바일·데스크톱, 밝은·어두운 테마의 입력과 결과 가독성
5. 지도 키 누락·SDK 실패 상태에서도 검색과 계산 사용

현재 테스트 환경은 Node이며 `.test.ts`를 실행합니다. 단위 테스트 통과만으로 브라우저 접근성이나 지도 API 정상 동작까지 검증한 것으로 보지 않습니다.
