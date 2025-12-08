// Spatial Canvas Type Definitions
// Following the Kinopio-inspired architecture for DOM-based infinite canvas

export interface Position {
  x: number
  y: number
}

// Extend Card to support Halcyon entity types
export type CardType = 'generic' | 'task' | 'note' | 'person' | 'sticker' | 'orbit' | 'flipclock' | 'pomodoro'

export interface Card {
  id: string
  spaceId: string
  name: string                    // Card content (plain text or markdown)
  x: number
  y: number
  z: number                       // Stack order
  width?: number                  // Auto-sized if not set
  height?: number
  color?: string                  // Background color
  frameId?: string               // If card is inside a box
  userId: string                 // Creator
  createdAt: string
  updatedAt: string

  // Halcyon entity type support
  cardType?: CardType

  // Task-specific fields
  completed?: boolean
  energy?: 'high_focus' | 'medium' | 'low_energy' | 'social'
  signal?: 'background' | 'normal' | 'loud' | 'critical'

  // Person-specific fields
  role?: string
  avatarColor?: string

  // Sticker-specific fields
  icon?: string
  size?: 'small' | 'medium' | 'large'

  // Card locking (for read-only spaces or locked cards)
  isLocked?: boolean             // True if card cannot be edited/moved

  // "Files know things about themselves"
  meta?: Record<string, any>     // Extensible metadata
}

export interface Connection {
  id: string
  spaceId: string
  startCardId: string
  endCardId: string
  path?: 'curved' | 'straight'
  color?: string
  label?: string                 // Optional label on connection
  userId: string
  createdAt: string
}

export interface Box {
  id: string
  spaceId: string
  name?: string                  // Box header/title
  x: number
  y: number
  width: number
  height: number
  color?: string
  userId: string
  createdAt: string
}

// Space permission levels
export type SpacePermission = 'owner' | 'editor' | 'viewer' | 'none'

export interface Space {
  id: string
  name: string
  cards: Card[]
  connections: Connection[]
  boxes: Box[]
  background?: string            // Color or image URL
  zoom: number                   // Current zoom level (0.1 - 3)
  scrollX: number               // Pan position
  scrollY: number
  userId: string                // Owner/creator
  collaboratorIds?: string[]
  isPublic: boolean
  isReadOnly?: boolean          // True if space is locked for viewing only
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  color: string                  // User's cursor/card color
  email?: string
  groupIds?: string[]           // Groups user belongs to
  isAdmin?: boolean             // Global admin status
}

// User session state (follows Kinopio states)
export interface UserSession {
  user: User | null              // null if not signed in
  isOnline: boolean              // Network connectivity
  isSignedIn: boolean            // Authentication status
  isMobile: boolean              // Device type detection
  currentSpacePermission: SpacePermission  // Permission in current space
}

// For offline queue
export interface QueuedOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: 'card' | 'connection' | 'box' | 'space'
  entityId: string
  data: any
  timestamp: number
  retries: number
}

// Viewport state
export interface ViewportTransform {
  zoom: number
  scrollX: number
  scrollY: number
}

// Selection state
export interface SelectionState {
  selectedCardIds: Set<string>
  selectedConnectionIds: Set<string>
  selectedBoxIds: Set<string>
}
