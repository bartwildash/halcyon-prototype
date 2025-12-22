// API Service for Halcyon Backend
// Handles sync between frontend and Cloudflare Workers backend

import type { Space, Card, Connection, Box, QueuedOperation } from '../types/spatial'

// File upload response type
export interface UploadedFile {
  id: string
  filename: string
  filepath: string
  size_bytes: number
  mime_type: string
  space_id: string | null
  card_id: string | null
  url: string
  created_at: string
}

// File metadata from list endpoint
export interface FileMetadata {
  id: string
  filename: string
  filepath: string
  size_bytes: number
  file_type_id: string | null
  thread_id: string | null
  entity_id: string | null
  space_id: string | null
  metadata: string
  created_at: string
  updated_at: string
  accessed_at: string
}

// API Base URL - configurable per environment
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.halcyon.computer'

// Convert frontend types to backend format (camelCase → snake_case)
function cardToAPI(card: Card): Record<string, any> {
  return {
    id: card.id,
    space_id: card.spaceId,
    name: card.name,
    x: card.x,
    y: card.y,
    z: card.z,
    width: card.width,
    height: card.height,
    card_type: card.cardType || 'text',
    color: card.color,
    metadata: JSON.stringify({
      frameId: card.frameId,
      completed: card.completed,
      energy: card.energy,
      signal: card.signal,
      role: card.role,
      avatarColor: card.avatarColor,
      icon: card.icon,
      size: card.size,
      isLocked: card.isLocked,
      meta: card.meta,
    }),
    created_at: card.createdAt,
  }
}

// Convert backend format to frontend types (snake_case → camelCase)
function cardFromAPI(data: Record<string, any>): Card {
  const metadata = data.metadata ? JSON.parse(data.metadata) : {}
  return {
    id: data.id,
    spaceId: data.space_id,
    name: data.name || '',
    x: data.x || 0,
    y: data.y || 0,
    z: data.z || 0,
    width: data.width,
    height: data.height,
    color: data.color,
    cardType: data.card_type || 'generic',
    userId: data.user_id || 'anonymous',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    // Unpack metadata
    frameId: metadata.frameId,
    completed: metadata.completed,
    energy: metadata.energy,
    signal: metadata.signal,
    role: metadata.role,
    avatarColor: metadata.avatarColor,
    icon: metadata.icon,
    size: metadata.size,
    isLocked: metadata.isLocked,
    meta: metadata.meta,
  }
}

function connectionToAPI(conn: Connection): Record<string, any> {
  return {
    id: conn.id,
    space_id: conn.spaceId,
    start_card_id: conn.startCardId,
    end_card_id: conn.endCardId,
    path_type: conn.path || 'curved',
    color: conn.color,
    label: conn.label,
    created_at: conn.createdAt,
  }
}

function connectionFromAPI(data: Record<string, any>): Connection {
  return {
    id: data.id,
    spaceId: data.space_id,
    startCardId: data.start_card_id,
    endCardId: data.end_card_id,
    path: data.path_type || 'curved',
    color: data.color,
    label: data.label,
    userId: data.user_id || 'anonymous',
    createdAt: data.created_at,
  }
}

function spaceToAPI(space: Space): Record<string, any> {
  return {
    id: space.id,
    name: space.name,
    user_id: space.userId,
    is_public: space.isPublic,
    zoom: space.zoom,
    scroll_x: space.scrollX,
    scroll_y: space.scrollY,
  }
}

function boxToAPI(box: Box): Record<string, any> {
  return {
    id: box.id,
    space_id: box.spaceId,
    name: box.name,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    color: box.color,
    user_id: box.userId,
    created_at: box.createdAt,
  }
}

function boxFromAPI(data: Record<string, any>): Box {
  return {
    id: data.id,
    spaceId: data.space_id,
    name: data.name || '',
    x: data.x || 0,
    y: data.y || 0,
    width: data.width || 400,
    height: data.height || 300,
    color: data.color,
    userId: data.user_id || 'anonymous',
    createdAt: data.created_at,
  }
}

