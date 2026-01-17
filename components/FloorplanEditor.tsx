'use client'

import React, { useState } from 'react'
import { FloorplanData } from '@/types/floorplan'
import FloorplanRenderer from './FloorplanRenderer'
import ZoomableContainer from './ZoomableContainer'

interface FloorplanEditorProps {
    initialData: FloorplanData
    jobId?: string // Optional for mock mode, required for real saving
}

export default function FloorplanEditor({ initialData, jobId }: FloorplanEditorProps) {
    const [data, setData] = useState<FloorplanData>(initialData)
    const [currentScale, setCurrentScale] = useState(1.5) // Updated initial scale
    const [isSaving, setIsSaving] = useState(false)

    const handleUpdate = (newData: FloorplanData) => {
        setData(newData)
    }

    const handleSave = async () => {
        if (!jobId) {
            alert('Cannot save in demo/mock mode (No Job ID)')
            return
        }

        setIsSaving(true)
        try {
            const res = await fetch(`/api/floorplan/${jobId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data }),
            })

            if (!res.ok) throw new Error('Failed to save')

            alert('Floorplan saved successfully! ✅')
        } catch (error) {
            console.error(error)
            alert('Failed to save changes ❌')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="w-full h-full relative">
            <div className="absolute top-4 left-4 z-10 bg-white/90 p-3 rounded shadow text-sm flex gap-3 items-center">
                <div>
                    <p className="font-bold cursor-default">🔧 Edit Mode Active</p>
                    <p className="text-gray-500 text-xs">Drag furniture to move</p>
                </div>
                {jobId && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                )}
            </div>

            <ZoomableContainer
                initialScale={1.5}
                minScale={0.2}
                maxScale={8}
                onTransformChange={(t) => setCurrentScale(t.scale)}
            >
                <FloorplanRenderer
                    data={data}
                    scale={currentScale}
                    onUpdate={handleUpdate}
                    readOnly={false}
                />
            </ZoomableContainer>
        </div>
    )
}
