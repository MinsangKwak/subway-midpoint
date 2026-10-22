# 이미지 안내

[실행 화면](../../README.md#실행-화면) · [검증 기록](../VALIDATION.md)

**캡처는 실제 앱 동작, 도식은 코드 구조와 사용 순서를 설명합니다.** 지도 타일이나 경로를 합성한 실행 화면은 사용하지 않습니다.

| 파일 | 용도·생성 기준 |
|---|---|
| [planner-result.png](planner-result.png) | 2026-10-22 로컬 main 기준 코드에서 검색·계산한 실제 데스크톱 패널 |
| [planner-mobile.png](planner-mobile.png) | 같은 코드의 390×844 모바일 화면, 지도 키 없이 실행 |
| [user-flow.png](user-flow.png) | 출발역 선택·계산·후보 비교·텍스트 공유의 설명 도식 |
| [architecture.png](architecture.png) | 데이터 생성과 브라우저 계산·카드·지도 연결 도식 |
| [user-flow.svg](../diagrams/user-flow.svg) | 사용 흐름 도식의 수정 가능한 원본 |
| [architecture.svg](../diagrams/architecture.svg) | 구조 도식의 수정 가능한 원본 |

로컬 캡처에는 지도 키를 설정하지 않았습니다. 지도 API 인증·타일·경로 렌더링 성공의 근거로 사용하지 않습니다. 키 없이도 검색·계산·후보 카드가 동작하는 범위를 보여줍니다.

입력 항목·후보 규칙·공유 기능·폴더 연결이 달라지면 도식도 함께 수정합니다. SVG 원본에서 텍스트와 선을 수정한 뒤 PNG로 렌더링하고, README 크기에서 글자와 선이 읽히는지 확인합니다.
