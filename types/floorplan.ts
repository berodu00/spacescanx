export type Point = [number, number]

export interface Wall {
    start: Point
    end: Point
    type: 'wall' | 'window' | 'door'
}

export interface Item {
    type: 'bed' | 'desk' | 'chair' | 'unknown' | string
    position: Point
    label?: string
    width?: number
    height?: number
    rotation?: number
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
