/**
 * Halcyon Personal Configuration
 *
 * Copy this file to personal.ts and customize for your needs.
 * personal.ts is git-ignored, so your setup stays private.
 */

export interface Zone {
  id: string
  title: string
  landmark: string
  bounds: { x: number; y: number; width: number; height: number }
  pattern?: 'dots' | 'grid' | 'none'
}

export interface EnergyLevel {
  id: string
  label: string
  icon: string
  color: string
}

export interface CustomTheme {
  background: string
  foreground: string
  primary: string
  accent: string
  card: string
  border: string
}

export interface PersonalConfig {
  // Your zones (spatial regions)
  zones: Zone[]

  // Your energy levels for CRUMPIT
  energyLevels: EnergyLevel[]

  // Custom theme (optional)
  customTheme?: CustomTheme

  // Preferences
  preferences: {
    defaultMode: 'think' | 'crumpit' | 'plan'
    defaultTheme: 'mono' | 'calm'
    autoSaveInterval: number
    enableKeyboardShortcuts: boolean
    enableAnimations: boolean
  }

  // Keyboard shortcuts (override defaults)
  keyboardShortcuts: {
    createTask: string
    createNote: string
    modeThink: string
    modeCrumpit: string
    modePlan: string
    toggleTheme: string
    showHelp: string
    search: string
    commandPalette: string
  }
}

export const personalConfig: PersonalConfig = {
  // Your zones (spatial regions)
  zones: [
    {
      id: 'deep-work',
      title: 'Deep Work',
      landmark: '🏔️',
      bounds: { x: 100, y: 100, width: 1200, height: 800 },
      pattern: 'dots',
    },
    {
      id: 'creative',
      title: 'Creative',
      landmark: '🎨',
      bounds: { x: 1400, y: 100, width: 1200, height: 800 },
      pattern: 'grid',
    },
    {
      id: 'personal',
      title: 'Personal',
      landmark: '🏡',
      bounds: { x: 100, y: 1000, width: 1200, height: 800 },
      pattern: 'none',
    },
  ],

  // Your energy levels
  energyLevels: [
    { id: 'high_focus', label: 'Deep Focus', icon: '⚡', color: '#000000' },
    { id: 'medium', label: 'Normal', icon: '☀️', color: '#333333' },
    { id: 'low_energy', label: 'Low Energy', icon: '☁️', color: '#666666' },
    { id: 'social', label: 'Social', icon: '👥', color: '#999999' },
  ],

  // Preferences
  preferences: {
    defaultMode: 'think',
    defaultTheme: 'mono',
    autoSaveInterval: 1000,
    enableKeyboardShortcuts: true,
    enableAnimations: true,
  },

  // Keyboard shortcuts
  keyboardShortcuts: {
    createTask: 't',
    createNote: 'n',
    modeThink: '1',
    modeCrumpit: '2',
    modePlan: '3',
    toggleTheme: 'c',
    showHelp: '?',
    search: '/',
    commandPalette: 'k', // Used with Cmd/Ctrl
  },
}
