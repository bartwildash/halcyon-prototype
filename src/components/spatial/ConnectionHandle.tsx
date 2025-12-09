// ConnectionHandle - Draggable handle for creating connections between cards
// Inspired by Kinopio's connection creation UX

import { useState, useRef, useCallback } from 'react'
import { useSpatialStore } from '../../stores/spatialStore'

// Global state for temp connection line (shared with ConnectionsLayer)
export const tempConnectionState = {
  isActive: false,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
  targetCardId: null as string | null,
  listeners: [] as (() => void)[],
  update(data: Partial<typeof tempConnectionState>) {
    Object.assign(this, data)
    this.listeners.forEach(fn => fn())
  },
  subscribe(fn: () => void) {
    this.listeners.push(fn)
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn)
    }
  }
}

interface ConnectionHandleProps {
  cardId: string
  cardX: number
  cardY: number
  cardWidth: number
  cardHeight: number
  position?: 'right' | 'bottom' | 'corner'
}

export function ConnectionHandle({ cardId, cardX, cardY, cardWidth, cardHeight, position = 'right' }: ConnectionHandleProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const handleRef = useRef<HTMLDivElement>(null)
  const { createConnection, space } = useSpatialStore()

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()

    setIsDragging(true)

    // Calculate start position (center of card)
    const startX = cardX + (cardWidth || 200) / 2
    const startY = cardY + (cardHeight || 100) / 2

    // Get canvas container for coordinate transformation
    const canvas = document.querySelector('.spatial-canvas-content')
    const canvasRect = canvas?.getBoundingClientRect()
    const zoom = space?.zoom || 1

    // Initialize temp line
    tempConnectionState.update({
      isActive: true,
      startX,
      startY,
      endX: startX,
      endY: startY,
      targetCardId: null
    })

    const handlePointerMove = (moveEvent: PointerEvent) => {
      document.body.style.cursor = 'crosshair'

      // Transform screen coords to canvas coords
      if (canvasRect) {
        const scrollX = space?.scrollX || 0
        const scrollY = space?.scrollY || 0
        const endX = (moveEvent.clientX - canvasRect.left) / zoom - scrollX
        const endY = (moveEvent.clientY - canvasRect.top) / zoom - scrollY

        // Check if over a card
        const elementsUnder = document.elementsFromPoint(moveEvent.clientX, moveEvent.clientY)
        const targetCard = elementsUnder.find(el => el.classList.contains('spatial-card'))
        const targetId = targetCard?.getAttribute('data-card-id')

        // Highlight target card
        document.querySelectorAll('.spatial-card').forEach(el => {
          el.classList.remove('connection-target')
        })
        if (targetId && targetId !== cardId) {
          targetCard?.classList.add('connection-target')
        }

        tempConnectionState.update({
          endX,
          endY,
          targetCardId: targetId && targetId !== cardId ? targetId : null
        })
      }
    }

    const handlePointerUp = () => {
      setIsDragging(false)
      document.body.style.cursor = ''

      // Remove highlight from all cards
      document.querySelectorAll('.spatial-card').forEach(el => {
        el.classList.remove('connection-target')
      })

      // Create connection if we have a target
      if (tempConnectionState.targetCardId) {
        console.log('[ConnectionHandle] Creating connection:', cardId, '→', tempConnectionState.targetCardId)
        createConnection(cardId, tempConnectionState.targetCardId)
      }

      // Clear temp line
      tempConnectionState.update({
        isActive: false,
        targetCardId: null
      })

      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }, [cardId, cardX, cardY, cardWidth, cardHeight, createConnection, space])

  // Position styles - inset more into the card
  const positionStyles: React.CSSProperties = {
    position: 'absolute',
    ...(position === 'right' && {
      right: 8,
      top: '50%',
      transform: 'translateY(-50%)',
    }),
    ...(position === 'bottom' && {
      bottom: 8,
      left: '50%',
      transform: 'translateX(-50%)',
    }),
    ...(position === 'corner' && {
      right: 8,
      bottom: 8,
    }),
  }

  return (
    <div
      ref={handleRef}
      className="connection-handle"
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...positionStyles,
        touchAction: 'none',
        width: 24,
        height: 24,
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
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'white',
          opacity: 0.8,
        }}
      />
    </div>
  )
}
