/**
 * THINK → Meadow Shader
 *
 * Open, low tension. Dots mostly uniform, with mild organic jitter
 * and a faint horizon when zoomed out.
 */

import type { TerrainShader, TerrainParams } from '../types'
import { zoomNorm } from '../types'

const MEADOW_PARAMS: TerrainParams = {
  baseSpacing: 26,
  dotSize: 5.0,
  baseAlpha: 0.7,
}

export const meadowShader: TerrainShader = {
  id: 'meadow',
  params: MEADOW_PARAMS,

  sample(worldX, worldY, camera, context) {
    const z = zoomNorm(camera.zoom)
    const width = context?.width || window.innerWidth
    const height = context?.height || window.innerHeight

    // Organic jitter for natural meadow feel - more pronounced
    const seed = Math.sin(worldX * 12.9898 + worldY * 78.233) * 43758.5453
    const jitterX = ((seed % 1) - 0.5) * 3.0 // more organic variation
    const jitterY = (((seed * 1.37) % 1) - 0.5) * 3.0

    let screenX = worldX - camera.offsetX + jitterX
    let screenY = worldY - camera.offsetY + jitterY

    // Dramatic horizon effect when zoomed out
    // horizonY is one third from top of canvas in world space
    const horizonScreenY = height * 0.32
    const distFromHorizon = screenY - horizonScreenY

    // Above horizon, create sky gradient effect
    let alphaMul = 1
    if (z < 0.5 && distFromHorizon < 0) {
      const t = Math.min(1, Math.abs(distFromHorizon) / 180)
      alphaMul *= 1 - t * (0.6 - z * 0.5) // stronger fade to create sky effect
    }

    // Below horizon, slight density increase (ground)
    if (distFromHorizon > 0 && z < 0.5) {
      const groundBoost = 0.1 + (0.5 - z) * 0.15
      alphaMul *= 1 + groundBoost
    }

    return { screenX, screenY, alpha: alphaMul }
  },
}
