/**
 * useLongPress - Detect long press gestures for edit mode
 *
 * Hold down on an entity to bring up edit tools
 */

import { useCallback, useRef } from 'react'

interface LongPressOptions {
  onLongPress: () => void
  delay?: number
}

export function useLongPress({ onLongPress, delay = 500 }: LongPressOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)

  const start = useCallback(() => {
    isLongPressRef.current = false
    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true
      onLongPress()
    }, delay)
  }, [onLongPress, delay])

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    isLongPressRef.current = false
  }, [])

  const handlers = {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  }

  return {
    handlers,
    isLongPress: () => isLongPressRef.current,
  }
}
