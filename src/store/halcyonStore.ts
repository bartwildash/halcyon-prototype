// Halcyon Store - Instant-save state management
// Using Zustand for simplicity and auto-persistence
// Now with pluggable storage adapters!

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  HalcyonEntity,
  HalcyonMode,
  BackgroundStyle,
  CrumpitState,
  Thread,
  Task,
  Note,
  Person,
  Region,
  Sticker,
  Landmark,
  CrumpitBucket,
  Event,
  EventType,
  Log,
} from '../types/entities'
import type { StorageAdapter, StorageConfig } from '../storage/adapters'
import { createStorageAdapter, DEFAULT_STORAGE_CONFIG } from '../storage/adapters'

interface HalcyonState {
  // Core data
  entities: Map<string, HalcyonEntity>
  threads: Map<string, Thread>
  currentThreadId: string | null

  // UI state
  currentMode: HalcyonMode
  backgroundStyle: BackgroundStyle

  // Crumpit state
  crumpit: CrumpitState

  // Storage config
  storageConfig: StorageConfig

  // Actions
  addEntity: (entity: HalcyonEntity) => void
  updateEntity: (id: string, updates: Partial<HalcyonEntity>) => void
  deleteEntity: (id: string) => void
  getEntity: (id: string) => HalcyonEntity | undefined
  getEntitiesByType: <T extends HalcyonEntity>(type: T['type']) => T[]

  // Thread actions
  createThread: (title: string, description?: string) => Thread
  setCurrentThread: (threadId: string | null) => void

  // Mode switching
  setMode: (mode: HalcyonMode) => void

  // Background
  setBackgroundStyle: (style: BackgroundStyle) => void

  // Crumpit actions
  addToCrumpit: (taskId: string, bucket: CrumpitBucket) => void
  removeFromCrumpit: (taskId: string) => void
  moveBetweenBuckets: (taskId: string, fromBucket: CrumpitBucket, toBucket: CrumpitBucket) => void

  // Task helpers
  createTask: (title: string, x: number, y: number) => Task
  toggleTaskComplete: (taskId: string) => void

  // Note helpers
  createNote: (content: string, x: number, y: number) => Note

  // Person helpers
  createPerson: (name: string, x: number, y: number) => Person

  // Sticker helpers
  createSticker: (icon: string, x: number, y: number, size?: 'small' | 'medium' | 'large') => Sticker

  // Event helpers
  createEvent: (summary: string, eventType: EventType, metadata?: Record<string, any>) => Event

  // Log helpers
  createLog: (content: string, linkedEventId?: string, valueTags?: string[]) => Log
  getLogsByDate: (startDate: Date, endDate?: Date) => Log[]

  // Storage adapter actions
  setStorageAdapter: (config: StorageConfig) => Promise<void>
  getStorageInfo: () => Promise<any>
}

// Load storage config from localStorage (fallback to default)
const loadStorageConfig = (): StorageConfig => {
  try {
    const saved = localStorage.getItem('halcyon-storage-config')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.warn('Failed to load storage config:', error)
  }
  return DEFAULT_STORAGE_CONFIG
}

// Global storage adapter instance
let storageAdapter: StorageAdapter = createStorageAdapter(loadStorageConfig())

// Device ID for CRDT conflict resolution
const DEVICE_ID = (() => {
  let id = localStorage.getItem('halcyon-device-id')
  if (!id) {
    id = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('halcyon-device-id', id)
  }
  return id
})()

// Helper to initialize CRDT fields
const initCRDT = () => ({
  version: 1,
  lastModifiedDevice: DEVICE_ID,
  deletedAt: null,
})

// Helper to convert Map to array for persistence
// Now uses pluggable storage adapter
const persistConfig = {
  name: 'halcyon-storage',
  storage: {
    getItem: async (name: string) => {
      try {
        const data = await storageAdapter.get<any>(name)
        if (!data) return null
        return {
          state: {
            ...data.state,
            entities: new Map(data.state.entities),
            threads: new Map(data.state.threads),
          },
        }
      } catch (error) {
        console.error('Storage getItem error:', error)
        return null
      }
    },
    setItem: async (name: string, value: any) => {
      try {
        const data = {
          state: {
            ...value.state,
            entities: Array.from(value.state.entities.entries()),
            threads: Array.from(value.state.threads.entries()),
          },
        }
        await storageAdapter.set(name, data)
      } catch (error) {
        console.error('Storage setItem error:', error)
      }
    },
    removeItem: async (name: string) => {
      try {
        await storageAdapter.delete(name)
      } catch (error) {
        console.error('Storage removeItem error:', error)
      }
    },
  },
}

