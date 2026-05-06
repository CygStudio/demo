import { describe, expect, it } from 'vitest'
import { getVisibleSceneBounds } from './visibleSceneBounds'

describe('getVisibleSceneBounds', () => {
  it('maps the currently visible stage window back into scene coordinates', () => {
    const stageRect = {
      left: 0,
      top: 0,
      right: 800,
      bottom: 500,
      width: 800,
      height: 500,
    }
    const sceneRect = {
      left: -400,
      top: -100,
      right: 1200,
      bottom: 600,
      width: 1600,
      height: 700,
    }

    expect(getVisibleSceneBounds(stageRect, sceneRect)).toEqual({
      left: 571,
      top: 186,
      right: 1712,
      bottom: 1116,
    })
  })
})
