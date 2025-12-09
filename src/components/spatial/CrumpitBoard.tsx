// CrumpitBoard - Energy-based Task Triage Board
// Works with spatialStore task cards - drag tasks between buckets
// Enforces bucket limits with shake animation feedback

import { useState, useCallback } from 'react'
import { useSpatialStore } from '../../stores/spatialStore'
import type { Card } from '../../types/spatial'
import './CrumpitBoard.css'

type Bucket = 'now' | 'next' | 'later' | 'someday'

const BUCKET_CONFIG = [
  { id: 'now' as Bucket, title: 'NOW', subtitle: 'Do these today', limit: 3 },
  { id: 'next' as Bucket, title: 'NEXT', subtitle: 'This week', limit: 5 },
  { id: 'later' as Bucket, title: 'LATER', subtitle: 'Someday soon', limit: null },
  { id: 'someday' as Bucket, title: 'SOMEDAY', subtitle: 'Maybe eventually', limit: null },
]

const ENERGY_ICONS = {
  high_focus: '⚡',
  medium: '○',
  low_energy: '☁️',
  social: '👥',
}

const ENERGY_COLORS = {
  high_focus: '#FF9A1A',
  medium: '#FFC48C',
  low_energy: '#C4C9FF',
  social: '#FF8B7B',
}

interface CrumpitBoardProps {
  onClose?: () => void
}

export function CrumpitBoard({ onClose }: CrumpitBoardProps) {
  const { space, updateCard } = useSpatialStore()
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [shakingBucket, setShakingBucket] = useState<Bucket | null>(null)
  const [dragOverBucket, setDragOverBucket] = useState<Bucket | null>(null)

  // Get all task cards
  const tasks = space?.cards.filter(c => c.cardType === 'task') || []

  // Get tasks by bucket
  const getTasksInBucket = useCallback((bucket: Bucket): Card[] => {
    return tasks.filter(t => t.bucket === bucket && !t.completed)
  }, [tasks])

  // Get unassigned tasks (no bucket, not completed)
  const unassignedTasks = tasks.filter(t => !t.bucket && !t.completed)

  // Get completed tasks
  const completedTasks = tasks.filter(t => t.completed)

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId)
  }

  const handleDragOver = (e: React.DragEvent, bucket: Bucket) => {
    e.preventDefault()
    setDragOverBucket(bucket)

    const config = BUCKET_CONFIG.find(b => b.id === bucket)
    const tasksInBucket = getTasksInBucket(bucket)
    const draggedTask = tasks.find(t => t.id === draggedTaskId)

    // Check if bucket is full (and task isn't already in it)
    if (config?.limit && tasksInBucket.length >= config.limit && draggedTask?.bucket !== bucket) {
      setShakingBucket(bucket)
      setTimeout(() => setShakingBucket(null), 300)
    }
  }

  const handleDragLeave = () => {
    setDragOverBucket(null)
  }

  const handleDrop = (e: React.DragEvent, bucket: Bucket) => {
    e.preventDefault()
    setDragOverBucket(null)

    if (!draggedTaskId) return

    const config = BUCKET_CONFIG.find(b => b.id === bucket)
    const tasksInBucket = getTasksInBucket(bucket)
    const draggedTask = tasks.find(t => t.id === draggedTaskId)

    // Skip if already in this bucket
    if (draggedTask?.bucket === bucket) {
      setDraggedTaskId(null)
      return
    }

    // Check bucket limit
    if (config?.limit && tasksInBucket.length >= config.limit) {
      setShakingBucket(bucket)
      setTimeout(() => setShakingBucket(null), 300)
      setDraggedTaskId(null)
      return
    }

    // Update task bucket
    updateCard(draggedTaskId, { bucket })
    setDraggedTaskId(null)
  }

  const handleToggleComplete = (taskId: string, completed: boolean) => {
    updateCard(taskId, {
      completed,
      bucket: completed ? undefined : undefined // Clear bucket when completing
    })
  }

  const handleRemoveFromBucket = (taskId: string) => {
    updateCard(taskId, { bucket: undefined })
  }

  const TaskItem = ({ task, showRemove = false }: { task: Card; showRemove?: boolean }) => (
    <div
      draggable
      onDragStart={() => handleDragStart(task.id)}
      className={`crumpit-task ${draggedTaskId === task.id ? 'dragging' : ''}`}
      style={{
        borderLeftColor: task.energy ? ENERGY_COLORS[task.energy] : '#ccc',
      }}
    >
      <input
        type="checkbox"
        checked={task.completed || false}
        onChange={(e) => handleToggleComplete(task.id, e.target.checked)}
        className="crumpit-checkbox"
      />
      <div className="crumpit-task-content">
        <span className={`crumpit-task-name ${task.completed ? 'completed' : ''}`}>
          {task.name || 'Untitled task'}
        </span>
        {task.energy && (
          <span className="crumpit-energy" title={task.energy}>
            {ENERGY_ICONS[task.energy]}
          </span>
        )}
      </div>
      {showRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleRemoveFromBucket(task.id)
          }}
          className="crumpit-remove"
          title="Remove from bucket"
        >
          ×
        </button>
      )}
    </div>
  )

  return (
    <div className="crumpit-overlay">
      <div className="crumpit-container">
        <div className="crumpit-header">
          <div>
            <h1>Crumpit</h1>
            <p>Match work to your energy, not endless lists</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="crumpit-close">
              ✕
            </button>
          )}
        </div>

        <div className="crumpit-board">
          {BUCKET_CONFIG.map((config) => {
            const bucketTasks = getTasksInBucket(config.id)
            const isShaking = shakingBucket === config.id
            const isDragOver = dragOverBucket === config.id
            const isFull = config.limit ? bucketTasks.length >= config.limit : false

            return (
              <div
                key={config.id}
                className={`crumpit-bucket ${isShaking ? 'shaking' : ''} ${isDragOver ? 'drag-over' : ''} ${isFull ? 'full' : ''}`}
                onDragOver={(e) => handleDragOver(e, config.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, config.id)}
              >
                <div className="bucket-header">
                  <h2>{config.title}</h2>
                  <p className="bucket-subtitle">{config.subtitle}</p>
                  {config.limit && (
                    <div className={`bucket-capacity ${isFull ? 'full' : ''}`}>
                      {bucketTasks.length} / {config.limit}
                      {isFull && <span className="capacity-warning"> FULL</span>}
                    </div>
                  )}
                </div>

                <div className="bucket-tasks">
                  {bucketTasks.length === 0 ? (
                    <div className="bucket-empty">Drop tasks here</div>
                  ) : (
                    bucketTasks.map((task) => (
                      <TaskItem key={task.id} task={task} showRemove />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {unassignedTasks.length > 0 && (
          <div className="crumpit-backlog">
            <h3>Unassigned Tasks ({unassignedTasks.length})</h3>
            <div className="backlog-tasks">
              {unassignedTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {completedTasks.length > 0 && (
          <div className="crumpit-completed">
            <h3>Completed ({completedTasks.length})</h3>
            <div className="completed-tasks">
              {completedTasks.slice(0, 5).map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
              {completedTasks.length > 5 && (
                <span className="completed-more">+{completedTasks.length - 5} more</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
