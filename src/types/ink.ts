/**
 * Ink & Drawing Types for Halcyon
 *
 * Supports handwritten notes, sketches, and freehand annotations
 * Compatible with touch, mouse, and stylus (Apple Pencil, Wacom)
 */

export interface InkStroke {
  id: string
  points: number[]       // [x1, y1, x2, y2, ...] in local coordinates
  color: string          // hex color
  width: number          // stroke width in px
  timestamp: number      // when drawn (for animations/replay)
  opacity?: number       // 0-1, default 1
  pressure?: number[]    // optional pressure data (future: Apple Pencil)
}

export interface InkBrush {
  color: string
  width: number
  opacity: number
  tool: 'pen' | 'marker' | 'pencil' | 'eraser'
}

export const DEFAULT_BRUSH: InkBrush = {
  color: '#111111',
  width: 2,
  opacity: 1,
  tool: 'pen',
}

export const BRUSH_PRESETS: Record<string, InkBrush> = {
  pen: {
    color: '#111111',
    width: 2,
    opacity: 1,
    tool: 'pen',
  },
  marker: {
    color: '#111111',
    width: 8,
    opacity: 0.7,
    tool: 'marker',
  },
  pencil: {
    color: '#333333',
    width: 1.5,
    opacity: 0.6,
    tool: 'pencil',
  },
}

/**
 * Serialize strokes to JSON for storage
 */
export function serializeStrokes(strokes: InkStroke[]): string {
  return JSON.stringify(strokes)
}

/**
 * Deserialize strokes from JSON
 */
export function deserializeStrokes(data: string): InkStroke[] {
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

/**
 * Export strokes to SVG format
 */
export function exportToSVG(strokes: InkStroke[], width: number, height: number): string {
  const paths = strokes.map(stroke => {
    const d = stroke.points.reduce((acc, val, i) => {
      if (i === 0) return `M ${val} ${stroke.points[i + 1]}`
      if (i % 2 === 0) return `${acc} L ${val} ${stroke.points[i + 1]}`
      return acc
    }, '')

    return `<path d="${d}" stroke="${stroke.color}" stroke-width="${stroke.width}" fill="none" opacity="${stroke.opacity || 1}" stroke-linecap="round" stroke-linejoin="round" />`
  }).join('\n  ')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${paths}
</svg>`
}
