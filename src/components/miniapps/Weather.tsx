/**
 * Weather - Current weather conditions
 *
 * Simple weather widget (using mock data for prototype)
 */

import { useState, useEffect } from 'react'

interface WeatherProps {
  onClose: () => void
}

interface WeatherData {
  temp: number
  condition: string
  icon: string
  location: string
}

export function Weather({ onClose }: WeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    // Mock weather data (in production, fetch from API)
    setTimeout(() => {
      setWeather({
        temp: 72,
        condition: 'Partly Cloudy',
        icon: '⛅',
        location: 'San Francisco',
      })
    }, 500)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '80px',
        width: '280px',
        background: 'var(--primary-background)',
        border: '2px solid var(--primary-border)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        zIndex: 2000,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--primary-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
          🌡️ Weather
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ×
        </button>
      </div>

      {/* Weather content */}
      <div style={{ padding: '20px', textAlign: 'center' }}>
        {!weather ? (
          <div style={{ color: 'var(--secondary)', fontSize: '13px' }}>
            Loading weather...
          </div>
        ) : (
          <>
            <div style={{ fontSize: '64px', marginBottom: '12px' }}>
              {weather.icon}
            </div>
            <div style={{ fontSize: '36px', fontWeight: 600, marginBottom: '8px' }}>
              {weather.temp}°F
            </div>
            <div
              style={{
                fontSize: '16px',
                color: 'var(--secondary)',
                marginBottom: '4px',
              }}
            >
              {weather.condition}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--tertiary)' }}>
              {weather.location}
            </div>

            {/* Mock forecast */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '20px',
                justifyContent: 'center',
              }}
            >
              {['🌤️', '☀️', '🌧️', '⛅', '🌥️'].map((icon, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '24px',
                    opacity: 0.6,
                  }}
                >
                  {icon}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
