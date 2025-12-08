/**
 * CRUMPIT → Mountain Shader
 *
 * Effort, uphill, triage. Dots lean up to the right,
 * density increases in the "NOW" area (top left quadrant).
 */

import type { TerrainShader, TerrainParams } from '../types'
import { zoomNorm } from '../types'

const MOUNTAIN_PARAMS: TerrainParams = {
  baseSpacing: 24,
  dotSize: 5.0,
  baseAlpha: 0.75,
}

export const mountainShader: TerrainShader = {
  id: 'mountain',
  params: MOUNTAIN_PARAMS,

  sample(worldX, worldY, camera, context) {
    const width = context?.width || window.innerWidth
    const height = context?.height || window.innerHeight

    // Slope transform - "tilt" grid upwards from left to right (dramatic uphill climb)
    const slope = 0.8 // vertical px shift per 1 screen width (increased for visibility)
    const screenX = worldX - camera.offsetX
    const screenY = worldY - camera.offsetY - slope * (screenX - width / 2)

    const z = zoomNorm(camera.zoom)
    let alphaMul = 1

    // Highlight NOW quadrant as you zoom out
    const nowRect = {
      x1: width * 0.02,
      y1: height * 0.04,
      x2: width * 0.48,
      y2: height * 0.52,
    }

    const inNow =
      screenX >= nowRect.x1 &&
      screenX <= nowRect.x2 &&
      screenY >= nowRect.y1 &&
      screenY <= nowRect.y2

    if (inNow) {
      alphaMul *= 1.0 + 0.6 * (1 - z) // much brighter when zoomed out
    } else {
      alphaMul *= 0.75 // slightly dimmer elsewhere for contrast
    }

    // Peak silhouette at extreme zoom out - more pronounced
    if (z < 0.4) {
      const peakCenterX = width * 0.5
      const peakBaseY = height * 0.65
      const nx = (screenX - peakCenterX) / (width * 0.22)
      const ny = (screenY - peakBaseY) / (height * 0.22)
      // Simple isosceles mountain mask
      const insidePeak = ny <= 0 && Math.abs(nx) <= -ny
      if (insidePeak) {
        alphaMul *= 1.4 // stronger peak visibility
      }
    }

    return { screenX, screenY, alpha: alphaMul }
  },
}
