/**
 * Storage Adapter Interface
 *
 * Provides a unified interface for different storage backends.
 * Inspired by Fizzy's database adapter pattern.
 */

export type StorageAdapterType = 'localStorage' | 'indexedDB' | 'cloudflare'

export interface StorageAdapter {
  /**
   * Get a value by key
   */
  get<T>(key: string): Promise<T | null>

  /**
   * Set a value by key
   */
  set<T>(key: string, value: T): Promise<void>

  /**
   * Delete a value by key
   */
  delete(key: string): Promise<void>

  /**
   * Clear all values
   */
  clear(): Promise<void>

  /**
   * Get all values with a key prefix
   */
  getAll<T>(prefix: string): Promise<Map<string, T>>

  /**
   * Check if the adapter is available/supported
   */
  isAvailable(): Promise<boolean>

  /**
   * Get storage info (size, capacity, etc.)
   */
  getInfo(): Promise<StorageInfo>
}

export interface StorageInfo {
  type: StorageAdapterType
  available: boolean
  used?: number // bytes used
  quota?: number // total bytes available
  itemCount?: number
}

export interface StorageConfig {
  adapter: StorageAdapterType
  dbName?: string // for IndexedDB
  apiUrl?: string // for Cloudflare D1
  encryptionKey?: string // for future E2E encryption
}

export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  adapter: 'localStorage',
  dbName: 'halcyon-db',
}
