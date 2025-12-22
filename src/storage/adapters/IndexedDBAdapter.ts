/**
 * IndexedDBAdapter
 *
 * Uses browser IndexedDB (50MB-1GB+ limit, depending on browser).
 * Best for: Large datasets, complex queries, structured data.
 */

import type { StorageAdapter } from '../StorageAdapter'

export class IndexedDBAdapter implements StorageAdapter {
  readonly name = 'indexedDB'
  readonly maxSize = '50MB+'
  private dbName = 'halcyon-db'
  private storeName = 'halcyon_store'
  private db: IDBDatabase | null = null

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
    })
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly')
        const store = transaction.objectStore(this.storeName)
        const request = store.get(key)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result || null)
      })
    } catch (error) {
      console.error('IndexedDBAdapter.get error:', error)
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(value, key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async delete(key: string): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async clear(): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getAll<T>(prefix?: string): Promise<Map<string, T>> {
    const result = new Map<string, T>()
    const db = await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.openCursor()

      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const key = cursor.key as string
          if (!prefix || key.startsWith(prefix)) {
            result.set(key, cursor.value as T)
          }
          cursor.continue()
        } else {
          resolve(result)
        }
      }
    })
  }

  async setMany<T>(items: Map<string, T>): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      transaction.onerror = () => reject(transaction.error)
      transaction.oncomplete = () => resolve()

      for (const [key, value] of items) {
        store.put(value, key)
      }
    })
  }

  async size(): Promise<number> {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate()
      return estimate.usage || 0
    }
    return 0
  }

  async keys(): Promise<string[]> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAllKeys()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result as string[])
    })
  }
}
