# 이미지 안내

[실행 화면](../../README.md#실행-화면) · [검증 기록](../VALIDATION.md)

**캡처는 실제 앱 동작, 도식은 코드 구조와 사용 순서를 설명합니다.** 지도 타일이나 경로를 합성한 실행 화면은 사용하지 않습니다.

| 파일 | 용도·생성 기준 |
|---|---|
| [planner-result.png](planner-result.png) | 2026-10-27 로컬 빌드(지도 키 설정)에서 `?from=판교,일산,잠실`로 복원한 1280×800 데스크톱 화면. 2배 캡처를 1600px 폭으로 줄이고 256색으로 양자화 |
| [planner-mobile.png](planner-mobile.png) | 같은 빌드에서 `?from=서울대입구,강남`을 390×844로 연 모바일 화면 |
| [user-flow.png](user-flow.png) | 출발역 선택·계산·후보 비교·주소 공유의 설명 도식 |
| [architecture.png](architecture.png) | 데이터 생성과 브라우저 계산·카드·지도 연결 도식 |
| [user-flow.svg](../diagrams/user-flow.svg) | 사용 흐름 도식의 수정 가능한 원본 |
| [architecture.svg](../diagrams/architecture.svg) | 구조 도식의 수정 가능한 원본 |
| [../../public/og.png](../../public/og.png) | 링크 미리보기용 1200×630 이미지. 데스크톱 캡처와 같은 조건 |

캡처에 쓴 JavaScript 키는 허용 도메인(`localhost:5173`)으로 제한된 값이며 저장소에 두지 않습니다. 캡처는 로컬 환경의 지도 렌더링을 보여줄 뿐 운영 도메인의 키 인증을 증명하지 않습니다.

입력 항목·후보 규칙·공유 기능·폴더 연결이 달라지면 도식도 함께 수정합니다. SVG 원본에서 텍스트와 선을 수정한 뒤 1.5배로 PNG 렌더링하고, README 크기에서 글자와 선이 읽히는지 확인합니다.
