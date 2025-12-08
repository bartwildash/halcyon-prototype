/**
 * Config Loader
 *
 * Loads personal.ts if it exists, otherwise falls back to personal.example.ts
 * This allows users to customize Halcyon without editing core files.
 */

import { personalConfig as exampleConfig } from './personal.example'
import type { PersonalConfig } from './personal.example'

let loadedConfig: PersonalConfig = exampleConfig
let isUsingCustomConfig = false

// Try to load personal.ts (git-ignored)
// Note: To use custom config, copy personal.example.ts to personal.ts
// and uncomment the import below, then restart dev server
try {
  // Uncomment this line after creating personal.ts:
  // import { personalConfig as customConfig } from './personal'
  // loadedConfig = customConfig
  // isUsingCustomConfig = true

  console.log('ℹ️ Using default config. To customize:')
  console.log('   1. cp src/config/personal.example.ts src/config/personal.ts')
  console.log('   2. Edit personal.ts')
  console.log('   3. Uncomment import in src/config/index.ts')
  console.log('   4. Restart dev server')
} catch (error) {
  console.log('⚠️ Error loading config:', error)
}

/**
 * Get the current personal configuration
 */
export function getPersonalConfig(): PersonalConfig {
  return loadedConfig
}

/**
 * Check if user has a custom config
 */
export function hasCustomConfig(): boolean {
  return isUsingCustomConfig
}

/**
 * Get a specific config value with type safety
 */
export function getConfigValue<K extends keyof PersonalConfig>(
  key: K
): PersonalConfig[K] {
  return loadedConfig[key]
}

// Export the config directly for convenience
export const config = loadedConfig

// Export types
export type { PersonalConfig }
