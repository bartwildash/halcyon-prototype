/**
 * Typing Intensity Hook
 *
 * Tracks typing activity and provides a decaying intensity value (0-1)
 * for driving Lake terrain ripple animations.
 *
 * Each keystroke sets intensity to 1, which then decays exponentially
 * via requestAnimationFrame until below threshold.
 */

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTypingIntensityOptions {
  /** Decay rate per frame (0-1), higher = faster decay */
  decayRate?: number
  /** Stop animating when below this threshold */
  threshold?: number
}

const DEFAULT_OPTIONS: UseTypingIntensityOptions = {
  decayRate: 0.9,
  threshold: 0.05,
}

export function useTypingIntensity(options: UseTypingIntensityOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const [intensity, setIntensity] = useState(0)
  const animationFrameRef = useRef<number | null>(null)

  // Decay intensity over time
  useEffect(() => {
    if (intensity <= opts.threshold!) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    const decay = () => {
      setIntensity(prev => {
        const next = prev * opts.decayRate!
        if (next <= opts.threshold!) {
          return 0
        }
        return next
      })
      animationFrameRef.current = requestAnimationFrame(decay)
    }

    animationFrameRef.current = requestAnimationFrame(decay)

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [intensity, opts.decayRate, opts.threshold])

  // Register keystroke
  const registerKeystroke = useCallback(() => {
    setIntensity(1.0)
  }, [])

  // Listen to global keydown events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only track actual typing (not meta keys, shortcuts, etc.)
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Only register if it's a character key
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
          registerKeystroke()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [registerKeystroke])

  return {
    intensity,
    registerKeystroke,
  }
}
