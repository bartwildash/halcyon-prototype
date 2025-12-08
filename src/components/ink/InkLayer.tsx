/**
 * InkLayer - Freehand drawing layer for Halcyon canvas
 *
 * Supports:
 * - Touch, mouse, and stylus input
 * - Undo/redo
 * - Multiple brush types
 * - Serialization to/from JSON
 */

import { useState, useRef, useCallback, memo, useEffect } from 'react'
import { Layer, Line } from 'react-konva'
import type Konva from 'konva'
import type { InkStroke, InkBrush } from '../../types/ink'
import { DEFAULT_BRUSH } from '../../types/ink'

interface InkLayerProps {
  strokes: InkStroke[]
  onStrokesChange: (strokes: InkStroke[]) => void
  isDrawingMode: boolean
  brush?: InkBrush
  onStrokeComplete?: (stroke: InkStroke) => void
}

export const InkLayer = memo(function InkLayer({
  strokes,
  onStrokesChange,
  isDrawingMode,
  brush = DEFAULT_BRUSH,
  onStrokeComplete,
}: InkLayerProps) {
  const [currentStroke, setCurrentStroke] = useState<number[]>([])
  const isDrawing = useRef(false)
  const layerRef = useRef<Konva.Layer>(null)

  // RAF batching for smooth stroke performance
  const rafRef = useRef<number | undefined>(undefined)
  const pendingPoints = useRef<number[]>([])

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isDrawingMode) return

    isDrawing.current = true
    const stage = e.target.getStage()
    const pos = stage?.getPointerPosition()
    if (!pos) return

    // Start new stroke
    setCurrentStroke([pos.x, pos.y])
  }, [isDrawingMode])

  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isDrawing.current || !isDrawingMode) return

    const stage = e.target.getStage()
    const pos = stage?.getPointerPosition()
    if (!pos) return

    // RAF batching: collect points and batch update on next frame
    pendingPoints.current.push(pos.x, pos.y)

    if (rafRef.current === undefined) {
      rafRef.current = requestAnimationFrame(() => {
        setCurrentStroke(prev => [...prev, ...pendingPoints.current])
        pendingPoints.current = []
        rafRef.current = undefined
      })
    }
  }, [isDrawingMode])

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current || currentStroke.length === 0) return

    isDrawing.current = false

    // Save completed stroke
    const newStroke: InkStroke = {
      id: crypto.randomUUID(),
      points: currentStroke,
      color: brush.color,
      width: brush.width,
      opacity: brush.opacity,
      timestamp: Date.now(),
    }

    const updatedStrokes = [...strokes, newStroke]
    onStrokesChange(updatedStrokes)
    onStrokeComplete?.(newStroke)

    // Clear current stroke
    setCurrentStroke([])
  }, [currentStroke, strokes, brush, onStrokesChange, onStrokeComplete])

  // Undo last stroke
  const undo = useCallback(() => {
    if (strokes.length === 0) return
    onStrokesChange(strokes.slice(0, -1))
  }, [strokes, onStrokesChange])

  // Clear all strokes
  const clear = useCallback(() => {
    onStrokesChange([])
  }, [onStrokesChange])

  return (
    <Layer
      ref={layerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}  // End stroke when leaving canvas
    >
      {/* Saved strokes - listening=false per Konva perf docs */}
      {strokes.map((stroke) => (
        <Line
          key={stroke.id}
          points={stroke.points}
          stroke={stroke.color}
          strokeWidth={stroke.width}
          opacity={stroke.opacity || 1}
          tension={0.5}  // Smooth curves
          lineCap="round"
          lineJoin="round"
          listening={false}
          globalCompositeOperation={brush.tool === 'eraser' ? 'destination-out' : 'source-over'}
        />
      ))}

      {/* Current stroke being drawn */}
      {currentStroke.length > 0 && (
        <Line
          points={currentStroke}
          stroke={brush.color}
          strokeWidth={brush.width}
          opacity={brush.opacity}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          listening={false}  // Don't interfere with pointer events
        />
      )}
    </Layer>
  )
})

// Export undo/clear methods via ref if needed
export interface InkLayerHandle {
  undo: () => void
  clear: () => void
}
