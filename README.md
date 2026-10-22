# Subway Midpoint · 어디서 만날까요?

**서로 다른 역에서 출발하는 사람들이 만날 때, 가장 오래 이동하는 사람의 예상 시간을 줄이는 중간역 추천 서비스입니다.**

출발역 2~6곳을 선택하면 추천역과 대안 두 곳을 비교할 수 있습니다. 각자의 예상 이동시간·환승 횟수를 보여주고, 선택한 후보의 경로를 지도에 표시합니다.

[서비스 열기](https://minsangkwak.github.io/subway-midpoint/) · [개발 미리보기](https://minsangkwak.github.io/subway-midpoint/dev/) · [노션 포트폴리오](https://www.notion.so/3e7cbbdd109b81d59d04d5f472db58cb) · [문서 모음](docs/README.md)

> 살펴볼 핵심: 다중 출발점 다익스트라 · 최대 이동시간 최소화(minimax) · 노선 데이터 정제 · React 입력 상태 · 지도 실패 대응

## 어떤 서비스인가

지도의 가운데에 있는 역이 모두에게 편한 장소는 아닙니다. 분기와 환승 때문에 가까워 보이는 곳까지도 누군가는 오래 이동해야 합니다. 이 프로젝트는 **가장 오래 걸리는 사람의 예상 시간**을 우선 줄이고, 같은 조건이면 전체 시간 합계를 비교합니다.

| 입력 | 계산 | 결과 |
|---|---|---|
| 서로 다른 출발역 2~6곳 | 각 출발지의 최단 예상 시간 → 후보별 최댓값 비교 | 상위 3개 역·개인별 시간·환승 횟수·지도 경로 |

수도권 전철 **1~9호선**을 대상으로 브라우저에서 계산합니다. 시간은 역 간 거리와 환승 비용으로 추정하며 실제 시각표와 다를 수 있습니다.

## 실행 화면

실제 앱에서 역을 선택하고 계산한 결과 패널입니다. **지도 키 없이 실행한 캡처**로, 지도 API 정상 동작을 보여주는 이미지는 아닙니다.

![역 입력, 추천역, 개인별 예상 시간과 환승 횟수, 대안 후보를 보여주는 실제 결과 패널](docs/images/planner-result.png)

<details>
<summary>모바일 화면 보기</summary>

모바일에서는 하단 패널을 접고 펼칠 수 있습니다. 아래는 지도 키 없이 실행한 로컬 환경의 화면입니다.

![하단 패널로 검색과 계산 결과를 확인하는 모바일 실행 화면](docs/images/planner-mobile.png)

</details>

## 사용 흐름

![출발역 선택부터 중간지점 계산, 후보 비교와 결과 공유까지의 사용 흐름](docs/images/user-flow.png)

1. **역 선택:** 자동완성에서 출발역을 고릅니다. 필요하면 최대 6곳까지 추가합니다.
2. **계산:** 출발역을 제외한 후보 중 최대 예상 시간이 작은 역을 찾습니다.
3. **비교:** 추천역과 대안 두 곳의 개인별 시간·환승 횟수를 확인합니다.
4. **공유:** 선택한 후보의 역 이름과 개인별 결과를 공유하거나 클립보드로 복사합니다.

공유 기능은 텍스트를 전달합니다. URL로 입력 조건과 결과를 복원하는 기능은 아직 없습니다.

## 무엇을 구현했는가

| 영역 | 구현 내용 | 코드·검증 근거 |
|---|---|---|
| 노선 모델 | 역과 운행 구간을 분리해 분기·순환·환승 표현 | [그래프](src/domain/subway/graph.ts) · [테스트](src/domain/subway/graph.test.ts) |
| 추천 알고리즘 | 이진 최소 힙 다익스트라, 최대 시간 → 합계 → 역 이름순 정렬 | [후보 계산](src/domain/subway/midpoint.ts) · [회귀 테스트](src/domain/subway/midpoint.test.ts) |
| 데이터 파이프라인 | OSM 수집·급행 제외·이름 정규화·별칭 보존·생성 데이터 검증 | [생성 스크립트](scripts/fetch-stations.mjs) · [데이터 테스트](src/data/subway/stations.test.ts) |
| React 입력 상태 | reducer로 입력과 결과 관리, 조건 변경 시 이전 결과 초기화 | [reducer](src/features/planner/model/plannerReducer.ts) |
| 검색과 한글 입력 | 키보드 자동완성, ARIA 상태, IME 조합 중 Enter 오선택 방지 | [검색 입력](src/features/planner/ui/DepartureField.tsx) |
| 지도 연동 | SDK 로더 분리, 출발지·후보 경로 표시, 지도 실패 시 계산 유지 | [지도](src/features/map/ui/KakaoMap.tsx) · [SDK 로더](src/features/map/api/kakaoLoader.ts) |
| 화면 구성 | 안내 사인에서 가져온 토큰, CSS Modules, 모바일 하단 패널, 시스템 테마 | [스타일](src/app/styles/tokens.css) · [앱 조립](src/app/App.tsx) |
| 검증·배포 | Vitest 38개, lint·타입·문서 검사, 운영·개발 Pages 배포 | [검증 기록](docs/VALIDATION.md) · [운영 가이드](docs/OPERATIONS.md) |

서비스 목적과 구현 선택은 [프로젝트 설명](docs/PROJECT.md)에서 이어서 볼 수 있습니다.

## 계산과 지도는 어떻게 연결되는가

![미리 생성한 역 데이터로 브라우저에서 경로를 계산하고 React 결과 카드와 Kakao 지도에 전달하는 구조](docs/images/architecture.png)

역 데이터는 개발 단계에서 생성해 앱에 포함합니다. 사용자가 검색하거나 계산할 때 Overpass API를 호출하지 않습니다. `App`이 계산 결과를 카드와 지도에 연결하므로 **지도 SDK가 실패해도 검색과 계산을 계속 사용할 수 있습니다.**

[폴더·설정 안내](docs/STRUCTURE.md) · [의존 관계](docs/ARCHITECTURE.md) · [계산 기준](docs/DEVELOPMENT.md#계산-기준)

## 직접 실행하기

Node.js 22 이상이 필요합니다. 지도 없이 검색과 계산부터 확인할 수 있습니다.

```bash
npm ci
npm run dev
```

[http://localhost:5173/](http://localhost:5173/)에서 출발역을 선택한 뒤 **중간지점 찾기**를 누릅니다. 지도도 사용하려면 `.env.example`을 `.env`로 복사하고 `VITE_KAKAO_MAP_KEY`를 설정합니다. 로컬 도메인 등록 방법은 [지도 설정](docs/OPERATIONS.md#지도-설정)에 정리했습니다.

```bash
npm run check
```

lint → TypeScript → Vitest → 문서 링크 → 루트 경로 빌드를 실행합니다. **2026-10-22 기준 7개 파일·38개 테스트가 통과**했습니다. 운영·개발 하위 경로 빌드와 브라우저 확인 범위는 [검증 기록](docs/VALIDATION.md)에서 확인할 수 있습니다.

## 기술 구성과 범위

| 구분 | 사용 기술 |
|---|---|
| 화면 | React 19 · TypeScript · CSS Modules |
| 빌드 | Vite 7 · Node.js 22 이상 |
| 계산·데이터 | 다익스트라 · minimax · OpenStreetMap · Overpass API |
| 지도 | Kakao Maps JavaScript SDK |
| 품질·배포 | Vitest · ESLint 9 · GitHub Actions · GitHub Pages |

- **시간:** 평균 속도 32km/h, 역 간 최소 1.5분, 환승 5분을 적용합니다. 실제 열차 대기·시각표·역별 환승 동선은 반영하지 않습니다.
- **추천:** 출발역은 후보에서 제외합니다. 최대 시간 최소화가 모든 사람의 시간이 같아짐을 보장하지는 않습니다.
- **지도:** 경유역 좌표를 이은 선으로, 실제 철도 선형과 다릅니다.
- **데이터:** 1~9호선 일반 운행 범위이며 광역 노선과 급행은 포함하지 않습니다. 출처는 [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), 데이터 라이선스는 ODbL입니다.

## 문서 찾아보기

| 알고 싶은 내용 | 문서 |
|---|---|
| 서비스 목적·설계 판단·개선 내용 | [프로젝트 설명](docs/PROJECT.md) |
| 실제 폴더와 설정 파일의 역할 | [폴더·설정 안내](docs/STRUCTURE.md) |
| 기능 간 의존 관계 | [아키텍처](docs/ARCHITECTURE.md) |
| 계산·데이터 생성·화면 상태 | [개발 가이드](docs/DEVELOPMENT.md) |
| 지도 설정·배포·문제 확인 | [운영·배포](docs/OPERATIONS.md) |
| 검증 결과와 확인 범위 | [검증 기록](docs/VALIDATION.md) |
| 커밋·PR 작성과 변경 절차 | [기여 안내](docs/CONTRIBUTING.md) |
