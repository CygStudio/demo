import { describe, expect, it } from 'vitest'
import {
  CHASE_LERP_PER_FRAME,
  ENTER_ORBIT_BAND_PX,
  EXIT_ORBIT_BAND_PX,
  HOME_BOB_AMPLITUDE_PX,
  ORBIT_ANGULAR_VELOCITY,
  ORBIT_RADIUS_PX,
  createInitialFollowerItems,
  getHomeTarget,
  getOrbitTarget,
  stepCursorFollower,
} from './cursorFollowerMotion'

const sampleLayout = [
  { name: 'a', x: 0, y: 0, width: 80, height: 80 },
  { name: 'b', x: 1000, y: 0, width: 80, height: 80 },
  { name: 'c', x: 0, y: 800, width: 80, height: 80 },
  { name: 'd', x: 1000, y: 800, width: 80, height: 80 },
]

const baseItems = createInitialFollowerItems(sampleLayout)

describe('createInitialFollowerItems', () => {
  it('records home positions and assigns 90 degree orbit phase per index', () => {
    const items = createInitialFollowerItems(sampleLayout)
    expect(items[0]).toMatchObject({ homeX: 0, homeY: 0, orbitPhase: 0 })
    expect(items[1].orbitPhase).toBeCloseTo(Math.PI / 2)
    expect(items[2].orbitPhase).toBeCloseTo(Math.PI)
    expect(items[3].orbitPhase).toBeCloseTo((3 * Math.PI) / 2)
  })
})

describe('stepCursorFollower chase mode', () => {
  it('moves each item toward pointer using lerp (monotonic decrease in distance)', () => {
    const pointer = { x: 500, y: 500 }
    let state = { items: baseItems, mode: 'chase' }
    const initialDistances = state.items.map((item) =>
      Math.hypot(item.x + item.width / 2 - pointer.x, item.y + item.height / 2 - pointer.y),
    )

    state = stepCursorFollower({ ...state, pointer, dtMs: 16, elapsedMs: 0 })

    state.items.forEach((item, index) => {
      const newDistance = Math.hypot(
        item.x + item.width / 2 - pointer.x,
        item.y + item.height / 2 - pointer.y,
      )
      expect(newDistance).toBeLessThan(initialDistances[index])
    })
  })

  it('moves further with larger dt (frame-rate aware)', () => {
    const pointer = { x: 500, y: 500 }
    const small = stepCursorFollower({
      items: baseItems,
      pointer,
      mode: 'chase',
      dtMs: 16,
      elapsedMs: 0,
    })
    const large = stepCursorFollower({
      items: baseItems,
      pointer,
      mode: 'chase',
      dtMs: 64,
      elapsedMs: 0,
    })

    const smallDx = Math.abs(small.items[0].x - baseItems[0].x)
    const largeDx = Math.abs(large.items[0].x - baseItems[0].x)
    expect(largeDx).toBeGreaterThan(smallDx)
  })

  it('uses approximately the configured lerp factor at the reference frame rate', () => {
    const pointer = { x: 500, y: 500 }
    const state = stepCursorFollower({
      items: baseItems,
      pointer,
      mode: 'chase',
      dtMs: 1000 / 60,
      elapsedMs: 0,
    })
    const itemA = state.items[0]
    const targetX = pointer.x - 80 / 2
    const expectedX = 0 + (targetX - 0) * CHASE_LERP_PER_FRAME
    expect(itemA.x).toBeCloseTo(expectedX, 3)
  })
})

describe('stepCursorFollower mode transitions with hysteresis', () => {
  it('switches to orbit when nearest item is within enter band', () => {
    const closeItem = { ...baseItems[0], x: ORBIT_RADIUS_PX, y: 0 }
    const items = [closeItem, baseItems[1], baseItems[2], baseItems[3]]
    const pointer = { x: closeItem.x + closeItem.width / 2, y: closeItem.y + closeItem.height / 2 }

    const result = stepCursorFollower({
      items,
      pointer,
      mode: 'chase',
      dtMs: 16,
      elapsedMs: 0,
    })

    expect(result.mode).toBe('orbit')
  })

  it('stays in orbit while items are within the exit band (hysteresis)', () => {
    const radius = ORBIT_RADIUS_PX
    const inBetweenDistance = radius + (ENTER_ORBIT_BAND_PX + EXIT_ORBIT_BAND_PX) / 2
    const items = baseItems.map((item) => ({
      ...item,
      x: inBetweenDistance - item.width / 2,
      y: -item.height / 2,
    }))
    const pointer = { x: 0, y: 0 }

    const fromOrbit = stepCursorFollower({
      items,
      pointer,
      mode: 'orbit',
      dtMs: 16,
      elapsedMs: 0,
    })
    const fromChase = stepCursorFollower({
      items,
      pointer,
      mode: 'chase',
      dtMs: 16,
      elapsedMs: 0,
    })

    expect(fromOrbit.mode).toBe('orbit')
    expect(fromChase.mode).toBe('chase')
  })

  it('exits orbit only when all items are beyond the exit band', () => {
    const farDistance = ORBIT_RADIUS_PX + EXIT_ORBIT_BAND_PX + 10
    const items = baseItems.map((item) => ({
      ...item,
      x: farDistance - item.width / 2,
      y: -item.height / 2,
    }))
    const pointer = { x: 0, y: 0 }

    const result = stepCursorFollower({
      items,
      pointer,
      mode: 'orbit',
      dtMs: 16,
      elapsedMs: 0,
    })

    expect(result.mode).toBe('chase')
  })

  it('forces returning mode when pointer is null', () => {
    const displaced = baseItems.map((item) => ({ ...item, x: item.x + 50, y: item.y + 50 }))
    const result = stepCursorFollower({
      items: displaced,
      pointer: null,
      mode: 'chase',
      dtMs: 16,
      elapsedMs: 0,
    })
    expect(result.mode).toBe('returning')
  })
})

