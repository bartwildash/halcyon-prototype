// Unit tests for spatialStore
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSpatialStore } from './spatialStore'

// Mock persistence
vi.mock('../utils/persistence', () => ({
  saveSpace: vi.fn(),
  loadSpace: vi.fn(),
}))

describe('spatialStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSpatialStore.setState({
      space: null,
      selectedCardIds: new Set(),
      selectedConnectionIds: new Set(),
      selectedBoxIds: new Set(),
      isDragging: false,
      isPanning: false,
      toolMode: 'hand',
    })
  })

  describe('createSpace', () => {
    it('creates a new space with default values', () => {
      const { createSpace } = useSpatialStore.getState()

      createSpace('Test Space')

      const { space } = useSpatialStore.getState()
      expect(space).not.toBeNull()
      expect(space?.name).toBe('Test Space')
      expect(space?.cards).toEqual([])
      expect(space?.connections).toEqual([])
      expect(space?.zoom).toBe(1)
      expect(space?.scrollX).toBe(0)
      expect(space?.scrollY).toBe(0)
    })
  })

  describe('createCard', () => {
    it('creates a card at specified position', () => {
      const { createSpace, createCard } = useSpatialStore.getState()

      createSpace('Test Space')
      const cardId = createCard(100, 200, 'Test Card')

      const { space } = useSpatialStore.getState()
      expect(space?.cards.length).toBe(1)

      const card = space?.cards.find(c => c.id === cardId)
      expect(card).toBeDefined()
      expect(card?.x).toBe(100)
      expect(card?.y).toBe(200)
      expect(card?.name).toBe('Test Card')
    })

    it('returns empty string if no space exists', () => {
      const { createCard } = useSpatialStore.getState()

      const cardId = createCard(100, 200)

      expect(cardId).toBe('')
    })
  })

  describe('updateCard', () => {
    it('updates card properties', () => {
      const { createSpace, createCard, updateCard } = useSpatialStore.getState()

      createSpace('Test Space')
      const cardId = createCard(100, 200, 'Original')

      updateCard(cardId, { name: 'Updated', color: '#ff0000' })

      const { space } = useSpatialStore.getState()
      const card = space?.cards.find(c => c.id === cardId)
      expect(card?.name).toBe('Updated')
      expect(card?.color).toBe('#ff0000')
    })
  })

  describe('deleteCard', () => {
    it('removes card from space', () => {
      const { createSpace, createCard, deleteCard } = useSpatialStore.getState()

      createSpace('Test Space')
      const cardId = createCard(100, 200, 'To Delete')

      expect(useSpatialStore.getState().space?.cards.length).toBe(1)

      deleteCard(cardId)

      expect(useSpatialStore.getState().space?.cards.length).toBe(0)
    })

    it('removes connections to deleted card', () => {
      const { createSpace, createCard, createConnection, deleteCard } = useSpatialStore.getState()

      createSpace('Test Space')
      const card1 = createCard(100, 100, 'Card 1')
      const card2 = createCard(200, 200, 'Card 2')
      createConnection(card1, card2)

      expect(useSpatialStore.getState().space?.connections.length).toBe(1)

      deleteCard(card1)

      expect(useSpatialStore.getState().space?.connections.length).toBe(0)
    })
  })

  describe('createConnection', () => {
    it('creates connection between two cards', () => {
      const { createSpace, createCard, createConnection } = useSpatialStore.getState()

      createSpace('Test Space')
      const card1 = createCard(100, 100, 'Card 1')
      const card2 = createCard(200, 200, 'Card 2')

      createConnection(card1, card2)

      const { space } = useSpatialStore.getState()
      expect(space?.connections.length).toBe(1)
      expect(space?.connections[0].startCardId).toBe(card1)
      expect(space?.connections[0].endCardId).toBe(card2)
    })

    it('does not create duplicate connections', () => {
      const { createSpace, createCard, createConnection } = useSpatialStore.getState()

      createSpace('Test Space')
      const card1 = createCard(100, 100, 'Card 1')
      const card2 = createCard(200, 200, 'Card 2')

      createConnection(card1, card2)
      createConnection(card1, card2) // Duplicate
      createConnection(card2, card1) // Reverse direction

      const { space } = useSpatialStore.getState()
      expect(space?.connections.length).toBe(1)
    })
  })

  describe('selection', () => {
    it('selects a card', () => {
      const { createSpace, createCard, selectCard } = useSpatialStore.getState()

      createSpace('Test Space')
      const cardId = createCard(100, 100, 'Card')

      selectCard(cardId)

      const { selectedCardIds } = useSpatialStore.getState()
      expect(selectedCardIds.has(cardId)).toBe(true)
    })

    it('adds to selection with addToSelection flag', () => {
      const { createSpace, createCard, selectCard } = useSpatialStore.getState()

      createSpace('Test Space')
      const card1 = createCard(100, 100, 'Card 1')
      const card2 = createCard(200, 200, 'Card 2')

      selectCard(card1)
      selectCard(card2, true)

      const { selectedCardIds } = useSpatialStore.getState()
      expect(selectedCardIds.size).toBe(2)
      expect(selectedCardIds.has(card1)).toBe(true)
      expect(selectedCardIds.has(card2)).toBe(true)
    })

    it('clears selection', () => {
      const { createSpace, createCard, selectCard, clearSelection } = useSpatialStore.getState()

      createSpace('Test Space')
      const cardId = createCard(100, 100, 'Card')
      selectCard(cardId)

      clearSelection()

      const { selectedCardIds } = useSpatialStore.getState()
      expect(selectedCardIds.size).toBe(0)
    })
  })

  describe('toolMode', () => {
    it('switches between hand and select modes', () => {
      const { setToolMode } = useSpatialStore.getState()

      expect(useSpatialStore.getState().toolMode).toBe('hand')

      setToolMode('select')
      expect(useSpatialStore.getState().toolMode).toBe('select')

      setToolMode('hand')
      expect(useSpatialStore.getState().toolMode).toBe('hand')
    })
  })

  describe('viewport', () => {
    it('sets zoom level', () => {
      const { createSpace, setZoom } = useSpatialStore.getState()

      createSpace('Test Space')
      setZoom(1.5)

      expect(useSpatialStore.getState().space?.zoom).toBe(1.5)
    })

    it('sets pan position', () => {
      const { createSpace, setPan } = useSpatialStore.getState()

      createSpace('Test Space')
      setPan(100, 200)

      const { space } = useSpatialStore.getState()
      expect(space?.scrollX).toBe(100)
      expect(space?.scrollY).toBe(200)
    })
  })
})
