/**
 * FloatingToolbar - Unified toolbar for all Halcyon editors
 *
 * Features:
 * - Floats on left edge of content card, vertically centered
 * - Pill-shaped with frosted glass effect
 * - Icons only, tooltips on hover
 * - Contextual tools based on editor mode
 * - Smooth transitions between modes
 * - Mobile: collapses to FAB
 */

import { useState, useEffect } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { getToolsForMode } from './tools'
import type { FloatingToolbarProps, Tool, ToolAction } from './types'
import './FloatingToolbar.css'

export function FloatingToolbar({
  mode,
  activeTool,
  onAction,
  position = 'left',
  collapsed: controlledCollapsed,
  onCollapsedChange,
}: FloatingToolbarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const collapsed = controlledCollapsed ?? internalCollapsed

  const setCollapsed = (value: boolean) => {
    setInternalCollapsed(value)
    onCollapsedChange?.(value)
  }

  const tools = getToolsForMode(mode)

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleToolClick = (action: ToolAction) => {
    onAction(action)

    // Auto-collapse on mobile after action
    if (window.innerWidth < 768) {
      setCollapsed(true)
    }
  }

  // Render FAB (mobile collapsed state)
  if (collapsed) {
    return (
      <div className={`floating-toolbar-fab ${position}`}>
        <button
          className="toolbar-fab-button"
          onClick={() => setCollapsed(false)}
          aria-label="Open toolbar"
        >
          <span className="toolbar-fab-icon">{getModeIcon(mode)}</span>
        </button>
      </div>
    )
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className={`floating-toolbar ${position} mode-${mode}`}>
        {/* Close button (mobile only) */}
        {window.innerWidth < 768 && (
          <button
            className="toolbar-close"
            onClick={() => setCollapsed(true)}
            aria-label="Close toolbar"
          >
            ✕
          </button>
        )}

        {/* Tools */}
        <div className="toolbar-tools">
          {tools.map((tool, index) => (
            <div key={`${tool.action}-${index}`}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    className={`toolbar-button ${activeTool === tool.action ? 'active' : ''}`}
                    onClick={() => handleToolClick(tool.action)}
                    aria-label={tool.label}
                    data-action={tool.action}
                  >
                    <span className="toolbar-icon">{tool.icon}</span>
                  </button>
                </Tooltip.Trigger>

                <Tooltip.Portal>
                  <Tooltip.Content
                    className="toolbar-tooltip"
                    side={position === 'left' ? 'right' : 'left'}
                    sideOffset={8}
                  >
                    <div className="tooltip-label">{tool.label}</div>
                    {tool.shortcut && (
                      <div className="tooltip-shortcut">{tool.shortcut}</div>
                    )}
                    <Tooltip.Arrow className="toolbar-tooltip-arrow" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              {/* Separator */}
              {tool.separator && <div className="toolbar-separator" />}
            </div>
          ))}
        </div>
      </div>
    </Tooltip.Provider>
  )
}

// Get icon for mode (for FAB)
function getModeIcon(mode: string): string {
  const icons = {
    text: '✎',
    markdown: 'M↓',
    canvas: '○',
    page: '⊞',
    inspect: '🔍',
  }
  return icons[mode as keyof typeof icons] || '✎'
}
