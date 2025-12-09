/**
 * StorageSettings Component
 *
 * Allows users to choose storage backend and view storage info.
 */

import { useState, useEffect } from 'react'
import {
  getStoragePreference,
  setStoragePreference,
  getStorageInfo,
  createStorage,
  migrateStorage,
  getDefaultStorage,
  setDefaultStorage,
  type StorageType,
} from '../../storage'
import './StorageSettings.css'

export function StorageSettings() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentType, setCurrentType] = useState<StorageType>(getStoragePreference())
  const [storageSize, setStorageSize] = useState<number>(0)
  const [isMigrating, setIsMigrating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load storage size on mount
  useEffect(() => {
    loadStorageSize()
  }, [currentType])

  const loadStorageSize = async () => {
    try {
      const storage = getDefaultStorage()
      const size = await storage.size()
      setStorageSize(size)
    } catch (err) {
      console.error('Failed to load storage size:', err)
    }
  }

  const handleSwitchStorage = async (newType: StorageType) => {
    if (newType === currentType) return

    setIsMigrating(true)
    setError(null)

    try {
      const oldStorage = getDefaultStorage()
      const newStorage = createStorage(newType)

      // Migrate data
      const result = await migrateStorage(oldStorage, newStorage)
      if (!result.success) {
        throw new Error(result.error || 'Migration failed')
      }

      // Update preference and default storage
      setStoragePreference(newType)
      setDefaultStorage(newStorage)
      setCurrentType(newType)

      // Reload to apply changes
      if (result.itemCount > 0) {
        window.location.reload()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch storage')
    } finally {
      setIsMigrating(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const storageOptions: StorageType[] = ['localStorage', 'indexedDB', 'cloudflare']

  return (
    <div className="storage-settings">
      <button
        className="storage-settings-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Storage Settings"
      >
        💾
      </button>

      {isOpen && (
        <div className="storage-settings-panel">
          <div className="storage-settings-header">
            <h3>Storage Location</h3>
            <button className="storage-settings-close" onClick={() => setIsOpen(false)}>
              x
            </button>
          </div>

          {error && <div className="storage-error">{error}</div>}

          <div className="storage-adapters">
            {storageOptions.map((type) => {
              const info = getStorageInfo(type)
              return (
                <button
                  key={type}
                  className={`storage-adapter ${currentType === type ? 'active' : ''} ${isMigrating ? 'disabled' : ''}`}
                  onClick={() => handleSwitchStorage(type)}
                  disabled={isMigrating}
                >
                  <div className="adapter-name">
                    {type === 'localStorage' && '📦 '}
                    {type === 'indexedDB' && '🗄️ '}
                    {type === 'cloudflare' && '☁️ '}
                    {info.name}
                  </div>
                  <div className="adapter-description">{info.description}</div>
                  <div className="adapter-size">{info.maxSize}</div>
                  {currentType === type && <div className="adapter-active-indicator">✓</div>}
                </button>
              )
            })}
          </div>

          <div className="storage-info">
            <div className="storage-info-item">
              <span className="label">Current size:</span>
              <span className="value">{formatBytes(storageSize)}</span>
            </div>
          </div>

          {isMigrating && (
            <div className="storage-migrating">Migrating data...</div>
          )}

          <div className="storage-footer">
            <p>Data stays local unless you enable cloud sync.</p>
          </div>
        </div>
      )}
    </div>
  )
}
