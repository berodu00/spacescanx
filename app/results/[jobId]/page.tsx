import { redis } from '@/lib/redis'
import { FloorplanData } from '@/types/floorplan'
import FloorplanEditor from '@/components/FloorplanEditor'
import JobPoller from '@/components/JobPoller'
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

    // Determine if we should show the "Processing" state
    const isProcessing = jobData && (jobData.status === 'pending' || jobData.status === 'processing')
    const isFailed = jobData && jobData.status === 'failed'

    // Only fallback to mock if we have NO job data (e.g. direct visit) or it failed (showing demo)
    // If it's processing, we show the poller instead of the editor with mock data
    if (!floorplan && !isProcessing && !jobData?.error) {
        // ... (keep existing mock logic for true fallback/demo cases)
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
                { type: 'bed', position: [300, 100], label: 'Bed', width: 120, height: 200, rotation: 90 },
                { type: 'desk', position: [50, 50], label: 'Desk', width: 120, height: 60, rotation: 0 },
                { type: 'chair', position: [80, 80], label: 'Chair', width: 50, height: 50, rotation: 180 },
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
                ) : isProcessing ? (
                    <JobPoller jobId={jobId} initialStatus={jobData.status} />
                ) : (
                    <div className="w-full h-full">
                        <FloorplanEditor initialData={floorplan || { /* Minimum fallback */
                            roomShape: 'rectangle', dimensions: { width: 1, height: 1 }, walls: [], items: []
                        }} jobId={jobId} />
                    </div>
                )}
            </main >

            {/* Debug Info Overlay */}
            <div className="absolute bottom-4 left-4 z-50 max-w-lg w-full">
                {/* Status Badge */}
                <div className="mb-2">
                    {jobData?.rawOutput ? (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded border border-green-400">
                            REAL GEMINI DATA
                        </span>
                    ) : isProcessing ? (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded border border-blue-400">
                            PROCESSING...
                        </span>
                    ) : (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded border border-yellow-400">
                            MOCK DATA (Demo)
                        </span>
                    )}
                </div>

                {/* Debug Panel */}
                <div className="bg-black/80 text-white p-4 rounded text-xs overflow-auto max-h-60 shadow-lg backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-2 border-b border-gray-600 pb-1">
                        <span className="font-bold">🔍 Debug Info</span>
                        <span className={`px-2 py-0.5 rounded ${jobData?.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'}`}>
                            {jobData?.status || 'unknown'}
                        </span>
                    </div>

                    {jobData?.error && (
                        <div className="mb-2 p-2 bg-red-900/50 border border-red-500 rounded">
                            <strong className="text-red-300">Error:</strong> {jobData.error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <p><strong>Job ID:</strong> {jobId}</p>
                        <p><strong>Duration:</strong> {jobData?.videoDuration || 'N/A'}s</p>
                        <details className="mt-2">
                            <summary className="cursor-pointer hover:text-blue-300">View Raw Output</summary>
                            <pre className="mt-2 p-2 bg-gray-800 rounded whitespace-pre-wrap word-break-all text-gray-300">
                                {jobData?.rawOutput || 'No raw output available'}
                            </pre>
                        </details>
                    </div>
                </div>
            </div>
        </div >
    )
}
