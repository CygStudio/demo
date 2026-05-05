import { describe, expect, it } from 'vitest'
import {
  getExpressionAtlasBackgroundPosition,
  getExpressionAtlasBackgroundSize,
} from './expressionAtlasSprite'

describe('expressionAtlasSprite', () => {
  it('maps atlas frame indexes to sprite positions within the image bounds', () => {
    expect(getExpressionAtlasBackgroundPosition(0, 4)).toBe('0% 0%')
    expect(getExpressionAtlasBackgroundPosition(1, 4)).toBe(`${(1 / 3) * 100}% 0%`)
    expect(getExpressionAtlasBackgroundPosition(2, 4)).toBe(`${(2 / 3) * 100}% 0%`)
    expect(getExpressionAtlasBackgroundPosition(3, 4)).toBe('100% 0%')
    expect(getExpressionAtlasBackgroundSize(4)).toBe('400% 100%')
  })
})
