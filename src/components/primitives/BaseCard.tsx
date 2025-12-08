// BaseCard - Enhanced primitive with pointer-based dragging for react-zoom-pan-pinch
// Implements BaseEntity interface guidance

import { useState, useRef } from 'react'
import type { BaseEntity } from '../../types/entities'
import { useLongPress } from '../../hooks/useLongPress'
import './BaseCard.css'

interface BaseCardProps {
  entity: BaseEntity
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onUpdate?: (id: string, updates: Partial<BaseEntity>) => void
  onContextMenu?: (id: string, x: number, y: number) => void
  isSelected?: boolean
  allowRotation?: boolean
  allowScale?: boolean
}

export function BaseCard({
  entity,
  children,
  className = '',
  style,
  onUpdate,
  onContextMenu,
  isSelected = false,
  allowRotation = true,
  allowScale = false,
}: BaseCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [rotation, setRotation] = useState(entity.rotation || 0)
  const cardRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ x: number; y: number; entityX: number; entityY: number } | null>(null)

  // Long press for context menu (not edit mode)
  const longPress = useLongPress({
    onLongPress: () => {
      if (onContextMenu && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        onContextMenu(entity.id, rect.right, rect.top)
        // Haptic feedback on supported devices
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }
      }
    },
    delay: 500,
  })

  // Pointer-based dragging (works with react-zoom-pan-pinch)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only handle left mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return

    e.stopPropagation() // Prevent canvas panning
    setIsDragging(true)

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      entityX: entity.position.x,
      entityY: entity.position.y,
    }

    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return

    e.stopPropagation()

    const deltaX = e.clientX - dragStartRef.current.x
    const deltaY = e.clientY - dragStartRef.current.y

    const newX = dragStartRef.current.entityX + deltaX
    const newY = dragStartRef.current.entityY + deltaY

    onUpdate?.(entity.id, {
      position: { x: newX, y: newY }
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return

    e.stopPropagation()
    setIsDragging(false)
    dragStartRef.current = null

    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  // Context menu handler
  const handleContextMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      onContextMenu?.(entity.id, rect.right, rect.top)
    }
  }

  return (
    <div
      ref={cardRef}
      className={`base-card ${className} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        ...style,
        transform: `rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none', // Prevent browser gestures
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      {...longPress.handlers}
    >
      {/* Contextual menu pin dot */}
      {onContextMenu && (
        <button
          className="context-menu-pin"
          onClick={handleContextMenuClick}
          aria-label="Open context menu"
        >
          •••
        </button>
      )}

      {/* Card content */}
      <div className="base-card-content">{children}</div>

      {/* Subtle wobble SVG filter for hand-cut feel */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="wobble">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.01"
              numOctaves="2"
              result="noise"
              seed={entity.id.charCodeAt(0)}
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
        </defs>
      </svg>
    </div>
  )
}
