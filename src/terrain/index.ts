/**
 * Terrain System
 *
 * Exports all terrain-related types, shaders, and components
 */

export * from './types'
export * from './shaders'
export { TerrainCanvas } from './TerrainCanvas'

// Mode to Terrain mapping
import type { HalcyonMode } from '../types/entities'
import type { TerrainId } from './types'

export const modeToTerrain: Record<HalcyonMode, TerrainId> = {
  think: 'meadow',
  plan: 'lake', // Planning uses lake terrain (quiet center, focus)
  crumpit: 'mountain',
  collect: 'meadow', // Collect uses meadow terrain for now
  people: 'meadow', // People uses meadow terrain for now
  log: 'canyon',
  // Future:
  // write: 'lake', (currently using for PLAN mode)
}
