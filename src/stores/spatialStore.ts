// Spatial Canvas Store using Zustand
// Follows "speed first" principle: instant updates, async persistence

import { create } from 'zustand'
import type { Space, Card, Connection, Box } from '../types/spatial'
import { saveSpace, loadSpace } from '../utils/persistence'
import { useHistoryStore } from './historyStore'

// Debounced save - don't hammer IndexedDB on every keystroke
let saveTimeout: number | undefined
function debouncedSave(space: Space, delay = 500) {
  if (saveTimeout !== undefined) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(() => {
    saveSpace(space)
  }, delay) as unknown as number
}

// Immediate save (for critical operations like create/delete)
function immediateSave(space: Space) {
  if (saveTimeout !== undefined) {
    clearTimeout(saveTimeout)
  }
  saveSpace(space)
}

interface SpatialStore {
  // Current space
  space: Space | null
  selectedCardIds: Set<string>
  selectedConnectionIds: Set<string>
  selectedBoxIds: Set<string>
  isDragging: boolean
  isPanning: boolean

  // Actions
  loadSpace: (spaceId: string) => Promise<void>
  createSpace: (name: string) => void
  updateSpace: (updates: Partial<Space>) => void

  // Card actions
  createCard: (x: number, y: number, name?: string) => string
  updateCard: (cardId: string, updates: Partial<Card>) => void
  deleteCard: (cardId: string) => void
  deleteAllCards: () => void
  moveCard: (cardId: string, x: number, y: number) => void

  // Connection actions
  createConnection: (startCardId: string, endCardId: string) => void
  deleteConnection: (connectionId: string) => void

  // Box/Frame actions
  createBox: (x: number, y: number, width?: number, height?: number) => string
  updateBox: (boxId: string, updates: Partial<Box>) => void
  deleteBox: (boxId: string) => void

  // Selection actions
  selectCard: (cardId: string, addToSelection?: boolean) => void
  selectCardsInArea: (cardIds: string[]) => void
  clearSelection: () => void

  // Viewport actions
  setZoom: (zoom: number) => void
  setPan: (scrollX: number, scrollY: number) => void
  setIsDragging: (isDragging: boolean) => void
  setIsPanning: (isPanning: boolean) => void
}

