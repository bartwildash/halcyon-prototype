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

type TimerMode = 'work' | 'break' | 'stopped'
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

  // Play a pleasant chirp sound using Web Audio API
  const playChirp = useCallback(() => {
    if (!soundEnabled) return

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create oscillator for a pleasant two-tone chirp
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // First tone: 800Hz
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      // Second tone: 1000Hz (higher pitch)
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1)

      // Envelope: quick fade in, sustain, fade out
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05)
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.25)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.25)
    } catch (error) {
      console.warn('Could not play sound:', error)
    }
  }, [soundEnabled])

  // Timer logic
  useEffect(() => {
    if (mode === 'stopped') {
      if (timerRef.current !== undefined) {
        clearInterval(timerRef.current)
      }
      return
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Play chirp sound when timer completes
          playChirp()

          // Switch modes
          if (mode === 'work') {
            setMode('break')
            setTotalTime(5 * 60)
            return 5 * 60
          } else {
            setMode('work')
            setTotalTime(25 * 60)
            return 25 * 60
          }
        }
        return prev - 1
      })
    }, 1000) as unknown as number

    return () => {
      if (timerRef.current !== undefined) {
        clearInterval(timerRef.current)
      }
    }
  }, [mode])

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

  // Dragging logic
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    if ((e.target as HTMLElement).closest('.settings-panel')) return
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

  // Start/pause timer
  const toggleTimer = () => {
    if (mode === 'stopped') {
      setMode('work')
      setTimeRemaining(25 * 60)
      setTotalTime(25 * 60)
    } else {
      setMode('stopped')
    }
  }

  // Reset timer
  const resetTimer = () => {
    setMode('stopped')
    setTimeRemaining(25 * 60)
    setTotalTime(25 * 60)
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
            {/* Tick marks - simpler style */}
            {Array.from({ length: 60 }).map((_, i) => {
              const isHour = i % 5 === 0
              const angle = (i * 6) * (Math.PI / 180)
              const innerRadius = isHour ? 122 : 132
              const outerRadius = 142
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

            {/* Number labels - starting from 12 o'clock */}
            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((num, i) => {
              const angle = (i * 30) * (Math.PI / 180)
              const radius = 95
              const x = 150 + Math.sin(angle) * radius
              const y = 150 - Math.cos(angle) * radius

              return (
                <text
                  key={num}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={themeColors.numberColor}
                  fontSize="26"
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
              y1="20"
              x2="150"
              y2="50"
              stroke={themeColors.startLineColor}
              strokeWidth="4"
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
              }}
            />

            {/* Red countdown disc - shows ONLY remaining time */}
            <g>
              {/* Red countdown wedge - starts at 12 o'clock (25min mark), shrinks clockwise */}
              {angle > 0 && (
                <path
                  d={`
                    M 150 150
                    L 150 20
                    A 130 130 0 ${angle > 180 ? 1 : 0} 1
                    ${150 + Math.sin((angle) * Math.PI / 180) * 130}
                    ${150 - Math.cos((angle) * Math.PI / 180) * 130}
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
              x2={150 + Math.sin((angle) * Math.PI / 180) * 110}
              y2={150 - Math.cos((angle) * Math.PI / 180) * 110}
              stroke="#2a2a2a"
              strokeWidth="4"
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 2px 2px rgba(0, 0, 0, 0.3))',
              }}
            />

            {/* Center hub - dark circle (rendered last so it's on top) */}
            <circle
              cx="150"
              cy="150"
              r="12"
              fill="radial-gradient(circle, #3a3a3a 0%, #1a1a1a 100%)"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))',
              }}
            />
          </svg>
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

      {/* Old settings panel - now unused */}
      {false && (
        <div
          className="settings-panel"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 40,
            right: -12,
            background: 'rgba(255, 255, 255, 0.98)',
            border: '2px solid #111',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
            minWidth: 200,
            fontFamily: 'system-ui',
            zIndex: 2002,
          }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#111' }}>
              Timer Settings
            </div>

            {/* Sound toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                padding: '8px 0',
              }}
            >
              <span style={{ fontSize: 13, color: '#333' }}>Sound Alert</span>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  width: 48,
                  height: 26,
                  background: soundEnabled ? '#4CAF50' : '#ccc',
                  border: '2px solid #111',
                  borderRadius: 13,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.3s',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    background: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: 2,
                    left: soundEnabled ? 24 : 2,
                    transition: 'left 0.3s',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                  }}
                />
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(0, 0, 0, 0.1)', margin: '8px 0' }} />

            {/* Visual theme selector */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, color: '#333', marginBottom: 8 }}>Visual Theme</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(['light', 'dark'] as VisualTheme[]).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setVisualTheme(theme)}
                    style={{
                      padding: '8px 12px',
                      background: visualTheme === theme ? '#E8EEF2' : 'transparent',
                      border: visualTheme === theme ? '2px solid #111' : '2px solid transparent',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: visualTheme === theme ? 600 : 400,
                      textAlign: 'left',
                      color: '#111',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (visualTheme !== theme) {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (visualTheme !== theme) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    {theme === 'light' && '☀️ Light'}
                    {theme === 'dark' && '🌙 Dark'}
                  </button>
                ))}
              </div>
            </div>
        </div>
      )}
    </div>
  )
}
