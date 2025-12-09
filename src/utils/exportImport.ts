// Export/Import utilities for Halcyon spaces
// Supports JSON backup and restore

import type { Space } from '../types/spatial'

export interface ExportData {
  version: string
  exportedAt: string
  space: Space
}

/**
 * Export a space to JSON file download
 */
export function exportSpace(space: Space): void {
  const exportData: ExportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    space,
  }

  const dataStr = JSON.stringify(exportData, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `halcyon-${space.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Import a space from JSON file
 * Returns the parsed space or throws an error
 */
export async function importSpace(file: File): Promise<Space> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const data = JSON.parse(text)

        // Handle both old format (just space) and new format (with version)
        let space: Space
        if (data.version && data.space) {
          space = data.space
        } else if (data.id && data.cards) {
          // Old format - direct space object
          space = data
        } else {
          throw new Error('Invalid file format')
        }

        // Validate required fields
        if (!space.id || !Array.isArray(space.cards)) {
          throw new Error('Invalid space data: missing required fields')
        }

        // Ensure arrays exist
        space.connections = space.connections || []
        space.boxes = space.boxes || []
        space.inkStrokes = space.inkStrokes || []

        resolve(space)
      } catch (err) {
        reject(new Error(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

/**
 * Trigger file picker for import
 */
export function pickImportFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'

    input.onchange = () => {
      const file = input.files?.[0] || null
      resolve(file)
    }

    input.oncancel = () => {
      resolve(null)
    }

    input.click()
  })
}

/**
 * Copy space data to clipboard
 */
export async function copySpaceToClipboard(space: Space): Promise<void> {
  const exportData: ExportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    space,
  }

  await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
}

/**
 * Paste space data from clipboard
 */
export async function pasteSpaceFromClipboard(): Promise<Space | null> {
  try {
    const text = await navigator.clipboard.readText()
    const data = JSON.parse(text)

    if (data.version && data.space) {
      return data.space
    } else if (data.id && data.cards) {
      return data
    }

    return null
  } catch {
    return null
  }
}
