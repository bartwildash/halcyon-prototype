/**
 * Keyboard Shortcuts Hook
 *
 * Full keyboard navigation for Halcyon
 * Inspired by Fizzy's HotkeysController
 */

import { useEffect, useState } from 'react'
import { useHalcyonStore } from '../store/halcyonStore'

export function useKeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false)
  const { createTask, createNote, createPerson, setMode, currentMode } = useHalcyonStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to blur
        if (e.key === 'Escape') {
          target.blur()
        }
        return
      }

      // Command/Ctrl combinations
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault()
            // TODO: Open command palette
            console.log('Command palette (not yet implemented)')
            break
          case 'z':
            if (e.shiftKey) {
              e.preventDefault()
              // TODO: Redo
              console.log('Redo (not yet implemented)')
            } else {
              e.preventDefault()
              // TODO: Undo
              console.log('Undo (not yet implemented)')
            }
            break
          default:
            break
        }
        return
      }

      // Single key shortcuts (global)
      switch (e.key) {
        // Help
        case '?':
          e.preventDefault()
          setShowHelp(!showHelp)
          break

        // Create entities (only in THINK mode)
        case 't':
          if (currentMode === 'think') {
            e.preventDefault()
            const x = window.innerWidth / 2 + Math.random() * 200 - 100
            const y = window.innerHeight / 2 + Math.random() * 200 - 100
            createTask('New task', x, y)
          }
          break

        case 'n':
          if (currentMode === 'think') {
            e.preventDefault()
            const x = window.innerWidth / 2 + Math.random() * 200 - 100
            const y = window.innerHeight / 2 + Math.random() * 200 - 100
            createNote('', x, y)
          }
          break

        case 'p':
          if (currentMode === 'think') {
            e.preventDefault()
            const x = window.innerWidth / 2 + Math.random() * 200 - 100
            const y = window.innerHeight / 2 + Math.random() * 200 - 100
            createPerson('New person', x, y)
          }
          break

        // Mode switching
        case '1':
          e.preventDefault()
          setMode('think')
          break

        case '2':
          e.preventDefault()
          setMode('crumpit')
          break

        case '3':
          e.preventDefault()
          setMode('log')
          break

        // Search
        case '/':
          e.preventDefault()
          // TODO: Open search
          console.log('Search (not yet implemented)')
          break

        // Close modals
        case 'Escape':
          e.preventDefault()
          setShowHelp(false)
          // TODO: Close other modals
          break

        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showHelp, currentMode, createTask, createNote, createPerson, setMode])

  return { showHelp, setShowHelp }
}
