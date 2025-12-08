/**
 * FlipClockModel - Pure state management for flip clock
 *
 * Architecture:
 * - Pure functions (no React dependencies)
 * - Testable without DOM or React
 * - Shared between Web and React Native
 */

// ============================================================================
// Types
// ============================================================================

export interface DigitPair {
  value: string
  previous: string
}

export interface TimeState {
  hourTens: DigitPair
  hourOnes: DigitPair
  minuteTens: DigitPair
  minuteOnes: DigitPair
  day: DigitPair
  dateTens: DigitPair
  dateOnes: DigitPair
  month: DigitPair
}

interface RawTimeData {
  hourTens: string
  hourOnes: string
  minuteTens: string
  minuteOnes: string
  day: string
  dateTens: string
  dateOnes: string
  month: string
}

// ============================================================================
// Pure functions
// ============================================================================

/**
 * Extract raw time data from Date object
 */
function extractTimeData(date: Date): RawTimeData {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const dateNum = date.getDate()

  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

  return {
    hourTens: Math.floor(hours / 10).toString(),
    hourOnes: (hours % 10).toString(),
    minuteTens: Math.floor(minutes / 10).toString(),
    minuteOnes: (minutes % 10).toString(),
    day: days[date.getDay()],
    dateTens: Math.floor(dateNum / 10).toString(),
    dateOnes: (dateNum % 10).toString(),
    month: months[date.getMonth()],
  }
}

/**
 * Create initial state (all previous values match current)
 */
export function createInitialState(date: Date): TimeState {
  const data = extractTimeData(date)

  return {
    hourTens: { value: data.hourTens, previous: data.hourTens },
    hourOnes: { value: data.hourOnes, previous: data.hourOnes },
    minuteTens: { value: data.minuteTens, previous: data.minuteTens },
    minuteOnes: { value: data.minuteOnes, previous: data.minuteOnes },
    day: { value: data.day, previous: data.day },
    dateTens: { value: data.dateTens, previous: data.dateTens },
    dateOnes: { value: data.dateOnes, previous: data.dateOnes },
    month: { value: data.month, previous: data.month },
  }
}

/**
 * Compute new state from previous state and current time
 *
 * This is the core diffing logic:
 * - Compares current vs previous values
 * - Returns new state with updated previous values
 * - Triggers animations when value !== previous
 */
export function computeTimeState(now: Date, prev: TimeState): TimeState {
  const current = extractTimeData(now)

  return {
    hourTens: {
      value: current.hourTens,
      previous: prev.hourTens.value
    },
    hourOnes: {
      value: current.hourOnes,
      previous: prev.hourOnes.value
    },
    minuteTens: {
      value: current.minuteTens,
      previous: prev.minuteTens.value
    },
    minuteOnes: {
      value: current.minuteOnes,
      previous: prev.minuteOnes.value
    },
    day: {
      value: current.day,
      previous: prev.day.value
    },
    dateTens: {
      value: current.dateTens,
      previous: prev.dateTens.value
    },
    dateOnes: {
      value: current.dateOnes,
      previous: prev.dateOnes.value
    },
    month: {
      value: current.month,
      previous: prev.month.value
    },
  }
}

/**
 * Check if a digit should flip (value changed)
 */
export function shouldFlip(digit: DigitPair): boolean {
  return digit.value !== digit.previous
}

/**
 * Get all fields that need to flip
 */
export function getFlippingFields(state: TimeState): (keyof TimeState)[] {
  return (Object.keys(state) as (keyof TimeState)[]).filter(key =>
    shouldFlip(state[key])
  )
}
