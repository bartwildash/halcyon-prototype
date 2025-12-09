// useSync - Hook for syncing space data with the backend
// Follows "speed first" principle: instant local updates, async server sync

import { useEffect, useRef, useCallback, useState } from 'react'
import { useSpatialStore } from '../stores/spatialStore'
import { api } from '../services/api'
import { saveSpace, loadSpace, queueOperation, processQueue } from '../utils/persistence'
import type { Space, QueuedOperation } from '../types/spatial'

// Sync configuration
const SYNC_INTERVAL = 30000 // Sync every 30 seconds
const RETRY_DELAY = 5000 // Retry failed syncs after 5 seconds

interface SyncState {
  isSyncing: boolean
  lastSyncAt: string | null
  syncError: string | null
  isOnline: boolean
}

export function useSync(spaceId: string | null) {
  const space = useSpatialStore((s) => s.space)
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncAt: null,
    syncError: null,
    isOnline: navigator.onLine,
  })

  const lastSyncedVersion = useRef<string | null>(null)
  const syncTimeoutRef = useRef<number | null>(null)

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setSyncState((s) => ({ ...s, isOnline: true }))
      // Trigger sync when coming online
      if (space) {
        syncToServer(space)
      }
      // Process queued operations
      processQueuedOperations()
    }

    const handleOffline = () => {
      setSyncState((s) => ({ ...s, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [space])

  // Sync space to server
  const syncToServer = useCallback(async (spaceToSync: Space) => {
    // Skip if not online
    if (!navigator.onLine) {
      console.log('[Sync] Offline, skipping server sync')
      return
    }

    // Skip if space hasn't changed since last sync
    if (lastSyncedVersion.current === spaceToSync.updatedAt) {
      console.log('[Sync] No changes since last sync')
      return
    }

    setSyncState((s) => ({ ...s, isSyncing: true, syncError: null }))

    try {
      const result = await api.syncSpace(spaceToSync)
      lastSyncedVersion.current = spaceToSync.updatedAt
      setSyncState((s) => ({
        ...s,
        isSyncing: false,
        lastSyncAt: result.synced_at,
      }))
      console.log('[Sync] Successfully synced to server:', result)
    } catch (error) {
      console.error('[Sync] Failed to sync to server:', error)
      setSyncState((s) => ({
        ...s,
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Sync failed',
      }))

      // Queue the operation for later retry
      await queueOperation({
        id: `sync-${Date.now()}`,
        type: 'update',
        entity: 'space',
        entityId: spaceToSync.id,
        data: spaceToSync,
        timestamp: Date.now(),
        retries: 0,
      })
    }
  }, [])

  // Process queued operations
  const processQueuedOperations = useCallback(async () => {
    if (!navigator.onLine) return

    try {
      await processQueue(async (op: QueuedOperation) => {
        await api.processOperation(op)
      })
      console.log('[Sync] Processed queued operations')
    } catch (error) {
      console.error('[Sync] Failed to process queue:', error)
    }
  }, [])

  // Initial load from server (with local cache fallback)
  const loadFromServer = useCallback(async (id: string) => {
    // First, try to load from local cache for instant display
    const localSpace = await loadSpace(id)
    if (localSpace) {
      useSpatialStore.setState({ space: localSpace })
      lastSyncedVersion.current = localSpace.updatedAt
    }

    // Then fetch from server if online
    if (navigator.onLine) {
      setSyncState((s) => ({ ...s, isSyncing: true }))
      try {
        const serverSpace = await api.getSpace(id)

        // Compare timestamps to see which is newer
        if (!localSpace || new Date(serverSpace.updatedAt) > new Date(localSpace.updatedAt)) {
          useSpatialStore.setState({ space: serverSpace })
          await saveSpace(serverSpace)
          lastSyncedVersion.current = serverSpace.updatedAt
          console.log('[Sync] Loaded newer version from server')
        } else {
          // Local is newer, push to server
          console.log('[Sync] Local version is newer, pushing to server')
          await syncToServer(localSpace)
        }

        setSyncState((s) => ({
          ...s,
          isSyncing: false,
          lastSyncAt: new Date().toISOString(),
        }))
      } catch (error) {
        console.warn('[Sync] Failed to load from server, using local cache:', error)
        setSyncState((s) => ({
          ...s,
          isSyncing: false,
          syncError: 'Failed to load from server',
        }))
      }
    }
  }, [syncToServer])

  // Periodic sync
  useEffect(() => {
    if (!space || !spaceId) return

    // Schedule periodic sync
    const scheduleSync = () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      syncTimeoutRef.current = window.setTimeout(() => {
        if (space) {
          syncToServer(space)
        }
        scheduleSync() // Schedule next sync
      }, SYNC_INTERVAL)
    }

    scheduleSync()

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [space, spaceId, syncToServer])

  // Sync when space changes (debounced via the store)
  useEffect(() => {
    if (!space) return

    // Debounced sync on changes
    const syncTimeout = setTimeout(() => {
      syncToServer(space)
    }, 2000) // Wait 2 seconds after last change before syncing

    return () => clearTimeout(syncTimeout)
  }, [space?.updatedAt, syncToServer])

  // Manual sync trigger
  const forceSync = useCallback(() => {
    if (space) {
      syncToServer(space)
    }
  }, [space, syncToServer])

  return {
    syncState,
    loadFromServer,
    forceSync,
    processQueuedOperations,
  }
}
