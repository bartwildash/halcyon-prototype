/**
 * FlipClock - Realistic flip card clock component
 *
 * ============================================================================
 * OVERVIEW
 * ============================================================================
 * A highly realistic flip clock inspired by vintage Solari board displays.
 * Built as a "CSS mechanical widget" - uses layered DOM elements with gradients
 * and transforms to simulate physical depth and materials without canvas/SVG.
 *
 * ============================================================================
 * FEATURES
 * ============================================================================
 * - 24-hour time display (HH:MM)
 * - Day of week (full name)
 * - Date and month (DD MMM)
 * - Animated flip card transitions with 3D perspective
 * - Draggable positioning
 * - Realistic optical effects (acrylic refraction, metallic rim, gloss overlay)
 *
 * ============================================================================
 * ARCHITECTURE
 * ============================================================================
 * Component Hierarchy:
 *   FlipClock (main container)
 *   ├── Draggable wrapper (pointer events)
 *   ├── Outer metallic rim (silver gradient)
 *   ├── Inner recessed bezel (dark gradient with optical layers)
 *   │   ├── Refractive highlight layer (simulates acrylic light refraction)
 *   │   └── Shadowed inner lip (moulded step separation)
 *   └── Clock face (light background)
 *       ├── Gloss overlay (glass/acrylic cover effect)
 *       └── Flip cards
 *           ├── DoubleFlipCard (HH, MM, DD - paired digits)
 *           │   └── FlipDigit × 2 (individual flip animations)
 *           └── FlipCard (day names, months - text cards)
 *
 * ============================================================================
 * OPTICAL REALISM TECHNIQUE
 * ============================================================================
 * Instead of drawing lines/patterns, we simulate actual light physics:
 *
 * 1. METALLIC RIM
 *    - Silver gradient with inset highlights
 *    - Drop shadow for elevation
 *
 * 2. ACRYLIC BEZEL (TWO-LAYER APPROACH)
 *    Layer 1: Refractive highlight
 *      - Diagonal gradient (135deg)
 *      - Bright specular hit at top-left (light refraction point)
 *      - Fades through mid-tone
 *      - Dark shadow band at bottom-right (where acrylic curves away)
 *
 *    Layer 2: Shadowed inner lip
 *      - Dark ring inside bezel
 *      - Creates visual separation (moulded plastic step)
 *      - Suggests depth between bezel and clock face
 *
 * 3. GLOSS OVERLAY
 *    - Simulates clear acrylic/glass cover over dial
 *    - White-to-transparent diagonal gradient
 *    - Subtle border for "edge" of glass
 *    - pointerEvents: none (purely visual, doesn't block interaction)
 *
 * 4. FLIP CARDS
 *    - Recessed appearance (inset shadows, not drop shadows)
 *    - Gradient backgrounds for depth
 *    - Center divider line (physical hinge)
 *    - 3D flip animation with rotateX transform
 *
 * ============================================================================
 * DIMENSIONS & LAYOUT
 * ============================================================================
 * - Outer frame: 300×342px (portrait orientation)
 * - Hour/Minute/Date cards: 80×90px (DoubleFlipCard)
 * - Day name card: 190×50px (wide)
 * - Month card: 80×90px
 * - Internal container: max-width 180px (consistent column alignment)
 * - Gap between cards: 16px horizontal, 12px vertical
 *
 * ============================================================================
 * ANIMATION
 * ============================================================================
 * - Updates every 1 second
 * - Detects value changes via diff (prevTime.current vs time)
 * - Triggers 600ms flip animation (cubic-bezier easing)
 * - rotateX transform with perspective: 1200px
 * - Transform origin: top (hinge at top edge)
 *
 * ============================================================================
 * TYPOGRAPHY
 * ============================================================================
 * - Digits: 56px, weight 700, system font
 * - Day names: 32px, Impact/Arial Narrow, scaleY(1.3) for tall effect
 * - Months: 38px, Impact/Arial Narrow, scaleY(1.3)
 * - Color: #fafafa (off-white for contrast against black cards)
 *
 * ============================================================================
 * FUTURE ENHANCEMENTS
 * ============================================================================
 * - Shared model layer (FlipClockModel.ts) for cross-platform state
 * - React Native version (FlipClockNative.tsx) with expo-linear-gradient
 * - Staggered flip choreography (hours delay slightly after minutes)
 * - Sound/haptic feedback on flip
 * - Skia renderer for true fresnel-like optical effects
 */

