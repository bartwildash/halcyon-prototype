/**
 * PomodoroTimer - Time Timer inspired visual countdown
 *
 * Based on the physical Time Timer design where:
 * - Red disc shows ONLY remaining time (not full circle at start)
 * - Red disc starts at 25-minute mark and shrinks clockwise
 * - Time stamps (0-55 minutes) are displayed around clock face
 * - Clear visual line marks the 25-minute starting position
 * - Minimal UI - click timer face to start/pause
 * - Two themes: Light (merged classic+soft) and Dark
 */

import { useState, useEffect, useRef, useCallback } from 'react'

interface PomodoroTimerProps {
  onClose?: () => void
}

type TimerMode = 'work' | 'break' | 'paused' | 'stopped'
type VisualTheme = 'light' | 'dark'

export function PomodoroTimer({ onClose }: PomodoroTimerProps) {
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [mode, setMode] = useState<TimerMode>('stopped')
  const [timeRemaining, setTimeRemaining] = useState(25 * 60) // 25 minutes in seconds
  const [totalTime, setTotalTime] = useState(25 * 60)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [visualTheme, setVisualTheme] = useState<VisualTheme>('light')
  const [isFlipped, setIsFlipped] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 })
  const timerRef = useRef<number | undefined>(undefined)
  const lastClickTime = useRef(0)
  // Track start time for drift-free timing
  const timerStartTime = useRef<number>(0)
  const timerStartRemaining = useRef<number>(0)

  // Play a pleasant chirp sound using Web Audio API
  // Plays 3 chirps for better notification
  const playChirp = useCallback(() => {
    if (!soundEnabled) return

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Play 3 chirps with delay between them
      const playTone = (startTime: number) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Two-tone chirp: 800Hz then 1000Hz
        oscillator.frequency.setValueAtTime(800, startTime)
        oscillator.frequency.setValueAtTime(1000, startTime + 0.1)

        // Envelope: quick fade in, sustain, fade out
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05)
        gainNode.gain.setValueAtTime(0.3, startTime + 0.15)
        gainNode.gain.linearRampToValueAtTime(0, startTime + 0.25)

        oscillator.start(startTime)
        oscillator.stop(startTime + 0.25)
      }

      // Play 3 chirps with 400ms gaps
      const now = audioContext.currentTime
      playTone(now)
      playTone(now + 0.4)
      playTone(now + 0.8)
    } catch (error) {
      console.warn('Could not play sound:', error)
    }
  }, [soundEnabled])

  // Timer logic - uses wall-clock time to prevent drift
  useEffect(() => {
    // Only run timer when in work or break mode
    if (mode === 'stopped' || mode === 'paused') {
      if (timerRef.current !== undefined) {
        clearInterval(timerRef.current)
        timerRef.current = undefined
      }
      return
    }

    // Record when we started this timer session
    timerStartTime.current = Date.now()
    timerStartRemaining.current = timeRemaining

    // Update every 100ms for smooth display, calculate from wall clock
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timerStartTime.current) / 1000)
      const newRemaining = Math.max(0, timerStartRemaining.current - elapsed)

      setTimeRemaining(newRemaining)

      if (newRemaining <= 0) {
        // Clear interval before playing sound to prevent multiple triggers
        if (timerRef.current !== undefined) {
          clearInterval(timerRef.current)
          timerRef.current = undefined
        }

        // Play chirp sound when timer completes
        playChirp()

        // Switch modes after a brief delay
        setTimeout(() => {
          if (mode === 'work') {
            setMode('break')
            setTotalTime(5 * 60)
            setTimeRemaining(5 * 60)
          } else {
            setMode('work')
            setTotalTime(25 * 60)
            setTimeRemaining(25 * 60)
          }
        }, 100)
      }
    }, 100) as unknown as number

    return () => {
      if (timerRef.current !== undefined) {
        clearInterval(timerRef.current)
        timerRef.current = undefined
      }
    }
    // Note: We intentionally capture timeRemaining at effect start via ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, playChirp])

  // Theme-specific styling (merged classic+soft into light, added dark)
  const getThemeColors = () => {
    switch (visualTheme) {
      case 'dark':
        return {
          discColor: '#FF4444',
          discOpacity: '0.95',
          faceGradient: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
          numberColor: '#ffffff',
          tickColor: '#cccccc',
          frameGradient: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 50%, #000000 100%)',
          startLineColor: 'rgba(255, 255, 255, 0.4)',
        }
      default: // light (merged classic + soft)
        return {
          discColor: '#FF3333',
          discOpacity: '0.95',
          faceGradient: 'linear-gradient(135deg, #fefefe 0%, #f0f0f0 100%)',
          numberColor: '#2a2a2a',
          tickColor: '#666666',
          frameGradient: 'linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 50%, #1a1a1a 100%)',
          startLineColor: 'rgba(0, 0, 0, 0.3)',
        }
    }
  }

  const themeColors = getThemeColors()

  // Dragging logic - use native touch events for reliable touch dragging
  const containerRef = useRef<HTMLDivElement>(null)
  const pointerIdRef = useRef<number | null>(null)

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    if ((e.target as HTMLElement).closest('.settings-panel')) return

    // Prevent default to stop browser touch handling
    e.preventDefault()

    setIsDragging(true)
    pointerIdRef.current = e.pointerId
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      startX: position.x,
      startY: position.y,
    }

    // Use setPointerCapture for reliable tracking
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || e.pointerId !== pointerIdRef.current) return

    // Prevent default to avoid scroll interference
    e.preventDefault()

    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setPosition({
      x: dragStart.current.startX + dx,
      y: dragStart.current.startY + dy,
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerIdRef.current) return

    setIsDragging(false)
    pointerIdRef.current = null

    if (containerRef.current) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId)
      } catch {
        // Ignore errors if capture already released
      }
    }
  }

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerIdRef.current) return
    setIsDragging(false)
    pointerIdRef.current = null
  }

  // Track which mode we were in before pausing
  const pausedFromMode = useRef<'work' | 'break'>('work')

  // Start/pause timer
  const toggleTimer = () => {
    if (mode === 'stopped') {
      // Fresh start
      setMode('work')
      setTimeRemaining(totalTime)
    } else if (mode === 'paused') {
      // Resume from pause
      setMode(pausedFromMode.current)
    } else {
      // Pause (from work or break)
      pausedFromMode.current = mode as 'work' | 'break'
      setMode('paused')
    }
  }

  // Reset timer
  const resetTimer = () => {
    setMode('stopped')
    setTimeRemaining(totalTime)
  }

  // Calculate rotation angle for red disc
  // Clock face represents 60 minutes (full circle = 360°)
  // Red disc shows ONLY remaining time mapped to 60-minute clock
  // When 25 min remaining: red disc covers 150° (25/60 × 360°)
  // When 5 min remaining: red disc covers 30° (5/60 × 360°)
  // When 0 min remaining: no red disc (0°)
  const timeInMinutes = timeRemaining / 60 // Convert seconds to minutes
  const angle = (timeInMinutes / 60) * 360 // Map to 60-minute clock face

  // Format time display
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 2000,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none', // Critical: prevent browser touch handling for smooth drag
        filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3))',
        perspective: '1000px',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerUp}
    >
      {/* Flip container with 3D transform */}
      <div
        style={{
          width: 228,
          height: 228,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
        }}
      >
        {/* FRONT FACE - Timer */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
          }}
        >
      {/* Outer frame - raised metallic rim (inspired by FlipClock) */}
      <div
        style={{
          width: 228,
          height: 228,
          background: visualTheme === 'dark'
            ? 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 50%, #3a3a3a 100%)'
            : 'linear-gradient(135deg, #e8e8e8 0%, #cecece 50%, #d8d8d8 100%)',
          borderRadius: 42,
          padding: 8,
          position: 'relative',
          boxShadow: `
            inset 0 2px 8px rgba(255, 255, 255, ${visualTheme === 'dark' ? '0.3' : '0.9'}),
            inset 0 -3px 8px rgba(0, 0, 0, ${visualTheme === 'dark' ? '0.6' : '0.2'}),
            0 12px 24px rgba(0, 0, 0, 0.3),
            0 4px 8px rgba(0, 0, 0, 0.2)
          `,
          border: visualTheme === 'dark' ? '2px solid #1a1a1a' : '2px solid #b8b8b8',
        }}
        onClick={(e) => {
          // Detect double-click to flip, single-click to start/pause
          if ((e.target as HTMLElement).closest('button')) return
          if ((e.target as HTMLElement).closest('.settings-panel')) return

          const now = Date.now()
          const timeSinceLastClick = now - lastClickTime.current
          lastClickTime.current = now

          if (timeSinceLastClick < 300) {
            // Double-click: flip to settings
            setIsFlipped(!isFlipped)
          } else {
            // Single-click: toggle timer
            if (!isFlipped) {
              toggleTimer()
            }
          }
        }}
      >
        {/* Inner recessed border - dark dip */}
        <div
          style={{
            width: '100%',
            height: '100%',
            background: visualTheme === 'dark'
              ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)'
              : 'linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 50%, #1a1a1a 100%)',
            borderRadius: 36,
            padding: 5,
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
              top: 5,
              left: 5,
              right: 5,
              bottom: 5,
              borderRadius: 34,
              background: visualTheme === 'dark'
                ? 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 30%, rgba(0,0,0,0.6) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.25) 30%, rgba(0,0,0,0.45) 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* Layer 2: Shadowed inner lip - moulded step separation */}
          <div
            style={{
              position: 'absolute',
              top: 9,
              left: 9,
              right: 9,
              bottom: 9,
              borderRadius: 30,
              background: 'rgba(0,0,0,0.5)',
              opacity: visualTheme === 'dark' ? 0.8 : 0.7,
              pointerEvents: 'none',
            }}
          />

          {/* Clock face - light background */}
          <div
            style={{
              width: '100%',
              height: '100%',
              background: themeColors.faceGradient,
              borderRadius: 30,
              padding: 10,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Gloss overlay - simulates acrylic/glass cover */}
            <div
              style={{
                position: 'absolute',
                top: 6,
                left: 6,
                right: 6,
                bottom: 6,
                borderRadius: 28,
                background: visualTheme === 'dark'
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, rgba(0,0,0,0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 40%, rgba(0,0,0,0.05) 100%)',
                border: visualTheme === 'dark'
                  ? '1px solid rgba(255,255,255,0.15)'
                  : '1px solid rgba(255,255,255,0.4)',
                pointerEvents: 'none',
                zIndex: 1000,
              }}
            />

          {/* Clock face */}
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 300 300"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
            }}
          >
            {/* Tick marks - inside the number circle */}
            {Array.from({ length: 60 }).map((_, i) => {
              const isHour = i % 5 === 0
              const angle = (i * 6) * (Math.PI / 180)
              const innerRadius = isHour ? 100 : 105
              const outerRadius = 115
              const x1 = 150 + Math.sin(angle) * innerRadius
              const y1 = 150 - Math.cos(angle) * innerRadius
              const x2 = 150 + Math.sin(angle) * outerRadius
              const y2 = 150 - Math.cos(angle) * outerRadius

              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={themeColors.tickColor}
                  strokeWidth={isHour ? 2.5 : 1.5}
                  opacity={0.7}
                  strokeLinecap="round"
                />
              )
            })}

            {/* Number labels - outside tick marks, mirrored horizontally for counter-clockwise progression */}
            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((num, i) => {
              // Mirror angle horizontally: negate the sin component
              const angle = (i * 30) * (Math.PI / 180)
              const radius = 128
              const x = 150 - Math.sin(angle) * radius  // Changed + to - to mirror
              const y = 150 - Math.cos(angle) * radius

              return (
                <text
                  key={num}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={themeColors.numberColor}
                  fontSize="24"
                  fontWeight="700"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {num}
                </text>
              )
            })}

            {/* 25-minute start line - clear visual marker at 12 o'clock */}
            <line
              x1="150"
              y1="25"
              x2="150"
              y2="48"
              stroke={themeColors.startLineColor}
              strokeWidth="4"
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
              }}
            />

            {/* Red countdown disc - shows ONLY remaining time */}
            <g>
              {/* Red countdown wedge - starts at 12 o'clock (25min mark), shrinks counter-clockwise */}
              {angle > 0 && (
                <path
                  d={`
                    M 150 150
                    L 150 50
                    A 100 100 0 ${angle > 180 ? 1 : 0} 0
                    ${150 - Math.sin((angle) * Math.PI / 180) * 100}
                    ${150 - Math.cos((angle) * Math.PI / 180) * 100}
                    Z
                  `}
                  fill={themeColors.discColor}
                  opacity={themeColors.discOpacity}
                  style={{
                    filter: `drop-shadow(0 2px 4px ${themeColors.discColor}40)`,
                  }}
                />
              )}
            </g>

            {/* Hand/pointer - points to where the red disc ends */}
            <line
              x1="150"
              y1="150"
              x2={150 - Math.sin((angle) * Math.PI / 180) * 100}
              y2={150 - Math.cos((angle) * Math.PI / 180) * 100}
              stroke="#2a2a2a"
              strokeWidth="4"
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 2px 2px rgba(0, 0, 0, 0.3))',
              }}
            />

            {/* Center hub - dark circle */}
            <circle
              cx="150"
              cy="150"
              r="12"
              fill={visualTheme === 'dark' ? '#1a1a1a' : '#2a2a2a'}
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))',
              }}
            />

            {/* Paused indicator - pulsing ring */}
            {mode === 'paused' && (
              <circle
                cx="150"
                cy="150"
                r="18"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="3"
                opacity="0.8"
                style={{
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            )}
          </svg>

          {/* CSS for pause animation */}
          {mode === 'paused' && (
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 1; }
              }
            `}</style>
          )}
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
        >
          {/* Outer frame - matching metallic rim */}
          <div
            style={{
              width: 228,
              height: 228,
              background: visualTheme === 'dark'
                ? 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 50%, #3a3a3a 100%)'
                : 'linear-gradient(135deg, #e8e8e8 0%, #cecece 50%, #d8d8d8 100%)',
              borderRadius: 42,
              padding: 8,
              position: 'relative',
              boxShadow: `
                inset 0 2px 8px rgba(255, 255, 255, ${visualTheme === 'dark' ? '0.3' : '0.9'}),
                inset 0 -3px 8px rgba(0, 0, 0, ${visualTheme === 'dark' ? '0.6' : '0.2'}),
                0 12px 24px rgba(0, 0, 0, 0.3),
                0 4px 8px rgba(0, 0, 0, 0.2)
              `,
              border: visualTheme === 'dark' ? '2px solid #1a1a1a' : '2px solid #b8b8b8',
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
            {/* Inner glass back */}
            <div
              style={{
                width: '100%',
                height: '100%',
                background: visualTheme === 'dark'
                  ? 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)'
                  : 'linear-gradient(135deg, #fafafa 0%, #e8e8e8 100%)',
                borderRadius: 36,
                padding: 12,
                position: 'relative',
                boxShadow: `
                  inset 0 3px 6px rgba(0, 0, 0, 0.4),
                  inset 0 -1px 3px rgba(255, 255, 255, 0.1)
                `,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {/* Settings Title */}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: visualTheme === 'dark' ? '#fff' : '#1a1a1a',
                  textAlign: 'center',
                  fontFamily: 'system-ui',
                }}
              >
                TIMER SETTINGS
              </div>

              {/* Beeper Toggle Switch */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: visualTheme === 'dark'
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.05)',
                  borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={visualTheme === 'dark' ? '#fff' : '#1a1a1a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: visualTheme === 'dark' ? '#fff' : '#1a1a1a',
                      fontFamily: 'system-ui',
                    }}
                  >
                    BEEPER
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSoundEnabled(!soundEnabled)
                  }}
                  style={{
                    width: 44,
                    height: 24,
                    background: soundEnabled
                      ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                      : 'linear-gradient(135deg, #666 0%, #555 100%)',
                    border: '2px solid rgba(0,0,0,0.3)',
                    borderRadius: 12,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      background: 'linear-gradient(135deg, #fff 0%, #e8e8e8 100%)',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: 2,
                      left: soundEnabled ? 22 : 2,
                      transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  />
                </button>
              </div>

              {/* Theme Toggle Switch */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: visualTheme === 'dark'
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.05)',
                  borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {visualTheme === 'dark' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                  )}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: visualTheme === 'dark' ? '#fff' : '#1a1a1a',
                      fontFamily: 'system-ui',
                    }}
                  >
                    THEME
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setVisualTheme(visualTheme === 'dark' ? 'light' : 'dark')
                  }}
                  style={{
                    width: 44,
                    height: 24,
                    background: visualTheme === 'dark'
                      ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)'
                      : 'linear-gradient(135deg, #fafafa 0%, #e8e8e8 100%)',
                    border: '2px solid rgba(0,0,0,0.3)',
                    borderRadius: 12,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      background: visualTheme === 'dark'
                        ? 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)'
                        : 'linear-gradient(135deg, #fff 0%, #e8e8e8 100%)',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: 2,
                      left: visualTheme === 'dark' ? 22 : 2,
                      transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  />
                </button>
              </div>

              {/* Time preset buttons */}
              <div style={{ display: 'flex', gap: 3, marginTop: 4, maxWidth: '100%', justifyContent: 'center' }}>
                {[5, 15, 25, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={(e) => {
                      e.stopPropagation()
                      setTotalTime(mins * 60)
                      setTimeRemaining(mins * 60)
                      setMode('stopped')
                    }}
                    style={{
                      minWidth: 28,
                      padding: '6px 4px',
                      background: totalTime === mins * 60
                        ? 'linear-gradient(135deg, #FF3333 0%, #cc0000 100%)'
                        : 'linear-gradient(135deg, #888 0%, #666 100%)',
                      border: '2px solid rgba(0,0,0,0.3)',
                      borderRadius: 6,
                      color: 'white',
                      fontSize: 9,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'system-ui',
                      boxShadow: totalTime === mins * 60
                        ? 'inset 0 2px 4px rgba(0,0,0,0.3)'
                        : '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.3)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {mins}
                  </button>
                ))}
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