function spaceFromAPI(data: Record<string, any>, cards: Card[], connections: Connection[], boxes: Box[] = []): Space {
  return {
    id: data.id,
    name: data.name || 'Untitled Space',
    cards,
    connections,
    boxes,
    background: data.background_color,
    zoom: data.zoom || 1,
    scrollX: data.scroll_x || 0,
    scrollY: data.scroll_y || 0,
    userId: data.user_id || 'anonymous',
    isPublic: Boolean(data.is_public),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// API Client
class HalcyonAPI {
  private apiKey: string | null = null

  setApiKey(key: string) {
    this.apiKey = key
  }

  private async fetch(path: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `API error: ${response.status}`)
    }

    return response.json()
  }

  // ========== SPACES ==========

  async listSpaces(userId?: string): Promise<Space[]> {
    const params = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
    const spacesData = await this.fetch(`/api/spaces${params}`)

    // For each space, we'd need to fetch cards/connections too
    // For now, return minimal space info
    return spacesData.map((s: any) => spaceFromAPI(s, [], []))
  }

  async getSpace(spaceId: string): Promise<Space> {
    const [spaceData, cardsData, connectionsData, boxesData] = await Promise.all([
      this.fetch(`/api/spaces/${spaceId}`),
      this.fetch(`/api/spaces/${spaceId}/cards`),
      this.fetch(`/api/connections?space_id=${spaceId}`),
      this.fetch(`/api/spaces/${spaceId}/boxes`).catch(() => []), // Boxes optional for backwards compat
    ])

    const cards = cardsData.map(cardFromAPI)
    const connections = connectionsData.map(connectionFromAPI)
    const boxes = boxesData.map(boxFromAPI)

    return spaceFromAPI(spaceData, cards, connections, boxes)
  }

  async createSpace(space: Partial<Space>): Promise<Space> {
    const data = await this.fetch('/api/spaces', {
      method: 'POST',
      body: JSON.stringify(spaceToAPI(space as Space)),
    })
    return spaceFromAPI(data, [], [])
  }

  async updateSpace(spaceId: string, updates: Partial<Space>): Promise<void> {
    await this.fetch(`/api/spaces/${spaceId}`, {
      method: 'PATCH',
      body: JSON.stringify(spaceToAPI(updates as Space)),
    })
  }

  async deleteSpace(spaceId: string): Promise<void> {
    await this.fetch(`/api/spaces/${spaceId}`, {
      method: 'DELETE',
    })
  }

  // ========== CARDS ==========

  async createCard(card: Card): Promise<Card> {
    const data = await this.fetch('/api/cards', {
      method: 'POST',
      body: JSON.stringify(cardToAPI(card)),
    })
    return cardFromAPI(data)
  }

  async updateCard(cardId: string, updates: Partial<Card>): Promise<void> {
    await this.fetch(`/api/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify(cardToAPI(updates as Card)),
    })
  }

  async deleteCard(cardId: string): Promise<void> {
    await this.fetch(`/api/cards/${cardId}`, {
      method: 'DELETE',
    })
  }

  // ========== CONNECTIONS ==========

  async createConnection(conn: Connection): Promise<Connection> {
    const data = await this.fetch('/api/connections', {
      method: 'POST',
      body: JSON.stringify(connectionToAPI(conn)),
    })
    return connectionFromAPI(data)
  }

  async updateConnection(connId: string, updates: Partial<Connection>): Promise<void> {
    await this.fetch(`/api/connections/${connId}`, {
      method: 'PATCH',
      body: JSON.stringify(connectionToAPI(updates as Connection)),
    })
  }

  async deleteConnection(connId: string): Promise<void> {
    await this.fetch(`/api/connections/${connId}`, {
      method: 'DELETE',
    })
  }

  // ========== BOXES ==========

  async createBox(box: Box): Promise<Box> {
    const data = await this.fetch('/api/boxes', {
      method: 'POST',
      body: JSON.stringify(boxToAPI(box)),
    })
    return boxFromAPI(data)
  }

  async updateBox(boxId: string, updates: Partial<Box>): Promise<void> {
    await this.fetch(`/api/boxes/${boxId}`, {
      method: 'PATCH',
      body: JSON.stringify(boxToAPI(updates as Box)),
    })
  }

  async deleteBox(boxId: string): Promise<void> {
    await this.fetch(`/api/boxes/${boxId}`, {
      method: 'DELETE',
    })
  }

  // ========== BULK SYNC ==========

  async syncSpace(space: Space): Promise<{ success: boolean; synced_at: string }> {
    const data = await this.fetch('/api/sync', {
      method: 'POST',
      body: JSON.stringify({
        space: spaceToAPI(space),
        cards: space.cards.map(cardToAPI),
        connections: space.connections.map(connectionToAPI),
        boxes: space.boxes.map(boxToAPI),
      }),
    })
    return data
  }

  // ========== OPERATION QUEUE PROCESSOR ==========

  async processOperation(op: QueuedOperation): Promise<void> {
    switch (op.entity) {
      case 'card':
        if (op.type === 'create') await this.createCard(op.data)
        else if (op.type === 'update') await this.updateCard(op.entityId, op.data)
        else if (op.type === 'delete') await this.deleteCard(op.entityId)
        break

      case 'connection':
        if (op.type === 'create') await this.createConnection(op.data)
        else if (op.type === 'update') await this.updateConnection(op.entityId, op.data)
        else if (op.type === 'delete') await this.deleteConnection(op.entityId)
        break

      case 'box':
        if (op.type === 'create') await this.createBox(op.data)
        else if (op.type === 'update') await this.updateBox(op.entityId, op.data)
        else if (op.type === 'delete') await this.deleteBox(op.entityId)
        break

      case 'space':
        if (op.type === 'create') await this.createSpace(op.data)
        else if (op.type === 'update') await this.updateSpace(op.entityId, op.data)
        else if (op.type === 'delete') await this.deleteSpace(op.entityId)
        break

      default:
        console.warn('Unknown operation entity:', op.entity)
    }
  }

  // ========== FILE UPLOAD/DOWNLOAD ==========

  /**
   * Upload a file to R2 storage
   * @param file - File or Blob to upload
   * @param options - Optional metadata (spaceId, cardId, filename)
   * @returns Upload result with file ID and download URL
   */
  async uploadFile(
    file: File | Blob,
    options?: { spaceId?: string; cardId?: string; filename?: string }
  ): Promise<UploadedFile> {
    const formData = new FormData()
    formData.append('file', file, options?.filename || (file instanceof File ? file.name : 'upload'))

    const params = new URLSearchParams()
    if (options?.spaceId) params.set('space_id', options.spaceId)
    if (options?.cardId) params.set('card_id', options.cardId)
    if (options?.filename) params.set('filename', options.filename)

    const queryString = params.toString()
    const url = `/api/upload${queryString ? '?' + queryString : ''}`

    const headers: Record<string, string> = {}
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }
    // Don't set Content-Type - browser will set it with boundary for FormData

    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(error.error || `Upload error: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Get the full download URL for a file
   * @param fileId - The file ID returned from upload
   * @returns Full URL to download the file
   */
  getDownloadUrl(fileId: string): string {
    return `${API_BASE}/api/download/${fileId}`
  }

  /**
   * Download a file from R2 storage
   * @param fileId - The file ID to download
   * @returns Blob of the file contents
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const headers: Record<string, string> = {}
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const response = await fetch(`${API_BASE}/api/download/${fileId}`, { headers })

    if (!response.ok) {
      throw new Error(`Download error: ${response.status}`)
    }

    return response.blob()
  }

  /**
   * Delete a file from R2 storage
   * @param fileId - The file ID to delete
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.fetch(`/api/upload/${fileId}`, {
      method: 'DELETE',
    })
  }

  /**
   * List files for a space or card
   * @param options - Filter by spaceId or cardId
   * @returns Array of file metadata
   */
  async listFiles(options?: { spaceId?: string; cardId?: string }): Promise<FileMetadata[]> {
    const params = new URLSearchParams()
    if (options?.spaceId) params.set('space_id', options.spaceId)
    if (options?.cardId) params.set('entity_id', options.cardId)

    const queryString = params.toString()
    return this.fetch(`/api/files${queryString ? '?' + queryString : ''}`)
  }

  // ========== HEALTH CHECK ==========

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.fetch('/health')
  }
}

// Export singleton instance
export const api = new HalcyonAPI()

// Export types for use elsewhere
export type { HalcyonAPI }
