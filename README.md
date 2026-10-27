# Subway Midpoint · 어디서 만날까요?

**‘공평한 중간지점’을 계산 기준으로 정의하고, 추천 결과를 React 화면·지도·공유 주소까지 연결한 개인 프로젝트입니다.**

서로 다른 출발역 2~6곳을 선택하면 가장 오래 이동하는 사람의 예상 시간을 줄이는 역을 추천합니다. 상위 후보 3개의 개인별 시간·환승 횟수를 비교하고, 선택한 결과를 같은 조건으로 다시 열 수 있는 주소로 공유합니다.

[서비스 열기](https://minsangkwak.github.io/subway-midpoint/) · [개발 미리보기](https://minsangkwak.github.io/subway-midpoint/dev/) · [노션 포트폴리오](https://www.notion.so/3e7cbbdd109b81d59d04d5f472db58cb) · [문서 모음](docs/README.md)

## 먼저 봐주셨으면 하는 경험

금융 서비스 UI 실무에서 다뤄 온 화면·상태 관리 경험을 바탕으로, 이 프로젝트에서는 **모호한 요구를 데이터와 알고리즘으로 구체화하는 과정**에 집중했습니다. 기획, 데이터 설계, 프론트엔드, UI·접근성, 검증·배포를 직접 맡았습니다.

| 확인할 역량 | 해결한 문제 | 구현 근거 |
| --- | --- | --- |
| 문제 정의 | 지도 가운데가 아닌 최대 예상 이동시간을 기준으로 추천 | [계산 기준과 설계 판단](docs/PROJECT.md) |
| 데이터 모델링 | 분기 노선의 잘못된 연결과 신촌·양평 동명이역의 오결합 방지 | [그래프](src/domain/subway/graph.ts) · [데이터 테스트](src/data/subway/stations.test.ts) |
| 계산과 성능 | 점수로 후보를 먼저 정렬하고 상위 후보만 경로 복원 | [추천 알고리즘](src/domain/subway/midpoint.ts) · [측정 조건](docs/VALIDATION.md#성능-측정) |
| 프론트엔드 상태 설계 | 입력 변경 시 결과 무효화, 공유 URL로 입력·후보 복원 | [reducer](src/features/planner/model/plannerReducer.ts) · [URL 상태](src/features/planner/model/urlState.ts) |
| UI 품질과 운영 | 키보드·한글 입력 대응, 지도 실패 시 계산 유지, 브라우저 회귀 검사 | [검색 입력](src/features/planner/ui/DepartureField.tsx) · [검증 기록](docs/VALIDATION.md) |

**추천하는 읽기 순서:** 이 README에서 서비스와 기여 범위를 확인한 뒤 [프로젝트 설명](docs/PROJECT.md)에서 판단 과정을, [검증 기록](docs/VALIDATION.md)에서 근거와 한계를 확인해 주세요.

## 현재 구현 범위

| 항목 | 범위 |
| --- | --- |
| 데이터 | 수도권 전철 13개 노선·509역, 노선별 노드 606개·운행 구간 149개 |
| 노선 | 1~9호선·신분당선·경의중앙선·수인분당선·공항철도 |
| 입력·결과 | 서로 다른 출발역 2~6곳, 추천역을 포함한 상위 후보 3개 |
| 공유 | 출발역 키와 후보 인덱스를 URL에 저장하고 첫 로드에서 복원 |
| 검증 기록 | 2026-10-27: Vitest 8개 파일·53개, Playwright 12개 |
| 주요 기술 | React 19 · TypeScript · Vite 7 · CSS Modules · Kakao Maps · OSM · GitHub Actions |

검증 수치는 [기존 실행 기록과 CI 근거](docs/VALIDATION.md)에 연결했습니다. 시간은 거리와 환승 비용으로 계산한 추정값입니다.

## 실행 화면

판교(신분당선)·일산(경의중앙선)·잠실(2·8호선)에서 출발한 결과입니다. 지도 키를 설정한 로컬 빌드에서 캡처했으며, 지도 위 선은 각 출발지에서 추천역까지의 경유역을 이은 경로입니다.

![판교·일산·잠실 출발 시 이촌역을 추천하고 개인별 시간·환승 횟수와 지도 경로를 보여주는 실행 화면](docs/images/planner-result.png)

<details>
<summary>모바일 화면 보기</summary>

모바일에서는 하단 패널을 접고 펼칠 수 있습니다. 서울대입구·강남에서 출발한 결과입니다.

![하단 패널로 검색과 계산 결과를 확인하는 모바일 실행 화면](docs/images/planner-mobile.png)

</details>

## 사용 흐름

![출발역 선택부터 중간지점 계산, 후보 비교와 주소 공유까지의 사용 흐름](docs/images/user-flow.png)

1. **역 선택:** 자동완성에서 출발역을 고릅니다. 필요하면 최대 6곳까지 추가합니다.
2. **계산:** 출발역을 제외한 후보 중 최대 예상 시간이 작은 역을 찾습니다.
3. **비교:** 추천역과 대안 두 곳의 개인별 시간·환승 횟수를 확인합니다. 후보를 바꾸면 지도 경로도 바뀝니다.
4. **공유:** 결과 텍스트와 함께 `?from=판교,일산,잠실&pick=1` 형태의 주소를 전달합니다. 받는 사람은 같은 조건과 선택 후보로 바로 엽니다.

## 추천 기준

후보 A의 예상 시간이 20분·40분이고 후보 B가 32분·32분이면 B를 먼저 추천합니다. 총합보다 **가장 오래 걸리는 사람의 부담**을 우선하기 때문입니다. 실제 역이 아닌 기준 설명용 예시입니다.

1. 출발지별 최단 예상 시간의 최댓값이 작은 역을 고릅니다.
2. 최댓값이 같으면 전체 시간 합계, 그다음 한국어 역 이름순으로 정렬합니다.
3. 출발역과 모든 출발지에서 도달할 수 없는 역은 후보에서 제외합니다.

다익스트라는 출발지마다 수행합니다. 환승역에서 출발할 때는 해당 역의 여러 노선 노드를 비용 0으로 시작합니다. 구체적인 가중치와 데이터 생성 규칙은 [개발 가이드](docs/DEVELOPMENT.md#계산-기준)에 있습니다.

## 담당 역할

1인 프로젝트로 기획부터 배포까지 맡았습니다. 각 역할의 산출물은 아래 링크에서 확인할 수 있습니다.

| 역할 | 한 일 | 산출물 |
|---|---|---|
| 기획·계산 기준 | "공평함"을 최대 예상 시간 최소화로 정의, 동점 처리와 출발역 제외 규칙 결정 | [프로젝트 설명](docs/PROJECT.md) · [계산 기준](docs/DEVELOPMENT.md#계산-기준) |
| 데이터 | OpenStreetMap 노선 관계 수집·정제 스크립트, 이름만 같은 역 분리, 생성 데이터 회귀 테스트 | [생성 스크립트](scripts/fetch-stations.mjs) · [데이터 테스트](src/data/subway/stations.test.ts) |
| 프론트엔드 | React 19·TypeScript, reducer 기반 입력 상태, URL 상태 복원, Kakao Maps 연동 | [planner](src/features/planner/) · [map](src/features/map/) |
| UX/UI·접근성 | 안내 사인 모티프 토큰, CSS Modules, 모바일 하단 패널, ARIA combobox·tab 패턴, 한글 IME 처리 | [토큰](src/app/styles/tokens.css) · [검색 입력](src/features/planner/ui/DepartureField.tsx) |
| 품질·운영 | Vitest 단위·회귀 테스트, Playwright 브라우저 테스트, GitHub Actions CI, 운영·개발 Pages 배포 | [CI](.github/workflows/ci.yml) · [e2e](e2e/) · [검증 기록](docs/VALIDATION.md) |

## 화면과 계산을 연결한 구조

![미리 생성한 역 데이터로 브라우저에서 계산하고 React 카드와 Kakao 지도에 전달하는 구조](docs/images/architecture.png)

역 데이터는 개발 단계에서 생성해 앱에 포함합니다. 검색·계산 때마다 외부 데이터 API를 호출하지 않으며, 추천은 브라우저에서 실행합니다. 계산 코드는 React와 지도 SDK에 의존하지 않고, `App`이 결과를 카드와 지도에 전달합니다.

지도 키가 없거나 SDK 로딩이 실패해도 출발역 검색과 결과 비교를 사용할 수 있습니다. [아키텍처](docs/ARCHITECTURE.md)에서 책임과 오류 처리 경계를 확인할 수 있습니다.

## 직접 실행하기

Node.js 22 이상에서 실행합니다.

```bash
npm ci
npm run dev
```

[로컬 앱](http://localhost:5173/)에서 지도 키 없이 검색·계산을 확인할 수 있습니다. 지도 설정은 [운영 가이드](docs/OPERATIONS.md#지도-설정)를 참고해 주세요.

```bash
npm run check
npx playwright install chromium
npm run test:e2e
```

`check`는 lint·타입·단위 테스트·문서 링크·빌드를 실행합니다. Playwright는 지도 키 없는 preview 빌드에서 검색·계산·공유·모바일 흐름을 확인합니다.

## 현재 한계

- 시간은 평균 속도 32km/h, 역 간 최소 1.5분, 환승 5분으로 추정합니다. 실제 시각표·열차 대기·역별 환승 동선은 반영하지 않습니다.
- 최대 시간 최소화가 모든 사람의 이동시간을 같게 만들지는 않습니다.
- 지도 경로는 경유역 좌표를 이은 선이며 실제 철도 선형과 다릅니다.
- 급행·직통과 13개 노선 밖의 광역·경전철은 범위 밖입니다. 공용 승강장 구간에도 노선 변경 시 환승 5분을 적용합니다.
- 운영 도메인의 지도 인증, 실기기 IME·스크린리더·공유 시트는 [자동 검사와 별도의 확인 항목](docs/VALIDATION.md#확인하지-않은-범위)입니다.

<details>
<summary>변경 이력과 설계 과정</summary>

## 변경 이력에서 볼 수 있는 설계 과정

| 시기 | 변경 | 배운 점 |
|---|---|---|
| 2026-02 | [초기 React 앱과 Kakao 지도 연동](https://github.com/MinsangKwak/subway-midpoint/commit/bd44c9e) | 지도 SDK 로딩과 React 렌더링 순서가 꼬이면 마커가 사라졌다. 로더를 분리하고 상태를 나누는 계기 |
| 2026-09 | [앱 구조·디자인·도구·배포 재구축](https://github.com/MinsangKwak/subway-midpoint/commit/ccc30ce) | 계산을 `domain`으로 분리하고 ESLint import 경계를 두어 지도 없이도 테스트할 수 있게 함 |
| 2026-09 | [OSM 기반 1~9호선 데이터 생성](https://github.com/MinsangKwak/subway-midpoint/commit/e9a5985) | 역 배열 순서로 연결하던 방식이 1호선 분기에서 틀렸다. 운행 구간(`LINE_SEGMENTS`)을 도입하고 구로 경유 회귀 테스트를 추가 |
| 2026-10 | [문서를 docs로 통합](https://github.com/MinsangKwak/subway-midpoint/commit/88baf09), [구직용 문서 개편](https://github.com/MinsangKwak/subway-midpoint/commit/ab01738) | 측정하지 않은 성과는 적지 않고, 확인한 범위와 확인하지 못한 범위를 구분해 기록 |
| 2026-10 | [환승 별칭 역 표시 오류 수정과 상위 후보만 경로 복원](https://github.com/MinsangKwak/subway-midpoint/commit/538fe98) | 이수역이 후보가 되면 "총신대입구 4호선"으로 보였다. 이름 대신 역 키로 통일하고, 기존 로컬 측정에서 6인 계산 17.8ms → 2.3ms 기록(데이터 범위가 다른 비교; 검증 문서 참고) |
| 2026-10 | [신분당·경의중앙·수인분당·공항철도 추가](https://github.com/MinsangKwak/subway-midpoint/commit/9c5fd54) | 같은 이름의 다른 역(신촌·양평)이 환승역으로 묶이는 문제를 거리 검사로 잡아 분리 |
| 2026-10 | [URL 상태 복원과 공유 주소](https://github.com/MinsangKwak/subway-midpoint/commit/cd12cc4), [Playwright 테스트를 CI에 추가](https://github.com/MinsangKwak/subway-midpoint/commit/5af4a34) | 수동으로 확인하던 브라우저 흐름을 자동 검사로 옮김 |

</details>

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

## 이용 조건

- 코드는 [MIT 라이선스](LICENSE)로 공개합니다.
- 역 데이터의 출처는 [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)이며 [ODbL](https://opendatacommons.org/licenses/odbl/) 조건을 따릅니다. 앱 화면 하단에 출처를 표기합니다.
- 지도 타일과 SDK는 [Kakao Maps API](https://apis.map.kakao.com/) 이용 약관을 따릅니다. JavaScript 키는 허용 도메인으로 보호하며 저장소에 두지 않습니다.
- 노선 상징색은 각 운영사의 안내 체계를 참고한 값이며, 운영사와는 무관한 개인 프로젝트입니다.

