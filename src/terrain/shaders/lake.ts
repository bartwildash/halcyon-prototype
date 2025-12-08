/**
 * WRITE → Lake Shader
 *
 * Still water center, ripples at the edges.
 * Writing surface in the middle has almost no dots;
 * periphery gives a subtle ring.
 */

import type { TerrainShader, TerrainParams } from '../types'
import { zoomNorm } from '../types'

const LAKE_PARAMS: TerrainParams = {
  baseSpacing: 26,
  dotSize: 5.0,
  baseAlpha: 0.7,
}

export const lakeShader: TerrainShader = {
  id: 'lake',
  params: LAKE_PARAMS,

  sample(worldX, worldY, camera, context) {
    const width = context?.width || window.innerWidth
    const height = context?.height || window.innerHeight
    const centerX = width / 2
    const centerY = height / 2

    let screenX = worldX - camera.offsetX
    let screenY = worldY - camera.offsetY

    // Distance from center in screen space
    const dx = screenX - centerX
    const dy = screenY - centerY
    const r = Math.sqrt(dx * dx + dy * dy)
    const maxR = Math.min(width, height) * 0.55
    const innerR = maxR * 0.45 // lake interior

    let alphaMul = 1

    // Inside inner lake - almost no dots (crystal clear center)
    if (r < innerR) {
      const t = r / innerR // 0 at center, 1 at boundary
      alphaMul *= t * t * t // even clearer in middle (cubic falloff)
    } else {
      // Ripples between inner and outer radius - more dramatic
      const typingIntensity = context?.typingIntensity || 0
      const rippleStrength = 6 + typingIntensity * 3 // more ripples
      const norm = (r - innerR) / (maxR - innerR) // 0-1
      const ripple = Math.sin(norm * Math.PI * rippleStrength) * 0.5 + 0.5 // 0-1 (stronger contrast)
      alphaMul *= ripple

      // Larger radial displacement for wave effect
      const disp = (5 + typingIntensity * 4) * (1 - norm)
      const ang = Math.atan2(dy, dx)
      screenX += Math.cos(ang) * disp
      screenY += Math.sin(ang) * disp
    }

    // Zoom relation - zooming out brings dots back a bit
    const z = zoomNorm(camera.zoom)
    alphaMul *= 0.6 + 0.4 * (1 - z) // stronger visibility at distance

    return { screenX, screenY, alpha: alphaMul }
  },
}
