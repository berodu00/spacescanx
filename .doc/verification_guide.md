# SpaceScanX 수동 검증 가이드 (Manual Verification Guide)

이 문서는 SpaceScanX (Vibe-Floorplan) 프로젝트의 최종 수동 점검을 위한 체크리스트입니다.

## 1. 인프라 점검 (Infrastructure)
- [x] **Docker 컨테이너**: `docker ps` 명령어로 `spacescanx_db` (Postgres) 컨테이너가 실행 중인지 확인.
- [x] **Next.js 서버**: `localhost:3000` 접속 확인.
- [x] **로그인**: Clerk 인증이 정상 작동하는지 (또는 개발 모드 우회) 확인.

## 2. 미션 1: 기본 기능 (Basic Functions)
- [x] **메인 페이지**: 접속 시 헤더, 푸터, 메인 콘텐츠가 정상적으로 렌더링되는지 확인.
- [x] **업로드 페이지**: `/upload` 페이지 접근 가능 여부 확인.

## 3. 미션 2: 분석 파이프라인 (Analysis Pipeline)
- [x] **비디오 업로드**:
    - [ ] `mp4` 파일 업로드 시도 (예: `video1.mp4`).
    - [ ] 업로드 게이지가 정상적으로 표시되는지 확인.
    - [ ] 업로드 완료 후 결과 페이지(`/results/[jobId]`)로 리다이렉트 되는지 확인.
- [ ] **분석 상태**:
    - [ ] 결과 페이지에서 상태가 `processing` -> `completed`로 변경되는지 확인 (Mock 또는 실제 API).
    - [ ] **Debug Info**: 화면 좌측 하단 디버그 패널 확인.
        - [ ] "MOCK DATA" 또는 "REAL GEMINI DATA" 뱃지 확인.
        - [ ] "View Raw Output"을 클릭하여 Gemini 응답(또는 오류) 확인.

## 4. 미션 3: 인터랙티브 렌더러 (Interactive Renderer)
- [ ] **렌더링**:
    - [ ] 평면도(벽, 문, 창문, 가구)가 SVG로 정상적으로 그려지는지 확인.
    - [ ] 초기 로드 시 평면도가 화면 중앙에 위치하는지 확인.
- [ ] **상호작용 (Interaction)**:
    - [ ] **줌/팬**: 마우스 휠로 확대/축소, 드래그로 이동 기능 확인.
    - [ ] **편집 모드**: '수정 모드' 진입 가능 여부 확인.
    - [ ] **드래그**: 가구 아이템을 드래그하여 위치 이동 가능 확인.
    - [ ] **스냅**: 벽면 근처 이동 시 스냅(자석) 효과 작동 확인.
- [ ] **저장**:
    - [ ] 수정 후 '저장하기' 버튼 클릭 시 정상 저장(Toast 메시지 등) 확인.
    - [ ] 페이지 새로고침 후 수정된 위치가 유지되는지 확인.

## 5. 트러블슈팅 (Troubleshooting)
- **DB 연결 오류**: `docker-compose logs postgres` 확인.
- **분석 멈춤**: `npm run dev` 터미널 로그에서 Worker 오류 확인.
