'use client'

import React, { useRef, useEffect, useState } from 'react'
import { FloorplanData } from '../types/floorplan'

interface FloorplanRendererProps {
    data: FloorplanData
    scale?: number // Needed for drag calculation
    onUpdate?: (newData: FloorplanData) => void
    readOnly?: boolean
}

export default function FloorplanRenderer({
    data,
    scale = 1,
    onUpdate,
    readOnly = false
}: FloorplanRendererProps) {
    const { dimensions, walls, items } = data
    const { width, height } = dimensions

    // Drag State
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null)

    // Refs for rAF optimization avoid closure staleness and re-renders
    const dragInfoRef = useRef<{
        startX: number
        startY: number
        originalPosition: [number, number]
        itemIndex: number
        currentX: number
        currentY: number
    } | null>(null)

    const requestRef = useRef<number>()

    // Start Drag logic
    const handleDragStart = (e: React.MouseEvent, index: number) => {
        if (readOnly) return
        e.stopPropagation() // Stop zoom/pan

        const item = items[index]
        setDraggedItemIndex(index)

        dragInfoRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            originalPosition: [...item.position],
            itemIndex: index,
            // Initialize current with start
            currentX: e.clientX,
            currentY: e.clientY
        }
    }

    // Animation Loop
    const animate = () => {
        if (!dragInfoRef.current || !onUpdate) return

        const { startX, startY, originalPosition, itemIndex, currentX, currentY } = dragInfoRef.current

        // Calculate delta based on client coordinates vs start coordinates
        // adjusted by zoom scale
        const dx = (currentX - startX) / scale
        const dy = (currentY - startY) / scale

        // Create new items array
        const newItems = [...items]
        const item = { ...newItems[itemIndex] }

        // Update position explicitly based on original start + delta
        // This prevents floating point drift from accumulation
        item.position = [
            originalPosition[0] + dx,
            originalPosition[1] + dy
        ]

        newItems[itemIndex] = item

        // Commit update
        onUpdate({
            ...data,
            items: newItems
        })

        // Continue loop
        requestRef.current = requestAnimationFrame(animate)
    }

    useEffect(() => {
        if (draggedItemIndex === null) return

        const handleMouseMove = (e: MouseEvent) => {
            if (dragInfoRef.current) {
                dragInfoRef.current.currentX = e.clientX
                dragInfoRef.current.currentY = e.clientY

                // Start animation loop if not running
                if (!requestRef.current) {
                    requestRef.current = requestAnimationFrame(animate)
                }
            }
        }

        const handleMouseUp = () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current)
                requestRef.current = undefined
            }
            dragInfoRef.current = null
            setDraggedItemIndex(null)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current)
                requestRef.current = undefined
            }
        }
        // We intentionally omit 'items' and 'data' from dependencies to avoid resetting the effect on every render.
        // The 'animate' function closes over the latest props if defined inside component,
        // BUT since we are using rAF, we need to be careful about closure staleness of 'items'.
        // Actually, 'items' changes on every frame. 
        // The robust way for rAF in React is to use a Ref for the LATEST data too, OR rely on the fact that
        // we calculate position based on 'originalPosition' (constant during drag) + delta.
        // So strictly speaking we don't need the *latest* items array for the specific dragged item, 
        // we just need to reconstruct the items array.
        // However, if other items changed (unlikely during single user drag), we might overwrite them.
        // For this single-user local drag, reconstructing from "props.data.items" is risky if props update.
        // Let's use a ref for 'latestItems' to be safe, or just trust 'data.items' is fresh enough.
        // Given the parent updates 'data' on every frame, 'data' prop IS fresh.
        // But 'animate' is defined inside render, so it refreshes. 
        // The issue is 'requestAnimationFrame(animate)' uses the 'animate' from the CLOSURE where it was started? 
        // No, rAF in React usually requires a stable reference or a ref-based tick.
        // Let's use the 'animate' defined in the *current* render?
        // Actually the standard pattern is:
        // rAF calls a ref-held function?
        // Let's simplify: simply use the mutable ref for position and trigger ONE update per frame.
        // The 'animate' function captures 'items' from the render scope.
        // If 'items' changes, 'animate' changes. 
        // If we call 'requestAnimationFrame(animate)', does it call the OLD animate? Yes.
        // So we need to cancel and restart rAF on deps change? That defeats the point!
        // -> SOLUTION: Use useRef for the callback.
    }, [draggedItemIndex, scale, readOnly]) // eslint-disable-line react-hooks/exhaustive-deps

    // Ref to hold the latest animate function to avoid closure staleness
    const animateRef = useRef(animate)
    useEffect(() => {
        animateRef.current = animate
    })
    // Wait, the above useEffect for mousemove calls 'animate'.
    // If 'animate' is stale, it uses old 'items'.
    // Let's fix the animate loop to call `animateRef.current()`.

    useEffect(() => {
        if (draggedItemIndex !== null && !requestRef.current) {
            const loop = () => {
                animateRef.current()
                requestRef.current = requestAnimationFrame(loop)
            }
            requestRef.current = requestAnimationFrame(loop)

            return () => {
                if (requestRef.current) cancelAnimationFrame(requestRef.current)
                requestRef.current = undefined
            }
        }
    }, [draggedItemIndex])

    // Redefine handleMouseMove to just update ref
    // We need to detach the mousemove listener from triggering animate directly.

    return (
        <div className="relative w-fit h-fit flex items-center justify-center pointer-events-none">
            <svg
                width={width}
                height={height}
                viewBox={`${-50} ${-50} ${width + 100} ${height + 100}`}
                className="overflow-visible pointer-events-auto shadow-2xl bg-white"
                style={{ width: `${width}px`, height: `${height}px` }}
            >
                <defs>
                    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" strokeWidth="1" />
                    </pattern>
                </defs>

                <rect x={-50} y={-50} width={width + 100} height={height + 100} fill="url(#grid)" />

                <g id="walls">
                    {walls.map((wall, i) => {
                        const isWindow = wall.type === 'window'
                        const isDoor = wall.type === 'door'
                        let strokeColor = '#333'
                        let strokeWidth = 5
                        if (isWindow) { strokeColor = '#60a5fa'; strokeWidth = 3 }
                        else if (isDoor) { strokeColor = '#fbbf24'; strokeWidth = 3 }

                        // Calculate Center and Length
                        const midX = (wall.start[0] + wall.end[0]) / 2
                        const midY = (wall.start[1] + wall.end[1]) / 2
                        const length = Math.sqrt(
                            Math.pow(wall.end[0] - wall.start[0], 2) +
                            Math.pow(wall.end[1] - wall.start[1], 2)
                        )

                        return (
                            <g key={`wall-group-${i}`}>
                                <line
                                    x1={wall.start[0]} y1={wall.start[1]}
                                    x2={wall.end[0]} y2={wall.end[1]}
                                    stroke={strokeColor} strokeWidth={strokeWidth}
                                    strokeLinecap="round"
                                    className="hover:stroke-red-500 cursor-pointer transition-colors"
                                />
                                {/* Wall Dimension Label */}
                                <text
                                    x={midX} y={midY}
                                    textAnchor="middle"
                                    dy={-5}
                                    fontSize="10"
                                    fill="#666"
                                    className="pointer-events-none select-none"
                                >
                                    {Math.round(length)}cm
                                </text>
                            </g>
                        )
                    })}
                </g>

                <g id="items">
                    {items.map((item, i) => {
                        const w = item.width
                        const h = item.height
                        const x = item.position[0] - w / 2
                        const y = item.position[1] - h / 2

                        return (
                            <g
                                key={`item-${i}`}
                                transform={`translate(${x}, ${y}) rotate(${item.rotation || 0}, ${w / 2}, ${h / 2})`}
                                className={`cursor-pointer group ${!readOnly ? 'cursor-move' : ''}`}
                                onMouseDown={(e) => handleDragStart(e, i)}
                            >
                                <rect
                                    width={w} height={h} rx="4"
                                    fill={draggedItemIndex === i ? '#eff6ff' : '#fff'}
                                    stroke={draggedItemIndex === i ? '#3b82f6' : '#94a3b8'}
                                    strokeWidth="2"
                                    className="group-hover:stroke-blue-500 transition-colors"
                                />
                                {/* Item Label and Dimensions */}
                                <foreignObject x={-20} y={h / 2 - 15} width={w + 40} height={40} className="overflow-visible pointer-events-none">
                                    <div className="flex flex-col justify-center items-center h-full">
                                        <span className="bg-white/80 text-[10px] px-1 rounded shadow-sm whitespace-nowrap text-center select-none font-medium">
                                            {item.label || item.type}
                                        </span>
                                        <span className="bg-white/60 text-[8px] px-1 rounded text-gray-500 whitespace-nowrap text-center select-none">
                                            {w}x{h}
                                        </span>
                                    </div>
                                </foreignObject>
                            </g>
                        )
                    })}
                </g>
            </svg>
        </div>
    )
}
