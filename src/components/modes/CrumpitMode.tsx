// CRUMPIT Mode - Energy-based Task Triage Board
// Enforces psychological realism with bucket limits

import { useState } from 'react'
import { useHalcyonStore } from '../../store/halcyonStore'
import type { Task, CrumpitBucket } from '../../types/entities'
import { TaskCard } from '../entities/TaskCard'
import './CrumpitMode.css'

export function CrumpitMode() {
  const {
    entities,
    crumpit,
    addToCrumpit,
    moveBetweenBuckets,
    getEntitiesByType,
    toggleTaskComplete,
  } = useHalcyonStore()

  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [shakingBucket, setShakingBucket] = useState<CrumpitBucket | null>(null)

  const allTasks = getEntitiesByType<Task>('task')
  const availableTasks = allTasks.filter((t) => !t.bucket && !t.completed)

  const getBucketTasks = (bucket: CrumpitBucket): Task[] => {
    return crumpit[bucket].map((id) => entities.get(id)).filter((t) => t) as Task[]
  }

  const bucketLimits = {
    now: 3,
    next: 5,
    later: Infinity,
    someday: Infinity,
  }

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId)
  }

  const handleDragOver = (e: React.DragEvent, bucket: CrumpitBucket) => {
    e.preventDefault()
    const tasks = getBucketTasks(bucket)
    const limit = bucketLimits[bucket]

    if (tasks.length >= limit && !tasks.find((t) => t.id === draggedTask)) {
      setShakingBucket(bucket)
      setTimeout(() => setShakingBucket(null), 300)
    }
  }

  const handleDrop = (e: React.DragEvent, bucket: CrumpitBucket) => {
    e.preventDefault()
    if (!draggedTask) return

    const tasks = getBucketTasks(bucket)
    const limit = bucketLimits[bucket]

    // Check if task is already in this bucket
    if (tasks.find((t) => t.id === draggedTask)) {
      setDraggedTask(null)
      return
    }

    // Check bucket limit
    if (tasks.length >= limit) {
      setShakingBucket(bucket)
      setTimeout(() => setShakingBucket(null), 300)
      setDraggedTask(null)
      return
    }

    // Find source bucket and move
    const task = entities.get(draggedTask) as Task
    if (task?.bucket) {
      moveBetweenBuckets(draggedTask, task.bucket, bucket)
    } else {
      addToCrumpit(draggedTask, bucket)
    }

    setDraggedTask(null)
  }

  const bucketConfig = [
    {
      id: 'now' as CrumpitBucket,
      title: 'NOW',
      subtitle: 'Do these today',
      limit: 3,
      borderWidth: 4,
    },
    {
      id: 'next' as CrumpitBucket,
      title: 'NEXT',
      subtitle: 'This week',
      limit: 5,
      borderWidth: 3,
    },
    {
      id: 'later' as CrumpitBucket,
      title: 'LATER',
      subtitle: 'Someday soon',
      limit: null,
      borderWidth: 2,
    },
    {
      id: 'someday' as CrumpitBucket,
      title: 'SOMEDAY',
      subtitle: 'Maybe eventually',
      limit: null,
      borderWidth: 1,
    },
  ]

  return (
    <div className="crumpit-container">
      <div className="crumpit-header">
        <h1>Crumpit</h1>
        <p>Match work to your energy, not endless lists</p>
      </div>

      <div className="crumpit-board">
        {bucketConfig.map((config) => {
          const tasks = getBucketTasks(config.id)
          const isShaking = shakingBucket === config.id
          const isFull = config.limit ? tasks.length >= config.limit : false

          return (
            <div
              key={config.id}
              className={`crumpit-bucket ${isShaking ? 'shaking' : ''} ${
                isFull ? 'full' : ''
              }`}
              style={{ borderWidth: `${config.borderWidth}px` }}
              onDragOver={(e) => handleDragOver(e, config.id)}
              onDrop={(e) => handleDrop(e, config.id)}
            >
              <div className="bucket-header">
                <h2>{config.title}</h2>
                <p className="bucket-subtitle">{config.subtitle}</p>
                {config.limit && (
                  <div className="bucket-capacity">
                    {tasks.length} / {config.limit}
                    {isFull && <span className="capacity-warning"> ⚠ FULL</span>}
                  </div>
                )}
              </div>

              <div className="bucket-tasks">
                {tasks.length === 0 ? (
                  <div className="bucket-empty">Drop tasks here</div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      className="crumpit-task-wrapper"
                    >
                      <TaskCard
                        task={task}
                        onToggleComplete={toggleTaskComplete}
                        isSelected={draggedTask === task.id}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {availableTasks.length > 0 && (
        <div className="crumpit-backlog">
          <h3>Available Tasks ({availableTasks.length})</h3>
          <div className="backlog-tasks">
            {availableTasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={() => handleDragStart(task.id)}
                className="backlog-task-wrapper"
              >
                <TaskCard task={task} onToggleComplete={toggleTaskComplete} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
