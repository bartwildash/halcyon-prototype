/**
 * ContextFilter - Filter entities by context/mode
 *
 * Replaces mode switching with spatial filtering.
 * Shows different entity types while staying in spatial canvas.
 */

import { useState } from 'react'
import './ContextFilter.css'

type FilterContext = 'all' | 'tasks' | 'notes' | 'people'

interface ContextFilterProps {
  onChange?: (context: FilterContext) => void
}

export function ContextFilter({ onChange }: ContextFilterProps) {
  const [active, setActive] = useState<FilterContext>('all')

  const handleChange = (context: FilterContext) => {
    setActive(context)
    onChange?.(context)
  }

  return (
    <div className="context-filter">
      <button
        className={`filter-btn ${active === 'all' ? 'active' : ''}`}
        onClick={() => handleChange('all')}
        title="Show everything"
      >
        <span className="filter-icon">∞</span>
        <span className="filter-label">All</span>
      </button>

      <button
        className={`filter-btn ${active === 'tasks' ? 'active' : ''}`}
        onClick={() => handleChange('tasks')}
        title="Show tasks only"
      >
        <span className="filter-icon">☐</span>
        <span className="filter-label">Plan</span>
      </button>

      <button
        className={`filter-btn ${active === 'notes' ? 'active' : ''}`}
        onClick={() => handleChange('notes')}
        title="Show notes only"
      >
        <span className="filter-icon">✎</span>
        <span className="filter-label">Think</span>
      </button>

      <button
        className={`filter-btn ${active === 'people' ? 'active' : ''}`}
        onClick={() => handleChange('people')}
        title="Show people only"
      >
        <span className="filter-icon">👥</span>
        <span className="filter-label">People</span>
      </button>
    </div>
  )
}
