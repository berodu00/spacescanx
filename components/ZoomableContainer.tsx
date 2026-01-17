'use client'

import React from 'react'
import { TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'

interface ZoomableContainerProps {
    children: React.ReactNode
    minScale?: number
    maxScale?: number
    initialScale?: number
    onTransformChange?: (transform: { x: number; y: number; scale: number }) => void
}

export default function ZoomableContainer({
    children,
    minScale = 0.5,
    maxScale = 5,
    initialScale = 1,
    onTransformChange,
}: ZoomableContainerProps) {

    const handleTransformed = (ref: ReactZoomPanPinchContentRef) => {
        if (onTransformChange) {
            const { positionX, positionY, scale } = ref.state
            onTransformChange({ x: positionX, y: positionY, scale })
        }
    }

    return (
        <div className="w-full h-full bg-gray-50 border border-gray-200 overflow-hidden relative">
            <TransformWrapper
                initialScale={initialScale}
                minScale={minScale}
                maxScale={maxScale}
                centerOnInit={true}
                onTransformed={handleTransformed}
                scrollAnimation={{ disabled: true }}
                wheel={{ step: 0.1 }}
                limitToBounds={false}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        {/* 
                            Force wrapper to take full size so centering works relative to screen 
                            We use inline style because sometimes library internal styles override classes
                        */}
                        <TransformComponent
                            wrapperClass="w-full h-full"
                            wrapperStyle={{ width: "100%", height: "100%" }}
                            contentClass="flex items-center justify-center pointer-events-none"
                        >
                            {children}
                        </TransformComponent>

                        {/* Controls Overlay */}
                        <div className="absolute bottom-4 right-4 flex gap-2 z-50">
                            <button
                                onClick={() => zoomIn()}
                                className="bg-white p-2 rounded shadow hover:bg-gray-100 font-bold"
                            >
                                +
                            </button>
                            <button
                                onClick={() => resetTransform()}
                                className="bg-white p-2 text-sm rounded shadow hover:bg-gray-100"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => zoomOut()}
                                className="bg-white p-2 rounded shadow hover:bg-gray-100 font-bold"
                            >
                                -
                            </button>
                        </div>
                    </>
                )}
            </TransformWrapper>
        </div>
    )
}
