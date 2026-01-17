import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params
        const jobString = await redis.get(`job:${jobId}`)

        if (!jobString) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        const job = typeof jobString === 'string' ? JSON.parse(jobString) : jobString
        return NextResponse.json(job)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
