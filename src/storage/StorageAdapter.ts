/**
 * Storage Adapter Interface
 *
 * Abstracts storage behind a common interface so users can choose
 * their persistence layer: localStorage, IndexedDB, or Cloudflare D1.
 */

export interface StorageAdapter {
  // Core operations
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>

  // Batch operations
  getAll<T>(prefix?: string): Promise<Map<string, T>>
  setMany<T>(items: Map<string, T>): Promise<void>

  // Metadata
  size(): Promise<number>
  keys(): Promise<string[]>

  // Adapter info
  readonly name: string
  readonly maxSize: string // Human-readable, e.g., "5MB", "50MB+", "Unlimited"
}

export type StorageType = 'localStorage' | 'indexedDB' | 'cloudflare'
