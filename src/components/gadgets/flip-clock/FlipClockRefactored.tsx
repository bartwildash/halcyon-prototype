/**
 * FlipClock - Realistic flip card clock component (Refactored)
 *
 * A highly realistic flip clock inspired by vintage Solari board displays.
 * Features:
 * - Animated flip card transitions
 * - 3D appearance with realistic shadows
 * - Time, day, and date display
 * - Draggable positioning
 *
 * Architecture:
 * - Uses shared FlipClockModel for state management
 * - Parent-controlled diffing (value/previous passed to children)
 * - Clean separation between logic and presentation
 */

import { useState, useRef } from 'react'
import { useFlipClockTime } from './useFlipClockTime'
import { shouldFlip } from './FlipClockModel'

interface FlipClockProps {
  onClose?: () => void
}

export function FlipClock({ onClose }: FlipClockProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 })

  // Get time state from shared hook
  const timeState = useFlipClockTime()

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
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Outer frame - raised metallic rim */}
      <div
        style={{
          width: 300,
          height: 342,
          background: 'linear-gradient(135deg, #e8e8e8 0%, #cecece 50%, #d8d8d8 100%)',
          borderRadius: 32,
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
            borderRadius: 24,
            padding: 6,
            boxShadow: `
              inset 0 3px 6px rgba(0, 0, 0, 0.8),
              inset 0 -1px 3px rgba(255, 255, 255, 0.1)
            `,
          }}
        >
          {/* Clock face - light background */}
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #fafafa 0%, #ececec 100%)',
              borderRadius: 18,
              padding: '0px 12px 4px 12px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
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
            digit1={timeState.hourTens}
            digit2={timeState.hourOnes}
          />

          {/* Minute digits in shared card */}
          <DoubleFlipCard
            digit1={timeState.minuteTens}
            digit2={timeState.minuteOnes}
          />
        </div>

          {/* Day row */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <FlipCard
              value={timeState.day.value}
              previous={timeState.day.previous}
              isWide
            />
          </div>

          {/* Date row */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', width: '100%' }}>
            {/* Date digits in shared card */}
            <DoubleFlipCard
              digit1={timeState.dateTens}
              digit2={timeState.dateOnes}
            />
            <FlipCard
              value={timeState.month.value}
              previous={timeState.month.previous}
            />
          </div>
        </div>
        {/* End internal container */}
      </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Child components - now receive value/previous from parent
// ============================================================================

import type { DigitPair } from './FlipClockModel'

interface DoubleFlipCardProps {
  digit1: DigitPair
  digit2: DigitPair
}

function DoubleFlipCard({ digit1, digit2 }: DoubleFlipCardProps) {
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
          <FlipDigit value={digit1.value} previous={digit1.previous} />
        </div>

        {/* Second digit */}
        <div style={{ width: '50%', height: '100%', position: 'relative' }}>
          <FlipDigit value={digit2.value} previous={digit2.previous} />
        </div>
      </div>
    </div>
  )
}

interface FlipDigitProps {
  value: string
  previous: string
}

function FlipDigit({ value, previous }: FlipDigitProps) {
  const isFlipping = value !== previous

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
          {value}
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
              {value}
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
  value: string
  previous: string
  isWide?: boolean
}

function FlipCard({ value, previous, isWide }: FlipCardProps) {
  const width = isWide ? 190 : 80
  const height = isWide ? 50 : 90
  const isFlipping = value !== previous

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

        {/* Full text positioned in center */}
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
              fontSize: isWide ? 32 : 38,
              fontWeight: 900,
              color: '#fafafa',
              fontFamily: 'Impact, "Arial Narrow", "Franklin Gothic Demi Cond", sans-serif-condensed, system-ui',
              letterSpacing: isWide ? 4 : 1,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
              lineHeight: 1,
              transform: 'scaleY(1.3)',
              transformOrigin: 'center',
            }}
          >
            {value}
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
                  fontSize: isWide ? 32 : 38,
                  fontWeight: 900,
                  color: '#fafafa',
                  fontFamily: 'Impact, "Arial Narrow", "Franklin Gothic Demi Cond", sans-serif-condensed, system-ui',
                  letterSpacing: isWide ? 4 : 1,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
                  lineHeight: 1,
                  transform: 'translateY(-50%) scaleY(1.3)',
                  transformOrigin: 'center',
                }}
              >
                {value}
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
      </div>

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
