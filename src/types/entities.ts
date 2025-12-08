// Core Halcyon Entity Types
// Following the POC spec: biology-aligned, spatial, monochrome-first

export type EntityType = 'task' | 'note' | 'person' | 'region' | 'sticker' | 'landmark' | 'waypoint' | 'event' | 'log'

export type EnergyLevel = 'high_focus' | 'medium' | 'low_energy' | 'social'
export type SignalLevel = 'background' | 'normal' | 'loud' | 'critical'
export type CrumpitBucket = 'now' | 'next' | 'later' | 'someday'

export interface SpatialCoords {
  x: number
  y: number
}

export interface SpatialBounds {
  x: number
  y: number
  width: number
  height: number
}

// Base entity that all objects inherit from
export interface BaseEntity {
  id: string
  type: EntityType
  position: SpatialCoords
  createdAt: Date
  updatedAt: Date
  threadId?: string // Which thread this belongs to
  rotation?: number // Slight rotation for organic feel

  // CRDT / Sync support (future-proofing)
  version: number // Lamport timestamp for conflict resolution
  lastModifiedDevice: string // Which device made the last change
  deletedAt?: Date | null // Soft delete for sync safety

  // Semantic zoom
  isLandmark?: boolean // Stays visible at low zoom levels

  // Whimsy & appearance
  stickerIds?: string[] // Visual stickers attached to this entity
  appearance?: {
    borderIntensity?: 'subtle' | 'normal' | 'heavy' | 'critical'
    style?: 'solid' | 'sketch' | 'outline'
  }
}

// Task - the primary unit of work
export interface Task extends BaseEntity {
  type: 'task'
  title: string
  description?: string
  completed: boolean
  energy: EnergyLevel
  signal: SignalLevel
  bucket?: CrumpitBucket // Which Crumpit bucket it's in
  dueDate?: Date
  estimatedMinutes?: number
  links: string[] // IDs of related entities
}

// Note - free-form thoughts and ideas
export interface Note extends BaseEntity {
  type: 'note'
  content: string
  isHandwritten: boolean // Did it come from ink?
  inkStrokes?: string // Serialized ink data
  links: string[]
  style: 'default' | 'handdrawn' | 'thick' | 'dashed'
}

// Person - people you work with or think about
export interface Person extends BaseEntity {
  type: 'person'
  name: string
  role?: string
  avatarColor?: string // Gentle pastel tint
  notes?: string
  relatedTasks: string[]
  relatedNotes: string[]
}

// Region - soft spatial boundaries (zones on canvas)
export interface Region extends BaseEntity {
  type: 'region'
  title?: string
  bounds: SpatialBounds
  pattern: 'dots' | 'hatching' | 'outline' | 'none'
  objects: string[] // IDs of contained entities
  color?: string // Gentle tint if color available
}

// Sticker - visual markers and badges
export interface Sticker extends BaseEntity {
  type: 'sticker'
  icon: string // emoji or glyph
  label?: string
  attachedTo?: string // ID of entity it's stuck to
  size: 'small' | 'medium' | 'large'
}

// Landmark - important waypoints on the canvas
export interface Landmark extends BaseEntity {
  type: 'landmark'
  title: string
  icon: string
  isWaypoint: boolean // Special landmarks like "Today Bench"
  scale: number // Larger = more important
}

// Waypoint - special named locations
export interface Waypoint extends BaseEntity {
  type: 'waypoint'
  name: string
  purpose: 'today' | 'week' | 'backlog' | 'archive' | 'custom'
  bounds: SpatialBounds
}

// Event - immutable objective fact
// System-generated or user-created record of something that happened
export type EventType = 'system_state' | 'communication' | 'work_state' | 'task_completed' | 'custom'

export interface Event extends BaseEntity {
  type: 'event'
  eventType: EventType
  timestamp: Date
  actorId?: string // Who did it?
  targetId?: string // To whom/what?
  data: {
    summary: string // Brief description
    bodyRef?: string // Full content (email, message, etc)
    metadata?: Record<string, any>
  }
}

// Log - subjective narrative meaning
// User-authored reflection, insight, or journal entry
export interface Log extends BaseEntity {
  type: 'log'
  content: string // The narrative/reflection
  writtenAt: Date
  linkedEventId?: string // Optional link to an Event
  valueTags?: string[] // e.g., ["insight", "win", "mood-low"]
  sentiment?: 'positive' | 'neutral' | 'negative'
}

// Thread - collection of related work
export interface Thread {
  id: string
  title: string
  description?: string
  color?: string
  entities: string[] // IDs of all entities in this thread
  createdAt: Date
  updatedAt: Date
  seed: number // For generating consistent background pattern
}

// Union type for all entities
export type HalcyonEntity = Task | Note | Person | Region | Sticker | Landmark | Waypoint | Event | Log

// Crumpit board state
export interface CrumpitState {
  now: string[] // max 3
  next: string[] // max 5
  later: string[]
  someday: string[]
}

// Mode types
export type HalcyonMode = 'think' | 'plan' | 'crumpit' | 'collect' | 'people' | 'log'

// Background style
export type BackgroundStyle = 'plain' | 'organic' | 'world'
