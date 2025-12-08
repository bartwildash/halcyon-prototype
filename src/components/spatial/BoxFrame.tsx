// BoxFrame Component - Grouping/framing container for cards
// Inspired by Kinopio's box/frame system

import { useRef, useState, useCallback, memo } from 'react'
import type { Box } from '../../types/spatial'
import { useSpatialStore } from '../../stores/spatialStore'

interface BoxFrameProps {
  box: Box
}

function BoxFrameComponent({ box }: BoxFrameProps) {
  const { selectedBoxIds, updateBox, deleteBox, space } = useSpatialStore()
  const boxRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, boxX: 0, boxY: 0 })
  const resizeStart = useRef({ x: 0, y: 0, boxWidth: 0, boxHeight: 0 })

  const isSelected = selectedBoxIds?.has(box.id) || false

  // Drag threshold to prevent accidental moves
  const DRAG_THRESHOLD = 5
  const dragThresholdCrossed = useRef(false)

  // Handle box drag
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Don't drag if clicking on title or resize handle
      if ((e.target as HTMLElement).closest('.box-title-input, .box-resize-handle')) {
        return
      }

      e.stopPropagation()
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        boxX: box.x,
        boxY: box.y,
      }
      dragThresholdCrossed.current = false
      setIsDragging(true)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [box.x, box.y]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return

      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (!dragThresholdCrossed.current && distance < DRAG_THRESHOLD) {
        return
      }

      dragThresholdCrossed.current = true

      const zoom = space?.zoom || 1
      const scaledDx = dx / zoom
      const scaledDy = dy / zoom

      const newX = dragStart.current.boxX + scaledDx
      const newY = dragStart.current.boxY + scaledDy

      updateBox?.(box.id, { x: newX, y: newY })
    },
    [isDragging, box.id, updateBox, space]
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    dragThresholdCrossed.current = false
  }, [])

  // Handle box resize
  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        boxWidth: box.width,
        boxHeight: box.height,
      }
      setIsResizing(true)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [box.width, box.height]
  )

  const handleResizeMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isResizing) return

      const zoom = space?.zoom || 1
      const dx = (e.clientX - resizeStart.current.x) / zoom
      const dy = (e.clientY - resizeStart.current.y) / zoom

      const newWidth = Math.max(150, resizeStart.current.boxWidth + dx)
      const newHeight = Math.max(100, resizeStart.current.boxHeight + dy)

      updateBox?.(box.id, { width: newWidth, height: newHeight })
    },
    [isResizing, box.id, updateBox, space]
  )

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
  }, [])

  // Edit title
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateBox?.(box.id, { name: e.target.value })
    },
    [box.id, updateBox]
  )

  const backgroundColor = box.color || 'rgba(147, 197, 253, 0.1)' // Light blue
  const borderColor = box.color || 'rgba(59, 130, 246, 0.3)'

  return (
    <div
      ref={boxRef}
      className="box-frame"
      data-box-id={box.id}
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        background: backgroundColor,
        border: `2px ${isSelected ? 'solid' : 'dashed'} ${borderColor}`,
        borderRadius: 12,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 0, // Behind cards
        pointerEvents: 'auto',
        transition: isDragging ? 'none' : 'border 0.2s ease',
        boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.3), 0 0 15px rgba(59, 130, 246, 0.2)' : 'none',
        animation: isSelected ? 'focus-ring-pulse 2s ease-in-out infinite' : 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Box title/header */}
      {(box.name || isEditing) && (
        <div
          style={{
            position: 'absolute',
            top: -32,
            left: 0,
            padding: '4px 12px',
            background: 'white',
            border: `1px solid ${borderColor}`,
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            color: '#374151',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <input
            className="box-title-input"
            type="text"
            value={box.name || ''}
            onChange={handleTitleChange}
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
            placeholder="Frame name..."
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              fontWeight: 'inherit',
              color: 'inherit',
              width: '100%',
              minWidth: 80,
            }}
          />
        </div>
      )}

      {/* Resize handle */}
      <div
        className="box-resize-handle"
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
        style={{
          position: 'absolute',
          right: -8,
          bottom: -8,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'white',
          border: `2px solid ${borderColor}`,
          cursor: 'nwse-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 'bold',
          color: borderColor,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 10,
        }}
      >
        ↘
      </div>
    </div>
  )
}

// Memoize to prevent unnecessary re-renders
export const BoxFrame = memo(BoxFrameComponent, (prevProps, nextProps) => {
  return (
    prevProps.box.id === nextProps.box.id &&
    prevProps.box.x === nextProps.box.x &&
    prevProps.box.y === nextProps.box.y &&
    prevProps.box.width === nextProps.box.width &&
    prevProps.box.height === nextProps.box.height &&
    prevProps.box.name === nextProps.box.name &&
    prevProps.box.color === nextProps.box.color
  )
})
