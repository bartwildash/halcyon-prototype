// History Store - Undo/Redo system inspired by Kinopio
// Tracks all entity changes for undo/redo functionality

import { create } from 'zustand'
import type { Card } from '../types/spatial'

export type HistoryAction = 'create' | 'update' | 'delete' | 'move'

export interface HistoryEntry {
  id: string
  timestamp: number
  action: HistoryAction
  entityId: string
  entityType: 'card' | 'connection' | 'box'
  before: Partial<Card> | null // null for create actions
  after: Partial<Card> | null // null for delete actions
}

interface HistoryState {
  entries: HistoryEntry[]
  currentIndex: number
  maxHistorySize: number

  // Actions
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
  undo: () => HistoryEntry | null
  redo: () => HistoryEntry | null
  clear: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

function generateHistoryId(): string {
  return `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: [],
  currentIndex: -1,
  maxHistorySize: 100,

  addEntry: (entry) => {
    set((state) => {
      // Remove any "future" history (entries after current index)
      const truncated = state.entries.slice(0, state.currentIndex + 1)

      // Add new entry
      const newEntry: HistoryEntry = {
        ...entry,
        id: generateHistoryId(),
        timestamp: Date.now(),
      }

      const newEntries = [...truncated, newEntry]

      // Limit history size
      if (newEntries.length > state.maxHistorySize) {
        newEntries.shift()
      }

      return {
        entries: newEntries,
        currentIndex: newEntries.length - 1,
      }
    })
  },

  undo: () => {
    const { entries, currentIndex } = get()

    if (currentIndex < 0) {
      console.log('[History] Nothing to undo')
      return null
    }

    const entry = entries[currentIndex]

    // Move index back
    set({ currentIndex: currentIndex - 1 })

    console.log('[History] Undo:', entry.action, entry.entityId)
    return entry
  },

  redo: () => {
    const { entries, currentIndex } = get()

    if (currentIndex >= entries.length - 1) {
      console.log('[History] Nothing to redo')
      return null
    }

    const entry = entries[currentIndex + 1]

    // Move index forward
    set({ currentIndex: currentIndex + 1 })

    console.log('[History] Redo:', entry.action, entry.entityId)
    return entry
  },

  clear: () => {
    set({ entries: [], currentIndex: -1 })
  },

  canUndo: () => {
    return get().currentIndex >= 0
  },

  canRedo: () => {
    return get().currentIndex < get().entries.length - 1
  },
}))
