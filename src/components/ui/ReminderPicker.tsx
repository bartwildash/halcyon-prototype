/**
 * ReminderPicker - UI for scheduling reminders on cards
 */

import { useState } from 'react'
import { messageQueue, TIME, type QueuedMessage } from '../../services/messageQueue'
import './ReminderPicker.css'

interface ReminderPickerProps {
  cardId: string
  cardName: string
  onClose: () => void
  existingReminders?: QueuedMessage[]
}

type QuickOption = {
  label: string
  getTime: () => Date
}

const QUICK_OPTIONS: QuickOption[] = [
  {
    label: 'In 5 minutes',
    getTime: () => new Date(Date.now() + 5 * TIME.MINUTE),
  },
  {
    label: 'In 15 minutes',
    getTime: () => new Date(Date.now() + 15 * TIME.MINUTE),
  },
  {
    label: 'In 1 hour',
    getTime: () => new Date(Date.now() + TIME.HOUR),
  },
  {
    label: 'In 3 hours',
    getTime: () => new Date(Date.now() + 3 * TIME.HOUR),
  },
  {
    label: 'Tomorrow 9am',
    getTime: () => {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      d.setHours(9, 0, 0, 0)
      return d
    },
  },
  {
    label: 'Next Monday 9am',
    getTime: () => {
      const d = new Date()
      const daysUntilMonday = (8 - d.getDay()) % 7 || 7
      d.setDate(d.getDate() + daysUntilMonday)
      d.setHours(9, 0, 0, 0)
      return d
    },
  },
]

export function ReminderPicker({ cardId, cardName, onClose, existingReminders = [] }: ReminderPickerProps) {
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const handleQuickReminder = (option: QuickOption) => {
    const scheduledAt = option.getTime()
    messageQueue.scheduleReminder(
      `Reminder: ${cardName}`,
      `Time to check on "${cardName}"`,
      scheduledAt,
      { cardId, priority: 'normal' }
    )
    onClose()
  }

  const handleCustomReminder = () => {
    if (!customDate || !customTime) return

    const scheduledAt = new Date(`${customDate}T${customTime}`)
    if (scheduledAt <= new Date()) {
      alert('Please select a future date and time')
      return
    }

    messageQueue.scheduleReminder(
      `Reminder: ${cardName}`,
      customMessage || `Time to check on "${cardName}"`,
      scheduledAt,
      { cardId, priority: 'normal' }
    )
    onClose()
  }

  const handleCancelReminder = (messageId: string) => {
    messageQueue.cancel(messageId)
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const pendingReminders = existingReminders.filter(r => r.status === 'pending')

  return (
    <div className="reminder-picker-overlay" onClick={onClose}>
      <div className="reminder-picker" onClick={e => e.stopPropagation()}>
        <div className="reminder-picker-header">
          <h3>Set Reminder</h3>
          <button className="reminder-picker-close" onClick={onClose}>×</button>
        </div>

        <div className="reminder-picker-card-name">
          For: <strong>{cardName}</strong>
        </div>

        {/* Existing reminders */}
        {pendingReminders.length > 0 && (
          <div className="reminder-picker-existing">
            <h4>Scheduled Reminders</h4>
            {pendingReminders.map(reminder => (
              <div key={reminder.id} className="reminder-item">
                <span className="reminder-time">{formatDate(reminder.scheduledAt)}</span>
                <button
                  className="reminder-cancel"
                  onClick={() => handleCancelReminder(reminder.id)}
                  title="Cancel reminder"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Quick options */}
        <div className="reminder-picker-quick">
          <h4>Quick Reminders</h4>
          <div className="reminder-quick-grid">
            {QUICK_OPTIONS.map(option => (
              <button
                key={option.label}
                className="reminder-quick-option"
                onClick={() => handleQuickReminder(option)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom time */}
        <div className="reminder-picker-custom">
          <button
            className="reminder-custom-toggle"
            onClick={() => setShowCustom(!showCustom)}
          >
            {showCustom ? '− Hide custom time' : '+ Set custom time'}
          </button>

          {showCustom && (
            <div className="reminder-custom-form">
              <div className="reminder-custom-row">
                <input
                  type="date"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <input
                  type="time"
                  value={customTime}
                  onChange={e => setCustomTime(e.target.value)}
                />
              </div>
              <input
                type="text"
                placeholder="Custom message (optional)"
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                className="reminder-custom-message"
              />
              <button
                className="reminder-custom-submit"
                onClick={handleCustomReminder}
                disabled={!customDate || !customTime}
              >
                Set Reminder
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
