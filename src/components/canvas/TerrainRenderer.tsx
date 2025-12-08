/**
 * TerrainRenderer - Uses EXISTING Halcyon terrain shaders
 *
 * Integrates with your sophisticated terrain shader system from src/terrain/shaders/
 * Renders dot-grid backgrounds using the sample() function pattern.
 *
 * Extension point: Add new terrains in src/terrain/shaders/ directory
 */

import { useEffect, useRef } from 'react'
import { useTransformContext } from 'react-zoom-pan-pinch'
import { lakeShader } from '../../terrain/shaders/lake'
import { meadowShader } from '../../terrain/shaders/meadow'
import { mountainShader } from '../../terrain/shaders/mountain'
import { canyonShader } from '../../terrain/shaders/canyon'
import type { TerrainShader, CameraState } from '../../terrain/types'

type TerrainMode = 'lake' | 'meadow' | 'crumpit' | 'canyon'

/** Map mode names to existing shaders */
const TERRAIN_SHADERS: Record<TerrainMode, TerrainShader> = {
  lake: lakeShader,
  meadow: meadowShader,
  crumpit: mountainShader, // 'crumpit' uses mountain shader
  canyon: canyonShader,
}

interface TerrainRendererProps {
  mode: TerrainMode
}

export function TerrainRenderer({ mode }: TerrainRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // useTransformContext must be called inside TransformWrapper
  let transformState
  try {
    const context = useTransformContext()
    transformState = context.state
  } catch (e) {
    // Fallback if not inside TransformWrapper
    transformState = { scale: 1, positionX: 0, positionY: 0 }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Size canvas to viewport
    const width = window.innerWidth
    const height = window.innerHeight
    const dpr = window.devicePixelRatio || 1

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    // Get current shader
    const shader = TERRAIN_SHADERS[mode]
    const params = shader.params

    // Create camera state from react-zoom-pan-pinch state
    const camera: CameraState = {
      zoom: transformState.scale,
      offsetX: -transformState.positionX,
      offsetY: -transformState.positionY,
    }

    // Render dots using shader's sample() function
    const spacing = params.baseSpacing
    const dotSize = params.dotSize
    const baseAlpha = params.baseAlpha

    // Calculate world bounds to render
    const worldLeft = -transformState.positionX - 1000
    const worldTop = -transformState.positionY - 1000
    const worldRight = -transformState.positionX + width + 1000
    const worldBottom = -transformState.positionY + height + 1000

    for (let worldX = worldLeft; worldX < worldRight; worldX += spacing) {
      for (let worldY = worldTop; worldY < worldBottom; worldY += spacing) {
        // Sample shader at this world position
        const result = shader.sample(worldX, worldY, camera, { width, height })

        // Skip if alpha too low
        if (!result || result.alpha < 0.05) continue

        // Convert world to screen coordinates
        const screenX = worldX + transformState.positionX
        const screenY = worldY + transformState.positionY

        // Draw dot
        const finalAlpha = baseAlpha * result.alpha
        ctx.fillStyle = `rgba(0, 0, 0, ${finalAlpha})`
        ctx.beginPath()
        ctx.arc(screenX, screenY, dotSize, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }, [mode, transformState.scale, transformState.positionX, transformState.positionY])

  return (
    <canvas
      ref={canvasRef}
      className="terrain-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