import { useState, useEffect, useRef } from 'react'

// ============================================================================
// Types
// ============================================================================

interface FlipClockProps {
  onClose?: () => void
}

// ============================================================================
// Main Component
// ============================================================================

export function FlipClock({ onClose }: FlipClockProps) {
  // State: positioning and dragging
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [isDragging, setIsDragging] = useState(false)

  // State: current time (updates every second)
  const [time, setTime] = useState(new Date())

  // State: flip animation flags for each card
  const [flipping, setFlipping] = useState({
    hourTens: false,
    hourOnes: false,
    minuteTens: false,
    minuteOnes: false,
    day: false,
    dateTens: false,
    dateOnes: false,
    month: false,
  })

  // State: 3D flip to settings
  const [isFlipped, setIsFlipped] = useState(false)
  const [use24Hour, setUse24Hour] = useState(false)
  const [timezone, setTimezone] = useState('local')

  // Refs: drag state and previous time for change detection
  const dragStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 })
  const prevTime = useRef(time)
  const lastClickTime = useRef(0)

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Trigger flip animations when digits change
  useEffect(() => {
    const prev = prevTime.current
    const curr = time

    const prevHourTens = Math.floor(prev.getHours() / 10)
    const currHourTens = Math.floor(curr.getHours() / 10)
    const prevHourOnes = prev.getHours() % 10
    const currHourOnes = curr.getHours() % 10
    const prevMinuteTens = Math.floor(prev.getMinutes() / 10)
    const currMinuteTens = Math.floor(curr.getMinutes() / 10)
    const prevMinuteOnes = prev.getMinutes() % 10
    const currMinuteOnes = curr.getMinutes() % 10
    const prevDay = prev.getDay()
    const currDay = curr.getDay()
    const prevDateTens = Math.floor(prev.getDate() / 10)
    const currDateTens = Math.floor(curr.getDate() / 10)
    const prevDateOnes = prev.getDate() % 10
    const currDateOnes = curr.getDate() % 10
    const prevMonth = prev.getMonth()
    const currMonth = curr.getMonth()

    if (currHourTens !== prevHourTens) triggerFlip('hourTens')
    if (currHourOnes !== prevHourOnes) triggerFlip('hourOnes')
    if (currMinuteTens !== prevMinuteTens) triggerFlip('minuteTens')
    if (currMinuteOnes !== prevMinuteOnes) triggerFlip('minuteOnes')
    if (currDay !== prevDay) triggerFlip('day')
    if (currDateTens !== prevDateTens) triggerFlip('dateTens')
    if (currDateOnes !== prevDateOnes) triggerFlip('dateOnes')
    if (currMonth !== prevMonth) triggerFlip('month')

    prevTime.current = curr
  }, [time])

  const triggerFlip = (card: keyof typeof flipping) => {
    setFlipping(prev => ({ ...prev, [card]: true }))
    setTimeout(() => {
      setFlipping(prev => ({ ...prev, [card]: false }))
    }, 600)
  }

  // Dragging logic
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    setIsDragging(true)
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      startX: position.x,
      startY: position.y,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setPosition({
      x: dragStart.current.startX + dx,
      y: dragStart.current.startY + dy,
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // Format helpers
  const hours = time.getHours()
  const minutes = time.getMinutes()
  const hourTens = Math.floor(hours / 10)
  const hourOnes = hours % 10
  const minuteTens = Math.floor(minutes / 10)
  const minuteOnes = minutes % 10
  const ampm = hours >= 12 ? 'pm' : 'am'

  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

  const dayName = days[time.getDay()]
  const date = time.getDate()
  const dateTens = Math.floor(date / 10)
  const dateOnes = date % 10
  const monthName = months[time.getMonth()]

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 2000,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3))',
        perspective: '1000px',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Flip container with 3D transform */}
      <div
        style={{
          width: 300,
          height: 342,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
        }}
      >
        {/* FRONT FACE - Clock */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
          }}
          onClick={(e) => {
            // Detect double-click to flip to settings
            const now = Date.now()
            const timeSinceLastClick = now - lastClickTime.current
            lastClickTime.current = now

            if (timeSinceLastClick < 300) {
              setIsFlipped(true)
            }
          }}
        >
          {/* Outer frame - raised metallic rim */}
          <div
            style={{
              width: 300,
              height: 342,
              background: 'linear-gradient(135deg, #e8e8e8 0%, #cecece 50%, #d8d8d8 100%)',
              borderRadius: 42,
              padding: 10,
              position: 'relative',
              boxShadow: `
                inset 0 2px 8px rgba(255, 255, 255, 0.9),
                inset 0 -3px 8px rgba(0, 0, 0, 0.2),
                0 12px 24px rgba(0, 0, 0, 0.2),
                0 4px 8px rgba(0, 0, 0, 0.15)
              `,
              border: '3px solid #b8b8b8',
            }}
          >
        {/* Inner recessed border - dark dip */}
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 50%, #1a1a1a 100%)',
            borderRadius: 36,
            padding: 6,
            boxShadow: `
              inset 0 3px 6px rgba(0, 0, 0, 0.8),
              inset 0 -1px 3px rgba(255, 255, 255, 0.1)
            `,
            position: 'relative',
          }}
        >
          {/* Layer 1: Interior refractive highlight - simulates acrylic cover refraction */}
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              right: 6,
              bottom: 6,
              borderRadius: 34,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.25) 30%, rgba(0,0,0,0.45) 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* Layer 2: Shadowed inner lip - moulded step separation */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              right: 12,
              bottom: 12,
              borderRadius: 30,
              background: 'rgba(0,0,0,0.5)',
              opacity: 0.7,
              pointerEvents: 'none',
            }}
          />
          {/* Clock face - light background */}
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #fafafa 0%, #ececec 100%)',
              borderRadius: 30,
              padding: '0px 12px 4px 12px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Gloss overlay - simulates acrylic/glass cover */}
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: 8,
                bottom: 8,
                borderRadius: 28,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 40%, rgba(0,0,0,0.05) 100%)',
                border: '1px solid rgba(255,255,255,0.4)',
                pointerEvents: 'none',
                zIndex: 1000,
              }}
            />
        {/* Internal container - consistent max width for all rows */}
        <div
          style={{
            maxWidth: 180,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            paddingBottom: '3pt',
          }}
        >
          {/* Time row (HH MM) */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          {/* Hour digits in shared card */}
          <DoubleFlipCard
            digit1={hourTens}
            digit2={hourOnes}
            isFlipping1={flipping.hourTens}
            isFlipping2={flipping.hourOnes}
          />

          {/* Minute digits in shared card */}
          <DoubleFlipCard
            digit1={minuteTens}
            digit2={minuteOnes}
            isFlipping1={flipping.minuteTens}
            isFlipping2={flipping.minuteOnes}
          />
        </div>

          {/* Day row */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <FlipCard text={dayName} isFlipping={flipping.day} isWide />
          </div>

          {/* Date row */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', width: '100%' }}>
            {/* Date digits in shared card */}
            <DoubleFlipCard
              digit1={dateTens}
              digit2={dateOnes}
              isFlipping1={flipping.dateTens}
              isFlipping2={flipping.dateOnes}
            />
            <FlipCard text={monthName} isFlipping={flipping.month} />
          </div>
            </div>
            {/* End internal container */}
          </div>
          </div>
        </div>
        </div>
        {/* End FRONT FACE */}

        {/* BACK FACE - Settings */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          onClick={(e) => {
            // Double-click back to flip to front
            const now = Date.now()
            const timeSinceLastClick = now - lastClickTime.current
            lastClickTime.current = now

            if (timeSinceLastClick < 300) {
              setIsFlipped(false)
            }
          }}
        >
          {/* Outer frame - matching metallic rim */}
          <div
            style={{
              width: 300,
              height: 342,
              background: 'linear-gradient(135deg, #e8e8e8 0%, #cecece 50%, #d8d8d8 100%)',
              borderRadius: 42,
              padding: 10,
              position: 'relative',
              boxShadow: `
                inset 0 2px 8px rgba(255, 255, 255, 0.9),
                inset 0 -3px 8px rgba(0, 0, 0, 0.2),
                0 12px 24px rgba(0, 0, 0, 0.2),
                0 4px 8px rgba(0, 0, 0, 0.15)
              `,
              border: '3px solid #b8b8b8',
            }}
          >
            {/* Inner glass back */}
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #fafafa 0%, #ececec 100%)',
                borderRadius: 36,
                padding: 20,
                position: 'relative',
                boxShadow: `
                  inset 0 3px 6px rgba(0, 0, 0, 0.15),
                  inset 0 -1px 3px rgba(255, 255, 255, 0.5)
                `,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* Settings Title */}
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#1a1a1a',
                  textAlign: 'center',
                  fontFamily: 'system-ui',
                }}
              >
                CLOCK SETTINGS
              </div>

              {/* 24-Hour Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.05)',
                  borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1a1a1a',
                      fontFamily: 'system-ui',
                    }}
                  >
                    24-HOUR TIME
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setUse24Hour(!use24Hour)
                  }}
                  style={{
                    width: 48,
                    height: 26,
                    background: use24Hour
                      ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                      : 'linear-gradient(135deg, #666 0%, #555 100%)',
                    border: '2px solid rgba(0,0,0,0.3)',
                    borderRadius: 13,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      background: 'linear-gradient(135deg, #fff 0%, #e8e8e8 100%)',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: 2,
                      left: use24Hour ? 24 : 2,
                      transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  />
                </button>
              </div>

              {/* Timezone Selector */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#1a1a1a',
                    fontFamily: 'system-ui',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  TIMEZONE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'LOCAL', value: 'local' },
                    { label: 'UTC', value: 'UTC' },
                    { label: 'NEW YORK', value: 'America/New_York' },
                  ].map((tz) => (
                    <button
                      key={tz.value}
                      onClick={(e) => {
                        e.stopPropagation()
                        setTimezone(tz.value)
                      }}
                      style={{
                        padding: '10px 14px',
                        background: timezone === tz.value
                          ? 'linear-gradient(135deg, #fafafa 0%, #e8e8e8 100%)'
                          : 'linear-gradient(135deg, #888 0%, #666 100%)',
                        border: '2px solid rgba(0,0,0,0.3)',
                        borderRadius: 8,
                        color: timezone === tz.value ? '#1a1a1a' : 'white',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'system-ui',
                        boxShadow: timezone === tz.value
                          ? 'inset 0 2px 4px rgba(0,0,0,0.2)'
                          : '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.3)',
                        transition: 'all 0.2s',
                      }}
                    >
                      {tz.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End BACK FACE */}
      </div>
      {/* End flip container */}
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

// Double digit card - shares one black background
interface DoubleFlipCardProps {
  digit1: number
  digit2: number
  isFlipping1: boolean
  isFlipping2: boolean
}

function DoubleFlipCard({ digit1, digit2, isFlipping1, isFlipping2 }: DoubleFlipCardProps) {
  const width = 80
  const height = 90

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        perspective: 1200,
      }}
    >
      {/* Shared black card container */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          background: 'linear-gradient(180deg, #1e1e1e 0%, #0d0d0d 50%, #1a1a1a 100%)',
          borderRadius: 8,
          boxShadow: `
            inset 0 3px 8px rgba(0, 0, 0, 0.8),
            inset 0 -2px 6px rgba(0, 0, 0, 0.6),
            inset 2px 0 4px rgba(0, 0, 0, 0.5),
            inset -2px 0 4px rgba(0, 0, 0, 0.5)
          `,
          border: '2px solid #000',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        {/* First digit */}
        <div style={{ width: '50%', height: '100%', position: 'relative' }}>
          <FlipDigit digit={digit1} isFlipping={isFlipping1} />
        </div>

        {/* Second digit */}
        <div style={{ width: '50%', height: '100%', position: 'relative' }}>
          <FlipDigit digit={digit2} isFlipping={isFlipping2} />
        </div>
      </div>
    </div>
  )
}