export const useHalcyonStore = create<HalcyonState>()(
  persist(
    (set, get) => ({
      // Initial state
      entities: new Map(),
      threads: new Map(),
      currentThreadId: null,
      currentMode: 'think',
      backgroundStyle: 'organic',
      crumpit: {
        now: [],
        next: [],
        later: [],
        someday: [],
      },
      storageConfig: loadStorageConfig(),

      // Entity CRUD
      addEntity: (entity) => {
        set((state) => {
          const newEntities = new Map(state.entities)
          newEntities.set(entity.id, entity)
          return { entities: newEntities }
        })
      },

      updateEntity: (id, updates) => {
        set((state) => {
          const entity = state.entities.get(id)
          if (!entity) return state

          const newEntities = new Map(state.entities)
          newEntities.set(id, {
            ...entity,
            ...updates,
            updatedAt: new Date(),
          })
          return { entities: newEntities }
        })
      },

      deleteEntity: (id) => {
        set((state) => {
          const newEntities = new Map(state.entities)
          newEntities.delete(id)
          return { entities: newEntities }
        })
      },

      getEntity: (id) => {
        return get().entities.get(id)
      },

      getEntitiesByType: (type) => {
        const entities = Array.from(get().entities.values())
        return entities.filter((e) => e.type === type) as any
      },

      // Thread management
      createThread: (title, description) => {
        const thread: Thread = {
          id: `thread-${Date.now()}`,
          title,
          description,
          entities: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          seed: Math.random(),
        }

        set((state) => {
          const newThreads = new Map(state.threads)
          newThreads.set(thread.id, thread)
          return { threads: newThreads }
        })

        return thread
      },

      setCurrentThread: (threadId) => {
        set({ currentThreadId: threadId })
      },

      // Mode switching
      setMode: (mode) => {
        set({ currentMode: mode })
      },

      // Background
      setBackgroundStyle: (style) => {
        set({ backgroundStyle: style })
      },

      // Crumpit management
      addToCrumpit: (taskId, bucket) => {
        set((state) => {
          const newCrumpit = { ...state.crumpit }

          // Remove from any existing bucket
          Object.keys(newCrumpit).forEach((b) => {
            newCrumpit[b as CrumpitBucket] = newCrumpit[b as CrumpitBucket].filter(
              (id) => id !== taskId
            )
          })

          // Add to new bucket (respecting limits)
          if (bucket === 'now' && newCrumpit.now.length >= 3) {
            return state // Reject - NOW is full
          }
          if (bucket === 'next' && newCrumpit.next.length >= 5) {
            return state // Reject - NEXT is full
          }

          newCrumpit[bucket].push(taskId)

          // Update task entity
          get().updateEntity(taskId, { bucket })

          return { crumpit: newCrumpit }
        })
      },

      removeFromCrumpit: (taskId) => {
        set((state) => {
          const newCrumpit = { ...state.crumpit }
          Object.keys(newCrumpit).forEach((bucket) => {
            newCrumpit[bucket as CrumpitBucket] = newCrumpit[bucket as CrumpitBucket].filter(
              (id) => id !== taskId
            )
          })

          get().updateEntity(taskId, { bucket: undefined })

          return { crumpit: newCrumpit }
        })
      },

      moveBetweenBuckets: (taskId, fromBucket, toBucket) => {
        get().removeFromCrumpit(taskId)
        get().addToCrumpit(taskId, toBucket)
      },

      // Task helpers
      createTask: (title, x, y) => {
        const task: Task = {
          id: `task-${Date.now()}-${Math.random()}`,
          type: 'task',
          title,
          completed: false,
          energy: 'medium',
          signal: 'normal',
          position: { x, y },
          createdAt: new Date(),
          updatedAt: new Date(),
          links: [],
        }

        get().addEntity(task)
        return task
      },

      toggleTaskComplete: (taskId) => {
        const task = get().getEntity(taskId) as Task
        if (task && task.type === 'task') {
          get().updateEntity(taskId, { completed: !task.completed })
        }
      },

      // Note helpers
      createNote: (content, x, y) => {
        const note: Note = {
          id: `note-${Date.now()}-${Math.random()}`,
          type: 'note',
          content,
          isHandwritten: false,
          position: { x, y },
          createdAt: new Date(),
          updatedAt: new Date(),
          links: [],
          style: 'default',
        }

        get().addEntity(note)
        return note
      },

      // Person helpers
      createPerson: (name, x, y) => {
        const person: Person = {
          id: `person-${Date.now()}-${Math.random()}`,
          type: 'person',
          name,
          position: { x, y },
          createdAt: new Date(),
          updatedAt: new Date(),
          ...initCRDT(),
          relatedTasks: [],
          relatedNotes: [],
        }

        get().addEntity(person)
        return person
      },

      // Sticker helpers
      createSticker: (icon, x, y, size = 'medium') => {
        const sticker: Sticker = {
          id: `sticker-${Date.now()}-${Math.random()}`,
          type: 'sticker',
          icon,
          size,
          position: { x, y },
          createdAt: new Date(),
          updatedAt: new Date(),
          ...initCRDT(),
        }

        get().addEntity(sticker)
        return sticker
      },

      // Event helpers
      createEvent: (summary, eventType, metadata) => {
        const event: Event = {
          id: `event-${Date.now()}-${Math.random()}`,
          type: 'event',
          eventType,
          timestamp: new Date(),
          position: { x: 0, y: 0 }, // Events don't have spatial position
          createdAt: new Date(),
          updatedAt: new Date(),
          ...initCRDT(),
          data: {
            summary,
            metadata,
          },
        }

        get().addEntity(event)
        return event
      },

      // Log helpers
      createLog: (content, linkedEventId, valueTags) => {
        const log: Log = {
          id: `log-${Date.now()}-${Math.random()}`,
          type: 'log',
          content,
          writtenAt: new Date(),
          linkedEventId,
          valueTags,
          position: { x: 0, y: 0 }, // Logs don't have spatial position initially
          createdAt: new Date(),
          updatedAt: new Date(),
          ...initCRDT(),
        }

        get().addEntity(log)
        return log
      },

      getLogsByDate: (startDate, endDate) => {
        const logs = get().getEntitiesByType<Log>('log')
        const end = endDate || new Date()

        return logs.filter(log => {
          const writtenAt = new Date(log.writtenAt)
          return writtenAt >= startDate && writtenAt <= end
        }).sort((a, b) =>
          new Date(b.writtenAt).getTime() - new Date(a.writtenAt).getTime()
        )
      },

      // Storage adapter management
      setStorageAdapter: async (config: StorageConfig) => {
        try {
          // Save config to localStorage
          localStorage.setItem('halcyon-storage-config', JSON.stringify(config))

          // Get current state before switching
          const currentState = get()

          // Create new adapter
          const newAdapter = createStorageAdapter(config)

          // Check if available
          const isAvailable = await newAdapter.isAvailable()
          if (!isAvailable) {
            throw new Error(`Storage adapter ${config.adapter} is not available`)
          }

          // Migrate data to new adapter
          const stateToMigrate = {
            state: {
              entities: Array.from(currentState.entities.entries()),
              threads: Array.from(currentState.threads.entries()),
              currentThreadId: currentState.currentThreadId,
              currentMode: currentState.currentMode,
              backgroundStyle: currentState.backgroundStyle,
              crumpit: currentState.crumpit,
              storageConfig: config,
            },
          }

          await newAdapter.set('halcyon-storage', stateToMigrate)

          // Update global adapter
          storageAdapter = newAdapter

          // Update state
          set({ storageConfig: config })

          console.log(`✅ Switched to ${config.adapter} storage adapter`)
        } catch (error) {
          console.error('Failed to switch storage adapter:', error)
          throw error
        }
      },

      getStorageInfo: async () => {
        return await storageAdapter.getInfo()
      },
    }),
    persistConfig as any
  )
)
