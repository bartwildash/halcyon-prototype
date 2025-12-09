// CommandPalette - Cmd+K quick actions
// VSCode-style command palette for Halcyon

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSpatialStore } from '../../stores/spatialStore'
import './CommandPalette.css'

interface Command {
  id: string
  label: string
  shortcut?: string
  category: 'create' | 'navigate' | 'action' | 'mode'
  action: () => void
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onShowPlan: () => void
}

export function CommandPalette({ isOpen, onClose, onShowPlan }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { createCard, space, setToolMode, clearInkStrokes } = useSpatialStore()

  // Define available commands
  const commands: Command[] = useMemo(() => [
    // Create commands
    {
      id: 'create-card',
      label: 'Create new card',
      shortcut: 'n',
      category: 'create',
      action: () => {
        const x = 200 + Math.random() * 400
        const y = 200 + Math.random() * 400
        createCard(x, y, '')
        onClose()
      },
    },
    {
      id: 'create-task',
      label: 'Create task card',
      shortcut: 't',
      category: 'create',
      action: () => {
        const x = 200 + Math.random() * 400
        const y = 200 + Math.random() * 400
        createCard(x, y, '[ ] New task')
        onClose()
      },
    },

    // Mode commands
    {
      id: 'mode-think',
      label: 'THINK mode (canvas)',
      shortcut: '1',
      category: 'mode',
      action: () => {
        onClose()
      },
    },
    {
      id: 'mode-plan',
      label: 'PLAN mode (today)',
      shortcut: '2',
      category: 'mode',
      action: () => {
        onShowPlan()
        onClose()
      },
    },

    // Tool commands
    {
      id: 'tool-hand',
      label: 'Hand tool (pan)',
      shortcut: 'h',
      category: 'action',
      action: () => {
        setToolMode('hand')
        onClose()
      },
    },
    {
      id: 'tool-select',
      label: 'Select tool',
      shortcut: 's',
      category: 'action',
      action: () => {
        setToolMode('select')
        onClose()
      },
    },
    {
      id: 'tool-draw',
      label: 'Draw tool (ink)',
      shortcut: 'd',
      category: 'action',
      action: () => {
        setToolMode('draw')
        onClose()
      },
    },

    // Action commands
    {
      id: 'clear-ink',
      label: 'Clear all ink strokes',
      category: 'action',
      action: () => {
        clearInkStrokes()
        onClose()
      },
    },
    {
      id: 'export-data',
      label: 'Export space data',
      category: 'action',
      action: () => {
        if (space) {
          const dataStr = JSON.stringify(space, null, 2)
          const blob = new Blob([dataStr], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `halcyon-${space.id}.json`
          a.click()
          URL.revokeObjectURL(url)
        }
        onClose()
      },
    },
  ], [createCard, space, setToolMode, clearInkStrokes, onClose, onShowPlan])

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query) return commands
    const lowerQuery = query.toLowerCase()
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.category.includes(lowerQuery)
    )
  }, [commands, query])

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredCommands])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex, onClose])

  if (!isOpen) return null

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          className="command-input"
          placeholder="Type a command..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        <div className="command-list">
          {filteredCommands.length === 0 ? (
            <div className="command-empty">No commands found</div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <div
                key={cmd.id}
                className={`command-item ${idx === selectedIndex ? 'selected' : ''}`}
                onClick={() => cmd.action()}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <span className="command-category">{cmd.category}</span>
                <span className="command-label">{cmd.label}</span>
                {cmd.shortcut && (
                  <kbd className="command-shortcut">{cmd.shortcut}</kbd>
                )}
              </div>
            ))
          )}
        </div>

        <div className="command-footer">
          <span><kbd>Up/Down</kbd> navigate</span>
          <span><kbd>Enter</kbd> select</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
