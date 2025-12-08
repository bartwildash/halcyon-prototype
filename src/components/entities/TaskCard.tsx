// TaskCard Component - Halcyon Task Entity
// Monochrome-first, heavy strokes, spatial feel

import type { Task } from '../../types/entities'
import './EntityCards.css'

interface TaskCardProps {
  task: Task
  onToggleComplete?: (id: string) => void
  onUpdate?: (id: string, updates: Partial<Task>) => void
  isSelected?: boolean
}

export function TaskCard({ task, onToggleComplete, onUpdate, isSelected }: TaskCardProps) {
  const energySymbol = {
    high_focus: '⚡',
    medium: '○',
    low_energy: '☁',
    social: '👥',
  }[task.energy]

  const signalBorder = {
    background: '1px',
    normal: '2px',
    loud: '3px',
    critical: '4px',
  }[task.signal]

  return (
    <div
      className={`halcyon-card task-card ${isSelected ? 'selected' : ''} ${
        task.completed ? 'completed' : ''
      }`}
      style={{
        borderWidth: signalBorder,
        transform: task.rotation ? `rotate(${task.rotation}deg)` : undefined,
      }}
    >
      <div className="task-header">
        <button
          className="task-checkbox"
          onClick={() => onToggleComplete?.(task.id)}
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.completed ? '☑' : '☐'}
        </button>
        <div className="task-energy" title={task.energy}>
          {energySymbol}
        </div>
      </div>

      <div className="task-content">
        <h3 className={task.completed ? 'strikethrough' : ''}>{task.title}</h3>
        {task.description && <p className="task-description">{task.description}</p>}
      </div>

      {task.dueDate && (
        <div className="task-footer">
          <span className="task-due">
            {new Date(task.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      )}
    </div>
  )
}
