// Device detection utilities
// Follows Kinopio patterns for mobile/desktop state management

/**
 * Detect if user is on a mobile/touch device
 * Checks both user agent and touch capability
 */
export function isMobileDevice(): boolean {
  // Check user agent for mobile indicators
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
  const isMobileUA = mobileRegex.test(userAgent.toLowerCase())

  // Check for touch capability
  const hasTouch =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0

  // Consider it mobile if either condition is true
  // But prioritize user agent for more accurate detection
  return isMobileUA || (hasTouch && window.innerWidth < 768)
}

/**
 * Detect if device supports hover interactions
 * Important for showing/hiding UI elements
 */
export function supportsHover(): boolean {
  return window.matchMedia('(hover: hover)').matches
}

/**
 * Get viewport dimensions
 * Useful for determining small screen vs desktop
 */
export function getViewportSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isSmall: window.innerWidth < 768, // Mobile breakpoint
    isMedium: window.innerWidth >= 768 && window.innerWidth < 1024, // Tablet
    isLarge: window.innerWidth >= 1024, // Desktop
  }
}

/**
 * Detect network connectivity status
 */
export function isOnline(): boolean {
  return navigator.onLine
}

/**
 * Setup listeners for online/offline events
 */
export function setupConnectivityListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}
