/**
 * Storage Adapters
 *
 * Export all adapters and factory function
 */

export * from './types'
export { LocalStorageAdapter } from './LocalStorageAdapter'
export { IndexedDBAdapter } from './IndexedDBAdapter'
export { CloudflareD1Adapter } from './CloudflareD1Adapter'

import type { StorageAdapter, StorageAdapterType, StorageConfig } from './types'
import { LocalStorageAdapter } from './LocalStorageAdapter'
import { IndexedDBAdapter } from './IndexedDBAdapter'
import { CloudflareD1Adapter } from './CloudflareD1Adapter'

/**
 * Factory function to create storage adapter
 */
export function createStorageAdapter(config: StorageConfig): StorageAdapter {
  switch (config.adapter) {
    case 'localStorage':
      return new LocalStorageAdapter()

    case 'indexedDB':
      return new IndexedDBAdapter(config.dbName)

    case 'cloudflare':
      return new CloudflareD1Adapter(config.apiUrl)

    default:
      console.warn(`Unknown adapter type: ${config.adapter}, falling back to localStorage`)
      return new LocalStorageAdapter()
  }
}

/**
 * Detect best available storage adapter
 */
export async function detectBestAdapter(): Promise<StorageAdapterType> {
  // Try IndexedDB first (best for local storage)
  const indexedDB = new IndexedDBAdapter()
  if (await indexedDB.isAvailable()) {
    return 'indexedDB'
  }

  // Fall back to localStorage
  const localStorage = new LocalStorageAdapter()
  if (await localStorage.isAvailable()) {
    return 'localStorage'
  }

  // Should never happen, but fall back to localStorage anyway
  return 'localStorage'
}