// Default user ID (in real app, from auth)
const DEFAULT_USER_ID = 'user-1'

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const useSpatialStore = create<SpatialStore>((set, get) => ({
  space: null,
  selectedCardIds: new Set(),
  selectedConnectionIds: new Set(),
  selectedBoxIds: new Set(),
  isDragging: false,
  isPanning: false,

  loadSpace: async (spaceId: string) => {
    // INSTANT: Restore from IndexedDB
    const localSpace = await loadSpace(spaceId)
    if (localSpace) {
      set({ space: localSpace })
    } else {
      // Create new space if not found
      const newSpace: Space = {
        id: spaceId,
        name: 'Untitled Space',
        cards: [],
        connections: [],
        boxes: [],
        zoom: 1,
        scrollX: 0,
        scrollY: 0,
        userId: DEFAULT_USER_ID,
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      set({ space: newSpace })
      await saveSpace(newSpace)
    }
  },

  createSpace: (name: string) => {
    const newSpace: Space = {
      id: generateId(),
      name,
      cards: [],
      connections: [],
      boxes: [],
      zoom: 1,
      scrollX: 0,
      scrollY: 0,
      userId: DEFAULT_USER_ID,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set({ space: newSpace })
    immediateSave(newSpace) // Create = immediate save
  },

  updateSpace: (updates: Partial<Space>) => {
    const { space } = get()
    if (!space) return

    const updatedSpace = {
      ...space,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    set({ space: updatedSpace })
    debouncedSave(updatedSpace) // Update = debounced
  },

  createCard: (x: number, y: number, name = '') => {
    const { space } = get()
    if (!space) return ''

    const newCard: Card = {
      id: generateId(),
      spaceId: space.id,
      name,
      x,
      y,
      z: space.cards.length,
      userId: DEFAULT_USER_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedSpace = {
      ...space,
      cards: [...space.cards, newCard],
      updatedAt: new Date().toISOString(),
    }
    set({ space: updatedSpace })
    immediateSave(updatedSpace) // Create = immediate save

    // Record in history
    useHistoryStore.getState().addEntry({
      action: 'create',
      entityId: newCard.id,
      entityType: 'card',
      before: null,
      after: newCard,
    })

    return newCard.id
  },

  updateCard: (cardId: string, updates: Partial<Card>) => {
    const { space } = get()
    if (!space) return

    // Get card before update for history
    const cardBefore = space.cards.find((c) => c.id === cardId)
    if (!cardBefore) return

    const updatedCards = space.cards.map((card) =>
      card.id === cardId
        ? { ...card, ...updates, updatedAt: new Date().toISOString() }
        : card
    )

    const cardAfter = updatedCards.find((c) => c.id === cardId)

    const updatedSpace = {
      ...space,
      cards: updatedCards,
      updatedAt: new Date().toISOString(),
    }
    set({ space: updatedSpace })
    debouncedSave(updatedSpace) // Update = debounced (for typing)

    // Record in history (skip if only updatedAt changed)
    if (cardAfter && Object.keys(updates).some(k => k !== 'updatedAt')) {
      useHistoryStore.getState().addEntry({
        action: 'update',
        entityId: cardId,
        entityType: 'card',
        before: cardBefore,
        after: cardAfter,
      })
    }
  },

  deleteCard: (cardId: string) => {
    const { space } = get()
    if (!space) return

    // Get card before deletion for history
    const cardBefore = space.cards.find((c) => c.id === cardId)
    if (!cardBefore) return

    // Also delete connections to this card
    const updatedCards = space.cards.filter((card) => card.id !== cardId)
    const updatedConnections = space.connections.filter(
      (conn) => conn.startCardId !== cardId && conn.endCardId !== cardId
    )

    const updatedSpace = {
      ...space,
      cards: updatedCards,
      connections: updatedConnections,
      updatedAt: new Date().toISOString(),
    }
    set({
      space: updatedSpace,
      selectedCardIds: new Set([...get().selectedCardIds].filter(id => id !== cardId))
    })
    immediateSave(updatedSpace)

    // Record in history
    useHistoryStore.getState().addEntry({
      action: 'delete',
      entityId: cardId,
      entityType: 'card',
      before: cardBefore,
      after: null,
    })
  },

  deleteAllCards: () => {
    const { space } = get()
    if (!space) return

    const updatedSpace = {
      ...space,
      cards: [],
      connections: [],
      updatedAt: new Date().toISOString(),
    }
    set({
      space: updatedSpace,
      selectedCardIds: new Set(),
      selectedConnectionIds: new Set(),
    })
    immediateSave(updatedSpace) // Delete = immediate save
  },

  moveCard: (cardId: string, x: number, y: number) => {
    const { space } = get()
    if (!space) return

    const updatedCards = space.cards.map((card) =>
      card.id === cardId ? { ...card, x, y } : card
    )

    const updatedSpace = {
      ...space,
      cards: updatedCards,
      updatedAt: new Date().toISOString(),
    }
    set({ space: updatedSpace })
    debouncedSave(updatedSpace) // Move = debounced (for smooth dragging)
  },

  createConnection: (startCardId: string, endCardId: string) => {
    const { space } = get()
    if (!space) return

    // Check if connection already exists
    const exists = space.connections.some(
      (conn) =>
        (conn.startCardId === startCardId && conn.endCardId === endCardId) ||
        (conn.startCardId === endCardId && conn.endCardId === startCardId)
    )
    if (exists) return

    const newConnection: Connection = {
      id: generateId(),
      spaceId: space.id,
      startCardId,
      endCardId,
      path: 'curved',
      userId: DEFAULT_USER_ID,
      createdAt: new Date().toISOString(),
    }

    const updatedSpace = {
      ...space,
      connections: [...space.connections, newConnection],
      updatedAt: new Date().toISOString(),
    }
    set({ space: updatedSpace })
    immediateSave(updatedSpace) // Create = immediate save
  },

  deleteConnection: (connectionId: string) => {
    const { space } = get()
    if (!space) return

    const updatedConnections = space.connections.filter(
      (conn) => conn.id !== connectionId
    )

    const updatedSpace = {
      ...space,
      connections: updatedConnections,
      updatedAt: new Date().toISOString(),
    }
    set({
      space: updatedSpace,
      selectedConnectionIds: new Set([...get().selectedConnectionIds].filter(id => id !== connectionId))
    })
    immediateSave(updatedSpace) // Delete = immediate save
  },

  createBox: (x: number, y: number, width = 400, height = 300) => {
    const { space } = get()
    if (!space) return ''

    const newBox: Box = {
      id: generateId(),
      spaceId: space.id,
      x,
      y,
      width,
      height,
      userId: DEFAULT_USER_ID,
      createdAt: new Date().toISOString(),
    }

    const updatedSpace = {
      ...space,
      boxes: [...space.boxes, newBox],
      updatedAt: new Date().toISOString(),
    }
    set({ space: updatedSpace })
    immediateSave(updatedSpace)
    return newBox.id
  },

  updateBox: (boxId: string, updates: Partial<Box>) => {
    const { space } = get()
    if (!space) return

    const updatedBoxes = space.boxes.map((box) =>
      box.id === boxId ? { ...box, ...updates } : box
    )

    const updatedSpace = {
      ...space,
      boxes: updatedBoxes,
      updatedAt: new Date().toISOString(),
    }
    set({ space: updatedSpace })
    debouncedSave(updatedSpace)
  },

  deleteBox: (boxId: string) => {
    const { space } = get()
    if (!space) return

    const updatedBoxes = space.boxes.filter((box) => box.id !== boxId)

    const updatedSpace = {
      ...space,
      boxes: updatedBoxes,
      updatedAt: new Date().toISOString(),
    }
    set({
      space: updatedSpace,
      selectedBoxIds: new Set([...get().selectedBoxIds].filter(id => id !== boxId))
    })
    immediateSave(updatedSpace)
  },

  selectCard: (cardId: string, addToSelection = false) => {
    const { selectedCardIds } = get()
    const newSelection = addToSelection
      ? new Set([...selectedCardIds, cardId])
      : new Set([cardId])
    set({ selectedCardIds: newSelection, selectedConnectionIds: new Set() })
  },

  selectCardsInArea: (cardIds: string[]) => {
    set({ selectedCardIds: new Set(cardIds), selectedConnectionIds: new Set() })
  },

  clearSelection: () => {
    set({ selectedCardIds: new Set(), selectedConnectionIds: new Set() })
  },

  setZoom: (zoom: number) => {
    const { space } = get()
    if (!space) return

    const updatedSpace = {
      ...space,
      zoom,
    }
    set({ space: updatedSpace })
    debouncedSave(updatedSpace) // Zoom = debounced (for smooth scrolling)
  },

  setPan: (scrollX: number, scrollY: number) => {
    const { space } = get()
    if (!space) return

    const updatedSpace = {
      ...space,
      scrollX,
      scrollY,
    }
    set({ space: updatedSpace })
    debouncedSave(updatedSpace) // Pan = debounced (for smooth scrolling)
  },

  setIsDragging: (isDragging: boolean) => {
    set({ isDragging })
  },

  setIsPanning: (isPanning: boolean) => {
    set({ isPanning })
  },
}))
