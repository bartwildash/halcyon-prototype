// Session Store - Manages user state and permissions
// Follows Kinopio user state patterns

import { create } from 'zustand'
import type { User, UserSession, SpacePermission } from '../types/spatial'
import { isMobileDevice, isOnline as checkOnline } from '../utils/device'

interface SessionStore extends UserSession {
  // Actions
  setUser: (user: User | null) => void
  setOnlineStatus: (isOnline: boolean) => void
  setSpacePermission: (permission: SpacePermission) => void
  signOut: () => void

  // Permission helpers
  canEdit: () => boolean
  canCreate: () => boolean
  canDelete: () => boolean
  canEditCard: (cardUserId: string) => boolean
}

// Default user for MVP (not signed in)
const DEFAULT_USER: User = {
  id: 'user-1',
  name: 'Anonymous',
  color: '#3b82f6',
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  // Initial state
  user: DEFAULT_USER,
  isOnline: checkOnline(),
  isSignedIn: false, // MVP: always not signed in
  isMobile: isMobileDevice(),
  currentSpacePermission: 'owner', // MVP: always owner

  // Actions
  setUser: (user: User | null) => {
    set({
      user,
      isSignedIn: user !== null,
    })
  },

  setOnlineStatus: (isOnline: boolean) => {
    set({ isOnline })
  },

  setSpacePermission: (permission: SpacePermission) => {
    set({ currentSpacePermission: permission })
  },

  signOut: () => {
    set({
      user: null,
      isSignedIn: false,
      currentSpacePermission: 'none',
    })
  },

  // Permission helpers
  canEdit: () => {
    const { currentSpacePermission, isOnline } = get()
    // Offline users can edit (changes queued)
    // Viewers cannot edit
    return currentSpacePermission === 'owner' || currentSpacePermission === 'editor'
  },

  canCreate: () => {
    const { currentSpacePermission } = get()
    return currentSpacePermission === 'owner' || currentSpacePermission === 'editor'
  },

  canDelete: () => {
    const { currentSpacePermission } = get()
    // Only owners and editors can delete
    return currentSpacePermission === 'owner' || currentSpacePermission === 'editor'
  },

  canEditCard: (cardUserId: string) => {
    const { user, currentSpacePermission } = get()

    // Viewers cannot edit any cards
    if (currentSpacePermission === 'viewer') return false

    // Owners can edit all cards
    if (currentSpacePermission === 'owner') return true

    // Editors can only edit their own cards
    if (currentSpacePermission === 'editor') {
      return user?.id === cardUserId
    }

    return false
  },
}))
