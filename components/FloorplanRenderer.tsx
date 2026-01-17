'use client'

import React from 'react'
import { FloorplanData, Wall, Item } from '../types/floorplan'

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
    const [draggedItemIndex, setDraggedItemIndex] = React.useState<number | null>(null)

    // Handle Global Mouse Move/Up for Dragging
    React.useEffect(() => {
        if (readOnly || draggedItemIndex === null) return

        const handleMouseMove = (e: MouseEvent) => {
            // Calculate World Delta = Screen Delta / Scale
            const dx = e.movementX / scale
            const dy = e.movementY / scale

            // Create new items array
            const newItems = [...items]
            const item = { ...newItems[draggedItemIndex] }

            // Update position
            item.position = [
                item.position[0] + dx,
                item.position[1] + dy
            ]

            newItems[draggedItemIndex] = item

            // Optimistic update via generic callback
            onUpdate?.({
                ...data,
                items: newItems
            })
        }

        const handleMouseUp = () => {
            setDraggedItemIndex(null)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [draggedItemIndex, items, data, scale, onUpdate, readOnly])

    // Add some padding to the viewbox so elements on the edge aren't cut off
    const padding = 50
    const viewBox = `${-padding} ${-padding} ${width + padding * 2} ${height + padding * 2}`

    return (
        <div className="relative w-fit h-fit flex items-center justify-center pointer-events-none">
            <svg
                width={width}
                height={height}
                viewBox={viewBox}
                className="overflow-visible pointer-events-auto shadow-2xl bg-white"
                style={{ width: `${width}px`, height: `${height}px` }} // Render 1px = 1cm for simplicity
            >
                <defs>
                    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" strokeWidth="1" />
                    </pattern>
                </defs>

                {/* Background Grid */}
                <rect x={-padding} y={-padding} width={width + padding * 2} height={height + padding * 2} fill="url(#grid)" />

                {/* Walls */}
                <g id="walls">
                    {walls.map((wall, i) => {
                        const isWindow = wall.type === 'window'
                        const isDoor = wall.type === 'door'

                        let strokeColor = '#333'
                        let strokeWidth = 5

                        if (isWindow) {
                            strokeColor = '#60a5fa' // Blue-400
                            strokeWidth = 3
                        } else if (isDoor) {
                            strokeColor = '#fbbf24' // Amber-400
                            strokeWidth = 3
                        }

                        return (
                            <line
                                key={`wall-${i}`}
                                x1={wall.start[0]}
                                y1={wall.start[1]}
                                x2={wall.end[0]}
                                y2={wall.end[1]}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                className="hover:stroke-red-500 cursor-pointer transition-colors"
                                // Prevent container pan when interacting with walls (future)
                                onMouseDown={(e) => !readOnly && e.stopPropagation()}
                            />
                        )
                    })}
                </g>

                {/* Items/Furniture */}
                <g id="items">
                    {items.map((item, i) => {
                        // Default item size if not provided
                        const w = item.width || 60
                        const h = item.height || 60
                        // Center the item rect on the position
                        const x = item.position[0] - w / 2
                        const y = item.position[1] - h / 2

                        return (
                            <g
                                key={`item-${i}`}
                                transform={`translate(${x}, ${y}) rotate(${item.rotation || 0}, ${w / 2}, ${h / 2})`}
                                className={`cursor-pointer group ${!readOnly ? 'cursor-move' : ''}`}
                                onMouseDown={(e) => {
                                    if (readOnly) return;
                                    e.stopPropagation(); // Stop ZoomableContainer pan
                                    setDraggedItemIndex(i);
                                }}
                            >
                                {/* Item Shape */}
                                <rect
                                    width={w}
                                    height={h}
                                    rx="4"
                                    fill={draggedItemIndex === i ? '#eff6ff' : '#fff'} // Highlight on drag
                                    stroke={draggedItemIndex === i ? '#3b82f6' : '#94a3b8'}
                                    strokeWidth="2"
                                    className="group-hover:stroke-blue-500 transition-colors"
                                />

                                {/* Item Label with Background */}
                                <foreignObject x={-10} y={h / 2 - 10} width={w + 20} height={20} className="overflow-visible pointer-events-none">
                                    <div className="flex justify-center items-center">
                                        <span className="bg-white/80 text-[10px] px-1 rounded shadow-sm whitespace-nowrap text-center select-none">
                                            {item.label || item.type}
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
