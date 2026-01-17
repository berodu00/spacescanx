import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { model, ANALYSIS_PROMPT } from '@/lib/gemini'

// In a real production app, this would be a separate worker service 
// or triggered by Vercel Cron/Queues.
// For now, we simulate a worker via an API endpoint that processes one item.

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    let jobString

    if (body.debugJobId) {
      console.log(`Debug Retry for Job: ${body.debugJobId}`)
      jobString = await redis.get(`job:${body.debugJobId}`)
    } else {
      // 1. Pop job from queue
      jobString = await redis.rpop('analysis-queue')
    }

    if (!jobString) {
      return NextResponse.json({ message: 'No jobs in queue' }, { status: 200 })
    }

    const job = typeof jobString === 'string' ? JSON.parse(jobString) : jobString
    const { jobId, videoUrl } = job

    console.log(`Processing Job: ${jobId}`)

    // 2. Update status to 'processing'
    job.status = 'processing'
    await redis.set(`job:${jobId}`, JSON.stringify(job))

    // 3. Call Gemini
    // Note: Gemini 1.5 Pro via AI Studio API can ingest video via URI (if File API) or base64.
    // Since Vercel Blob URL is public, we would ideally fetch and convert to GenerativePart.
    // However, google-generative-ai file API usually requires uploading to Google first.
    // For this MVP, we will assume we can pass simpler data or we skip actual video analysis 
    // if the library complexity is high, but let's try to fetch and pass base64.

    // Fetch video from Blob
    const response = await fetch(videoUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    const result = await model.generateContent([
      ANALYSIS_PROMPT,
      {
        inlineData: {
          mimeType: 'video/mp4', // Assuming mp4 for now
          data: base64Data
        }
      }
    ]);

    const text = result.response.text();
    console.log("Gemini Output:", text);

    // [DEBUG] Store raw output
    job.rawOutput = text

    let analysisResult;
    try {
      // Simple cleanup for code blocks if present
      const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      analysisResult = JSON.parse(jsonText);
    } catch (e) {
      console.error("JSON Parse Error", e);
      // Don't fail the whole job, just set error in result
      analysisResult = null
      job.error = "Failed to parse JSON: " + (e instanceof Error ? e.message : String(e))
    }

    // 4. Save result
    job.status = 'completed'
    job.result = analysisResult // Can be null if parse failed
    job.completedAt = new Date().toISOString()

    await redis.set(`job:${jobId}`, JSON.stringify(job))

    return NextResponse.json({ success: true, jobId, result: analysisResult })

  } catch (error) {
    console.error('Worker Error:', error)
    return NextResponse.json({ success: false, error: `Worker failed: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 })
  }
}
