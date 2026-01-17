[상세 명세서 v2.2] Project: Vibe-Floorplan (Video-to-2D)

📋 문서 정보

최종 수정일: 2026-01-17

버전: v2.2 (v2.1 기반 + 외부 초안 통합 및 보완)

주요 업데이트: 인프라 통합(Redis/Queue), 상세 데이터 스키마 확립, 프롬프트 전략 고도화, QA/성능 체크리스트 추가, 에이전트 개발 규칙 명시

1. 시스템 아키텍처 (System Architecture)

1.1 기술 스택

Frontend: Next.js 14+ (App Router), Tailwind CSS, Lucide React, Framer Motion

Backend: Next.js Server Actions, Gemini 3 Pro SDK

Orchestration: Google Antigravity (Mission Control)

Auth: Clerk 또는 NextAuth (사용자별 분석 이력 관리)

State Management: React Context API + Zustand (복잡한 편집 상태 관리)

Queue/Cache: Upstash Redis (비동기 작업 큐 및 분석 결과 캐싱)

Database: PostgreSQL (Prisma/Drizzle ORM 활용)

Storage: Vercel Blob Storage (영상 파일 임시 저장)

1.2 인프라 구성도

[Client Browser] ↔ [Next.js App (Vercel)] ↔ [Auth (Clerk)]
                        ↓
        [Vercel Blob (Video Storage)]
                        ↓
    [Job Queue (Redis)] → [Worker (Gemini 3 Pro)]
                        ↓
        [PostgreSQL (Spatial Data)] ↔ [Client (Polling/Webhook)]


2. 데이터 및 좌표계 정의 (Data & Coordinates)

2.1 좌표 정규화 로직

원점(Origin): 평면도의 좌상단(Min X, Min Y)을 (0,0)으로 재설정.

단위: cm 고정 (국내 가구 규격 반영).

스케일링: Canvas_px = (Real_cm * Zoom_Level) + Offset

2.2 확장된 Spatial Data 스키마 (JSON)

{
  "version": "1.0",
  "metadata": {
    "unit": "cm",
    "estimated_accuracy": 0.85,
    "video_duration_sec": 45,
    "total_area_sqm": 85.5,
    "floor_level": 1
  },
  "rooms": [
    {
      "id": "room_01",
      "type": "living_room",
      "vertices": [[0, 0], [500, 0], [500, 400], [0, 400]],
      "is_closed": true,
      "confidence_score": 0.92,
      "objects": [
        { "type": "door", "pos": [120, 0], "width": 90, "connects_to": "room_02" },
        { "type": "window", "pos": [500, 200], "width": 150 }
      ],
      "furniture": [
        { "type": "sofa", "pos": [250, 200], "dimensions": [180, 90], "rotation": 0 }
      ]
    }
  ],
  "quality_metrics": {
    "video_clarity": 0.9,
    "lighting": 0.8,
    "coverage": 0.95
  }
}


3. 핵심 모듈별 상세 요구사항

모듈 1: 비동기 분석 파이프라인 (Gemini 3 Pro)

전처리: 720p 미만 영상 업로드 제한, 1fps 프레임 샘플링을 통한 토큰 최적화.

프롬프트 전략:

역할: 실내 공간 분석 및 건축 데이터 추출 전문가.

지시: 영상에서 벽면 연결 상태를 파악하여 시계방향 좌표로 추출. 문, 창문, 주요 가구 식별.

출력: 반드시 정의된 JSON 스키마를 엄수하며, 좌표는 양수여야 함.

에러 처리: API 타임아웃 시 3회 재시도(Exponential Backoff).

모듈 2: 2D Floorplan 렌더링 및 편집 (Frontend)

렌더링: SVG 기반 폴리곤 렌더링. react-zoom-pan-pinch로 인터랙션 구현.

Edit Mode (수정 기능):

Wall Dragging: 벽면 및 정점(Vertex) 마우스 드래그 이동.

Snapping: 벽면 수정 시 90도 직각 유지 및 인접 벽면 자석 효과.

Library: 인식되지 않은 가구/문을 드래그 앤 드롭으로 추가.

모듈 3: SSR & Hydration

SSR: 분석 완료 시 데이터베이스에서 JSON을 가져와 SVG의 골격(Skeleton)을 미리 렌더링하여 SEO 및 초기 속도 확보.

Client: 하이드레이션 이후 줌/팬 및 수정 이벤트 활성화.

4. Antigravity 미션 제어 (Mission Control)

[MISSION 1: INFRA & AUTH]

Task: Next.js 14 프로젝트 초기화, Prisma 설정, Clerk 인증 연동, Tailwind 커스텀 테마 설정.

[MISSION 2: ANALYSIS PIPELINE]

Task: Vercel Blob 업로드 액션, Upstash Redis 큐 구성, Gemini 3 Pro SDK 연결 및 프롬프트 서비스 작성.

[MISSION 3: INTERACTIVE RENDERER]

Task: SVG 기반 렌더링 컴포넌트 개발, 편집 모드(Drag/Snap) 로직 구현, 수정 데이터 저장 API 작성.

5. 품질 및 위험 관리

5.1 성능 최적화

대용량 JSON 파싱 시 Web Worker 활용.

SVG 렌더링 시 requestAnimationFrame 적용하여 부드러운 이동 보장.

5.2 보안 및 프라이버시

영상 분석 직후 서버 내 임시 파일 즉시 삭제.

얼굴/개인정보 포함 시 비식별화 로직(Gemini 지시어에 포함) 강화.

6. 에이전트 개발 규칙 (Agent Development Rules)

6.1 코드 작성 원칙

모듈화: 모든 기능은 독립적인 컴포넌트나 유틸리티 함수로 분리한다. (Single Responsibility Principle)

타입 안전성: 모든 데이터 구조에 대해 TypeScript 인터페이스를 정의하고 any 사용을 지양한다.

에러 핸들링: 모든 Server Action 및 API 호출에는 try-catch 블록과 사용자 알림 로직을 포함한다.

6.2 데이터 일관성 준수

좌표계 유지: 모든 공간 계산은 섹션 2에서 정의한 cm 단위와 좌상단 원점 규칙을 반드시 따른다.

스키마 엄격 검증: Gemini API의 응답은 렌더링 전 반드시 Zod 또는 JSON Schema를 통해 유효성을 검사한다.

6.3 작업 프로세스

Context 복기: 매 미션 시작 전, vibe_floorplan_spec_v2.2.md의 전체 내용을 요약 확인하여 이전 작업과의 정렬 상태를 체크한다.

Incremental 커밋: 기능 단위로 코드를 생성하고, 변경 사항에 대한 명확한 이유를 주석으로 남긴다.

QA 자가 진단: 코드를 제출하기 전, 섹션 5의 성능 최적화 및 보안 규칙을 준수했는지 스스로 검증한다.

7. 결론 및 실행 우선순위

단위 시스템: cm 고정.

좌표 원점: 좌상단(0,0) 기준.

저장 정책: 분석 결과는 영구 저장, 원본 영상은 24시간 후 삭제.

🚀 다음 단계: Antigravity 에이전트에게 **[MISSION 1]**을 전달하여 프로젝트 골격을 생성합니다.