/**
 * Offline Message Queue
 *
 * Schedules reminders and notifications for delivery.
 * - Queues messages locally when offline
 * - Delivers via browser notifications when online
 * - Falls back to email via Cloudflare Worker API
 * - Persists queue to localStorage/IndexedDB
 */

export interface QueuedMessage {
  id: string
  type: 'reminder' | 'notification' | 'email'
  title: string
  body: string
  scheduledAt: string // ISO timestamp
  createdAt: string
  cardId?: string // Associated card
  status: 'pending' | 'delivered' | 'failed'
  attempts: number
  lastAttempt?: string
  emailTo?: string // For email fallback
  priority: 'low' | 'normal' | 'high'
}

export interface MessageQueueState {
  messages: QueuedMessage[]
  isProcessing: boolean
  lastProcessedAt: string | null
}

const STORAGE_KEY = 'halcyon-message-queue'
const MAX_ATTEMPTS = 3
const PROCESS_INTERVAL = 30000 // 30 seconds

// Generate unique ID
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Load queue from storage
function loadQueue(): QueuedMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save queue to storage
function saveQueue(messages: QueuedMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch (e) {
    console.error('Failed to save message queue:', e)
  }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Show browser notification
function showBrowserNotification(message: QueuedMessage): boolean {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false
  }

  try {
    const notification = new Notification(message.title, {
      body: message.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: message.id,
      requireInteraction: message.priority === 'high',
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
      // Could navigate to card if cardId is set
    }

    return true
  } catch (e) {
    console.error('Failed to show notification:', e)
    return false
  }
}

// Send email via Cloudflare Worker (fallback)
async function sendEmailNotification(message: QueuedMessage): Promise<boolean> {
  if (!message.emailTo) {
    return false
  }

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: message.emailTo,
        subject: message.title,
        body: message.body,
        messageId: message.id,
      }),
    })

    return response.ok
  } catch (e) {
    console.error('Failed to send email:', e)
    return false
  }
}

// Message Queue class
class MessageQueue {
  private messages: QueuedMessage[] = []
  private processInterval: number | null = null
  private listeners: Set<(messages: QueuedMessage[]) => void> = new Set()

