// Persistence Layer using IndexedDB (idb-keyval)
// Follows the "speed first" principle: instant local updates, async server sync

import { get, set, del, keys } from 'idb-keyval'
import type { Space, QueuedOperation } from '../types/spatial'

// Store structure in IndexedDB:
// - `space:${spaceId}` → Full space object
// - `user` → User preferences
// - `queue` → Array of pending API operations

export async function saveSpace(space: Space): Promise<void> {
  await set(`space:${space.id}`, space)
}

export async function loadSpace(spaceId: string): Promise<Space | undefined> {
  return get(`space:${spaceId}`)
}

export async function deleteSpace(spaceId: string): Promise<void> {
  await del(`space:${spaceId}`)
}

export async function listSpaces(): Promise<string[]> {
  const allKeys = await keys()
  return allKeys
    .filter((key) => typeof key === 'string' && key.startsWith('space:'))
    .map((key) => (key as string).replace('space:', ''))
}

// Operation Queue for offline-first sync
export async function queueOperation(op: QueuedOperation): Promise<void> {
  const queue = (await get('queue')) || []
  queue.push(op)
  await set('queue', queue)
}

export async function getQueue(): Promise<QueuedOperation[]> {
  return (await get('queue')) || []
}

export async function updateQueue(queue: QueuedOperation[]): Promise<void> {
  await set('queue', queue)
}

export async function clearQueue(): Promise<void> {
  await set('queue', [])
}

// Process queue: send pending operations to server
// This is called periodically or when connection is restored
export async function processQueue(
  sendToAPI: (op: QueuedOperation) => Promise<void>
): Promise<void> {
  const queue = await getQueue()
  if (queue.length === 0) return

  const remainingOps: QueuedOperation[] = []

  for (const op of queue) {
    try {
      await sendToAPI(op)
      // Successfully sent, don't add to remainingOps
    } catch (e) {
      op.retries++
      if (op.retries > 5) {
        // Move to dead letter queue or alert user
        console.error('Operation failed after 5 retries:', op, e)
      } else {
        remainingOps.push(op)
      }
    }
  }

  await updateQueue(remainingOps)
}

// User preferences
export async function saveUserPreferences(prefs: any): Promise<void> {
  await set('user', prefs)
}

export async function loadUserPreferences(): Promise<any> {
  return get('user')
}
