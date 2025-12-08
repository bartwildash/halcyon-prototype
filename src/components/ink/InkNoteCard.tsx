/**
 * InkNoteCard - Handwritten note card with ink drawing support
 *
 * A note card that can contain freehand ink strokes.
 * Used for sketches, handwritten notes, and visual thinking in Lake/Write modes.
 */

import { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react'
import { Group, Rect, Line, Text } from 'react-konva'
import type { Note } from '../../types/entities'
import type { InkStroke, InkBrush } from '../../types/ink'
import { deserializeStrokes, serializeStrokes, DEFAULT_BRUSH } from '../../types/ink'

interface InkNoteCardProps {
  note: Note
  isDrawingMode: boolean
  brush?: InkBrush
  onUpdate: (updates: Partial<Note>) => void
  onDragEnd?: (pos: { x: number; y: number }) => void
}

const CARD_WIDTH = 300
const CARD_HEIGHT = 400
const PADDING = 16

export const InkNoteCard = memo(function InkNoteCard({
  note,
  isDrawingMode,
  brush = DEFAULT_BRUSH,
  onUpdate,
  onDragEnd,
}: InkNoteCardProps) {
  const [currentStroke, setCurrentStroke] = useState<number[]>([])
  const [isDrawing, setIsDrawing] = useState(false)

  // RAF batching for smooth stroke performance
  const rafRef = useRef<number | undefined>(undefined)
  const pendingPoints = useRef<number[]>([])

  // Parse ink strokes from note
  const strokes = useMemo(() => {
    return note.inkStrokes ? deserializeStrokes(note.inkStrokes) : []
  }, [note.inkStrokes])

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const handlePointerDown = useCallback((e: any) => {
    if (!isDrawingMode) return

    e.cancelBubble = true  // Don't trigger card drag
    setIsDrawing(true)

    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()

    // Convert to card-local coordinates
    const localX = pos.x - (note.layout?.x || 0)
    const localY = pos.y - (note.layout?.y || 0)

    setCurrentStroke([localX, localY])
  }, [isDrawingMode, note.layout?.x, note.layout?.y])

  const handlePointerMove = useCallback((e: any) => {
    if (!isDrawing || !isDrawingMode) return

    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()

    const localX = pos.x - (note.layout?.x || 0)
    const localY = pos.y - (note.layout?.y || 0)

    // RAF batching: collect points and batch update on next frame
    pendingPoints.current.push(localX, localY)

    if (rafRef.current === undefined) {
      rafRef.current = requestAnimationFrame(() => {
        setCurrentStroke(prev => [...prev, ...pendingPoints.current])
        pendingPoints.current = []
        rafRef.current = undefined
      })
    }
  }, [isDrawing, isDrawingMode, note.layout?.x, note.layout?.y])

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || currentStroke.length === 0) return

    setIsDrawing(false)

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

    // Update note entity with new ink data
    onUpdate({
      inkStrokes: serializeStrokes(updatedStrokes),
      body: note.body || '', // Ensure body exists
    })

    setCurrentStroke([])
  }, [isDrawing, currentStroke, strokes, brush, onUpdate, note.body])

  const handleDrag = useCallback((e: any) => {
    if (isDrawingMode) {
      // Prevent dragging while drawing
      e.target.stopDrag()
      return
    }
  }, [isDrawingMode])

  const handleDragEndInternal = useCallback((e: any) => {
    if (isDrawingMode) return

    onDragEnd?.({
      x: e.target.x(),
      y: e.target.y(),
    })
  }, [isDrawingMode, onDragEnd])

  // Paper texture style - use note's color or default zen cream
  const paperColor = note.color || '#F5F5F0'

  return (
    <Group
      x={note.layout?.x || 0}
      y={note.layout?.y || 0}
      draggable={!isDrawingMode}
      rotation={note.layout?.rotation || 0}
      onDragMove={handleDrag}
      onDragEnd={handleDragEndInternal}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Card background - no shadow per Konva perf docs (strokes+shadows = extra draw) */}
      <Rect
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        fill={paperColor}
        stroke="#111"
        strokeWidth={2}
        cornerRadius={4}
      />

      {/* Title area (if has title) */}
      {note.title && (
        <Text
          x={PADDING}
          y={PADDING}
          width={CARD_WIDTH - PADDING * 2}
          text={note.title}
          fontSize={18}
          fontFamily="system-ui, -apple-system"
          fill="#111"
          fontStyle="bold"
        />
      )}

      {/* Ink strokes */}
      {strokes.map((stroke) => (
        <Line
          key={stroke.id}
          points={stroke.points}
          stroke={stroke.color}
          strokeWidth={stroke.width}
          opacity={stroke.opacity || 1}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          listening={false}
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
          listening={false}
        />
      )}

      {/* Handwritten badge */}
      {strokes.length > 0 && (
        <Text
          x={CARD_WIDTH - 40}
          y={PADDING}
          text="✏️"
          fontSize={16}
        />
      )}
    </Group>
  )
})
