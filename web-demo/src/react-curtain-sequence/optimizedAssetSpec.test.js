import { describe, expect, it } from 'vitest'
import { mascotTangyuanLayout } from './mascotTangyuanLayout.js'
import {
  criticalOptimizedAssetNames,
  getOptimizedAssetBox,
  optimizedAssetSpec,
  optimizedSceneGroups,
} from './optimizedAssetSpec'

describe('optimizedAssetSpec', () => {
  it('defines the approved optimized request budget', () => {
    expect(optimizedAssetSpec).toHaveLength(16)
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
    expect(optimizedSceneGroups.ghost.map((layer) => layer.name)).toEqual(['ghost-right', 'ghost-right-blurred'])
    expect(optimizedSceneGroups.mascot.map((layer) => layer.name)).toEqual([
      'mascot-cake-1',
      'mascot-cake-2',
      'mascot-cake-3',
      'mascot-cake-4',
    ])
    expect(optimizedSceneGroups.fx.map((layer) => layer.name)).toEqual(['glow', 'filter'])
  })

  it('replaces mascot-cake with four tangyuan assets', () => {
    expect(optimizedAssetSpec.some((asset) => asset.name === 'mascot-cake')).toBe(false)
    expect(
      optimizedAssetSpec.filter((asset) => asset.name.startsWith('mascot-cake')).map((asset) => asset.name),
    ).toEqual(['mascot-cake-1', 'mascot-cake-2', 'mascot-cake-3', 'mascot-cake-4'])
  })

  it('computes union boxes for composite assets and split mascot tangyuan', () => {
    expect(getOptimizedAssetBox('character-body')).toEqual([814, 131, 1892, 1265])
    expect(getOptimizedAssetBox('expression-atlas')).toEqual([1090, 228, 1295, 421])
    mascotTangyuanLayout.forEach(({ name, sceneBox }) => {
      expect(getOptimizedAssetBox(name)).toEqual(sceneBox)
    })
  })
})
