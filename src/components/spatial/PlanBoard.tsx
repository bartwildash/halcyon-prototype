// PlanBoard - Today View for Daily Planning
// Shows tasks scheduled for today (bucket='now') with time blocking
// Minimal, focused view for daily execution

import { useState, useCallback } from 'react'
import { useSpatialStore } from '../../stores/spatialStore'
import type { Card } from '../../types/spatial'
import './PlanBoard.css'

const ENERGY_ICONS = {
  high_focus: '⚡',
  medium: '○',
  low_energy: '☁️',
  social: '👥',
}

const ENERGY_LABELS = {
  high_focus: 'High Focus',
  medium: 'Medium',
  low_energy: 'Low Energy',
  social: 'Social',
}

interface PlanBoardProps {
  onClose?: () => void
}

export function PlanBoard({ onClose }: PlanBoardProps) {
  const { space, updateCard, createCard } = useSpatialStore()
  const [newTaskName, setNewTaskName] = useState('')

  // Get all task cards
  const tasks = space?.cards.filter(c => c.cardType === 'task') || []

  // Today's tasks (bucket = 'now')
  const todayTasks = tasks.filter(t => t.bucket === 'now' && !t.completed)

  // Group by energy level
  const tasksByEnergy = {
    high_focus: todayTasks.filter(t => t.energy === 'high_focus'),
    medium: todayTasks.filter(t => t.energy === 'medium' || !t.energy),
    low_energy: todayTasks.filter(t => t.energy === 'low_energy'),
    social: todayTasks.filter(t => t.energy === 'social'),
  }

  // Completed today (bucket = 'now' and completed)
  const completedToday = tasks.filter(t => t.bucket === 'now' && t.completed)

  const handleToggleComplete = (taskId: string, completed: boolean) => {
    updateCard(taskId, { completed })
  }

  const handleAddTask = useCallback(() => {
    if (!newTaskName.trim()) return

    const cardId = createCard(100, 100, newTaskName.trim())
    updateCard(cardId, {
      cardType: 'task',
      bucket: 'now',
      energy: 'medium',
      completed: false,
    })
    setNewTaskName('')
  }, [newTaskName, createCard, updateCard])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask()
    }
  }

  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening'
  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const TaskItem = ({ task }: { task: Card }) => (
    <div className={`plan-task ${task.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={task.completed || false}
        onChange={(e) => handleToggleComplete(task.id, e.target.checked)}
        className="plan-checkbox"
      />
      <span className="plan-task-name">{task.name || 'Untitled task'}</span>
      {task.energy && (
        <span className="plan-energy" title={ENERGY_LABELS[task.energy]}>
          {ENERGY_ICONS[task.energy]}
        </span>
      )}
    </div>
  )

  const totalTasks = todayTasks.length + completedToday.length
  const progress = totalTasks > 0 ? (completedToday.length / totalTasks) * 100 : 0

  return (
    <div className="plan-overlay">
      <div className="plan-container">
        <div className="plan-header">
          <div>
            <h1>{greeting}</h1>
            <p className="plan-date">{todayDate}</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="plan-close">
              ✕
            </button>
          )}
        </div>

        {/* Progress bar */}
        {totalTasks > 0 && (
          <div className="plan-progress">
            <div className="plan-progress-bar" style={{ width: `${progress}%` }} />
            <span className="plan-progress-text">
              {completedToday.length} of {totalTasks} tasks done
            </span>
          </div>
        )}

        {/* Quick add */}
        <div className="plan-quick-add">
          <input
            type="text"
            placeholder="Add a task for today..."
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="plan-input"
          />
          <button onClick={handleAddTask} className="plan-add-btn" disabled={!newTaskName.trim()}>
            Add
          </button>
        </div>

        <div className="plan-content">
          {todayTasks.length === 0 && completedToday.length === 0 ? (
            <div className="plan-empty">
              <p>No tasks for today</p>
              <p className="plan-empty-sub">
                Add tasks above or assign tasks to "NOW" in Crumpit
              </p>
            </div>
          ) : (
            <>
              {/* Group by energy */}
              {tasksByEnergy.high_focus.length > 0 && (
                <div className="plan-section">
                  <h3>
                    <span className="plan-section-icon">⚡</span>
                    High Focus
                    <span className="plan-section-hint">Morning energy peak</span>
                  </h3>
                  {tasksByEnergy.high_focus.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              )}

              {tasksByEnergy.medium.length > 0 && (
                <div className="plan-section">
                  <h3>
                    <span className="plan-section-icon">○</span>
                    Standard Tasks
                  </h3>
                  {tasksByEnergy.medium.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              )}

              {tasksByEnergy.social.length > 0 && (
                <div className="plan-section">
                  <h3>
                    <span className="plan-section-icon">👥</span>
                    Social / Meetings
                  </h3>
                  {tasksByEnergy.social.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              )}

              {tasksByEnergy.low_energy.length > 0 && (
                <div className="plan-section">
                  <h3>
                    <span className="plan-section-icon">☁️</span>
                    Low Energy
                    <span className="plan-section-hint">Afternoon slump</span>
                  </h3>
                  {tasksByEnergy.low_energy.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              )}

              {/* Completed */}
              {completedToday.length > 0 && (
                <div className="plan-section completed">
                  <h3>
                    <span className="plan-section-icon">✓</span>
                    Done
                  </h3>
                  {completedToday.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="plan-footer">
          <p>Tasks from Crumpit "NOW" bucket appear here</p>
        </div>
      </div>
    </div>
  )
}
