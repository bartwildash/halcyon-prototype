/**
 * CloudflareD1Adapter
 *
 * Uses Cloudflare D1 SQLite database (unlimited storage, edge-deployed).
 * Best for: Multi-device sync, cloud backup, sharing data.
 */

import type { StorageAdapter, StorageInfo } from './types'

export class CloudflareD1Adapter implements StorageAdapter {
  private apiUrl: string

  constructor(apiUrl = 'https://halcyon.computer/api') {
    this.apiUrl = apiUrl
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const response = await fetch(`${this.apiUrl}/kv/${encodeURIComponent(key)}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`HTTP ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('CloudflareD1Adapter.get error:', error)
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/kv/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('CloudflareD1Adapter.set error:', error)
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/kv/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      })
      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('CloudflareD1Adapter.delete error:', error)
    }
  }

  async clear(): Promise<void> {
    try {
      // This would need a custom endpoint to clear all Halcyon keys
      const response = await fetch(`${this.apiUrl}/kv/clear`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('CloudflareD1Adapter.clear error:', error)
    }
  }

  async getAll<T>(prefix: string): Promise<Map<string, T>> {
    const result = new Map<string, T>()
    try {
      const response = await fetch(
        `${this.apiUrl}/kv?prefix=${encodeURIComponent(prefix)}`
      )
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        for (const item of data) {
          result.set(item.key, item.value as T)
        }
      }
    } catch (error) {
      console.error('CloudflareD1Adapter.getAll error:', error)
    }
    return result
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000), // 5s timeout
      })
      return response.ok
    } catch {
      return false
    }
  }

  async getInfo(): Promise<StorageInfo> {
    const isAvailable = await this.isAvailable()

    if (!isAvailable) {
      return {
        type: 'cloudflare',
        available: false,
      }
    }

    // Try to get stats from API
    let itemCount: number | undefined
    let used: number | undefined

    try {
      const response = await fetch(`${this.apiUrl}/stats`)
      if (response.ok) {
        const stats = await response.json()
        itemCount = stats.itemCount
        used = stats.storageUsed
      }
    } catch (error) {
      console.error('CloudflareD1Adapter.getInfo error:', error)
    }

    return {
      type: 'cloudflare',
      available: true,
      used,
      quota: undefined, // D1 has no hard quota
      itemCount,
    }
  }
}
