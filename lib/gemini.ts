import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in .env')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Gemini 1.5 Pro or 3 Pro (depending on availability, usually 1.5 Pro is 'gemini-1.5-pro')
// Using 'gemini-1.5-pro' for vision capabilities as of 2024/2025 standard
export const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-09-2025' })

export const ANALYSIS_PROMPT = `
당신은 실내 건축 전문가입니다. 영상을 분석하여 2D 평면도 JSON을 생성하세요.
Markdown 없이 순수 JSON 객체만 반환해야 합니다.

[분석 요구사항]
1. 모든 단위는 'cm'이며, 좌표 [0,0]은 좌측상단입니다.
2. **스케일**: 방문(폭 90cm), 침대(200cm) 등 표준 사물을 기준으로 실제 크기를 추정하세요.
3. **가구(Items)**:
   - 모든 아이템의 실제 가로/세로 크기(dimensions)를 정확히 계산하세요.
   - 벽면과 평행하도록 회전 각도(rotation)를 0, 90, 180, 270도 단위로 입력하세요.

[출력 스키마]
{
  "roomShape": "rectangle" | "L-shape" | "polygon",
  "dimensions": { "width": number, "height": number } (전체 공간 크기),
  "walls": [
    { "start": [x1, y1], "end": [x2, y2], "type": "wall" | "window" | "door" }
  ],
  "items": [
    { 
      "type": "bed" | "desk" | "chair" | "table" | "sofa" | "door" | "window" | "unknown", 
      "position": [centerX, centerY], 
      "label": "구체적 명칭",
      "width": number,    // 필수: 가로 폭 (cm)
      "height": number,   // 필수: 세로 깊이 (cm)
      "rotation": number  // 필수: 시계방향 각도 (0~359)
    }
  ]
}

[주의]
- 벽(Walls)은 끊기지 않고 연결되어야 합니다.
- 아이템의 position은 중심점(Center) 기준입니다.
- 가상의 데이터를 넣지 말고 영상에 보이는 것만 분석하세요.
`
