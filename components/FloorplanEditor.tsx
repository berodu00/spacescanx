'use client'

import React, { useState } from 'react'
import { FloorplanData } from '@/types/floorplan'
import FloorplanRenderer from './FloorplanRenderer'
import ZoomableContainer from './ZoomableContainer'

interface FloorplanEditorProps {
    initialData: FloorplanData
}

export default function FloorplanEditor({ initialData }: FloorplanEditorProps) {
    const [data, setData] = useState<FloorplanData>(initialData)
    const [currentScale, setCurrentScale] = useState(1)

    const handleUpdate = (newData: FloorplanData) => {
        setData(newData)
        // TODO: Debounce and save to server
    }

    return (
        <div className="w-full h-full relative">
            <div className="absolute top-4 left-4 z-10 bg-white/90 p-2 rounded shadow text-xs">
                <p>🔧 Edit Mode Active</p>
                <p className="text-gray-500">Drag furniture to move</p>
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
