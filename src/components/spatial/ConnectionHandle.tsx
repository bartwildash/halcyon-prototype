// ConnectionHandle - Draggable handle for creating connections between cards
// Inspired by Kinopio's connection creation UX

import { useState, useRef, useCallback } from 'react'
import { useSpatialStore } from '../../stores/spatialStore'

interface ConnectionHandleProps {
  cardId: string
  position?: 'right' | 'bottom' | 'corner'
}

export function ConnectionHandle({ cardId, position = 'right' }: ConnectionHandleProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const { createConnection, space } = useSpatialStore()

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation() // Don't trigger card drag
    e.preventDefault()

    setIsDragging(true)
    dragStartPos.current = { x: e.clientX, y: e.clientY }

    const handlePointerMove = (moveEvent: PointerEvent) => {
      // Visual feedback could be added here (draw temporary line)
      const dx = moveEvent.clientX - dragStartPos.current.x
      const dy = moveEvent.clientY - dragStartPos.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Show we're dragging if moved more than 5px
      if (distance > 5) {
        document.body.style.cursor = 'crosshair'
      }
    }

    const handlePointerUp = (upEvent: PointerEvent) => {
      setIsDragging(false)
      document.body.style.cursor = ''

      // Find if we're over another card
      const target = upEvent.target as HTMLElement
      const targetCard = target.closest('.spatial-card')

      if (targetCard) {
        const targetCardId = targetCard.getAttribute('data-card-id')
        if (targetCardId && targetCardId !== cardId) {
          // Create connection!
          console.log('[ConnectionHandle] Creating connection:', cardId, '→', targetCardId)
          createConnection(cardId, targetCardId)
        }
      }

      // Cleanup
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }, [cardId, createConnection])

  // Position styles
  const positionStyles: React.CSSProperties = {
    position: 'absolute',
    ...(position === 'right' && {
      right: -8,
      top: '50%',
      transform: 'translateY(-50%)',
    }),
    ...(position === 'bottom' && {
      bottom: -8,
      left: '50%',
      transform: 'translateX(-50%)',
    }),
    ...(position === 'corner' && {
      right: -8,
      bottom: -8,
    }),
  }

  return (
    <div
      className="connection-handle"
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...positionStyles,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: isDragging
          ? '#3b82f6'
          : isHovered
          ? '#60a5fa'
          : 'rgba(59, 130, 246, 0.6)',
        cursor: isDragging ? 'grabbing' : 'grab',
        border: '2px solid white',
        boxShadow: isHovered
          ? '0 4px 8px rgba(0,0,0,0.3)'
          : '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'all 0.2s ease',
        zIndex: 100,
        opacity: isHovered || isDragging ? 1 : 0.7,
        transform: isHovered
          ? position === 'right'
            ? 'translateY(-50%) scale(1.2)'
            : position === 'bottom'
            ? 'translateX(-50%) scale(1.2)'
            : 'scale(1.2)'
          : positionStyles.transform,
      }}
      title="Drag to connect to another card"
    >
      {/* Small dot in center for visual feedback */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: 'white',
          opacity: 0.8,
        }}
      />
    </div>
  )
}
