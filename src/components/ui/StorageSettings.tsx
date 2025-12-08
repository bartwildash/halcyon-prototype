/**
 * StorageSettings Component
 *
 * Allows users to choose storage backend and view storage info.
 * Monochrome-first design with heavy borders.
 */

import { useState, useEffect } from 'react'
import { useHalcyonStore } from '../../store/halcyonStore'
import type { StorageAdapterType, StorageInfo } from '../../storage/adapters'
import './StorageSettings.css'

export function StorageSettings() {
  const { storageConfig, setStorageAdapter, getStorageInfo } = useHalcyonStore()
  const [isOpen, setIsOpen] = useState(false)
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [isSwitching, setIsSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load storage info on mount
  useEffect(() => {
    loadStorageInfo()
  }, [storageConfig.adapter])

  const loadStorageInfo = async () => {
    try {
      const info = await getStorageInfo()
      setStorageInfo(info)
    } catch (err) {
      console.error('Failed to load storage info:', err)
    }
  }

  const handleSwitchAdapter = async (adapter: StorageAdapterType) => {
    if (adapter === storageConfig.adapter) return

    setIsSwitching(true)
    setError(null)

    try {
      await setStorageAdapter({
        ...storageConfig,
        adapter,
      })
      await loadStorageInfo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch storage')
      console.error('Storage switch error:', err)
    } finally {
      setIsSwitching(false)
    }
  }

  const formatBytes = (bytes?: number) => {
    if (bytes === undefined) return 'Unknown'
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getAdapterDescription = (adapter: StorageAdapterType) => {
    switch (adapter) {
      case 'localStorage':
        return '~5MB limit, simple, always available'
      case 'indexedDB':
        return '50MB-1GB+, structured, local-first'
      case 'cloudflare':
        return 'Unlimited, cloud sync, multi-device'
      default:
        return ''
    }
  }

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
            <h3>Storage</h3>
            <button
              className="storage-settings-close"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          {error && (
            <div className="storage-error">
              ⚠ {error}
            </div>
          )}

          <div className="storage-adapters">
            {(['localStorage', 'indexedDB', 'cloudflare'] as StorageAdapterType[]).map((adapter) => (
              <button
                key={adapter}
                className={`storage-adapter ${
                  storageConfig.adapter === adapter ? 'active' : ''
                } ${isSwitching ? 'disabled' : ''}`}
                onClick={() => handleSwitchAdapter(adapter)}
                disabled={isSwitching}
              >
                <div className="adapter-name">
                  {adapter === 'localStorage' && '📦'}
                  {adapter === 'indexedDB' && '🗄️'}
                  {adapter === 'cloudflare' && '☁️'}
                  {' '}
                  {adapter}
                </div>
                <div className="adapter-description">
                  {getAdapterDescription(adapter)}
                </div>
                {storageConfig.adapter === adapter && (
                  <div className="adapter-active-indicator">✓</div>
                )}
              </button>
            ))}
          </div>

          {storageInfo && (
            <div className="storage-info">
              <h4>Current Storage</h4>
              <div className="storage-info-grid">
                <div className="storage-info-item">
                  <span className="label">Type:</span>
                  <span className="value">{storageInfo.type}</span>
                </div>
                <div className="storage-info-item">
                  <span className="label">Status:</span>
                  <span className="value">
                    {storageInfo.available ? '✓ Available' : '✗ Unavailable'}
                  </span>
                </div>
                {storageInfo.itemCount !== undefined && (
                  <div className="storage-info-item">
                    <span className="label">Items:</span>
                    <span className="value">{storageInfo.itemCount}</span>
                  </div>
                )}
                {storageInfo.used !== undefined && (
                  <div className="storage-info-item">
                    <span className="label">Used:</span>
                    <span className="value">{formatBytes(storageInfo.used)}</span>
                  </div>
                )}
                {storageInfo.quota !== undefined && (
                  <div className="storage-info-item">
                    <span className="label">Quota:</span>
                    <span className="value">{formatBytes(storageInfo.quota)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="storage-footer">
            <p>All data stays on your device unless you enable cloud sync.</p>
          </div>
        </div>
      )}
    </div>
  )
}
