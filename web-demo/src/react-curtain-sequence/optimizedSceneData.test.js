import { describe, expect, it } from 'vitest'
import {
  criticalOptimizedSrcs,
  expressionAtlas,
  optimizedCurtainSceneGroups,
  optimizedLayerByName,
} from './optimizedSceneData'

describe('optimizedSceneData', () => {
  it('exposes a five-image critical set', () => {
    expect(criticalOptimizedSrcs).toHaveLength(5)
    expect(criticalOptimizedSrcs.every((src) => src.includes('/extracted/optimized/'))).toBe(true)
  })

  it('maps generated assets into runtime scene groups', () => {
    expect(optimizedCurtainSceneGroups.background.map((layer) => layer.name)).toEqual(['scene-base'])
    expect(optimizedCurtainSceneGroups.character.map((layer) => layer.name)).toEqual([
      'character-hair-back',
      'character-body',
      'character-hair-front',
    ])
    expect(optimizedLayerByName.get('balloons').loop).toBe('balloons')
    expect(optimizedLayerByName.get('glow').loop).toBe('glow')
  })

  it('exposes expression atlas frames with the original active frame', () => {
    expect(expressionAtlas.frameNames).toEqual(['expr-a', 'expr-b', 'expr-c', 'expr-d'])
    expect(expressionAtlas.activeIndex).toBe(2)
  })
})
