// SyncIndicator - Shows sync status in the corner of the canvas

import './SyncIndicator.css'

interface SyncIndicatorProps {
  isSyncing: boolean
  isOnline: boolean
  lastSyncAt: string | null
  error: string | null
  onForceSync?: () => void
}

export function SyncIndicator({
  isSyncing,
  isOnline,
  lastSyncAt,
  error,
  onForceSync,
}: SyncIndicatorProps) {
  const getStatusColor = () => {
    if (!isOnline) return '#ef4444' // Red - offline
    if (error) return '#f59e0b' // Amber - error
    if (isSyncing) return '#3b82f6' // Blue - syncing
    return '#22c55e' // Green - synced
  }

  const getStatusText = () => {
    if (!isOnline) return 'Offline'
    if (error) return 'Sync Error'
    if (isSyncing) return 'Syncing...'
    if (lastSyncAt) {
      const date = new Date(lastSyncAt)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      if (diff < 60000) return 'Synced just now'
      if (diff < 3600000) return `Synced ${Math.floor(diff / 60000)}m ago`
      return `Synced ${Math.floor(diff / 3600000)}h ago`
    }
    return 'Not synced'
  }

  return (
    <button
      className="sync-indicator"
      onClick={onForceSync}
      title={error || getStatusText()}
      disabled={isSyncing || !isOnline}
    >
      <span
        className={`sync-dot ${isSyncing ? 'syncing' : ''}`}
        style={{ backgroundColor: getStatusColor() }}
      />
      <span className="sync-text">{getStatusText()}</span>
    </button>
  )
}
