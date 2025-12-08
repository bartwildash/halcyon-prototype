/**
 * EntityLayer - Renders Halcyon entities (cards) in world space
 *
 * Integrates with react-zoom-pan-pinch transform system.
 * Entities positioned at world coordinates, transform applied automatically.
 *
 * Includes:
 * - OrbitSystem at Lake (0, 0)
 * - All entity cards (Note, Task, Person, Sticker)
 * - Drag to reposition
 * - Selection state
 */

import { useHalcyonStore } from '../../store/halcyonStore'
import type { HalcyonEntity, Task, Note, Person, Sticker } from '../../types/entities'
import { BaseCard } from '../primitives/BaseCard'
import { TaskCard } from '../entities/TaskCard'
import { NoteCard } from '../entities/NoteCard'
import { PersonCard } from '../entities/PersonCard'
import { StickerCard } from '../entities/StickerCard'
import { RelationLine } from '../primitives/RelationLine'
import { OrbitSystem } from '../spatial/OrbitSystem'
import './EntityLayer.css'

interface EntityLayerProps {
  entities: HalcyonEntity[]
}

export function EntityLayer({ entities }: EntityLayerProps) {
  const { updateEntity, toggleTaskComplete } = useHalcyonStore()

  // Filter visible entities (skip events and logs - not spatial cards)
  const visibleEntities = entities.filter(
    (entity) => entity.type !== 'event' && entity.type !== 'log'
  )

  // Handle entity updates
  const handleEntityUpdate = (id: string, updates: Partial<HalcyonEntity>) => {
    updateEntity(id, updates)
  }

  // Get all tasks and people for relationship lines
  const tasks = visibleEntities.filter((e) => e.type === 'task') as Task[]
  const people = visibleEntities.filter((e) => e.type === 'person') as Person[]

  // Calculate relationship lines
  const relationLines: Array<{ from: HalcyonEntity; to: HalcyonEntity; label?: string }> = []

  people.forEach((person) => {
    person.relatedTasks.forEach((taskId) => {
      const task = tasks.find((t) => t.id === taskId)
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
    <div
      className="entity-layer"
      style={{
        position: 'absolute',
        width: '10000px',
        height: '10000px',
        top: -5000,
        left: -5000,
      }}
    >
      {/* Orbit system at Lake (center 0, 0) */}
      <div
        style={{
          position: 'absolute',
          left: 5000 - 520, // Center in our 10000x10000 space
          top: 5000 - 320,
          pointerEvents: 'none',
        }}
      >
        <OrbitSystem centerX={0} centerY={0} cameraOffsetX={0} cameraOffsetY={0} />
      </div>

      {/* Render relationship lines first (background layer) */}
      {relationLines.map((rel, idx) => {
        const fromX = 5000 + rel.from.position.x
        const fromY = 5000 + rel.from.position.y
        const toX = 5000 + rel.to.position.x
        const toY = 5000 + rel.to.position.y

        return (
          <div
            key={`rel-${idx}`}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
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
      {visibleEntities.map((entity) => {
        // Position in world space (offset by 5000 to center in our container)
        const worldX = 5000 + entity.position.x
        const worldY = 5000 + entity.position.y

        // Add organic rotation for stickers
        const stickerRotation =
          entity.type === 'sticker'
            ? ((entity.id.charCodeAt(0) + entity.id.charCodeAt(entity.id.length - 1)) % 30) - 15
            : 0

        // Add staggered animation delay for stickers
        const stickerDelay = entity.type === 'sticker' ? (entity.id.charCodeAt(0) % 10) * 0.2 : 0

        return (
          <div
            key={entity.id}
            className="spatial-entity"
            style={{
              position: 'absolute',
              left: worldX,
              top: worldY,
              '--sticker-rotation': `${stickerRotation}deg`,
              '--sticker-delay': `${stickerDelay}s`,
            } as React.CSSProperties}
          >
            <BaseCard entity={entity} onUpdate={handleEntityUpdate} allowRotation={true}>
              {entity.type === 'task' && (
                <TaskCard task={entity as Task} onToggleComplete={toggleTaskComplete} />
              )}
              {entity.type === 'note' && <NoteCard note={entity as Note} />}
              {entity.type === 'person' && <PersonCard person={entity as Person} />}
              {entity.type === 'sticker' && <StickerCard sticker={entity as Sticker} />}
            </BaseCard>
          </div>
        )
      })}
    </div>
  )
}
