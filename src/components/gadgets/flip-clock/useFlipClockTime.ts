/**
 * useFlipClockTime - React hook for flip clock state
 *
 * Updates at 1-second boundaries and maintains prev/current state
 * for flip animations.
 */

import { useState, useEffect, useRef } from 'react'
import { createInitialState, computeTimeState, TimeState } from './FlipClockModel'

export function useFlipClockTime(): TimeState {
  const [time, setTime] = useState(new Date())
  const [state, setState] = useState<TimeState>(() => createInitialState(new Date()))

  // Track previous state for diffing
  const prevStateRef = useRef<TimeState>(state)

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Compute new state when time changes
  useEffect(() => {
    const newState = computeTimeState(time, prevStateRef.current)
    prevStateRef.current = newState
    setState(newState)
  }, [time])

  return state
}
