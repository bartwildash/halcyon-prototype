/**
 * TerrainCanvas - Simple uniform dot grid background
 *
 * Takes transform state as props (passed from TransformWrapper render function)
 */

import { useEffect, useRef } from 'react'

interface TerrainCanvasProps {
  mode?: string // Keep for compatibility but not used
  scale: number
  positionX: number
  positionY: number
}

export function TerrainCanvas({ scale, positionX, positionY }: TerrainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = window.innerWidth
    const height = window.innerHeight
    const dpr = window.devicePixelRatio || 1

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    // Simple uniform dot grid
    const spacing = 26 // Grid spacing in pixels
    const dotSize = 1.5 // Dot radius
    const dotAlpha = 0.2 // Dot opacity

    // Calculate visible world bounds
    const worldLeft = Math.floor((-positionX - 1000) / spacing) * spacing
    const worldTop = Math.floor((-positionY - 1000) / spacing) * spacing
    const worldRight = -positionX + width + 1000
    const worldBottom = -positionY + height + 1000

    // Draw uniform grid of dots
    for (let worldX = worldLeft; worldX < worldRight; worldX += spacing) {
      for (let worldY = worldTop; worldY < worldBottom; worldY += spacing) {
        const screenX = worldX + positionX
        const screenY = worldY + positionY

        ctx.fillStyle = `rgba(0, 0, 0, ${dotAlpha})`
        ctx.beginPath()
        ctx.arc(screenX, screenY, dotSize, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }, [scale, positionX, positionY])

  return (
    <canvas
      ref={canvasRef}
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
