/**
 * SpatialCanvas - Renders entities on infinite canvas with camera transform
 *
 * Replaces mode-based rendering with spatial positioning.
 * Entities are positioned at world coordinates and transformed by camera.
 */

import { useHalcyonStore } from '../../store/halcyonStore'
import type { Task, Note, Person, Sticker, HalcyonEntity } from '../../types/entities'
import type { CameraState } from '../../terrain/types'
import { BaseCard } from '../primitives/BaseCard'
import { TaskCard } from '../entities/TaskCard'
import { NoteCard } from '../entities/NoteCard'
import { PersonCard } from '../entities/PersonCard'
import { StickerCard } from '../entities/StickerCard'
import { RelationLine } from '../primitives/RelationLine'
import { OrbitSystem } from './OrbitSystem'
import './SpatialCanvas.css'

interface SpatialCanvasProps {
  camera: CameraState
}

export function SpatialCanvas({ camera }: SpatialCanvasProps) {
  const { entities, updateEntity, toggleTaskComplete } = useHalcyonStore()

  // Get viewport bounds for culling (only render visible entities + margin)
  const viewportLeft = camera.offsetX
  const viewportTop = camera.offsetY
  const viewportRight = camera.offsetX + (typeof window !== 'undefined' ? window.innerWidth / camera.zoom : 1600)
  const viewportBottom = camera.offsetY + (typeof window !== 'undefined' ? window.innerHeight / camera.zoom : 1200)
  const margin = 800 // Render margin in world coordinates

  // Filter visible entities (viewport culling for performance)
  const visibleEntities = Array.from(entities.values()).filter(entity => {
    // Skip events and logs for now (they're not spatial cards)
    if (entity.type === 'event' || entity.type === 'log') return false

    return (
      entity.position.x > viewportLeft - margin &&
      entity.position.x < viewportRight + margin &&
      entity.position.y > viewportTop - margin &&
      entity.position.y < viewportBottom + margin
    )
  })

  // Handle entity updates (position, rotation, etc.)
  const handleEntityUpdate = (id: string, updates: Partial<HalcyonEntity>) => {
    updateEntity(id, updates)
  }

  // Handle drag to reposition
  const handleDragEnd = (entityId: string, e: React.DragEvent) => {
    e.preventDefault()
    const newX = e.clientX + camera.offsetX
    const newY = e.clientY + camera.offsetY

    updateEntity(entityId, {
      position: { x: newX, y: newY },
    })
  }

  // Get all tasks and people for relationship lines
  const tasks = visibleEntities.filter(e => e.type === 'task') as Task[]
  const people = visibleEntities.filter(e => e.type === 'person') as Person[]

  // Calculate relationship lines
  const relationLines: Array<{ from: HalcyonEntity; to: HalcyonEntity; label?: string }> = []

  people.forEach(person => {
    person.relatedTasks.forEach(taskId => {
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        relationLines.push({
          from: person,
          to: task,
          label: 'works on',
        })
      }
    })
  })

  return (
    <div className="spatial-canvas">
      {/* Orbit system at Lake (center) */}
      <OrbitSystem
        centerX={0}
        centerY={0}
        cameraOffsetX={camera.offsetX}
        cameraOffsetY={camera.offsetY}
      />

      {/* Render relationship lines first (background layer) */}
      {relationLines.map((rel, idx) => {
        const fromX = rel.from.position.x - camera.offsetX
        const fromY = rel.from.position.y - camera.offsetY
        const toX = rel.to.position.x - camera.offsetX
        const toY = rel.to.position.y - camera.offsetY

        return (
          <div
            key={`rel-${idx}`}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              // Relationship lines also stay fixed width
            }}
          >
            <RelationLine
              id={`rel-${rel.from.id}-${rel.to.id}`}
              from={{ x: fromX, y: fromY }}
              to={{ x: toX, y: toY }}
              isDirected={true}
              label={rel.label}
            />
          </div>
        )
      })}

      {/* Render entity cards */}
      {visibleEntities.map(entity => {
        // Calculate screen position with camera transform
        const screenX = entity.position.x - camera.offsetX
        const screenY = entity.position.y - camera.offsetY

        // Add organic rotation for stickers (based on ID hash)
        const stickerRotation = entity.type === 'sticker'
          ? ((entity.id.charCodeAt(0) + entity.id.charCodeAt(entity.id.length - 1)) % 30) - 15
          : 0

        // Add staggered animation delay for stickers
        const stickerDelay = entity.type === 'sticker'
          ? (entity.id.charCodeAt(0) % 10) * 0.2
          : 0

        return (
          <div
            key={entity.id}
            className="spatial-entity"
            style={{
              position: 'absolute',
              left: screenX,
              top: screenY,
              // Cards stay fixed size - only position transforms with camera
              '--sticker-rotation': `${stickerRotation}deg`,
              '--sticker-delay': `${stickerDelay}s`,
            } as React.CSSProperties}
            onDragEnd={(e) => handleDragEnd(entity.id, e)}
          >
            <BaseCard
              entity={entity}
              onUpdate={handleEntityUpdate}
              allowRotation={true}
            >
              {entity.type === 'task' && (
                <TaskCard
                  task={entity as Task}
                  onToggleComplete={toggleTaskComplete}
                />
              )}
              {entity.type === 'note' && (
                <NoteCard note={entity as Note} />
              )}
              {entity.type === 'person' && (
                <PersonCard person={entity as Person} />
              )}
              {entity.type === 'sticker' && (
                <StickerCard sticker={entity as Sticker} />
              )}
            </BaseCard>
          </div>
        )
      })}

      {/* SVG filters for sticker wobble effect */}
      <svg id="sticker-svg-filters" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="sticker-wobble">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02"
              numOctaves="3"
              result="noise"
              seed="42"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
    </div>
  )
}
