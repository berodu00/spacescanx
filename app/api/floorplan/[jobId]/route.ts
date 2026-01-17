import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { FloorplanData } from '@/types/floorplan'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params
        const body = await request.json()
        const { data } = body as { data: FloorplanData }

        if (!data) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 })
        }

        // 1. Fetch existing job
        const jobString = await redis.get(`job:${jobId}`)
        if (!jobString) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        const job = typeof jobString === 'string' ? JSON.parse(jobString) : jobString

        // 2. Update result
        job.result = data
        job.status = 'completed' // Force status to completed so ResultPage renders it
        job.updatedAt = new Date().toISOString()

        // 3. Save back to Redis
        await redis.set(`job:${jobId}`, JSON.stringify(job))

        return NextResponse.json({ success: true, message: 'Floorplan updated successfully' })
    } catch (error) {
        console.error('Update Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
