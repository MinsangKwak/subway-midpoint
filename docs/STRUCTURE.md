# 폴더·설정 안내

[저장소 홈](../README.md) · [의존 관계](ARCHITECTURE.md) · [문서 목록](README.md)

**계산 규칙 → 입력 데이터 → 사용자 기능 → 앱 조립** 순서로 읽으면 구조를 따라가기 쉽습니다. 기존 기능별 폴더를 유지하고 관련 코드·스타일·테스트를 가까이 둡니다.

## 폴더별 역할

| 경로 | 담고 있는 내용 | 읽기 시작할 파일 |
|---|---|---|
| [src/domain/subway](../src/domain/subway/) | 그래프·최단경로·추천·역 검색의 순수 로직 | [midpoint.ts](../src/domain/subway/midpoint.ts) |
| [src/data/subway](../src/data/subway/) | 생성된 역·구간, 노선 정보, 그래프·검색 카탈로그 초기화 | [index.ts](../src/data/subway/index.ts) |
| [src/features/planner/model](../src/features/planner/model/) | 출발지 상태 전이와 계산 호출 | [usePlanner.ts](../src/features/planner/model/usePlanner.ts) |
| [src/features/planner/ui](../src/features/planner/ui/) | 검색 입력·결과 카드·노선 배지 | [PlannerPanel.tsx](../src/features/planner/ui/PlannerPanel.tsx) |
| [src/features/map/api](../src/features/map/api/) | SDK 로더와 Kakao 타입 | [kakaoLoader.ts](../src/features/map/api/kakaoLoader.ts) |
| [src/features/map/ui](../src/features/map/ui/) | 지도 상태·마커·경로 표시 | [KakaoMap.tsx](../src/features/map/ui/KakaoMap.tsx) |
| [src/shared](../src/shared/) | 특정 기능에 의존하지 않는 버튼·아이콘·표시 함수 | [format.ts](../src/shared/lib/format.ts) |
| [src/app](../src/app/) | planner와 map 조립, 전역 레이아웃·토큰 | [App.tsx](../src/app/App.tsx) |
| [e2e](../e2e/) | Playwright 브라우저 테스트와 공용 조작 함수 | [planner.spec.ts](../e2e/planner.spec.ts) |
| [public](../public/) | 빌드에 그대로 복사되는 정적 파일 (링크 미리보기 이미지) | [og.png](../public/og.png) |
| [scripts](../scripts/) | 데이터 생성과 Markdown 검사 | [fetch-stations.mjs](../scripts/fetch-stations.mjs) |
| [docs](./) | 소개·설계·실행·운영·검증 문서 | [문서 목록](README.md) |
| [docs/diagrams](diagrams/) · [docs/images](images/) | 수정 가능한 SVG와 README용 PNG·실행 캡처 | [이미지 안내](images/README.md) |
| [.github](../.github/) | CI·배포와 이슈·PR 템플릿 | [ci.yml](../.github/workflows/ci.yml) |

## 설정 파일

| 파일 | 현재 책임 |
|---|---|
| [package.json](../package.json) · [package-lock.json](../package-lock.json) | 실행·검증 명령과 설치 버전 재현 |
| [.nvmrc](../.nvmrc) | Node.js 22 기준 |
| [tsconfig.json](../tsconfig.json) | TypeScript 검사와 경로 별칭 |
| [vite.config.ts](../vite.config.ts) | React SWC, `@` 별칭, 모드별 base와 `og` 절대 주소, Node 테스트 환경 |
| [playwright.config.ts](../playwright.config.ts) | 데스크톱·모바일 프로젝트, 지도 키 없는 빌드를 preview 서버로 실행 |
| [LICENSE](../LICENSE) | 코드 이용 조건 (MIT) |
| [eslint.config.js](../eslint.config.js) | 미사용 변수·Hooks·기능 간 import 경계 검사 |
| [.editorconfig](../.editorconfig) · [.prettierrc](../.prettierrc) | 들여쓰기·줄바꿈·문서 포맷 기준 |
| [.vscode/settings.json](../.vscode/settings.json) | 저장소에 공유한 편집기 설정 |
| [.env.example](../.env.example) | 지도 키와 사이트 주소 환경변수 이름, 설정 예시 |
| [.gitignore](../.gitignore) | 의존성·빌드·환경변수·원본 캐시 제외 |
| [.github/workflows/ci.yml](../.github/workflows/ci.yml) | `check`(문서·lint·타입·단위 테스트·빌드)와 `e2e`(Playwright) job |
| [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) | main·dev를 각각 빌드해 하나의 Pages 사이트로 배포 |

앱 전반에 같은 TypeScript·ESLint 설정을 적용합니다. 폴더마다 설정 파일을 추가하지 않고 import 경계로 책임을 구분합니다. 노선 배지는 노선 데이터에 의존하므로 `shared`가 아닌 planner에 둡니다.

## 파일을 추가하거나 옮길 때

- 계산 규칙은 `domain`, 생성 결과는 `data`, 입력 상태는 `planner/model`에 둡니다.
- 지도 서비스 호출과 타입은 `map/api`, 지도 표시는 `map/ui`에 둡니다.
- 단위 테스트는 구현 파일 옆에 `.test.ts`, 브라우저 테스트는 `e2e/*.spec.ts`, 컴포넌트 스타일은 CSS Modules로 둡니다.
- 파일을 옮기면 import·문서 링크를 함께 수정하고 `npm run check`를 실행합니다.

커밋은 폴더 수만큼 기계적으로 나누기보다 **독립적으로 검토할 수 있는 변경 목적**으로 나눕니다. 작성 예시는 [기여 안내](CONTRIBUTING.md#커밋과-pr)에 있습니다.
