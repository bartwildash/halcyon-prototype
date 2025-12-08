/**
 * BenchBackground - OSB/chipboard texture for the React Flow canvas
 *
 * Provides a warm, physical-feeling workbench surface that:
 * - Tiles seamlessly at any zoom level
 * - Works in both color (calm) and monochrome modes
 * - Maintains low contrast so cards remain legible
 * - Fades at extreme zoom-out for clarity
 */

import { useEffect, useState } from 'react'
import './BenchBackground.css'

export type BenchMode = 'osb' | 'grid' | 'plain'

interface BenchBackgroundProps {
  /** Which background style to use */
  mode?: BenchMode
  /** Current zoom level (0.3 to 2.0) - used to fade texture at extreme zoom */
  zoom?: number
  /** Force monochrome even in calm theme */
  forceMonochrome?: boolean
}

export function BenchBackground({
  mode = 'osb',
  zoom = 1,
  forceMonochrome = false,
}: BenchBackgroundProps) {
  const [theme, setTheme] = useState<'mono' | 'calm'>('mono')

  // Watch for theme changes
  useEffect(() => {
    const checkTheme = () => {
      const hasCalm = document.documentElement.getAttribute('data-theme') === 'calm'
      setTheme(hasCalm ? 'calm' : 'mono')
    }

    // Initial check
    checkTheme()

    // Watch for attribute changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  // Calculate texture opacity based on zoom
  // At normal zoom (1.0), full opacity
  // At zoomed way out (0.3), fade to near invisible
  const textureOpacity = Math.min(1, Math.max(0.2, (zoom - 0.2) / 0.8))

  // Determine if we should use monochrome texture
  const useMonochrome = forceMonochrome || theme === 'mono'

  // Build class names
  const classNames = [
    'bench-background',
    `bench-background--${mode}`,
    useMonochrome ? 'bench-background--mono' : 'bench-background--color',
  ].join(' ')

  return (
    <div
      className={classNames}
      style={{
        '--bench-texture-opacity': textureOpacity,
      } as React.CSSProperties}
      aria-hidden="true"
    />
  )
}
