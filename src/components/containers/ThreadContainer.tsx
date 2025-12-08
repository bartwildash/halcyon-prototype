// ThreadContainer - Narrative unit container (desk mat style)
// Implements Thread interface guidance

import type { Thread } from '../../types/entities'
import './ThreadContainer.css'

interface ThreadContainerProps {
  thread: Thread
  children: React.ReactNode
  isActive?: boolean
  onZoomIn?: () => void
  onZoomOut?: () => void
  className?: string
}

export function ThreadContainer({
  thread,
  children,
  isActive = false,
  onZoomIn,
  onZoomOut,
  className = '',
}: ThreadContainerProps) {
  return (
    <div
      className={`thread-container ${isActive ? 'active' : 'inactive'} ${className}`}
      data-thread-id={thread.id}
      onClick={isActive ? undefined : onZoomIn}
    >
      {/* Title ribbon at top-left */}
      <div className="thread-ribbon">
        <h2 className="thread-title">{thread.title}</h2>
        {thread.description && <p className="thread-description">{thread.description}</p>}

        {/* Thread metadata */}
        <div className="thread-meta">
          <span className="thread-entity-count">{thread.entities.length} items</span>
          {onZoomOut && isActive && (
            <button className="thread-zoom-out" onClick={onZoomOut} aria-label="Zoom out">
              ⬅ Back
            </button>
          )}
        </div>
      </div>

      {/* Faint bounding line to maintain identity */}
      <div className="thread-boundary" />

      {/* Thread content area */}
      <div className="thread-content">{children}</div>

      {/* Background pattern based on thread seed */}
      <div
        className="thread-background"
        style={{
          backgroundImage: generateThreadPattern(thread.seed),
        }}
      />
    </div>
  )
}

// Generate unique background pattern for each thread using seed
function generateThreadPattern(seed: number): string {
  // Use seed to create consistent but unique pattern
  const hue = Math.floor(seed * 360)
  const lightness = 97 + Math.floor(seed * 2)

  // Subtle dot pattern with thread-specific variation
  return `
    radial-gradient(
      circle at ${20 + seed * 30}% ${20 + seed * 30}%,
      rgba(0, 0, 0, 0.01) 1px,
      transparent 1px
    )
  `
}
