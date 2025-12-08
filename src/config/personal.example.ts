/**
 * Halcyon Personal Configuration (Example)
 *
 * Copy this file to personal.ts and customize for your needs.
 * personal.ts is git-ignored, so your setup stays private.
 *
 * To use:
 * 1. cp personal.example.ts personal.ts
 * 2. Edit personal.ts with your preferences
 * 3. Restart the dev server
 */

import type { HalcyonMode, EnergyLevel, CrumpitBucket } from '../types/entities'
import type { StorageConfig } from '../storage/adapters'

export interface PersonalConfig {
  // Spatial zones for THINK mode
  zones: Array<{
    id: string
    title: string
    landmark: string // emoji or icon
    bounds: { x: number; y: number; width: number; height: number }
    pattern: 'dots' | 'hatching' | 'outline' | 'none'
    description?: string
  }>

  // Custom energy levels (extends defaults)
  energyLevels: Array<{
    id: EnergyLevel
    label: string
    icon: string
    description?: string
  }>

  // Custom theme (optional - overrides default)
  customTheme?: {
    name: string
    colors: {
      background: string
      foreground: string
      primary: string
      accent: string
      card: string
      border: string
    }
  }

  // User preferences
  preferences: {
    defaultMode: HalcyonMode
    defaultTheme: 'mono' | 'calm'
    defaultStorage: StorageConfig['adapter']
    autoSaveInterval: number // milliseconds
    enableKeyboardShortcuts: boolean
    enableAnimations: boolean
    enableTerrainShaders: boolean
  }

  // Keyboard shortcuts (override defaults)
  keyboardShortcuts: {
    createTask: string
    createNote: string
    createPerson: string
    createLog: string
    modeThink: string
    modeCrumpit: string
    modeLog: string
    toggleTheme: string
    showHelp: string
    search: string
  }

  // Crumpit customization
  crumpitConfig: {
    nowLimit: number // max tasks in NOW bucket
    nextLimit: number // max tasks in NEXT bucket
    showEnergyBadges: boolean
    autoSortByEnergy: boolean
  }

  // Entity appearance defaults
  entityDefaults: {
    taskDefaultEnergy: EnergyLevel
    noteDefaultStyle: 'default' | 'handdrawn' | 'thick' | 'dashed'
    stickerDefaultSize: 'small' | 'medium' | 'large'
  }
}

export const personalConfig: PersonalConfig = {
  // Example spatial zones
  zones: [
    {
      id: 'deep-work',
      title: 'Deep Work',
      landmark: '🏔️',
      bounds: { x: 100, y: 100, width: 1200, height: 800 },
      pattern: 'dots',
      description: 'High-focus technical work',
    },
    {
      id: 'creative',
      title: 'Creative',
      landmark: '🎨',
      bounds: { x: 1400, y: 100, width: 1200, height: 800 },
      pattern: 'outline',
      description: 'Design, writing, exploration',
    },
    {
      id: 'personal',
      title: 'Personal',
      landmark: '🏡',
      bounds: { x: 100, y: 1000, width: 1200, height: 800 },
      pattern: 'none',
      description: 'Life admin, hobbies, relationships',
    },
    {
      id: 'backlog',
      title: 'Backlog',
      landmark: '📦',
      bounds: { x: 2700, y: 100, width: 1200, height: 1600 },
      pattern: 'hatching',
      description: 'Someday/maybe ideas',
    },
  ],

  // Energy level definitions
  energyLevels: [
    {
      id: 'high_focus',
      label: 'Deep Focus',
      icon: '⚡',
      description: 'Requires sustained concentration',
    },
    {
      id: 'medium',
      label: 'Medium',
      icon: '🌊',
      description: 'Moderate cognitive load',
    },
    {
      id: 'low_energy',
      label: 'Low Energy',
      icon: '☁️',
      description: 'Light work for tired moments',
    },
    {
      id: 'social',
      label: 'Social',
      icon: '👥',
      description: 'Meetings, conversations, collaboration',
    },
  ],

  // Optional custom theme (commented out by default)
  // customTheme: {
  //   name: 'Warm Paper',
  //   colors: {
  //     background: '#f2f0e3',
  //     foreground: '#2e2e2e',
  //     primary: '#f76f53',
  //     accent: '#e6e4d7',
  //     card: '#f7f6ee',
  //     border: '#eae9e2',
  //   },
  // },

  // User preferences
  preferences: {
    defaultMode: 'think',
    defaultTheme: 'mono',
    defaultStorage: 'localStorage',
    autoSaveInterval: 1000,
    enableKeyboardShortcuts: true,
    enableAnimations: true,
    enableTerrainShaders: true,
  },

  // Keyboard shortcuts
  keyboardShortcuts: {
    createTask: 't',
    createNote: 'n',
    createPerson: 'p',
    createLog: 'l',
    modeThink: '1',
    modeCrumpit: '2',
    modeLog: '3',
    toggleTheme: 'c',
    showHelp: '?',
    search: '/',
  },

  // Crumpit configuration
  crumpitConfig: {
    nowLimit: 3,
    nextLimit: 5,
    showEnergyBadges: true,
    autoSortByEnergy: false,
  },

  // Entity defaults
  entityDefaults: {
    taskDefaultEnergy: 'medium',
    noteDefaultStyle: 'default',
    stickerDefaultSize: 'medium',
  },
}

export type { PersonalConfig }
