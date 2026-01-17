'use server'

import { uploadVideo } from '@/lib/storage'
import { redis } from '@/lib/redis'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function uploadVideoAction(formData: FormData) {
    let { userId } = await auth()

    // [DEV BYPASS] Temporary mock for testing due to CAPTCHA issues
    if (!userId && process.env.NODE_ENV === 'development') {
        console.log('Using Mock User ID for development')
        userId = 'user_mock_1234'
    }

    if (!userId) {
        return { success: false, error: 'Unauthorized' }
    }

    const file = formData.get('file') as File
    if (!file) {
        return { success: false, error: 'No file provided' }
    }

    try {
        // 1. Upload to Vercel Blob
        const blob = await uploadVideo(file)

        // 2. Add job to Redis Queue
        const jobId = `job-${Date.now()}-${userId}`
        const jobData = {
            jobId,
            userId,
            videoUrl: blob.url,
            status: 'pending',
            createdAt: new Date().toISOString(),
        }

        // Push to 'analysis-queue'
        await redis.lpush('analysis-queue', JSON.stringify(jobData))

        // Optional: Store job status for frontend polling
        await redis.set(`job:${jobId}`, JSON.stringify(jobData))
        await redis.expire(`job:${jobId}`, 60 * 60 * 24) // 24 hours retention

        // [DEV TRIGER] Automatically trigger the worker in development
        // In production, this might be handled by a queue consumer or cron
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            fetch(`${baseUrl}/api/worker`, {
                method: 'POST',
                body: JSON.stringify({}),
                headers: { 'Content-Type': 'application/json' }
            }).catch(err => console.error("Failed to trigger worker:", err))
        } catch (e) {
            // Ignore trigger errors to not fail the upload
            console.error("Worker trigger failed", e)
        }

        revalidatePath('/')
        return { success: true, url: blob.url, jobId }
    } catch (error) {
        console.error('Upload Error:', error)
        return { success: false, error: 'Upload failed' }
    }
}
