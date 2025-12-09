/**
 * CloudflareAdapter
 *
 * Uses Cloudflare D1 via backend API for cloud sync.
 * Best for: Cross-device sync, unlimited storage, collaboration.
 */

import type { StorageAdapter } from '../StorageAdapter'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.halcyon.computer'

export class CloudflareAdapter implements StorageAdapter {
  readonly name = 'cloudflare'
  readonly maxSize = 'Unlimited'
  private apiKey: string | null = null

  setApiKey(key: string) {
    this.apiKey = key
  }

  private async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const response = await this.fetch(`/api/storage/${encodeURIComponent(key)}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`API error: ${response.status}`)
      }
      return response.json()
    } catch (error) {
      console.error('CloudflareAdapter.get error:', error)
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const response = await this.fetch(`/api/storage/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(value),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
  }

  async delete(key: string): Promise<void> {
    const response = await this.fetch(`/api/storage/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    })

    if (!response.ok && response.status !== 404) {
      throw new Error(`API error: ${response.status}`)
    }
  }

  async clear(): Promise<void> {
    const response = await this.fetch('/api/storage', {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
  }

  async getAll<T>(prefix?: string): Promise<Map<string, T>> {
    const result = new Map<string, T>()
    try {
      const params = prefix ? `?prefix=${encodeURIComponent(prefix)}` : ''
      const response = await this.fetch(`/api/storage${params}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      if (Array.isArray(data)) {
        for (const item of data) {
          result.set(item.key, item.value)
        }
      }
    } catch (error) {
      console.error('CloudflareAdapter.getAll error:', error)
    }
    return result
  }

  async setMany<T>(items: Map<string, T>): Promise<void> {
    const batch = Array.from(items.entries()).map(([key, value]) => ({
      key,
      value,
    }))

    const response = await this.fetch('/api/storage/batch', {
      method: 'PUT',
      body: JSON.stringify({ items: batch }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
  }

  async size(): Promise<number> {
    try {
      const response = await this.fetch('/api/storage/size')
      if (!response.ok) return 0
      const data = await response.json()
      return data.size || 0
    } catch {
      return 0
    }
  }

  async keys(): Promise<string[]> {
    try {
      const response = await this.fetch('/api/storage/keys')
      if (!response.ok) return []
      return response.json()
    } catch {
      return []
    }
  }
}
