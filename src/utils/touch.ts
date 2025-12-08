// Touch interaction utilities
// Inspired by Kinopio's PaintSelectCanvas patterns

/**
 * Check if event is multi-touch (2+ fingers)
 * Critical for preventing conflicts with pinch zoom
 */
export function isMultiTouch(event: PointerEvent | TouchEvent | React.PointerEvent | React.TouchEvent): boolean {
  if ('touches' in event) {
    return event.touches.length > 1
  }
  return false
}

/**
 * Check if event is touch or mouse left button
 * Used to validate drag/select interactions
 */
export function isTouchOrLeftClick(event: PointerEvent | React.PointerEvent): boolean {
  // Touch events have pointerType === 'touch'
  if (event.pointerType === 'touch') return true

  // Mouse left button only
  return event.button === 0
}

/**
 * Get cursor/touch position from event
 * Works for both mouse and touch events
 */
export function getCursorPosition(event: PointerEvent | TouchEvent | React.PointerEvent | React.TouchEvent): { x: number; y: number } {
  if ('touches' in event && event.touches.length > 0) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    }
  }

  if ('clientX' in event) {
    return {
      x: event.clientX,
      y: event.clientY,
    }
  }

  return { x: 0, y: 0 }
}

/**
 * Time-based touch interaction manager
 * Like Kinopio: requires hold before drag/paint on touch
 */
export class TouchInteractionManager {
  private touchStartTime: number = 0
  private touchStartPosition: { x: number; y: number } = { x: 0, y: 0 }
  private isTouch: boolean = false

  // Kinopio-inspired durations
  private readonly LOCK_PRE_DURATION = 100 // ms - delay before starting lock
  private readonly LOCK_DURATION = 150 // ms - total time to complete lock
  private readonly LONG_PRESS_DURATION = 600 // ms - time for long press

  private lockingStartTime: number = 0
  private longPressTimer: number | undefined
  private longPressCallback: (() => void) | null = null

  /**
   * Start tracking touch interaction
   */
  start(event: PointerEvent | React.PointerEvent, onLongPress?: () => void): void {
    this.isTouch = event.pointerType === 'touch'
    this.touchStartTime = Date.now()
    this.touchStartPosition = { x: event.clientX, y: event.clientY }
    this.lockingStartTime = 0
    this.longPressCallback = onLongPress || null

    // Set up long press detection
    if (this.isTouch && onLongPress) {
      this.longPressTimer = setTimeout(() => {
        if (this.longPressCallback) {
          this.longPressCallback()
        }
      }, this.LONG_PRESS_DURATION) as unknown as number
    }
  }

  /**
   * Cancel any ongoing timers
   */
  cancel(): void {
    if (this.longPressTimer !== undefined) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = undefined
    }
    this.longPressCallback = null
  }

  /**
   * Check if enough time has passed for touch interaction to be valid
   * Returns true if:
   * - Not a touch event (mouse is always instant)
   * - Touch event and enough time has passed (150ms like Kinopio)
   */
  canInteract(): boolean {
    if (!this.isTouch) return true // Mouse is instant

    const elapsed = Date.now() - this.touchStartTime
    return elapsed >= this.LOCK_DURATION
  }

  /**
   * Get locking progress (0-1) for visual feedback
   */
  getLockingProgress(): number {
    if (!this.isTouch) return 1

    const elapsed = Date.now() - this.touchStartTime
    if (elapsed < this.LOCK_PRE_DURATION) return 0

    const lockProgress = (elapsed - this.LOCK_PRE_DURATION) / (this.LOCK_DURATION - this.LOCK_PRE_DURATION)
    return Math.min(1, Math.max(0, lockProgress))
  }

  /**
   * Check if user has moved beyond threshold
   * Cancels long press if moved
   */
  hasMovedBeyondThreshold(currentX: number, currentY: number, threshold: number = 10): boolean {
    const dx = currentX - this.touchStartPosition.x
    const dy = currentY - this.touchStartPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > threshold) {
      this.cancel() // Cancel long press
      return true
    }

    return false
  }

  /**
   * Reset state
   */
  reset(): void {
    this.cancel()
    this.touchStartTime = 0
    this.lockingStartTime = 0
    this.isTouch = false
  }
}

/**
 * Double-tap detection for mobile zoom
 */
export class DoubleTapDetector {
  private lastTapTime: number = 0
  private lastTapPosition: { x: number; y: number } = { x: 0, y: 0 }
  private readonly TAP_TIMEOUT = 300 // ms between taps
  private readonly TAP_DISTANCE = 50 // px - max distance between taps

  /**
   * Check if event is a double-tap
   * Returns true if this tap completes a double-tap sequence
   */
  isDoubleTap(event: PointerEvent | React.PointerEvent): boolean {
    if (event.pointerType !== 'touch') return false

    const now = Date.now()
    const position = { x: event.clientX, y: event.clientY }

    const timeDiff = now - this.lastTapTime
    const dx = position.x - this.lastTapPosition.x
    const dy = position.y - this.lastTapPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    const isDoubleTap =
      timeDiff > 0 &&
      timeDiff < this.TAP_TIMEOUT &&
      distance < this.TAP_DISTANCE

    // Update state
    this.lastTapTime = now
    this.lastTapPosition = position

    return isDoubleTap
  }

  /**
   * Reset detector state
   */
  reset(): void {
    this.lastTapTime = 0
    this.lastTapPosition = { x: 0, y: 0 }
  }
}

/**
 * Get optimal drag threshold based on interaction type
 * Touch needs higher threshold than mouse for comfort
 */
export function getDragThreshold(isTouch: boolean): number {
  return isTouch ? 15 : 5 // Touch: 15px, Mouse: 5px
}

/**
 * Prevent default touch behaviors that interfere with app
 */
export function preventDefaultTouchBehaviors(element: HTMLElement): () => void {
  // Prevent pull-to-refresh on mobile
  const preventPullToRefresh = (e: TouchEvent) => {
    if (e.touches.length > 1) return // Allow pinch zoom

    const scrollTop = element.scrollTop || window.scrollY
    if (scrollTop === 0) {
      e.preventDefault()
    }
  }

  element.addEventListener('touchstart', preventPullToRefresh, { passive: false })

  // Cleanup
  return () => {
    element.removeEventListener('touchstart', preventPullToRefresh)
  }
}
