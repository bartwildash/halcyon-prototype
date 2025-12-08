/**
 * IndexedDBAdapter
 *
 * Uses browser IndexedDB (50MB-1GB+ limit, depending on browser).
 * Best for: Large datasets, complex queries, structured data.
 */

import type { StorageAdapter, StorageInfo } from './types'

export class IndexedDBAdapter implements StorageAdapter {
  private dbName: string
  private storeName = 'halcyon_store'
  private db: IDBDatabase | null = null

  constructor(dbName = 'halcyon-db') {
    this.dbName = dbName
  }

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
    try {
      const db = await this.openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const request = store.put(value, key)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.error('IndexedDBAdapter.set error:', error)
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const db = await this.openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const request = store.delete(key)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.error('IndexedDBAdapter.delete error:', error)
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const request = store.clear()

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.error('IndexedDBAdapter.clear error:', error)
    }
  }

  async getAll<T>(prefix: string): Promise<Map<string, T>> {
    const result = new Map<string, T>()
    try {
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
            if (key.startsWith(prefix)) {
              result.set(key, cursor.value as T)
            }
            cursor.continue()
          } else {
            resolve(result)
          }
        }
      })
    } catch (error) {
      console.error('IndexedDBAdapter.getAll error:', error)
      return result
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!window.indexedDB) return false

      // Test if we can open a database
      const testDB = await new Promise<boolean>((resolve) => {
        const request = indexedDB.open('__test__')
        request.onsuccess = () => {
          request.result.close()
          indexedDB.deleteDatabase('__test__')
          resolve(true)
        }
        request.onerror = () => resolve(false)
      })

      return testDB
    } catch {
      return false
    }
  }

  async getInfo(): Promise<StorageInfo> {
    const isAvailable = await this.isAvailable()

    if (!isAvailable) {
      return {
        type: 'indexedDB',
        available: false,
      }
    }

    let itemCount = 0
    try {
      const db = await this.openDB()
      itemCount = await new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly')
        const store = transaction.objectStore(this.storeName)
        const request = store.count()

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
      })
    } catch (error) {
      console.error('IndexedDBAdapter.getInfo error:', error)
    }

    // Try to get storage estimate
    let used: number | undefined
    let quota: number | undefined
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate()
        used = estimate.usage
        quota = estimate.quota
      } catch (error) {
        console.error('Storage estimate error:', error)
      }
    }

    return {
      type: 'indexedDB',
      available: true,
      used,
      quota,
      itemCount,
    }
  }
}
