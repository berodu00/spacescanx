'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface JobPollerProps {
    jobId: string
    initialStatus: string
}

export default function JobPoller({ jobId, initialStatus }: JobPollerProps) {
    const router = useRouter()
    const [status, setStatus] = useState(initialStatus)
    const [dots, setDots] = useState('')

    useEffect(() => {
        if (status === 'completed' || status === 'failed') return

        // 1. Polling interval
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/jobs/${jobId}`)
                if (res.ok) {
                    const data = await res.json()
                    // If status changed to completed, refresh the server component
                    if (data.status === 'completed' || data.status === 'failed') {
                        setStatus(data.status)
                        router.refresh()
                    }
                }
            } catch (e) {
                console.error("Polling error", e)
            }
        }, 3000) // Poll every 3 seconds

        // 2. Loading animation
        const dotInterval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.')
        }, 500)

        return () => {
            clearInterval(interval)
            clearInterval(dotInterval)
        }
    }, [jobId, status, router])

    if (status === 'completed' || status === 'failed') return null

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50 absolute top-0 left-0 z-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-gray-800">Analyzing Space{dots}</h2>
                <p className="text-gray-500 mt-2">Gemini AI is generating your floorplan.</p>
                <p className="text-gray-400 text-sm mt-1">This may take 15-30 seconds.</p>
            </div>
        </div>
    )
}
