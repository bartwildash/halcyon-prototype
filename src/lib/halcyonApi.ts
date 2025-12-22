// Halcyon API Client for halcyon.computer
// Interfaces with Cloudflare Worker D1 database

const API_BASE = import.meta.env.VITE_API_URL || 'https://halcyon.computer/api'

export interface FileType {
  id: string
  name: string
  extension: string
  mime_type?: string
  description?: string
  icon?: string
  category?: string
  is_halcyon_native: boolean
  created_at: string
  updated_at: string
}

export interface HalcyonFile {
  id: string
  file_type_id: string
  filename: string
  filepath: string
  size_bytes?: number
  hash?: string
  thread_id?: string
  entity_id?: string
  parent_id?: string
  tags?: string[]
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  accessed_at: string
}

class HalcyonApiClient {
  private baseUrl: string

  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // File Types API
  async getFileTypes(): Promise<FileType[]> {
    return this.request<FileType[]>('/file-types')
  }

  async getFileType(id: string): Promise<FileType> {
    return this.request<FileType>(`/file-types/${id}`)
  }

  async createFileType(data: Partial<FileType>): Promise<FileType> {
    return this.request<FileType>('/file-types', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateFileType(id: string, data: Partial<FileType>): Promise<FileType> {
    return this.request<FileType>(`/file-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteFileType(id: string): Promise<{ success: boolean }> {
    return this.request(`/file-types/${id}`, {
      method: 'DELETE',
    })
  }

  // Files API
  async getFiles(params?: { thread_id?: string; entity_id?: string }): Promise<HalcyonFile[]> {
    const query = new URLSearchParams(params as any).toString()
    const endpoint = query ? `/files?${query}` : '/files'
    return this.request<HalcyonFile[]>(endpoint)
  }

  async getFile(id: string): Promise<HalcyonFile> {
    return this.request<HalcyonFile>(`/files/${id}`)
  }

  async createFile(data: Partial<HalcyonFile>): Promise<HalcyonFile> {
    return this.request<HalcyonFile>('/files', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateFile(id: string, data: Partial<HalcyonFile>): Promise<HalcyonFile> {
    return this.request<HalcyonFile>(`/files/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteFile(id: string): Promise<{ success: boolean }> {
    return this.request(`/files/${id}`, {
      method: 'DELETE',
    })
  }

  // Health check
  async health(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health')
  }
}

// Export singleton instance
export const halcyonApi = new HalcyonApiClient()
