// THINK Mode - Spatial Canvas with Zones, Threads, and Entities
// Implements full spatial thinking environment

import { useState } from 'react'
import { useHalcyonStore } from '../../store/halcyonStore'
import type { Task, Note, Person, HalcyonEntity } from '../../types/entities'
import { BaseCard } from '../primitives/BaseCard'
import { RelationLine } from '../primitives/RelationLine'
import { ZoneRegion } from '../containers/ZoneRegion'
import { ThreadContainer } from '../containers/ThreadContainer'
import { TaskCard } from '../entities/TaskCard'
import { NoteCard } from '../entities/NoteCard'
import { PersonCard } from '../entities/PersonCard'
import { WriteSurface } from './WriteSurface'
import './ThinkMode.css'

export function ThinkMode() {
  const {
    entities,
    threads,
    currentThreadId,
    setCurrentThread,
    updateEntity,
    toggleTaskComplete,
    createTask,
    createNote,
    createPerson,
  } = useHalcyonStore()

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)
  const [contextMenuState, setContextMenuState] = useState<{
    entityId: string
    x: number
    y: number
  } | null>(null)

  // Get all entities for current thread (or all if no thread selected)
  const visibleEntities = Array.from(entities.values()).filter((e) =>
    currentThreadId ? e.threadId === currentThreadId : true
  )

  const tasks = visibleEntities.filter((e) => e.type === 'task') as Task[]
  const notes = visibleEntities.filter((e) => e.type === 'note') as Note[]
  const people = visibleEntities.filter((e) => e.type === 'person') as Person[]

  // Handle entity updates (drag, rotate, etc.)
  const handleEntityUpdate = (id: string, updates: Partial<HalcyonEntity>) => {
    updateEntity(id, updates)
  }

  // Handle context menu
  const handleContextMenu = (entityId: string, x: number, y: number) => {
    setContextMenuState({ entityId, x, y })
  }

  // Handle double-tap to create new entity
  const handleDoubleClick = (e: React.MouseEvent) => {
    const x = e.clientX
    const y = e.clientY

    // Simple prompt for now - could be a modal
    const type = prompt('Create: (t)ask, (n)ote, or (p)erson?')?.toLowerCase()

    if (type === 't' || type === 'task') {
      const title = prompt('Task title:')
      if (title) {
        const task = createTask(title, x, y)
        if (currentThreadId) {
          updateEntity(task.id, { threadId: currentThreadId })
        }
      }
    } else if (type === 'n' || type === 'note') {
      const content = prompt('Note content:')
      if (content) {
        const note = createNote(content, x, y)
        if (currentThreadId) {
          updateEntity(note.id, { threadId: currentThreadId })
        }
      }
    } else if (type === 'p' || type === 'person') {
      const name = prompt('Person name:')
      if (name) {
        const person = createPerson(name, x, y)
        if (currentThreadId) {
          updateEntity(person.id, { threadId: currentThreadId })
        }
      }
    }
  }

  // Handle note expansion to WriteSurface
  const handleNoteClick = (noteId: string) => {
    setExpandedNoteId(noteId)
  }

  const expandedNote = expandedNoteId ? (entities.get(expandedNoteId) as Note) : null

  return (
    <div className="think-mode" onDoubleClick={handleDoubleClick}>
      {/* Header */}
      <div className="think-header">
        <h1>Think</h1>
        <p>Spatial canvas for thoughts, tasks, and connections</p>

        {/* Thread selector */}
        {threads.size > 0 && (
          <div className="thread-selector">
            <button
              onClick={() => setCurrentThread(null)}
              className={!currentThreadId ? 'active' : ''}
            >
              All
            </button>
            {Array.from(threads.values()).map((thread) => (
              <button
                key={thread.id}
                onClick={() => setCurrentThread(thread.id)}
                className={currentThreadId === thread.id ? 'active' : ''}
              >
                {thread.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spatial Canvas */}
      <div className="think-canvas">
        {/* Zone Regions (background layer) */}
        <ZoneRegion
          id="zone-work"
          title="Work"
          bounds={{ x: 50, y: 50, width: 1200, height: 800 }}
          landmark="work"
          pattern="dots"
          isActive={true}
        />

        <ZoneRegion
          id="zone-personal"
          title="Personal"
          bounds={{ x: 1300, y: 50, width: 1200, height: 800 }}
          landmark="home"
          pattern="grid"
          isActive={true}
        />

        {/* Render Threads if any exist */}
        {currentThreadId && threads.get(currentThreadId) && (
          <ThreadContainer
            thread={threads.get(currentThreadId)!}
            isActive={true}
            onZoomOut={() => setCurrentThread(null)}
          >
            {/* Thread content rendered below */}
          </ThreadContainer>
        )}

        {/* Render all Tasks */}
        {tasks.map((task) => (
          <BaseCard
            key={task.id}
            entity={task}
            onUpdate={handleEntityUpdate}
            onContextMenu={handleContextMenu}
            isSelected={selectedEntityId === task.id}
            className="entity-positioned"
            style={{
              position: 'absolute',
              left: task.position.x,
              top: task.position.y,
            }}
          >
            <TaskCard
              task={task}
              onToggleComplete={toggleTaskComplete}
              isSelected={selectedEntityId === task.id}
            />
          </BaseCard>
        ))}

        {/* Render all Notes */}
        {notes.map((note) => (
          <BaseCard
            key={note.id}
            entity={note}
            onUpdate={handleEntityUpdate}
            onContextMenu={handleContextMenu}
            isSelected={selectedEntityId === note.id}
            className="entity-positioned"
            style={{
              position: 'absolute',
              left: note.position.x,
              top: note.position.y,
            }}
          >
            <div onClick={() => handleNoteClick(note.id)}>
              <NoteCard note={note} isSelected={selectedEntityId === note.id} />
            </div>
          </BaseCard>
        ))}

        {/* Render all People */}
        {people.map((person) => (
          <BaseCard
            key={person.id}
            entity={person}
            onUpdate={handleEntityUpdate}
            onContextMenu={handleContextMenu}
            isSelected={selectedEntityId === person.id}
            className="entity-positioned"
            style={{
              position: 'absolute',
              left: person.position.x,
              top: person.position.y,
            }}
          >
            <PersonCard person={person} isSelected={selectedEntityId === person.id} />
          </BaseCard>
        ))}

        {/* Render Relations (if entities have links) */}
        {tasks.map((task) =>
          task.links.map((targetId) => {
            const target = entities.get(targetId)
            if (!target) return null

            return (
              <RelationLine
                key={`${task.id}-${targetId}`}
                id={`rel-${task.id}-${targetId}`}
                from={task.position}
                to={target.position}
                isDirected={true}
                onSelect={(id) => console.log('Selected relation:', id)}
              />
            )
          })
        )}
      </div>

      {/* Context Menu */}
      {contextMenuState && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            left: contextMenuState.x,
            top: contextMenuState.y,
          }}
        >
          <button onClick={() => setContextMenuState(null)}>Delete</button>
          <button onClick={() => setContextMenuState(null)}>Duplicate</button>
          <button onClick={() => setContextMenuState(null)}>Link to...</button>
          <button onClick={() => setContextMenuState(null)}>Close</button>
        </div>
      )}

      {/* WriteSurface (modal) */}
      {expandedNote && (
        <WriteSurface
          note={expandedNote}
          onSave={(content) => {
            updateEntity(expandedNote.id, { content })
          }}
          onClose={() => setExpandedNoteId(null)}
        />
      )}

      {/* Footer with hints */}
      <div className="think-footer">
        <span className="hint">Double-click to create • Drag to move • Two-finger twist to rotate</span>
        <span className="entity-count">
          {tasks.length} tasks • {notes.length} notes • {people.length} people
        </span>
      </div>
    </div>
  )
}
