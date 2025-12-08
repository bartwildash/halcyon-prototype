/**
 * LocalStorageAdapter
 *
 * Uses browser localStorage (5-10MB limit).
 * Best for: Small datasets, simple persistence, maximum compatibility.
 */

import type { StorageAdapter, StorageInfo } from './types'

export class LocalStorageAdapter implements StorageAdapter {
  private prefix = 'halcyon:'

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.prefix + key)
      if (!item) return null
      return JSON.parse(item) as T
    } catch (error) {
      console.error('LocalStorageAdapter.get error:', error)
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value))
    } catch (error) {
      console.error('LocalStorageAdapter.set error:', error)
      throw new Error('localStorage quota exceeded')
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key)
    } catch (error) {
      console.error('LocalStorageAdapter.delete error:', error)
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.error('LocalStorageAdapter.clear error:', error)
    }
  }

  async getAll<T>(prefix: string): Promise<Map<string, T>> {
    const result = new Map<string, T>()
    try {
      const fullPrefix = this.prefix + prefix
      const keys = Object.keys(localStorage)

      for (const key of keys) {
        if (key.startsWith(fullPrefix)) {
          const item = localStorage.getItem(key)
          if (item) {
            const cleanKey = key.replace(this.prefix, '')
            result.set(cleanKey, JSON.parse(item) as T)
          }
        }
      }
    } catch (error) {
      console.error('LocalStorageAdapter.getAll error:', error)
    }
    return result
  }

  async isAvailable(): Promise<boolean> {
    try {
      const testKey = this.prefix + '__test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  async getInfo(): Promise<StorageInfo> {
    const isAvailable = await this.isAvailable()

    if (!isAvailable) {
      return {
        type: 'localStorage',
        available: false,
      }
    }

    // Estimate used storage
    let used = 0
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        const item = localStorage.getItem(key)
        if (item) {
          used += item.length * 2 // UTF-16 = 2 bytes per char
        }
      }
    }

    const itemCount = keys.filter(k => k.startsWith(this.prefix)).length

    return {
      type: 'localStorage',
      available: true,
      used,
      quota: 5 * 1024 * 1024, // ~5MB typical limit
      itemCount,
    }
  }
}