describe('orbit target', () => {
  it('places items 90 degrees apart at fixed radius around pointer', () => {
    const pointer = { x: 500, y: 500 }
    const targets = baseItems.map((item) => getOrbitTarget(pointer, item, 0))
    targets.forEach((target, index) => {
      const item = baseItems[index]
      const cx = target.x + item.width / 2
      const cy = target.y + item.height / 2
      const radius = Math.hypot(cx - pointer.x, cy - pointer.y)
      expect(radius).toBeCloseTo(ORBIT_RADIUS_PX, 3)
    })

    const angleOf = (target, item) => {
      const cx = target.x + item.width / 2
      const cy = target.y + item.height / 2
      return Math.atan2(cy - pointer.y, cx - pointer.x)
    }
    const angle0 = angleOf(targets[0], baseItems[0])
    const angle1 = angleOf(targets[1], baseItems[1])
    const diff = ((angle1 - angle0) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
    expect(diff).toBeCloseTo(Math.PI / 2, 3)
  })

  it('rotates counter-clockwise (negative angular velocity)', () => {
    expect(ORBIT_ANGULAR_VELOCITY).toBeLessThan(0)
    const pointer = { x: 500, y: 500 }
    const item = baseItems[0]
    const earlier = getOrbitTarget(pointer, item, 0)
    const later = getOrbitTarget(pointer, item, 100)
    const angleEarlier = Math.atan2(
      earlier.y + item.height / 2 - pointer.y,
      earlier.x + item.width / 2 - pointer.x,
    )
    const angleLater = Math.atan2(
      later.y + item.height / 2 - pointer.y,
      later.x + item.width / 2 - pointer.x,
    )
    expect(angleLater).toBeLessThan(angleEarlier)
  })
})

describe('returning and home', () => {
  it('returning collapses items toward home when pointer is null', () => {
    const displaced = baseItems.map((item) => ({ ...item, x: item.x + 200, y: item.y + 200 }))
    let state = { items: displaced, mode: 'returning' }
    for (let i = 0; i < 200; i += 1) {
      state = stepCursorFollower({
        items: state.items,
        pointer: null,
        mode: state.mode,
        dtMs: 16,
        elapsedMs: i * 16,
      })
    }
    state.items.forEach((item) => {
      expect(Math.abs(item.x - item.homeX)).toBeLessThan(HOME_BOB_AMPLITUDE_PX + 1)
      expect(Math.abs(item.y - item.homeY)).toBeLessThan(HOME_BOB_AMPLITUDE_PX + 1)
    })
    expect(state.mode).toBe('home')
  })

  it('home bob amplitude stays bounded around home y', () => {
    const item = baseItems[0]
    const samples = []
    for (let t = 0; t < 6000; t += 100) {
      samples.push(getHomeTarget(item, t).y - item.homeY)
    }
    const maxAmplitude = Math.max(...samples.map(Math.abs))
    expect(maxAmplitude).toBeLessThanOrEqual(HOME_BOB_AMPLITUDE_PX + 1e-6)
  })
})

describe('bounds clamping', () => {
  it('keeps items inside provided bounds', () => {
    const bounds = { left: 0, top: 0, right: 200, bottom: 200 }
    const items = [{ ...baseItems[0], x: 50, y: 50 }]
    const pointer = { x: 1000, y: 1000 }
    const state = stepCursorFollower({ items, pointer, mode: 'chase', dtMs: 1000, elapsedMs: 0, bounds })
    state.items.forEach((item) => {
      expect(item.x).toBeGreaterThanOrEqual(bounds.left)
      expect(item.x + item.width).toBeLessThanOrEqual(bounds.right)
      expect(item.y).toBeGreaterThanOrEqual(bounds.top)
      expect(item.y + item.height).toBeLessThanOrEqual(bounds.bottom)
    })
  })
})
