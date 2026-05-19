import { describe, expect, it } from 'vitest'
import { computeCoverTransform, sceneEntryCompleteMs, sequenceByKey } from './pixiScene'
import { BASE_H, BASE_W } from './sceneGeometry'

describe('pixiScene helpers', () => {
  it('exposes sequence config keyed by entry name', () => {
    expect(sequenceByKey.character).toBeDefined()
    expect(sequenceByKey.mascot).toBeDefined()
    expect(sequenceByKey.ghost).toBeDefined()
  })

  it('reports the scene entry duration in ms', () => {
    expect(sceneEntryCompleteMs).toBeGreaterThan(1000)
    expect(Number.isFinite(sceneEntryCompleteMs)).toBe(true)
  })

  describe('computeCoverTransform', () => {
    it('returns finite positive scale for a typical desktop viewport', () => {
      const { scale, scaledW, scaledH, offsetX, offsetY } = computeCoverTransform(1920, 1080)
      expect(scale).toBeGreaterThan(0)
      expect(scaledW).toBeGreaterThan(0)
      expect(scaledH).toBeGreaterThan(0)
      expect(Number.isFinite(offsetX)).toBe(true)
      expect(Number.isFinite(offsetY)).toBe(true)
    })

    it('scales by width when viewport is at the canvas aspect ratio', () => {
      const { scale } = computeCoverTransform(1920, 1080)
      // BG width (1920) should match viewport width when scale * BASE_W * (1920/BASE_W) ≈ 1920
      expect(scale * BASE_W).toBeCloseTo(1920 * (BASE_W / 1920), 1)
    })

    it('scales by height for portrait viewports', () => {
      const portrait = computeCoverTransform(600, 1000)
      const landscape = computeCoverTransform(1000, 600)
      expect(portrait.scale).not.toEqual(landscape.scale)
    })

    it('keeps BG center anchored near the viewport center', () => {
      const w = 1920
      const h = 1080
      const { scale, offsetX, offsetY, scaledW, scaledH } = computeCoverTransform(w, h)
      const bgCenterSceneX = scaledW * 0.5046
      const bgCenterSceneY = scaledH * 0.4747
      expect(offsetX + bgCenterSceneX).toBeCloseTo(w / 2, 0)
      expect(offsetY + bgCenterSceneY).toBeCloseTo(h / 2, 0)
      void BASE_H
    })
  })
})
