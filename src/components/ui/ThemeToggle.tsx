// ThemeToggle - Switch between monochrome and calm themes

import { useState, useEffect } from 'react'
import './ThemeToggle.css'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'mono' | 'calm'>('mono')

  useEffect(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('halcyon-theme') as 'mono' | 'calm' | null
    if (saved) {
      setTheme(saved)
      applyTheme(saved)
    }
  }, [])

  const applyTheme = (newTheme: 'mono' | 'calm') => {
    if (newTheme === 'calm') {
      document.documentElement.setAttribute('data-theme', 'calm')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    localStorage.setItem('halcyon-theme', newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'mono' ? 'calm' : 'mono'
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'mono' ? 'calm' : 'monochrome'} theme`}
      title={`Current: ${theme === 'mono' ? 'Monochrome (DC-1 optimized)' : 'Calm colors'}`}
    >
      <span className="theme-icon">{theme === 'mono' ? '◐' : '◑'}</span>
      <span className="theme-label">{theme === 'mono' ? 'Mono' : 'Calm'}</span>
    </button>
  )
}
