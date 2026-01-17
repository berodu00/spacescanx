export type Point = [number, number]

export interface Wall {
    start: Point
    end: Point
    type: 'wall' | 'window' | 'door'
}

export interface Item {
    type: 'bed' | 'desk' | 'chair' | 'unknown' | string
    position: Point // Center position [x, y]
    label?: string
    width: number   // Width in cm
    height: number  // Depth in cm
    rotation: number // Rotation in degrees (0-360)
}

export interface FloorplanData {
    roomShape: 'rectangle' | 'L-shape' | 'polygon'
    dimensions: {
        width: number
        height: number
    }
    walls: Wall[]
    items: Item[]
}
