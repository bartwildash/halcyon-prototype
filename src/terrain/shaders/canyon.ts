/**
 * LOG → Canyon Shader
 *
 * Sediment, strata, depth. Horizontal bands with slightly different alpha,
 * to imply layers of time. Zooming out reveals banding.
 */

import type { TerrainShader, TerrainParams } from '../types'
import { zoomNorm } from '../types'

const CANYON_PARAMS: TerrainParams = {
  baseSpacing: 24,
  dotSize: 5.0,
  baseAlpha: 0.75,
}

export const canyonShader: TerrainShader = {
  id: 'canyon',
  params: CANYON_PARAMS,

  sample(worldX, worldY, camera, context) {
    const screenX = worldX - camera.offsetX
    const screenY = worldY - camera.offsetY

    // Strata bands: narrower for more visible layering
    const bandHeight = 60 // tighter bands
    const bandIndex = Math.floor(screenY / bandHeight)
    const bandPos = (screenY % bandHeight) / bandHeight // 0-1 within band

    // Dramatic dark band lines at boundaries (sediment layers)
    let alphaMul = 1
    const edgeDist = Math.min(bandPos, 1 - bandPos)
    const edgeFactor = Math.max(0, 1 - edgeDist * 15) // much stronger near edges
    alphaMul *= 0.6 + edgeFactor * 0.7 // higher contrast between bands

    // Horizontal erosion noise - more pronounced
    const seed = Math.sin(worldY * 0.0217) * 43758.5453
    const jitterX = ((seed % 1) - 0.5) * 2.5 // more horizontal displacement
    const jitterY = (((seed * 1.9) % 1) - 0.5) * 0.5

    const finalX = screenX + jitterX
    const finalY = screenY + jitterY

    // Zoom - much more stratification visible when zooming out
    const z = zoomNorm(camera.zoom)
    const depthBoost = 0.5 + (1 - z) * 0.8 // stronger depth effect
    alphaMul *= depthBoost

    return { screenX: finalX, screenY: finalY, alpha: alphaMul }
  },
}
