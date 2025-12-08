// useUndoRedo hook - Keyboard shortcuts and undo/redo logic
// Cmd/Ctrl+Z to undo, Cmd/Ctrl+Shift+Z to redo

import { useEffect, useCallback } from 'react'
import { useHistoryStore } from '../stores/historyStore'
import { useSpatialStore } from '../stores/spatialStore'

export function useUndoRedo() {
  const { undo, redo, canUndo, canRedo } = useHistoryStore()
  const { updateCard, deleteCard, createCard, space } = useSpatialStore()

  // Apply history entry (undo or redo)
  const applyHistoryEntry = useCallback(
    (entry: ReturnType<typeof undo>, isUndo: boolean) => {
      if (!entry || !space) return

      console.log('[UndoRedo] Applying:', entry.action, isUndo ? 'undo' : 'redo')

      switch (entry.action) {
        case 'create':
          if (isUndo) {
            // Undo create = delete
            deleteCard(entry.entityId)
          } else {
            // Redo create = recreate with same data
            if (entry.after) {
              // Create card with exact previous state
              const card = entry.after as any
              createCard(card.x, card.y, card.name)
            }
          }
          break

        case 'delete':
          if (isUndo) {
            // Undo delete = recreate
            if (entry.before) {
              const card = entry.before as any
              createCard(card.x, card.y, card.name)
            }
          } else {
            // Redo delete = delete again
            deleteCard(entry.entityId)
          }
          break

        case 'update':
        case 'move':
          if (isUndo) {
            // Undo update/move = restore previous state
            if (entry.before) {
              updateCard(entry.entityId, entry.before as any)
            }
          } else {
            // Redo update/move = apply new state
            if (entry.after) {
              updateCard(entry.entityId, entry.after as any)
            }
          }
          break
      }
    },
    [space, updateCard, deleteCard, createCard]
  )

  // Undo handler
  const handleUndo = useCallback(() => {
    if (!canUndo()) {
      console.log('[UndoRedo] Nothing to undo')
      return
    }

    const entry = undo()
    if (entry) {
      applyHistoryEntry(entry, true)
    }
  }, [undo, canUndo, applyHistoryEntry])

  // Redo handler
  const handleRedo = useCallback(() => {
    if (!canRedo()) {
      console.log('[UndoRedo] Nothing to redo')
      return
    }

    const entry = redo()
    if (entry) {
      applyHistoryEntry(entry, false)
    }
  }, [redo, canRedo, applyHistoryEntry])

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+Z or Cmd/Ctrl+Shift+Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()

        if (e.shiftKey) {
          // Redo
          handleRedo()
        } else {
          // Undo
          handleUndo()
        }
      }

      // Alternative: Cmd/Ctrl+Y for redo (Windows convention)
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  return {
    undo: handleUndo,
    redo: handleRedo,
    canUndo: canUndo(),
    canRedo: canRedo(),
  }
}
