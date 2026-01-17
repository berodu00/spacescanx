import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in .env')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Gemini 1.5 Pro or 3 Pro (depending on availability, usually 1.5 Pro is 'gemini-1.5-pro')
// Using 'gemini-1.5-pro' for vision capabilities as of 2024/2025 standard
export const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-09-2025' })

export const ANALYSIS_PROMPT = `
Analyze the provided video of a room scan and output a structured JSON plan for a 2D floorplan.
The output MUST be a raw JSON object (no markdown, no backticks).

Structure:
{
  "roomShape": "rectangle" | "L-shape" | "polygon",
  "dimensions": { "width": number, "height": number } (approximate in cm),
  "walls": [
    { "start": [x1, y1], "end": [x2, y2], "type": "wall" | "window" | "door" }
  ],
  "items": [
    { "type": "bed" | "desk" | "chair" | "unknown", "position": [x, y], "label": string }
  ]
}

Focus on identifying corners and straight lines for walls.
Estimates coordinates relative to a top-left origin [0,0].
`
