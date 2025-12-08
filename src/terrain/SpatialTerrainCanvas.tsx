/**
 * Spatial Terrain Canvas
 *
 * Renders psychogeographic terrain that blends based on camera position,
 * not mode switching. As you pan across the infinite canvas, you move
 * through different terrain regions (Lake, Mountain, Canyon, Meadow).
 */

import { useEffect, useRef } from 'react'
import type { TerrainShader, CameraState, TerrainContext } from './types'
import { terrainShaders } from './shaders'
import { getTerrainBlend } from '../config/landmarks'
import './TerrainCanvas.css'

interface SpatialTerrainCanvasProps {
  /** Camera state for spatial canvas */
  camera: CameraState
  /** Typing intensity for Lake ripples (0-1) */
  typingIntensity?: number
}

const DEFAULT_CAMERA: CameraState = {
  zoom: 1.0,
  offsetX: 0,
  offsetY: 0,
}

export function SpatialTerrainCanvas({
  camera = DEFAULT_CAMERA,
  typingIntensity = 0,
}: SpatialTerrainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to window size
    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
    }

    updateSize()
    window.addEventListener('resize', updateSize)

    // Animation loop
    let animationFrameId: number

    const render = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      // Get camera center in world space
      // Space uses translate(scrollX, scrollY) which moves the canvas right/down for positive values
      // So to get world position from screen center, we subtract the offset
      const centerX = -camera.offsetX + width / 2
      const centerY = -camera.offsetY + height / 2

      // Get terrain blend for current position
      const blend = getTerrainBlend(centerX, centerY)

      if (blend.length === 0) {
        // Fallback to meadow if no landmarks nearby
        const meadowShader = terrainShaders.meadow
        renderTerrain(ctx, meadowShader, camera, width, height, { typingIntensity })
      } else if (blend.length === 1) {
        // Single terrain, no blending needed
        const shader = terrainShaders[blend[0].landmark.terrain]
        renderTerrain(ctx, shader, camera, width, height, { typingIntensity })
      } else {
        // Blend multiple terrains
        renderBlendedTerrains(ctx, blend, camera, width, height, { typingIntensity })
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', updateSize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [camera.offsetX, camera.offsetY, camera.zoom, typingIntensity])

  return <canvas ref={canvasRef} className="terrain-canvas" />
}

/**
 * Render a single terrain
 */
function renderTerrain(
  ctx: CanvasRenderingContext2D,
  terrain: TerrainShader,
  camera: CameraState,
  width: number,
  height: number,
  context: TerrainContext
) {
  const { baseSpacing, dotSize, baseAlpha } = terrain.params

  ctx.clearRect(0, 0, width, height)

  // Get foreground color from CSS
  const fgColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--halcyon-foreground')
    .trim() || '#111111'

  ctx.fillStyle = fgColor

  const spacing = baseSpacing * (1 / camera.zoom)
  const startX = camera.offsetX % spacing - spacing
  const startY = camera.offsetY % spacing - spacing

  for (let x = startX; x < width + spacing; x += spacing) {
    for (let y = startY; y < height + spacing; y += spacing) {
      const worldX = x - camera.offsetX
      const worldY = y - camera.offsetY

      const sample = terrain.sample(worldX, worldY, camera, { ...context, width, height })
      if (!sample) continue

      const { screenX, screenY, alpha } = sample
      const a = baseAlpha * alpha

      if (a <= 0.02) continue

      ctx.globalAlpha = a
      ctx.beginPath()
      ctx.arc(screenX, screenY, dotSize / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.globalAlpha = 1
}

/**
 * Render blended terrains based on position
 */
function renderBlendedTerrains(
  ctx: CanvasRenderingContext2D,
  blend: Array<{ landmark: { terrain: string }; weight: number }>,
  camera: CameraState,
  width: number,
  height: number,
  context: TerrainContext
) {
  ctx.clearRect(0, 0, width, height)

  // Create temporary canvas for each terrain
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = width
  tempCanvas.height = height
  const tempCtx = tempCanvas.getContext('2d')!

  // Render each terrain and composite
  for (const { landmark, weight } of blend) {
    const shader = terrainShaders[landmark.terrain as keyof typeof terrainShaders]
    if (!shader) continue

    tempCtx.clearRect(0, 0, width, height)
    renderTerrain(tempCtx, shader, camera, width, height, context)

    ctx.globalAlpha = weight
    ctx.drawImage(tempCanvas, 0, 0)
  }

  ctx.globalAlpha = 1
}