// Single digit flipper (used inside DoubleFlipCard)
interface FlipDigitProps {
  digit: number
  isFlipping: boolean
}

function FlipDigit({ digit, isFlipping }: FlipDigitProps) {
  return (
    <>
      {/* Top half background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, #242424 0%, #0d0d0d 100%)',
          borderBottom: '1.5px solid #000',
          boxShadow: 'inset 0 -2px 4px rgba(0, 0, 0, 0.6)',
          zIndex: 1,
        }}
      />

      {/* Bottom half background */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, #0d0d0d 0%, #1a1a1a 100%)',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6)',
          zIndex: 1,
        }}
      />

      {/* Digit display */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#fafafa',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
            lineHeight: 1,
          }}
        >
          {digit}
        </div>
      </div>

      {/* Flipping animation */}
      {isFlipping && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '50%',
            transformOrigin: 'top',
            transformStyle: 'preserve-3d',
            background: 'linear-gradient(180deg, #242424 0%, #0d0d0d 100%)',
            overflow: 'hidden',
            animation: 'flip 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.8)',
            borderRadius: '0 0 8px 8px',
            zIndex: 5,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: '#fafafa',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
                lineHeight: 1,
                transform: 'translateY(-50%)',
              }}
            >
              {digit}
            </div>
          </div>
        </div>
      )}

      {/* Center divider line */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 2,
          background: '#000',
          transform: 'translateY(-1px)',
          zIndex: 10,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
        }}
      />

      <style>{`
        @keyframes flip {
          0% {
            transform: rotateX(0deg);
          }
          100% {
            transform: rotateX(-180deg);
          }
        }
      `}</style>
    </>
  )
}

