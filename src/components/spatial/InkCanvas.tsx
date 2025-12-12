// InkCanvas - SVG-based drawing layer for the spatial canvas
// Uses SVG paths for compatibility with DOM-based infinite canvas

import { useState, useRef, useCallback, useEffect } from 'react'
import type { InkStroke, InkBrush } from '../../types/ink'
import { DEFAULT_BRUSH } from '../../types/ink'

interface InkCanvasProps {
  strokes: InkStroke[]
  onStrokesChange: (strokes: InkStroke[]) => void
  isDrawingMode: boolean
  brush?: InkBrush
  zoom: number
  scrollX: number
  scrollY: number
}

export function InkCanvas({
  strokes,
  onStrokesChange,
  isDrawingMode,
  brush = DEFAULT_BRUSH,
  zoom,
  scrollX,
  scrollY,
}: InkCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [currentPoints, setCurrentPoints] = useState<number[]>([])
  const isDrawing = useRef(false)
  const drawingPointerId = useRef<number | null>(null)
  const activeTouchPointers = useRef<Set<number>>(new Set())

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX / zoom) - scrollX,
      y: (screenY / zoom) - scrollY,
    }
  }, [zoom, scrollX, scrollY])

  // Generate SVG path data from points
  const pointsToPath = (points: number[]): string => {
    if (points.length < 2) return ''

    let d = `M ${points[0]} ${points[1]}`

    // Use quadratic curves for smooth lines
    for (let i = 2; i < points.length - 2; i += 2) {
      const x1 = points[i]
      const y1 = points[i + 1]
      const x2 = points[i + 2]
      const y2 = points[i + 3]
      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2
      d += ` Q ${x1} ${y1} ${midX} ${midY}`
    }

    // Add last point
    if (points.length >= 4) {
      d += ` L ${points[points.length - 2]} ${points[points.length - 1]}`
    }

    return d
  }

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isDrawingMode) return

    // Ignore multi-touch so pinch/2-finger pan can still work
    if (e.pointerType === 'touch') {
      if (activeTouchPointers.current.size > 0) {
        return
      }
      activeTouchPointers.current.add(e.pointerId)
    }

    e.preventDefault()
    e.stopPropagation()

    isDrawing.current = true
    drawingPointerId.current = e.pointerId
    const { x, y } = screenToCanvas(e.clientX, e.clientY)
    setCurrentPoints([x, y])

    // Capture pointer for smooth drawing
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }, [isDrawingMode, screenToCanvas])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing.current || !isDrawingMode) return
    if (drawingPointerId.current !== e.pointerId) return

    const { x, y } = screenToCanvas(e.clientX, e.clientY)

    setCurrentPoints(prev => [...prev, x, y])
  }, [isDrawingMode, screenToCanvas])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDrawing.current) return
    if (drawingPointerId.current !== e.pointerId) {
      if (e.pointerType === 'touch') {
        activeTouchPointers.current.delete(e.pointerId)
      }
      return
    }

    isDrawing.current = false
    drawingPointerId.current = null
    if (e.pointerType === 'touch') {
      activeTouchPointers.current.delete(e.pointerId)
    }
    ;(e.target as Element).releasePointerCapture(e.pointerId)

    if (currentPoints.length >= 4) {
      const newStroke: InkStroke = {
        id: crypto.randomUUID(),
        points: currentPoints,
        color: brush.color,
        width: brush.width,
        opacity: brush.opacity,
        timestamp: Date.now(),
      }

      onStrokesChange([...strokes, newStroke])
    }

    setCurrentPoints([])
  }, [currentPoints, strokes, brush, onStrokesChange])

  // Keyboard shortcut for undo (Cmd+Z while drawing)
  useEffect(() => {
    if (!isDrawingMode) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (strokes.length > 0) {
          onStrokesChange(strokes.slice(0, -1))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawingMode, strokes, onStrokesChange])

  return (
    <svg
      ref={svgRef}
      className="ink-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: isDrawingMode ? 'auto' : 'none',
        cursor: isDrawingMode ? 'crosshair' : 'default',
        touchAction: 'none',
        zIndex: isDrawingMode ? 500 : 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Saved strokes */}
      {strokes.map((stroke) => (
        <path
          key={stroke.id}
          d={pointsToPath(stroke.points)}
          stroke={stroke.color}
          strokeWidth={stroke.width / zoom}
          fill="none"
          opacity={stroke.opacity || 1}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pointerEvents: 'none' }}
        />
      ))}

      {/* Current stroke being drawn */}
      {currentPoints.length >= 2 && (
        <path
          d={pointsToPath(currentPoints)}
          stroke={brush.color}
          strokeWidth={brush.width / zoom}
          fill="none"
          opacity={brush.opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </svg>
  )
}
