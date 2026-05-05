import { describe, expect, it } from 'vitest'
import {
  criticalOptimizedAssetNames,
  getOptimizedAssetBox,
  optimizedAssetSpec,
  optimizedSceneGroups,
} from './optimizedAssetSpec'

describe('optimizedAssetSpec', () => {
  it('defines the approved optimized request budget', () => {
    expect(optimizedAssetSpec).toHaveLength(12)
    expect(criticalOptimizedAssetNames).toEqual([
      'scene-base',
      'character-hair-back',
      'character-body',
      'character-hair-front',
      'expression-atlas',
    ])
  })

  it('keeps scene groups aligned with the approved animation model', () => {
    expect(optimizedSceneGroups.background.map((layer) => layer.name)).toEqual(['scene-base'])
    expect(optimizedSceneGroups.character.map((layer) => layer.name)).toEqual([
      'character-hair-back',
      'character-body',
      'character-hair-front',
    ])
    expect(optimizedSceneGroups.cake.map((layer) => layer.name)).toEqual(['cake-table'])
    expect(optimizedSceneGroups.balloons.map((layer) => layer.name)).toEqual(['balloons'])
    expect(optimizedSceneGroups.gifts.map((layer) => layer.name)).toEqual(['gifts'])
    expect(optimizedSceneGroups.fx.map((layer) => layer.name)).toEqual(['glow', 'filter'])
  })

  it('computes union boxes for composite assets', () => {
    expect(getOptimizedAssetBox('character-body')).toEqual([814, 131, 1892, 1265])
    expect(getOptimizedAssetBox('expression-atlas')).toEqual([1090, 228, 1295, 421])
  })
})