  constructor() {
    this.messages = loadQueue()
    this.startProcessing()

    // Listen for online/offline events
    window.addEventListener('online', () => this.processQueue())
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.processQueue()
      }
    })
  }

  // Subscribe to queue changes
  subscribe(listener: (messages: QueuedMessage[]) => void): () => void {
    this.listeners.add(listener)
    listener(this.messages)
    return () => this.listeners.delete(listener)
  }

  // Notify listeners
  private notify(): void {
    this.listeners.forEach(listener => listener(this.messages))
  }

  // Add message to queue
  schedule(options: {
    type: QueuedMessage['type']
    title: string
    body: string
    scheduledAt: Date
    cardId?: string
    emailTo?: string
    priority?: QueuedMessage['priority']
  }): QueuedMessage {
    const message: QueuedMessage = {
      id: generateId(),
      type: options.type,
      title: options.title,
      body: options.body,
      scheduledAt: options.scheduledAt.toISOString(),
      createdAt: new Date().toISOString(),
      cardId: options.cardId,
      emailTo: options.emailTo,
      status: 'pending',
      attempts: 0,
      priority: options.priority || 'normal',
    }

    this.messages.push(message)
    saveQueue(this.messages)
    this.notify()

    return message
  }

  // Schedule a reminder for a specific time
  scheduleReminder(
    title: string,
    body: string,
    scheduledAt: Date,
    options?: { cardId?: string; emailTo?: string; priority?: QueuedMessage['priority'] }
  ): QueuedMessage {
    return this.schedule({
      type: 'reminder',
      title,
      body,
      scheduledAt,
      ...options,
    })
  }

  // Schedule reminder relative to now (e.g., "in 5 minutes")
  scheduleIn(
    title: string,
    body: string,
    delayMs: number,
    options?: { cardId?: string; emailTo?: string; priority?: QueuedMessage['priority'] }
  ): QueuedMessage {
    const scheduledAt = new Date(Date.now() + delayMs)
    return this.scheduleReminder(title, body, scheduledAt, options)
  }

  // Cancel a scheduled message
  cancel(messageId: string): boolean {
    const index = this.messages.findIndex(m => m.id === messageId)
    if (index === -1) return false

    this.messages.splice(index, 1)
    saveQueue(this.messages)
    this.notify()
    return true
  }

  // Cancel all messages for a card
  cancelForCard(cardId: string): number {
    const before = this.messages.length
    this.messages = this.messages.filter(m => m.cardId !== cardId)
    saveQueue(this.messages)
    this.notify()
    return before - this.messages.length
  }

  // Get all pending messages
  getPending(): QueuedMessage[] {
    return this.messages.filter(m => m.status === 'pending')
  }

  // Get messages for a specific card
  getForCard(cardId: string): QueuedMessage[] {
    return this.messages.filter(m => m.cardId === cardId)
  }

  // Process due messages
  async processQueue(): Promise<void> {
    if (!navigator.onLine) return

    const now = new Date()
    const due = this.messages.filter(
      m => m.status === 'pending' && new Date(m.scheduledAt) <= now
    )

    for (const message of due) {
      await this.deliverMessage(message)
    }

    // Clean up old delivered/failed messages (older than 7 days)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    this.messages = this.messages.filter(
      m => m.status === 'pending' || new Date(m.createdAt).getTime() > weekAgo
    )

    saveQueue(this.messages)
    this.notify()
  }

  // Deliver a single message
  private async deliverMessage(message: QueuedMessage): Promise<void> {
    message.attempts++
    message.lastAttempt = new Date().toISOString()

    let delivered = false

    // Try browser notification first
    if (message.type === 'reminder' || message.type === 'notification') {
      delivered = showBrowserNotification(message)
    }

    // Fall back to email if browser notification failed and email is configured
    if (!delivered && message.emailTo) {
      delivered = await sendEmailNotification(message)
    }

    if (delivered) {
      message.status = 'delivered'
    } else if (message.attempts >= MAX_ATTEMPTS) {
      message.status = 'failed'
    }
    // Otherwise stays pending for retry

    saveQueue(this.messages)
  }

  // Start periodic processing
  private startProcessing(): void {
    if (this.processInterval) return

    // Process immediately
    this.processQueue()

    // Then process periodically
    this.processInterval = window.setInterval(() => {
      this.processQueue()
    }, PROCESS_INTERVAL)
  }

  // Stop processing (for cleanup)
  stopProcessing(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval)
      this.processInterval = null
    }
  }

  // Get queue stats
  getStats(): {
    total: number
    pending: number
    delivered: number
    failed: number
  } {
    return {
      total: this.messages.length,
      pending: this.messages.filter(m => m.status === 'pending').length,
      delivered: this.messages.filter(m => m.status === 'delivered').length,
      failed: this.messages.filter(m => m.status === 'failed').length,
    }
  }

  // Clear all messages
  clear(): void {
    this.messages = []
    saveQueue(this.messages)
    this.notify()
  }
}

// Singleton instance
export const messageQueue = new MessageQueue()

// Convenience time helpers
export const TIME = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
}

// Quick scheduling helpers
export function remindIn(minutes: number, title: string, body?: string, cardId?: string) {
  return messageQueue.scheduleIn(
    title,
    body || title,
    minutes * TIME.MINUTE,
    { cardId }
  )
}

export function remindAt(date: Date, title: string, body?: string, cardId?: string) {
  return messageQueue.scheduleReminder(title, body || title, date, { cardId })
}

export function remindTomorrow(title: string, body?: string, cardId?: string) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0) // 9 AM
  return messageQueue.scheduleReminder(title, body || title, tomorrow, { cardId })
}
