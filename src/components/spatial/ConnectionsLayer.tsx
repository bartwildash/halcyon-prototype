// ConnectionsLayer - SVG container for all connections
// Rendered below cards in the z-order

import { useSpatialStore } from '../../stores/spatialStore'
import { Connection } from './Connection'
import { TempConnectionLine } from './TempConnectionLine'

export function ConnectionsLayer() {
  const { space, selectedConnectionIds } = useSpatialStore()

  if (!space) return null

  // Get card lookup for connection rendering
  const cardMap = new Map(space.cards.map((card) => [card.id, card]))

  return (
    <svg
      className="connections-layer"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'visible',
        width: '100%',
        height: '100%',
      }}
    >
      {space.connections.map((connection) => {
        const startCard = cardMap.get(connection.startCardId)
        const endCard = cardMap.get(connection.endCardId)

        if (!startCard || !endCard) return null

        return (
          <Connection
            key={connection.id}
            connection={connection}
            startCard={startCard}
            endCard={endCard}
            isSelected={selectedConnectionIds.has(connection.id)}
            onSelect={() => {
              // TODO: implement connection selection
            }}
          />
        )
      })}

      {/* Temporary line while dragging to create connection */}
      <TempConnectionLine />
    </svg>
  )
}