interface FlipCardProps {
  digit?: number
  text?: string
  isFlipping: boolean
  isWide?: boolean
}

function FlipCard({ digit, text, isFlipping, isWide }: FlipCardProps) {
  const content = text || digit?.toString() || '0'
  const width = isWide ? 190 : text ? 80 : 55
  const height = isWide ? 50 : text ? 90 : 62

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        perspective: 1200,
      }}
    >
      {/* Card container with depth */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          background: 'linear-gradient(180deg, #1e1e1e 0%, #0d0d0d 50%, #1a1a1a 100%)',
          borderRadius: 8,
          boxShadow: `
            inset 0 3px 8px rgba(0, 0, 0, 0.8),
            inset 0 -2px 6px rgba(0, 0, 0, 0.6),
            inset 2px 0 4px rgba(0, 0, 0, 0.5),
            inset -2px 0 4px rgba(0, 0, 0, 0.5)
          `,
          border: '2px solid #000',
          overflow: 'hidden',
        }}
      >
        {/* Top half background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, #242424 0%, #0d0d0d 100%)',
            borderBottom: '1.5px solid #000',
            boxShadow: 'inset 0 -2px 4px rgba(0, 0, 0, 0.6)',
            zIndex: 1,
          }}
        />

        {/* Bottom half background */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, #0d0d0d 0%, #1a1a1a 100%)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6)',
            zIndex: 1,
          }}
        />

        {/* Full number positioned in center - appears above backgrounds */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontSize: isWide ? 32 : text ? 38 : 52,
              fontWeight: 900,
              color: '#fafafa',
              fontFamily: isWide || text ? 'Impact, "Arial Narrow", "Franklin Gothic Demi Cond", sans-serif-condensed, system-ui' : 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
              letterSpacing: isWide ? 4 : text ? 1 : 0,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
              lineHeight: 1,
              transform: isWide || text ? 'scaleY(1.3)' : 'none',
              transformOrigin: 'center',
            }}
          >
            {content}
          </div>
        </div>

        {/* Flipping animation - top flap that rotates down */}
        {isFlipping && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '50%',
              transformOrigin: 'top',
              transformStyle: 'preserve-3d',
              background: 'linear-gradient(180deg, #242424 0%, #0d0d0d 100%)',
              overflow: 'hidden',
              animation: 'flip 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.8)',
              borderRadius: '0 0 8px 8px',
              zIndex: 5,
            }}
          >
            {/* Number on the flipping card */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontSize: isWide ? 32 : text ? 38 : 52,
                  fontWeight: 900,
                  color: '#fafafa',
                  fontFamily: isWide || text ? 'Impact, "Arial Narrow", "Franklin Gothic Demi Cond", sans-serif-condensed, system-ui' : 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                  letterSpacing: isWide ? 4 : text ? 1 : 0,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
                  lineHeight: 1,
                  transform: isWide || text ? 'translateY(-50%) scaleY(1.3)' : 'translateY(-50%)',
                  transformOrigin: 'center',
                }}
              >
                {content}
              </div>
            </div>
          </div>
        )}

        {/* Center divider line - thicker and more visible */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 2,
            background: '#000',
            transform: 'translateY(-1px)',
            zIndex: 10,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>

      {/* CSS for flip animation */}
      <style>{`
        @keyframes flip {
          0% {
            transform: rotateX(0deg);
          }
          100% {
            transform: rotateX(-180deg);
          }
        }
      `}</style>
    </div>
  )
}
