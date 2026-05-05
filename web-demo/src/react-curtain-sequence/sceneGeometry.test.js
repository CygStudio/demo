import { describe, expect, it } from 'vitest'
import { BASE_H, BASE_W, BG_RECT, getLayerStyle, layerBoxes } from './sceneGeometry'

describe('sceneGeometry', () => {
  it('exports the PSD coordinate system and known layer boxes', () => {
    expect(BASE_W).toBe(2283)
    expect(BASE_H).toBe(1302)
    expect(BG_RECT).toEqual({ x: 192, y: 78, w: 1920, h: 1080 })
    expect(layerBoxes.body).toEqual([1160, 347, 1892, 1150])
    expect(layerBoxes['expr-c']).toEqual([1090, 228, 1295, 408])
  })

  it('converts layer boxes to percentage styles', () => {
    expect(getLayerStyle('body')).toEqual({
      left: `${(1160 / 2283) * 100}%`,
      top: `${(347 / 1302) * 100}%`,
      width: `${((1892 - 1160) / 2283) * 100}%`,
      height: `${((1150 - 347) / 1302) * 100}%`,
    })
  })
})
