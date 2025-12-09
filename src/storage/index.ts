/**
 * Storage System
 *
 * Factory for creating storage adapters based on user preference.
 * Supports localStorage, IndexedDB, and Cloudflare D1.
 */

import type { StorageAdapter, StorageType } from './StorageAdapter'
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter'
import { IndexedDBAdapter } from './adapters/IndexedDBAdapter'
import { CloudflareAdapter } from './adapters/CloudflareAdapter'

// Storage preference key
const STORAGE_PREF_KEY = 'halcyon-storage-type'

/**
 * Create a storage adapter of the specified type
 */
export function createStorage(type: StorageType): StorageAdapter {
  switch (type) {
    case 'localStorage':
      return new LocalStorageAdapter()
    case 'indexedDB':
      return new IndexedDBAdapter()
    case 'cloudflare':
      return new CloudflareAdapter()
    default:
      return new LocalStorageAdapter()
  }
}

/**
 * Get the current storage preference
 */
export function getStoragePreference(): StorageType {
  try {
    const pref = localStorage.getItem(STORAGE_PREF_KEY)
    if (pref === 'localStorage' || pref === 'indexedDB' || pref === 'cloudflare') {
      return pref
    }
  } catch {
    // localStorage not available
  }
  return 'indexedDB' // Default to IndexedDB for better capacity
}

/**
 * Set the storage preference
 */
export function setStoragePreference(type: StorageType): void {
  try {
    localStorage.setItem(STORAGE_PREF_KEY, type)
  } catch {
    console.error('Failed to save storage preference')
  }
}

/**
 * Migrate data from one storage adapter to another
 */
export async function migrateStorage(
  from: StorageAdapter,
  to: StorageAdapter
): Promise<{ success: boolean; itemCount: number; error?: string }> {
  try {
    const allData = await from.getAll()
    if (allData.size === 0) {
      return { success: true, itemCount: 0 }
    }

    await to.setMany(allData)
    return { success: true, itemCount: allData.size }
  } catch (error) {
    return {
      success: false,
      itemCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get storage info for display
 */
export function getStorageInfo(type: StorageType): { name: string; description: string; maxSize: string } {
  switch (type) {
    case 'localStorage':
      return {
        name: 'Browser Storage',
        description: 'Simple local storage, limited capacity',
        maxSize: '5-10MB',
      }
    case 'indexedDB':
      return {
        name: 'IndexedDB',
        description: 'Large local database, best for offline use',
        maxSize: '50MB+',
      }
    case 'cloudflare':
      return {
        name: 'Cloud Sync',
        description: 'Sync across devices via Cloudflare',
        maxSize: 'Unlimited',
      }
  }
}

// Export types and adapters
export type { StorageAdapter, StorageType }
export { LocalStorageAdapter, IndexedDBAdapter, CloudflareAdapter }

// Create default storage instance
let defaultStorage: StorageAdapter | null = null

export function getDefaultStorage(): StorageAdapter {
  if (!defaultStorage) {
    defaultStorage = createStorage(getStoragePreference())
  }
  return defaultStorage
}

export function setDefaultStorage(storage: StorageAdapter): void {
  defaultStorage = storage
}
