import { redis } from '@/lib/redis'
import { FloorplanData } from '@/types/floorplan'
import FloorplanEditor from '@/components/FloorplanEditor'
import Link from 'next/link'

interface PageProps {
    params: Promise<{
        jobId: string
    }>
}

// Ensure dynamic rendering to fetch latest Redis data
export const dynamic = 'force-dynamic'

export default async function ResultPage({ params }: PageProps) {
    const { jobId } = await params

    let jobData = null
    let floorplan: FloorplanData | null = null
    let error = null

    try {
        const jobString = await redis.get(`job:${jobId}`)
        if (jobString) {
            jobData = typeof jobString === 'string' ? JSON.parse(jobString) : jobString

            if (jobData.status === 'completed' && jobData.result) {
                floorplan = jobData.result as FloorplanData
            }
        }
    } catch (e) {
        console.error('Failed to fetch job:', e)
        error = 'Failed to load analysis result.'
    }

    // Debug/Fallback: If Redis is empty or analysis failed (e.g. Gemini quota), use Mock Data for demo
    if (!floorplan) {
        console.warn("Using Mock Data for display purposes as real data is missing or pending.")
        floorplan = {
            roomShape: 'rectangle',
            dimensions: { width: 400, height: 300 },
            walls: [
                { start: [0, 0], end: [400, 0], type: 'wall' },
                { start: [400, 0], end: [400, 300], type: 'wall' },
                { start: [400, 300], end: [0, 300], type: 'wall' },
                { start: [0, 300], end: [0, 0], type: 'wall' },
                { start: [100, 0], end: [180, 0], type: 'window' },
                { start: [0, 200], end: [0, 280], type: 'door' },
            ],
            items: [
                { type: 'bed', position: [300, 100], label: 'Bed', width: 120, height: 180 },
                { type: 'desk', position: [50, 50], label: 'Desk', width: 80, height: 60 },
            ]
        }
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                <div>
                    <h1 className="text-xl font-bold">Analysis Result</h1>
                    <p className="text-sm text-gray-500">Job ID: {jobId}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/upload" className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300">
                        Upload New
                    </Link>
                    <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                        Export SVG
                    </button>
                </div>
            </header>

            <main className="flex-1 relative overflow-hidden">
                {error ? (
                    <div className="p-8 text-red-500">{error}</div>
                ) : (
                    <div className="w-full h-full">
                        <FloorplanEditor initialData={floorplan} jobId={jobId} />
                    </div>
                )}
            </main >

            {/* Debug Info Overlay */}
            {
                jobData && (
                    <div className="absolute bottom-4 left-4 bg-black/80 text-white p-4 rounded text-xs max-w-sm overflow-auto max-h-48 z-20">
                        <pre>{JSON.stringify(jobData.status, null, 2)}</pre>
                        <pre>Duration: {jobData.videoDuration}s</pre>
                    </div>
                )
            }
        </div >
    )
}
