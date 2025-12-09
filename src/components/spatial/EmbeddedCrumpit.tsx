/**
 * EmbeddedCrumpit - Fixed Crumpit board embedded in the spatial canvas
 *
 * This is a simplified version of CrumpitBoard that lives at the Mountain
 * zone location and scales with the canvas zoom.
 */

import { useState, useCallback } from 'react'
import { LANDMARKS } from '../../config/landmarks'
import './EmbeddedCrumpit.css'

// Get Mountain landmark for positioning
const mountainLandmark = LANDMARKS.find(l => l.id === 'mountain')!

interface Task {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  done: boolean
}

// Persist tasks in localStorage
const STORAGE_KEY = 'halcyon-crumpit-tasks'

function loadTasks(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    // Ignore errors
  }
  return [
    { id: '1', title: 'Review priorities', priority: 'high', done: false },
    { id: '2', title: 'Check blocked items', priority: 'medium', done: false },
    { id: '3', title: 'Plan next sprint', priority: 'low', done: false },
  ]
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function EmbeddedCrumpit() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const addTask = useCallback(() => {
    if (!newTaskTitle.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      priority: 'medium',
      done: false,
    }

    const updated = [...tasks, newTask]
    setTasks(updated)
    saveTasks(updated)
    setNewTaskTitle('')
  }, [newTaskTitle, tasks])

  const toggleTask = useCallback((id: string) => {
    const updated = tasks.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    )
    setTasks(updated)
    saveTasks(updated)
  }, [tasks])

  const deleteTask = useCallback((id: string) => {
    const updated = tasks.filter(t => t.id !== id)
    setTasks(updated)
    saveTasks(updated)
  }, [tasks])

  const setPriority = useCallback((id: string, priority: Task['priority']) => {
    const updated = tasks.map(t =>
      t.id === id ? { ...t, priority } : t
    )
    setTasks(updated)
    saveTasks(updated)
  }, [tasks])

  // Sort by priority and completion
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const highPriority = sortedTasks.filter(t => t.priority === 'high' && !t.done)
  const otherTasks = sortedTasks.filter(t => t.priority !== 'high' || t.done)

  // Position in canvas coordinates (relative to 5000,5000 center)
  const x = 5000 + mountainLandmark.x - 200
  const y = 5000 + mountainLandmark.y - 150

  return (
    <div
      className={`embedded-crumpit ${isExpanded ? 'embedded-crumpit--expanded' : ''}`}
      style={{
        left: x,
        top: y,
      }}
    >
      <div className="embedded-crumpit-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="embedded-crumpit-icon">⛰️</span>
        <span className="embedded-crumpit-title">Crumpit</span>
        <span className="embedded-crumpit-count">{tasks.filter(t => !t.done).length}</span>
        <span className="embedded-crumpit-toggle">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="embedded-crumpit-content">
          {/* High priority section */}
          {highPriority.length > 0 && (
            <div className="embedded-crumpit-section embedded-crumpit-section--high">
              <div className="embedded-crumpit-section-label">🔴 Now</div>
              {highPriority.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onPriority={setPriority}
                />
              ))}
            </div>
          )}

          {/* Other tasks */}
          <div className="embedded-crumpit-section">
            {otherTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onPriority={setPriority}
              />
            ))}
          </div>

          {/* Add task */}
          <div className="embedded-crumpit-add">
            <input
              type="text"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Add task..."
              className="embedded-crumpit-input"
            />
            <button onClick={addTask} className="embedded-crumpit-add-btn">+</button>
          </div>
        </div>
      )}
    </div>
  )
}

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onPriority: (id: string, priority: Task['priority']) => void
}

function TaskItem({ task, onToggle, onDelete, onPriority }: TaskItemProps) {
  return (
    <div className={`embedded-crumpit-task ${task.done ? 'embedded-crumpit-task--done' : ''}`}>
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => onToggle(task.id)}
        className="embedded-crumpit-checkbox"
      />
      <span className="embedded-crumpit-task-title">{task.title}</span>
      <select
        value={task.priority}
        onChange={e => onPriority(task.id, e.target.value as Task['priority'])}
        className={`embedded-crumpit-priority embedded-crumpit-priority--${task.priority}`}
        onClick={e => e.stopPropagation()}
      >
        <option value="high">🔴</option>
        <option value="medium">🟡</option>
        <option value="low">🟢</option>
      </select>
      <button
        onClick={() => onDelete(task.id)}
        className="embedded-crumpit-delete"
        title="Delete"
      >
        ×
      </button>
    </div>
  )
}
