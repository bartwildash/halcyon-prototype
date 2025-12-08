/**
 * ControlPanel - Universal navigation controls for both canvas types
 *
 * Features:
 * - Zoom in/out controls
 * - Recenter to nearest landmark
 * - Navigation history (back/forward)
 */

import { useState, useCallback } from 'react'

interface ControlPanelProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onRecenter: () => void
  onBack: () => void
  onForward: () => void
  canGoBack: boolean
  canGoForward: boolean
}

export function ControlPanel({
  zoom,
  onZoomIn,
  onZoomOut,
  onRecenter,
  onBack,
  onForward,
  canGoBack,
  canGoForward,
}: ControlPanelProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left: 20,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 8,
        border: '2px solid #111',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Recenter to nearest landmark */}
      <button
        onClick={onRecenter}
        title="Recenter to nearest landmark"
        style={{
          width: 44,
          height: 44,
          border: 'none',
          background: 'transparent',
          color: '#111',
          cursor: 'pointer',
          borderRadius: 8,
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        ⊞
      </button>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(0, 0, 0, 0.1)', margin: '4px 0' }} />

      {/* Zoom in */}
      <button
        onClick={onZoomIn}
        title="Zoom in"
        style={{
          width: 44,
          height: 44,
          border: 'none',
          background: 'transparent',
          color: '#111',
          cursor: 'pointer',
          borderRadius: 8,
          fontSize: 24,
          fontWeight: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        +
      </button>

      {/* Zoom out */}
      <button
        onClick={onZoomOut}
        title="Zoom out"
        style={{
          width: 44,
          height: 44,
          border: 'none',
          background: 'transparent',
          color: '#111',
          cursor: 'pointer',
          borderRadius: 8,
          fontSize: 24,
          fontWeight: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        −
      </button>

      {/* Zoom percentage indicator */}
      <div
        style={{
          width: 44,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 500,
          color: 'rgba(0, 0, 0, 0.6)',
          fontFamily: 'system-ui',
        }}
      >
        {Math.round(zoom * 100)}%
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(0, 0, 0, 0.1)', margin: '4px 0' }} />

      {/* Back button */}
      <button
        onClick={onBack}
        disabled={!canGoBack}
        title="Go back"
        style={{
          width: 44,
          height: 44,
          border: 'none',
          background: 'transparent',
          color: canGoBack ? '#111' : 'rgba(0, 0, 0, 0.3)',
          cursor: canGoBack ? 'pointer' : 'not-allowed',
          borderRadius: 8,
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          if (canGoBack) {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        ↶
      </button>

      {/* Forward button */}
      <button
        onClick={onForward}
        disabled={!canGoForward}
        title="Go forward"
        style={{
          width: 44,
          height: 44,
          border: 'none',
          background: 'transparent',
          color: canGoForward ? '#111' : 'rgba(0, 0, 0, 0.3)',
          cursor: canGoForward ? 'pointer' : 'not-allowed',
          borderRadius: 8,
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          if (canGoForward) {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        ↷
      </button>
    </div>
  )
}
