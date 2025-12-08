// WriteSurface - Full-screen writing membrane
// Implements Write Surface interface guidance

import { useState, useRef, useEffect } from 'react'
import type { Note } from '../../types/entities'
import './WriteSurface.css'

interface WriteSurfaceProps {
  note: Note
  onSave: (content: string) => void
  onClose: () => void
}

export function WriteSurface({ note, onSave, onClose }: WriteSurfaceProps) {
  const [content, setContent] = useState(note.content)
  const [selectedText, setSelectedText] = useState('')
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Focus on mount
    textAreaRef.current?.focus()
  }, [])

  const handleTextSelection = () => {
    const selection = window.getSelection()
    const selected = selection?.toString() || ''
    setSelectedText(selected)

    if (textAreaRef.current && selected) {
      setSelectionRange({
        start: textAreaRef.current.selectionStart,
        end: textAreaRef.current.selectionEnd,
      })
    } else {
      setSelectionRange(null)
    }
  }

  const handleSave = () => {
    onSave(content)
    onClose()
  }

  const handleBold = () => {
    if (!selectionRange || !selectedText) return
    const before = content.slice(0, selectionRange.start)
    const after = content.slice(selectionRange.end)
    const newContent = `${before}**${selectedText}**${after}`
    setContent(newContent)
  }

  const handleHighlight = () => {
    if (!selectionRange || !selectedText) return
    const before = content.slice(0, selectionRange.start)
    const after = content.slice(selectionRange.end)
    const newContent = `${before}==${selectedText}==${after}`
    setContent(newContent)
  }

  const handlePromoteToCard = () => {
    // TODO: Implement paragraph promotion
    // This would extract selected text into a new Note card
    console.log('Promote to card:', selectedText)
  }

  const handleEscape = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleSave()
    }
  }

  return (
    <div className="write-surface">
      {/* Blurred backdrop */}
      <div className="write-backdrop" onClick={handleSave} />

      {/* Main writing area */}
      <div className="write-container">
        {/* Header */}
        <div className="write-header">
          <button className="write-close" onClick={handleSave} aria-label="Save and close">
            ← Done
          </button>
          <span className="write-hint">Esc to save and close</span>
        </div>

        {/* Text area with paper texture */}
        <textarea
          ref={textAreaRef}
          className="write-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onSelect={handleTextSelection}
          onKeyDown={handleEscape}
          placeholder="Start writing..."
          spellCheck={true}
        />

        {/* Tool palette (appears at edges) */}
        {selectionRange && (
          <div className="write-tools">
            <button onClick={handleBold} title="Bold">
              <strong>B</strong>
            </button>
            <button onClick={handleHighlight} title="Highlight">
              ✏️
            </button>
            <button onClick={handlePromoteToCard} title="Promote to card">
              🗂️
            </button>
          </div>
        )}

        {/* Character count */}
        <div className="write-footer">
          <span className="write-count">{content.length} characters</span>
        </div>
      </div>
    </div>
  )
}
