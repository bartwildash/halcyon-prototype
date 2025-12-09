/**
 * NotificationBell - Shows pending reminders count and notification status
 */

import { useState, useEffect } from 'react'
import { messageQueue, requestNotificationPermission, type QueuedMessage } from '../../services/messageQueue'
import './NotificationBell.css'

interface NotificationBellProps {
  onClick?: () => void
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const [messages, setMessages] = useState<QueuedMessage[]>([])
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted')
    }

    // Subscribe to queue changes
    const unsubscribe = messageQueue.subscribe(setMessages)
    return unsubscribe
  }, [])

  const pendingCount = messages.filter(m => m.status === 'pending').length
  const stats = messageQueue.getStats()

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission()
    setHasPermission(granted)
  }

  const handleClearDelivered = () => {
    // Clear old delivered messages
    const pending = messages.filter(m => m.status === 'pending')
    // Save only pending back
    localStorage.setItem('halcyon-message-queue', JSON.stringify(pending))
    window.location.reload() // Reload to reset queue
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffMins = Math.round(diffMs / 60000)

    if (diffMins < 0) return 'Overdue'
    if (diffMins < 60) return `In ${diffMins}m`
    if (diffMins < 1440) return `In ${Math.round(diffMins / 60)}h`
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div className="notification-bell-container">
      <button
        className={`notification-bell ${pendingCount > 0 ? 'has-pending' : ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
        title={`${pendingCount} pending reminder${pendingCount !== 1 ? 's' : ''}`}
      >
        <span className="bell-icon">🔔</span>
        {pendingCount > 0 && (
          <span className="bell-badge">{pendingCount > 9 ? '9+' : pendingCount}</span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="notification-dropdown-backdrop" onClick={() => setShowDropdown(false)} />
          <div className="notification-dropdown">
            <div className="notification-dropdown-header">
              <h4>Reminders</h4>
              <button className="dropdown-close" onClick={() => setShowDropdown(false)}>×</button>
            </div>

            {/* Permission request */}
            {hasPermission === false && (
              <div className="notification-permission">
                <p>Enable notifications to receive reminders</p>
                <button onClick={handleRequestPermission}>Enable</button>
              </div>
            )}

            {/* Stats */}
            <div className="notification-stats">
              <span>{stats.pending} pending</span>
              <span>{stats.delivered} delivered</span>
              {stats.failed > 0 && <span className="failed">{stats.failed} failed</span>}
            </div>

            {/* Pending reminders list */}
            <div className="notification-list">
              {messages
                .filter(m => m.status === 'pending')
                .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                .slice(0, 5)
                .map(msg => (
                  <div key={msg.id} className="notification-item">
                    <div className="notification-item-content">
                      <span className="notification-title">{msg.title}</span>
                      <span className="notification-time">{formatDate(msg.scheduledAt)}</span>
                    </div>
                    <button
                      className="notification-cancel"
                      onClick={() => messageQueue.cancel(msg.id)}
                      title="Cancel"
                    >
                      ×
                    </button>
                  </div>
                ))}

              {pendingCount === 0 && (
                <div className="notification-empty">No pending reminders</div>
              )}

              {pendingCount > 5 && (
                <div className="notification-more">+{pendingCount - 5} more</div>
              )}
            </div>

            {/* Actions */}
            {stats.delivered > 0 && (
              <div className="notification-actions">
                <button onClick={handleClearDelivered}>Clear delivered</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
