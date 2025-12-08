// StickerCard Component - Playful visual markers
// Rough-cut paper style with shadow

import type { Sticker } from '../../types/entities'
import './StickerCard.css'

interface StickerCardProps {
  sticker: Sticker
  isSelected?: boolean
}

export function StickerCard({ sticker, isSelected }: StickerCardProps) {
  const sizeClass = `sticker-${sticker.size}`

  return (
    <div className={`sticker-card ${sizeClass} ${isSelected ? 'selected' : ''}`}>
      <span className="sticker-icon">{sticker.icon}</span>
      {sticker.label && <span className="sticker-label">{sticker.label}</span>}
    </div>
  )
}
