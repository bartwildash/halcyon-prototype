/**
 * CardContextMenu - Right-click menu for cards with reminder option
 */

import { useState, useEffect, useCallback } from 'react'
import { useSpatialStore } from '../../stores/spatialStore'
import { messageQueue, type QueuedMessage } from '../../services/messageQueue'
import { ReminderPicker } from './ReminderPicker'
import './CardContextMenu.css'

interface Position {
  x: number
  y: number
}

interface CardContextMenuProps {
  isOpen: boolean
  position: Position
  cardId: string
  onClose: () => void
}

export function CardContextMenu({ isOpen, position, cardId, onClose }: CardContextMenuProps) {
  const { space, updateCard, deleteCard } = useSpatialStore()
  const [showReminderPicker, setShowReminderPicker] = useState(false)
  const [reminders, setReminders] = useState<QueuedMessage[]>([])

  const card = space?.cards.find(c => c.id === cardId)

  // Subscribe to reminders for this card
  useEffect(() => {
    const unsubscribe = messageQueue.subscribe((messages) => {
      setReminders(messages.filter(m => m.cardId === cardId))
    })
    return unsubscribe
  }, [cardId])

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    const handleClick = () => onClose()
    // Delay to avoid immediate close
    setTimeout(() => {
      window.addEventListener('click', handleClick)
    }, 0)
    return () => window.removeEventListener('click', handleClick)
  }, [isOpen, onClose])

  const handleSetReminder = useCallback(() => {
    setShowReminderPicker(true)
  }, [])

  const handleDelete = useCallback(() => {
    if (confirm('Delete this card?')) {
      deleteCard(cardId)
    }
    onClose()
  }, [cardId, deleteCard, onClose])

  const handleDuplicate = useCallback(() => {
    if (!card || !space) return
    const newX = card.x + 20
    const newY = card.y + 20
    // This would need to be implemented in the store
    onClose()
  }, [card, space, onClose])

  const handleLockToggle = useCallback(() => {
    if (!card) return
    updateCard(cardId, { isLocked: !card.isLocked })
    onClose()
  }, [card, cardId, updateCard, onClose])

  if (!isOpen || !card) return null

  const pendingReminders = reminders.filter(r => r.status === 'pending').length

  return (
    <>
      <div
        className="card-context-menu"
        style={{
          left: position.x,
          top: position.y,
        }}
        onClick={e => e.stopPropagation()}
      >
        <button className="context-menu-item" onClick={handleSetReminder}>
          <span className="context-menu-icon">🔔</span>
          <span>Set Reminder</span>
          {pendingReminders > 0 && (
            <span className="context-menu-badge">{pendingReminders}</span>
          )}
        </button>

        <button className="context-menu-item" onClick={handleLockToggle}>
          <span className="context-menu-icon">{card.isLocked ? '🔓' : '🔒'}</span>
          <span>{card.isLocked ? 'Unlock' : 'Lock'}</span>
        </button>

        <div className="context-menu-divider" />

        <button className="context-menu-item danger" onClick={handleDelete}>
          <span className="context-menu-icon">🗑️</span>
          <span>Delete</span>
        </button>
      </div>

      {showReminderPicker && (
        <ReminderPicker
          cardId={cardId}
          cardName={card.name || 'Untitled card'}
          onClose={() => {
            setShowReminderPicker(false)
            onClose()
          }}
          existingReminders={reminders}
        />
      )}
    </>
  )
}

// Hook to manage context menu state
export function useCardContextMenu() {
  const [menuState, setMenuState] = useState<{
    isOpen: boolean
    position: Position
    cardId: string
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    cardId: '',
  })

  const openMenu = useCallback((e: React.MouseEvent, cardId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuState({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      cardId,
    })
  }, [])

  const closeMenu = useCallback(() => {
    setMenuState(prev => ({ ...prev, isOpen: false }))
  }, [])

  return {
    menuState,
    openMenu,
    closeMenu,
  }
}
