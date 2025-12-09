/**
 * Configuration loader - loads personal config if available, falls back to example
 */

import { personalConfig as exampleConfig, type PersonalConfig } from './personal.example'

// Try to load personal.ts if it exists
let config: PersonalConfig

try {
  // Dynamic import would be ideal but causes issues with Vite
  // Instead, we use a simple fallback pattern
  const personalModule = await import('./personal')
  config = personalModule.personalConfig
  console.log('Loaded personal config')
} catch {
  config = exampleConfig
  console.log('Using default config. Copy personal.example.ts to personal.ts to customize.')
}

export const personalConfig = config
export type { PersonalConfig }
export * from './personal.example'
