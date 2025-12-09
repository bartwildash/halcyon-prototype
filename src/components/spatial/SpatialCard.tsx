// SpatialCard Component - Individual card with drag and edit
// Follows Kinopio's "sticky cursor" micro-interaction

import { useRef, useState, useCallback, useEffect, memo } from 'react'
import type { Card } from '../../types/spatial'
import { useSpatialStore } from '../../stores/spatialStore'
import { useSessionStore } from '../../stores/sessionStore'
import { OrbitCard } from './OrbitCard'
import { TiptapEditor } from './TiptapEditor'
import { ConnectionHandle } from './ConnectionHandle'
import { FlipClock } from '../gadgets/flip-clock/FlipClock'
import { PomodoroTimer } from '../gadgets/pomodoro/PomodoroTimer'

interface SpatialCardProps {
  card: Card
}

function SpatialCardComponent({ card }: SpatialCardProps) {
  // Special case: Orbit card
  if (card.cardType === 'orbit') {
    return <OrbitCard card={card} />
  }

  // Special case: FlipClock gadget
  if (card.cardType === 'flipclock') {
    return (
      <div style={{ position: 'absolute', left: card.x, top: card.y, zIndex: card.z }}>
        <FlipClock />
      </div>
    )
  }

  // Special case: Pomodoro Timer gadget
  if (card.cardType === 'pomodoro') {
    return (
      <div style={{ position: 'absolute', left: card.x, top: card.y, zIndex: card.z }}>
        <PomodoroTimer />
      </div>
    )
  }

  const {
    selectedCardIds,
    selectCard,
    updateCard,
    moveCard,
    setIsDragging,
    isPanning,
    space,
  } = useSpatialStore()

  const { canEditCard, isMobile, isOnline } = useSessionStore()

  const cardRef = useRef<HTMLDivElement>(null)
  const [isDragging, setLocalDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [stickyOffset, setStickyOffset] = useState({ x: 0, y: 0 })
  const [showJiggle, setShowJiggle] = useState(true)

  // Permission checks
  const isLocked = card.isLocked || space?.isReadOnly || false
  const canEdit = !isLocked && canEditCard(card.userId)
  const dragStart = useRef({ x: 0, y: 0, cardX: 0, cardY: 0 })
  const dragThresholdCrossed = useRef(false)
  const resizeStart = useRef({ x: 0, y: 0, cardWidth: 0, cardHeight: 0 })
  const hoverTimeout = useRef<number | undefined>(undefined)
  const jiggleTimeout = useRef<number | undefined>(undefined)

  const isSelected = selectedCardIds.has(card.id)

  // Auto-stop jiggle animation after 3500ms
  useEffect(() => {
    if (isSelected) {
      setShowJiggle(true)
      if (jiggleTimeout.current !== undefined) {
        clearTimeout(jiggleTimeout.current)
      }
      jiggleTimeout.current = setTimeout(() => {
        setShowJiggle(false)
      }, 3500) as unknown as number
    } else {
      setShowJiggle(true)
      if (jiggleTimeout.current !== undefined) {
        clearTimeout(jiggleTimeout.current)
      }
    }

    return () => {
      if (jiggleTimeout.current !== undefined) {
        clearTimeout(jiggleTimeout.current)
      }
    }
  }, [isSelected])

  // Kinopio drag threshold - prevents accidental drags
  const DRAG_THRESHOLD = 5 // pixels

  // Type-specific sizing and styling
  const isSticker = card.cardType === 'sticker'
  const defaultWidth = isSticker ? 60 : 200
  const defaultHeight = isSticker ? 60 : 100

  const width = card.width || defaultWidth
  const height = card.height || defaultHeight
  const backgroundColor = card.color || (isSticker ? 'transparent' : 'var(--primary-background)')
  const zoom = space?.zoom || 1

  // Task energy indicator colors
  const energyColors = {
    high_focus: '#FF9A1A',
    medium: '#FFC48C',
    low_energy: '#C4C9FF',
    social: '#FF8B7B',
  }
  const signalWidths = {
    background: 1,
    normal: 2,
    loud: 3,
    critical: 4,
  }

  // ========== RESIZE HANDLERS (defined first) ==========

  // Handle resize start
  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation() // Don't trigger card drag
      e.preventDefault()

      setIsResizing(true)
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        cardWidth: width,
        cardHeight: height,
      }

      cardRef.current?.setPointerCapture(e.pointerId)
    },
    [width, height]
  )

  // Handle resize move
  const handleResizeMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isResizing) return

      const dx = (e.clientX - resizeStart.current.x) / zoom
      const dy = (e.clientY - resizeStart.current.y) / zoom

      const newWidth = Math.max(100, resizeStart.current.cardWidth + dx) // Min width 100px
      const newHeight = Math.max(60, resizeStart.current.cardHeight + dy) // Min height 60px

      updateCard(card.id, { width: newWidth, height: newHeight })
    },
    [isResizing, card.id, updateCard, zoom]
  )

  // Handle resize end
  const handleResizeEnd = useCallback(
    (e: React.PointerEvent) => {
      if (isResizing) {
        setIsResizing(false)
        cardRef.current?.releasePointerCapture(e.pointerId)
      }
    },
    [isResizing]
  )

  // ========== DRAG HANDLERS ==========

  // Handle drag start
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning) return
      if (isEditing) return
      if (e.button !== 0) return // Left mouse only

      e.stopPropagation()
      selectCard(card.id, e.shiftKey)

      // Don't allow dragging if locked or no edit permission
      if (!canEdit) return

      // Start tracking potential drag (but don't actually drag yet)
      setLocalDragging(true)
      setIsDragging(true)
      dragThresholdCrossed.current = false // Reset threshold
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        cardX: card.x,
        cardY: card.y,
      }

      // Capture pointer
      cardRef.current?.setPointerCapture(e.pointerId)
    },
    [card.id, card.x, card.y, selectCard, setIsDragging, isPanning, isEditing, canEdit]
  )

  // Handle drag move
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Handle resize first (takes priority)
      if (isResizing) {
        handleResizeMove(e)
        return
      }

      if (!isDragging) return

      // Calculate distance from drag start
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Kinopio pattern: only start dragging after crossing threshold
      if (!dragThresholdCrossed.current && distance < DRAG_THRESHOLD) {
        return // Don't drag yet - user might just be clicking
      }

      // Threshold crossed - now we can actually drag
      dragThresholdCrossed.current = true

      // Apply zoom to movement
      const scaledDx = dx / zoom
      const scaledDy = dy / zoom

      moveCard(card.id, dragStart.current.cardX + scaledDx, dragStart.current.cardY + scaledDy)
    },
    [isDragging, isResizing, card.id, moveCard, zoom, handleResizeMove]
  )

  // Handle drag end
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isResizing) {
        handleResizeEnd(e)
      } else if (isDragging) {
        setLocalDragging(false)
        setIsDragging(false)
        cardRef.current?.releasePointerCapture(e.pointerId)
      }
    },
    [isDragging, isResizing, setIsDragging, handleResizeEnd]
  )

  // Handle double-click to edit
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    // Only allow editing if user has permission
    if (!canEdit) return
    setIsEditing(true)
  }, [canEdit])

  // Handle content edit (for Tiptap)
  const handleEditorUpdate = useCallback(
    (content: string) => {
      updateCard(card.id, { name: content })
    },
    [card.id, updateCard]
  )

  // Handle blur (exit edit mode)
  const handleBlur = useCallback(() => {
    setIsEditing(false)
  }, [])

  // Sticky cursor effect on hover
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    hoverTimeout.current = setTimeout(() => {
      // Card will follow cursor slightly
      setStickyOffset({ x: 0, y: 0 })
    }, 200)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    if (hoverTimeout.current !== undefined) {
      clearTimeout(hoverTimeout.current)
    }
    setStickyOffset({ x: 0, y: 0 })
  }, [])

  // Handle keyboard shortcuts when focused
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEditing(false)
        cardRef.current?.blur()
      } else if (e.key === 'Enter' && !e.shiftKey && isEditing) {
        e.preventDefault()
        setIsEditing(false)
        cardRef.current?.blur()
      }
    },
    [isEditing]
  )

  return (
    <div
      ref={cardRef}
      className={`card spatial-card ${isDragging ? 'dragging active' : ''} ${
        isSelected ? `selected ${showJiggle ? 'jiggle' : ''}` : ''
      } ${isEditing ? 'editing' : ''}`}
      data-card-id={card.id}
      style={{
        position: 'absolute',
        left: card.x + stickyOffset.x,
        top: card.y + stickyOffset.y,
        width,
        minHeight: height,
        padding: isSticker ? '8px' : '12px 16px',
        background: backgroundColor,
        borderRadius: 'var(--entity-radius)',
        border: isSticker
          ? 'none'
          : `${card.signal ? signalWidths[card.signal] : 1}px solid ${
              card.energy && card.cardType === 'task'
                ? energyColors[card.energy]
                : 'var(--primary-border)'
            }`,
        boxShadow: isSticker
          ? 'none'
          : isDragging
          ? 'var(--card-shadow-drag)'
          : isSelected && showJiggle
          ? '0 0 0 3px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)'
          : 'var(--card-shadow)',
        animation: isSelected && showJiggle ? 'focus-ring-pulse 2s ease-in-out infinite' : 'none',
        cursor: isDragging ? 'grabbing' : isEditing ? 'text' : isLocked ? 'not-allowed' : 'grab',
        opacity: isLocked ? 0.7 : 1,
        transition: isSelected && showJiggle ? 'none' : 'box-shadow 0.3s ease, transform 0.3s ease, opacity 0.2s ease',
        userSelect: isEditing ? 'text' : 'none',
        zIndex: isDragging ? 1000 : card.z,
        overflow: 'hidden',
        wordWrap: 'break-word',
        fontFamily: 'var(--sans-serif-font)',
        fontSize: isSticker ? '32px' : 'var(--base-font-size)',
        lineHeight: 'var(--base-line-height)',
        color: 'var(--primary)',
        touchAction: 'manipulation',
        textAlign: isSticker ? 'center' : 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={isSticker ? undefined : handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
    >
      {/* Sticker rendering */}
      {card.cardType === 'sticker' && (
        <span style={{ fontSize: card.size === 'large' ? '48px' : card.size === 'small' ? '24px' : '32px' }}>
          {card.icon}
        </span>
      )}

      {/* Task rendering */}
      {card.cardType === 'task' && (
        <>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={card.completed || false}
              onChange={(e) => {
                e.stopPropagation()
                updateCard(card.id, { completed: e.target.checked })
              }}
              style={{ flexShrink: 0 }}
            />
            <span style={{ textDecoration: card.completed ? 'line-through' : 'none', opacity: card.completed ? 0.6 : 1 }}>
              {card.name}
            </span>
          </div>
          {card.energy && (
            <div style={{ fontSize: '11px', opacity: 0.7, display: 'flex', gap: '4px' }}>
              <span>{card.energy === 'high_focus' ? '⚡' : card.energy === 'social' ? '👥' : card.energy === 'low_energy' ? '☁️' : '○'}</span>
            </div>
          )}
        </>
      )}

      {/* Person rendering */}
      {card.cardType === 'person' && (
        <>
          <div style={{ fontWeight: 600 }}>{card.name}</div>
          {card.role && <div style={{ fontSize: '13px', opacity: 0.7 }}>{card.role}</div>}
        </>
      )}

      {/* Note or generic rendering with Tiptap */}
      {(!card.cardType || card.cardType === 'note' || card.cardType === 'generic') && (
        <TiptapEditor
          content={card.name || '<p>Double-click to edit</p>'}
          onUpdate={handleEditorUpdate}
          onBlur={handleBlur}
          editable={isEditing}
        />
      )}

      {/* Lock indicator - show if card is locked */}
      {isLocked && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            fontSize: 14,
            opacity: 0.5,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          title="This card is locked"
        >
          🔒
        </div>
      )}

      {/* Connection handle - only show for non-sticker cards on hover/select and if can edit */}
      {!isSticker && !isLocked && canEdit && (isSelected || isHovered) && (
        <ConnectionHandle
          cardId={card.id}
          cardX={card.x}
          cardY={card.y}
          cardWidth={width}
          cardHeight={height}
          position="right"
        />
      )}

      {/* Resize handle - only show for non-sticker cards and if can edit */}
      {!isSticker && !isLocked && canEdit && (
        <div
          className="card-resize-handle"
          onPointerDown={handleResizeStart}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
        >
          ↘
        </div>
      )}
    </div>
  )
}

// Memoize to prevent unnecessary re-renders (Kinopio performance pattern)
export const SpatialCard = memo(SpatialCardComponent, (prevProps, nextProps) => {
  // Only re-render if card data actually changed
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.card.x === nextProps.card.x &&
    prevProps.card.y === nextProps.card.y &&
    prevProps.card.name === nextProps.card.name &&
    prevProps.card.width === nextProps.card.width &&
    prevProps.card.height === nextProps.card.height &&
    prevProps.card.color === nextProps.card.color &&
    prevProps.card.cardType === nextProps.card.cardType
  )
})
