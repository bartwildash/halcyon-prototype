/**
 * Camera Control Hook
 *
 * Manages zoom and pan state for spatial canvas.
 * Supports:
 * - Mouse wheel zoom
 * - Click and drag to pan
 * - Touch gestures (pinch-to-zoom, drag-to-pan)
 * - Keyboard shortcuts (+ - 0)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CameraState } from '../terrain/types'

interface UseCameraOptions {
  minZoom?: number
  maxZoom?: number
  zoomSpeed?: number
}

const DEFAULT_OPTIONS: UseCameraOptions = {
  minZoom: 0.3,
  maxZoom: 3.0,
  zoomSpeed: 0.001,
}

export function useCamera(options: UseCameraOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const [camera, setCamera] = useState<CameraState>({
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
  })

  const isPanning = useRef(false)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const lastTouchDistance = useRef<number | null>(null)

  // Clamp zoom to valid range
  const clampZoom = useCallback((zoom: number) => {
    return Math.max(opts.minZoom!, Math.min(opts.maxZoom!, zoom))
  }, [opts.minZoom, opts.maxZoom])

  // Zoom to a specific level
  const zoomTo = useCallback((newZoom: number, centerX?: number, centerY?: number) => {
    setCamera(prev => {
      const clampedZoom = clampZoom(newZoom)

      // If center point provided, zoom towards it
      if (centerX !== undefined && centerY !== undefined) {
        const zoomDelta = clampedZoom - prev.zoom
        const offsetXDelta = (centerX - window.innerWidth / 2) * zoomDelta * 0.5
        const offsetYDelta = (centerY - window.innerHeight / 2) * zoomDelta * 0.5

        return {
          zoom: clampedZoom,
          offsetX: prev.offsetX + offsetXDelta,
          offsetY: prev.offsetY + offsetYDelta,
        }
      }

      return { ...prev, zoom: clampedZoom }
    })
  }, [clampZoom])

  // Pan by delta
  const panBy = useCallback((dx: number, dy: number) => {
    setCamera(prev => ({
      ...prev,
      offsetX: prev.offsetX - dx,
      offsetY: prev.offsetY - dy,
    }))
  }, [])

  // Reset camera to default
  const resetCamera = useCallback(() => {
    setCamera({
      zoom: 1.0,
      offsetX: 0,
      offsetY: 0,
    })
  }, [])

  // Mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const delta = -e.deltaY * opts.zoomSpeed!
      const newZoom = camera.zoom + delta

      zoomTo(newZoom, e.clientX, e.clientY)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [camera.zoom, opts.zoomSpeed, zoomTo])

  // Mouse pan
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Only pan with middle mouse or space+left click
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        isPanning.current = true
        lastMousePos.current = { x: e.clientX, y: e.clientY }
        e.preventDefault()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning.current) {
        const dx = e.clientX - lastMousePos.current.x
        const dy = e.clientY - lastMousePos.current.y

        panBy(dx, dy)

        lastMousePos.current = { x: e.clientX, y: e.clientY }
      }
    }

    const handleMouseUp = () => {
      isPanning.current = false
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [panBy])

  // Touch gestures
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Prevent default browser zoom/pan behaviors
      if (e.touches.length > 1) {
        e.preventDefault()
      }

      if (e.touches.length === 2) {
        // Pinch zoom start
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )
        lastTouchDistance.current = distance
      } else if (e.touches.length === 1) {
        // Pan start
        isPanning.current = true
        lastMousePos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        // Pinch zoom - ALWAYS prevent default
        e.preventDefault()

        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )

        const centerX = (touch1.clientX + touch2.clientX) / 2
        const centerY = (touch1.clientY + touch2.clientY) / 2

        const scale = distance / lastTouchDistance.current
        const newZoom = camera.zoom * scale

        zoomTo(newZoom, centerX, centerY)

        lastTouchDistance.current = distance
      } else if (e.touches.length === 1 && isPanning.current) {
        // Pan - prevent default to override browser scroll
        e.preventDefault()

        const dx = e.touches[0].clientX - lastMousePos.current.x
        const dy = e.touches[0].clientY - lastMousePos.current.y

        panBy(dx, dy)

        lastMousePos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        }
      }
    }

    const handleTouchEnd = () => {
      isPanning.current = false
      lastTouchDistance.current = null
    }

    // Use passive: false to allow preventDefault
    const options = { passive: false }
    window.addEventListener('touchstart', handleTouchStart, options)
    window.addEventListener('touchmove', handleTouchMove, options)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [camera.zoom, zoomTo, panBy])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault()
          zoomTo(camera.zoom * 1.2)
          break
        case '-':
        case '_':
          e.preventDefault()
          zoomTo(camera.zoom / 1.2)
          break
        case '0':
          e.preventDefault()
          resetCamera()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [camera.zoom, zoomTo, resetCamera])

  // Animate pan to a specific world position
  const panTo = useCallback((worldX: number, worldY: number, duration = 500) => {
    const startCamera = { ...camera }
    const targetOffsetX = worldX - window.innerWidth / 2
    const targetOffsetY = worldY - window.innerHeight / 2
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const t = Math.min(1, elapsed / duration)

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)

      const newOffsetX = startCamera.offsetX + (targetOffsetX - startCamera.offsetX) * eased
      const newOffsetY = startCamera.offsetY + (targetOffsetY - startCamera.offsetY) * eased

      setCamera(prev => ({
        ...prev,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      }))

      if (t < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [camera])

  return {
    camera,
    zoomTo,
    panBy,
    panTo,
    resetCamera,
    zoomIn: () => zoomTo(camera.zoom * 1.2),
    zoomOut: () => zoomTo(camera.zoom / 1.2),
  }
}
