# 구현 계획 - 미션 2: 분석 파이프라인

## 목표 설명
비디오 업로드 및 비동기 분석 처리를 위한 파이프라인을 구축합니다. `Vercel Blob`에 영상을 저장하고, `Upstash Redis`를 통해 작업을 큐에 넣은 뒤, `Gemini 3 Pro`가 이를 분석하도록 구현합니다.

## 사용자 검토 필요
> [!IMPORTANT]
> **.env 파일에 다음 키들이 추가로 필요합니다:**
> 1. `BLOB_READ_WRITE_TOKEN`: Vercel Blob 스토리지 토큰
> 2. `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis 연결 정보
> 3. `GEMINI_API_KEY`: Google AI Studio API 키

## 제안된 변경 사항

### 의존성 설치
- `npm install @vercel/blob @upstash/redis @google/generative-ai`
- `npm install -D encoding` (Redis 호환성용, 필요시)

### 1. 스토리지 및 큐 설정 (Infra)
#### [NEW] [lib/redis.ts](file:///d:/berodu/SpaceScanX/lib/redis.ts)
- Upstash Redis 클라이언트 인스턴스 초기화.

#### [NEW] [lib/storage.ts](file:///d:/berodu/SpaceScanX/lib/storage.ts)
- Vercel Blob 업로드/삭제 유틸리티 함수.

### 2. 비디오 업로드 액션
#### [NEW] [actions/upload.ts](file:///d:/berodu/SpaceScanX/actions/upload.ts)
- Server Action 작성: 클라이언트에서 파일 업로드 요청 처리.
- 업로드 완료 후 Redis Queue(`analysis-queue`)에 작업 ID `LPUSH`.

### 3. Gemini 분석 모듈
#### [NEW] [lib/gemini.ts](file:///d:/berodu/SpaceScanX/lib/gemini.ts)
- Gemini Pro Vision 모델 초기화.
- `techspec.md`에 정의된 프롬프트 관리.

### 4. 작업 처리기 (Mock Worker)
#### [NEW] [app/api/worker/route.ts](file:///d:/berodu/SpaceScanX/app/api/worker/route.ts)
- (임시) Next.js API Route로 워커 트리거 엔드포인트 생성 (추후 Vercel CRON 등으로 대체 가능).
- Redis에서 작업을 꺼내(`RPOP`) Gemini 분석 실행 로직 시뮬레이션.

## 검증 계획

### 수동 검증
1. **API 키 설정 확인**: `.env` 파일 업데이트.
2. **업로드 테스트**: 간단한 UI 버튼을 만들어 파일을 업로드하고 Vercel 대시보드에서 확인.
3. **큐 테스트**: Redis 콘솔에서 업로드 후 키가 생성되었는지 확인.
4. **Gemini 연결**: 샘플 텍스트/이미지로 API 호출 성공 로그 확인.
