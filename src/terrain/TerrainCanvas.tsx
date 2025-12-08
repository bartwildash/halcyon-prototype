/**
 * TerrainCanvas Component
 *
 * Renders psychogeographic dot-grid background for cognitive modes.
 * Blends between terrains with smooth transitions.
 */

import { useEffect, useRef, useState } from 'react'
import type { TerrainId, TerrainShader, CameraState, TerrainContext } from './types'
import { terrainShaders } from './shaders'
import './TerrainCanvas.css'

interface TerrainCanvasProps {
  /** Current terrain to display */
  terrain: TerrainId
  /** Camera state for spatial canvas */
  camera?: CameraState
  /** Typing intensity for Lake ripples (0-1) */
  typingIntensity?: number
}

const DEFAULT_CAMERA: CameraState = {
  zoom: 1.0,
  offsetX: 0,
  offsetY: 0,
}

export function TerrainCanvas({
  terrain,
  camera = DEFAULT_CAMERA,
  typingIntensity = 0,
}: TerrainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [prevTerrain, setPrevTerrain] = useState<TerrainId | null>(null)
  const [transitionT, setTransitionT] = useState(1) // 0-1, 1 = fully transitioned

  // Handle terrain changes with transitions
  useEffect(() => {
    if (prevTerrain !== terrain) {
      setPrevTerrain(terrain)
      setTransitionT(0)

      const start = performance.now()
      const duration = 260 // ms (--terrain-transition-ms)

      function step(now: number) {
        const elapsed = now - start
        const t = Math.min(1, elapsed / duration)
        setTransitionT(t)
        if (t < 1) {
          requestAnimationFrame(step)
        }
      }

      requestAnimationFrame(step)
    }
  }, [terrain, prevTerrain])

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

      const currentShader = terrainShaders[terrain]
      const previousShader = prevTerrain ? terrainShaders[prevTerrain] : null

      if (transitionT >= 1 || !previousShader) {
        // No transition, render current terrain only
        renderTerrain(ctx, currentShader, camera, width, height, { typingIntensity })
      } else {
        // Blend between previous and current terrain
        renderBlendedTerrain(
          ctx,
          previousShader,
          currentShader,
          transitionT,
          camera,
          width,
          height,
          { typingIntensity }
        )
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', updateSize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [terrain, prevTerrain, transitionT, camera, typingIntensity])

  // Update data attribute for CSS hooks
  useEffect(() => {
    document.documentElement.dataset.terrain = terrain
  }, [terrain])

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
  const startX = -camera.offsetX % spacing - spacing
  const startY = -camera.offsetY % spacing - spacing

  for (let x = startX; x < width + spacing; x += spacing) {
    for (let y = startY; y < height + spacing; y += spacing) {
      const worldX = x + camera.offsetX
      const worldY = y + camera.offsetY

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
 * Render blended transition between two terrains
 */
function renderBlendedTerrain(
  ctx: CanvasRenderingContext2D,
  terrainA: TerrainShader,
  terrainB: TerrainShader,
  t: number, // 0 = all A, 1 = all B
  camera: CameraState,
  width: number,
  height: number,
  context: TerrainContext
) {
  ctx.clearRect(0, 0, width, height)

  // Create temporary canvases for each terrain
  const tmpCanvasA = document.createElement('canvas')
  const tmpCanvasB = document.createElement('canvas')
  tmpCanvasA.width = width
  tmpCanvasA.height = height
  tmpCanvasB.width = width
  tmpCanvasB.height = height

  const tmpCtxA = tmpCanvasA.getContext('2d')
  const tmpCtxB = tmpCanvasB.getContext('2d')

  if (!tmpCtxA || !tmpCtxB) return

  // Render both terrains to temp canvases
  renderTerrain(tmpCtxA, terrainA, camera, width, height, context)
  renderTerrain(tmpCtxB, terrainB, camera, width, height, context)

  // Blend them on main canvas
  ctx.globalAlpha = 1 - t
  ctx.drawImage(tmpCanvasA, 0, 0)

  ctx.globalAlpha = t
  ctx.drawImage(tmpCanvasB, 0, 0)

  ctx.globalAlpha = 1
}
