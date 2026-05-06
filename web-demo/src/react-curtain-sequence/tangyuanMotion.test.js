import { describe, expect, test } from 'vitest'
import { createTangyuanVelocities, stepTangyuanMotion } from './tangyuanMotion.js'

describe('createTangyuanVelocities', () => {
  test('guarantees four tangyuan start in different directions', () => {
    const velocities = createTangyuanVelocities(() => 0)

    expect(velocities).toHaveLength(4)
    expect(new Set(velocities.map(({ vx, vy }) => `${Math.sign(vx)},${Math.sign(vy)}`)).size).toBe(4)
    velocities.forEach(({ vx, vy }) => {
      expect(vx).not.toBe(0)
      expect(vy).not.toBe(0)
    })
  })
})

describe('stepTangyuanMotion', () => {
  const bounds = { left: 0, top: 0, right: 100, bottom: 80 }

  test('preserves velocity when moving without hitting a boundary', () => {
    const [nextItem] = stepTangyuanMotion([
      { id: 't1', x: 20, y: 30, width: 10, height: 12, vx: 0.05, vy: -0.04 },
    ], bounds, 100)

    expect(nextItem).toMatchObject({
      id: 't1',
      x: 25,
      y: 26,
      vx: 0.05,
      vy: -0.04,
    })
  })

  test('reverses horizontal velocity when hitting the left or right boundary', () => {
    const [leftBounce, rightBounce] = stepTangyuanMotion([
      { id: 'left', x: 1, y: 10, width: 10, height: 10, vx: -0.2, vy: 0.03 },
      { id: 'right', x: 88, y: 12, width: 10, height: 10, vx: 0.2, vy: -0.01 },
    ], bounds, 20)

    expect(leftBounce).toMatchObject({
      id: 'left',
      x: 0,
      y: 10.6,
      vx: 0.2,
      vy: 0.03,
    })
    expect(rightBounce).toMatchObject({
      id: 'right',
      x: 90,
      y: 11.8,
      vx: -0.2,
      vy: -0.01,
    })
  })

  test('reverses horizontal velocity on exact left and right edge contact', () => {
    const [leftHit, rightHit] = stepTangyuanMotion([
      { id: 'left-hit', x: 2, y: 10, width: 10, height: 10, vx: -0.1, vy: 0.03 },
      { id: 'right-hit', x: 88, y: 12, width: 10, height: 10, vx: 0.1, vy: -0.01 },
    ], bounds, 20)

    expect(leftHit).toMatchObject({
      id: 'left-hit',
      x: 0,
      y: 10.6,
      vx: 0.1,
      vy: 0.03,
    })
    expect(rightHit).toMatchObject({
      id: 'right-hit',
      x: 90,
      y: 11.8,
      vx: -0.1,
      vy: -0.01,
    })
  })

  test('reverses vertical velocity when hitting the top or bottom boundary', () => {
    const [topBounce, bottomBounce] = stepTangyuanMotion([
      { id: 'top', x: 20, y: 1, width: 10, height: 10, vx: 0.01, vy: -0.2 },
      { id: 'bottom', x: 30, y: 68, width: 10, height: 10, vx: -0.02, vy: 0.2 },
    ], bounds, 20)

    expect(topBounce).toMatchObject({
      id: 'top',
      x: 20.2,
      y: 0,
      vx: 0.01,
      vy: 0.2,
    })
    expect(bottomBounce).toMatchObject({
      id: 'bottom',
      x: 29.6,
      y: 70,
      vx: -0.02,
      vy: -0.2,
    })
  })

  test('reverses vertical velocity on exact top and bottom edge contact', () => {
    const [topHit, bottomHit] = stepTangyuanMotion([
      { id: 'top-hit', x: 20, y: 2, width: 10, height: 10, vx: 0.01, vy: -0.1 },
      { id: 'bottom-hit', x: 30, y: 68, width: 10, height: 10, vx: -0.02, vy: 0.1 },
    ], bounds, 20)

    expect(topHit).toMatchObject({
      id: 'top-hit',
      x: 20.2,
      y: 0,
      vx: 0.01,
      vy: 0.1,
    })
    expect(bottomHit).toMatchObject({
      id: 'bottom-hit',
      x: 29.6,
      y: 70,
      vx: -0.02,
      vy: -0.1,
    })
  })

  test('reverses both axes on exact corner contact', () => {
    const [cornerHit] = stepTangyuanMotion([
      { id: 'corner-hit', x: 88, y: 68, width: 10, height: 10, vx: 0.1, vy: 0.1 },
    ], bounds, 20)

    expect(cornerHit).toMatchObject({
      id: 'corner-hit',
      x: 90,
      y: 70,
      vx: -0.1,
      vy: -0.1,
    })
  })

  test('clamps updated positions to the visible range', () => {
    const nextItems = stepTangyuanMotion([
      { id: 'left', x: 1, y: 10, width: 10, height: 10, vx: -0.2, vy: 0 },
      { id: 'right', x: 88, y: 12, width: 10, height: 10, vx: 0.2, vy: 0 },
      { id: 'top', x: 20, y: 1, width: 10, height: 10, vx: 0, vy: -0.2 },
      { id: 'bottom', x: 30, y: 68, width: 10, height: 10, vx: 0, vy: 0.2 },
    ], bounds, 20)

    nextItems.forEach(({ x, y, width, height }) => {
      expect(x).toBeGreaterThanOrEqual(bounds.left)
      expect(y).toBeGreaterThanOrEqual(bounds.top)
      expect(x + width).toBeLessThanOrEqual(bounds.right)
      expect(y + height).toBeLessThanOrEqual(bounds.bottom)
    })
  })

  test('clamps out-of-bounds positions without flipping inward recovery velocity', () => {
    const [nextItem] = stepTangyuanMotion([
      { id: 'recovering', x: -1, y: 10, width: 10, height: 10, vx: 0.1, vy: 0.02 },
    ], bounds, 0)

    expect(nextItem).toMatchObject({
      id: 'recovering',
      x: 0,
      y: 10,
      vx: 0.1,
      vy: 0.02,
    })
  })
})
