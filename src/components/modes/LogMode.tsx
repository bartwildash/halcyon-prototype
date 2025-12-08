/**
 * LOG Mode - Canyon Terrain
 *
 * Displays logs (subjective narratives) in chronological order with strata visualization.
 * Shows the geological depth of your work history.
 */

import { useState, useEffect } from 'react'
import { useHalcyonStore } from '../../store/halcyonStore'
import type { Log, Event } from '../../types/entities'
import './LogMode.css'

export function LogMode() {
  const { getEntitiesByType, getEntity, createLog, createEvent } = useHalcyonStore()
  const [logs, setLogs] = useState<Log[]>([])
  const [newLogContent, setNewLogContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'week' | 'month'>('all')

  // Common value tags
  const valueTags = ['insight', 'win', 'learning', 'challenge', 'gratitude', 'mood-low', 'mood-high']

  // Load and filter logs
  useEffect(() => {
    let allLogs = getEntitiesByType<Log>('log')

    // Filter by date
    if (filterDate !== 'all') {
      const now = new Date()
      let startDate = new Date()

      switch (filterDate) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
      }

      allLogs = allLogs.filter(log => {
        const writtenAt = new Date(log.writtenAt)
        return writtenAt >= startDate
      })
    }

    // Sort by most recent first
    allLogs.sort((a, b) =>
      new Date(b.writtenAt).getTime() - new Date(a.writtenAt).getTime()
    )

    setLogs(allLogs)
  }, [getEntitiesByType, filterDate])

  const handleCreateLog = () => {
    if (!newLogContent.trim()) return

    createLog(newLogContent.trim(), undefined, selectedTags.length > 0 ? selectedTags : undefined)

    // Reset form
    setNewLogContent('')
    setSelectedTags([])

    // Refresh logs
    const allLogs = getEntitiesByType<Log>('log')
    allLogs.sort((a, b) =>
      new Date(b.writtenAt).getTime() - new Date(a.writtenAt).getTime()
    )
    setLogs(allLogs)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getLinkedEvent = (eventId: string | undefined): Event | undefined => {
    if (!eventId) return undefined
    return getEntity(eventId) as Event
  }

  return (
    <div className="log-mode">
      <div className="log-header">
        <h1>LOG</h1>
        <p className="log-subtitle">Sediment layers of your work history</p>

        <div className="log-filters">
          <button
            className={filterDate === 'all' ? 'active' : ''}
            onClick={() => setFilterDate('all')}
          >
            All Time
          </button>
          <button
            className={filterDate === 'today' ? 'active' : ''}
            onClick={() => setFilterDate('today')}
          >
            Today
          </button>
          <button
            className={filterDate === 'week' ? 'active' : ''}
            onClick={() => setFilterDate('week')}
          >
            This Week
          </button>
          <button
            className={filterDate === 'month' ? 'active' : ''}
            onClick={() => setFilterDate('month')}
          >
            This Month
          </button>
        </div>
      </div>

      <div className="log-composer">
        <textarea
          value={newLogContent}
          onChange={(e) => setNewLogContent(e.target.value)}
          placeholder="What's on your mind? Reflect on your work, capture an insight, or record how you're feeling..."
          rows={4}
        />

        <div className="log-composer-tags">
          {valueTags.map(tag => (
            <button
              key={tag}
              className={selectedTags.includes(tag) ? 'tag-selected' : 'tag'}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <button
          className="log-composer-submit"
          onClick={handleCreateLog}
          disabled={!newLogContent.trim()}
        >
          Add Log Entry
        </button>
      </div>

      <div className="log-timeline">
        {logs.length === 0 ? (
          <div className="log-empty">
            <p>No logs yet. Start reflecting on your work!</p>
          </div>
        ) : (
          logs.map(log => {
            const linkedEvent = getLinkedEvent(log.linkedEventId)
            return (
              <div key={log.id} className="log-entry">
                <div className="log-entry-header">
                  <span className="log-entry-time">{formatDate(log.writtenAt)}</span>
                  {log.valueTags && log.valueTags.length > 0 && (
                    <div className="log-entry-tags">
                      {log.valueTags.map(tag => (
                        <span key={tag} className="log-entry-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="log-entry-content">
                  {log.content}
                </div>

                {linkedEvent && (
                  <div className="log-entry-event">
                    Related event: {linkedEvent.data.summary}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
