/**
 * Terrain Shader System Types
 *
 * Psychogeographic dot-grid shaders for cognitive modes.
 * Each mode (THINK, CRUMPIT, WRITE, LOG) has a corresponding terrain.
 */

export type TerrainId = 'meadow' | 'mountain' | 'lake' | 'canyon'

export interface CameraState {
  zoom: number      // 0.3 - 2.0
  offsetX: number
  offsetY: number
}

export interface TerrainParams {
  baseSpacing: number  // px in world space
  dotSize: number      // px
  baseAlpha: number    // 0-1
}

export interface TerrainSample {
  screenX: number
  screenY: number
  alpha: number
}

export interface TerrainShader {
  id: TerrainId
  params: TerrainParams
  /**
   * Called for each dot position.
   * Returns screen position and alpha multiplier, or null to skip.
   */
  sample(
    worldX: number,
    worldY: number,
    camera: CameraState,
    context?: TerrainContext
  ): TerrainSample | null
}

export interface TerrainContext {
  /** Canvas dimensions */
  width: number
  height: number
  /** Typing intensity for Lake ripples (0-1) */
  typingIntensity?: number
}

/**
 * Helper: Normalize zoom to 0-1 range
 * 0.5 zoom -> 0, 2.0 zoom -> 1
 */
export const zoomNorm = (z: number): number =>
  Math.max(0, Math.min(1, (z - 0.5) / (2.0 - 0.5)))
