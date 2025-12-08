// NoteCard Component - Halcyon Note Entity
// Hand-drawn feel, organic, monochrome-first

import type { Note } from '../../types/entities'
import './EntityCards.css'

interface NoteCardProps {
  note: Note
  onUpdate?: (id: string, updates: Partial<Note>) => void
  isSelected?: boolean
}

export function NoteCard({ note, onUpdate, isSelected }: NoteCardProps) {
  const styleClass = {
    default: 'note-default',
    handdrawn: 'note-handdrawn',
    thick: 'note-thick',
    dashed: 'note-dashed',
  }[note.style]

  return (
    <div
      className={`halcyon-card note-card ${styleClass} ${isSelected ? 'selected' : ''}`}
      style={{
        transform: note.rotation ? `rotate(${note.rotation}deg)` : undefined,
      }}
    >
      {note.isHandwritten && <div className="note-badge">✏️</div>}

      <div className="note-content">
        {note.isHandwritten && note.inkStrokes ? (
          <div className="note-ink">
            {/* Ink strokes would render here */}
            <p className="ink-preview">{note.content}</p>
          </div>
        ) : (
          <p>{note.content}</p>
        )}
      </div>

      <div className="note-footer">
        <span className="note-timestamp">
          {new Date(note.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </div>
  )
}
