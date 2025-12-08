// PersonCard Component - Halcyon Person Entity
// Simple, monochrome-safe, with gentle tints

import type { Person } from '../../types/entities'
import './EntityCards.css'

interface PersonCardProps {
  person: Person
  onUpdate?: (id: string, updates: Partial<Person>) => void
  isSelected?: boolean
}

export function PersonCard({ person, onUpdate, isSelected }: PersonCardProps) {
  const initials = person.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={`halcyon-card person-card ${isSelected ? 'selected' : ''}`}
      style={{
        transform: person.rotation ? `rotate(${person.rotation}deg)` : undefined,
        borderColor: person.avatarColor || undefined,
      }}
    >
      <div
        className="person-avatar"
        style={{
          backgroundColor: person.avatarColor || '#f0f0f0',
        }}
      >
        <span>{initials}</span>
      </div>

      <div className="person-content">
        <h3>{person.name}</h3>
        {person.role && <p className="person-role">{person.role}</p>}
        {person.notes && <p className="person-notes">{person.notes}</p>}
      </div>

      <div className="person-footer">
        {person.relatedTasks.length > 0 && (
          <span className="person-tasks">{person.relatedTasks.length} tasks</span>
        )}
      </div>
    </div>
  )
}
