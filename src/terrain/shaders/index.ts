/**
 * Terrain Shader Registry
 */

import type { TerrainId, TerrainShader } from '../types'
import { meadowShader } from './meadow'
import { mountainShader } from './mountain'
import { lakeShader } from './lake'
import { canyonShader } from './canyon'

export const terrainShaders: Record<TerrainId, TerrainShader> = {
  meadow: meadowShader,
  mountain: mountainShader,
  lake: lakeShader,
  canyon: canyonShader,
}

export { meadowShader, mountainShader, lakeShader, canyonShader }
