/**
 * LocalStorageAdapter
 *
 * Uses browser localStorage (5-10MB limit).
 * Best for: Small datasets, simple persistence, maximum compatibility.
 */

import type { StorageAdapter } from '../StorageAdapter'

export class LocalStorageAdapter implements StorageAdapter {
  readonly name = 'localStorage'
  readonly maxSize = '5-10MB'
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
    localStorage.removeItem(this.prefix + key)
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key)
      }
    }
  }

  async getAll<T>(prefix?: string): Promise<Map<string, T>> {
    const result = new Map<string, T>()
    const fullPrefix = this.prefix + (prefix || '')
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
    return result
  }

  async setMany<T>(items: Map<string, T>): Promise<void> {
    for (const [key, value] of items) {
      await this.set(key, value)
    }
  }

  async size(): Promise<number> {
    let total = 0
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        const item = localStorage.getItem(key)
        if (item) {
          total += item.length * 2 // UTF-16 = 2 bytes per char
        }
      }
    }
    return total
  }

  async keys(): Promise<string[]> {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix))
      .map(k => k.replace(this.prefix, ''))
  }
}
