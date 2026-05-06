const BASE_SPEED_PX_PER_MS = 0.12
const BASE_DIRECTION_VECTORS = [
  { vx: 1, vy: 1 },
  { vx: -1, vy: 1 },
  { vx: 1, vy: -1 },
  { vx: -1, vy: -1 },
]

const roundMotionValue = (value) => Number(value.toFixed(6))

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const shuffle = (items, rng) => {
  const shuffled = items.slice()

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(rng() * (index + 1))
    ;[shuffled[index], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[index]]
  }

  return shuffled
}

const normalizeVelocity = ({ vx, vy }, speed = BASE_SPEED_PX_PER_MS) => {
  const magnitude = Math.hypot(vx, vy)

  return {
    vx: roundMotionValue((vx / magnitude) * speed),
    vy: roundMotionValue((vy / magnitude) * speed),
  }
}

const getVisibleRange = (item, bounds) => ({
  minX: bounds.left,
  maxX: Math.max(bounds.left, bounds.right - item.width),
  minY: bounds.top,
  maxY: Math.max(bounds.top, bounds.bottom - item.height),
})

const reflectAxis = (position, velocity, min, max) => {
  const clampedPosition = clamp(position, min, max)
  const hitBoundary = (position <= min && velocity < 0) || (position >= max && velocity > 0)

  return {
    position: roundMotionValue(clampedPosition),
    velocity: roundMotionValue(hitBoundary ? -velocity : velocity),
  }
}

export function createTangyuanVelocities(rng = Math.random) {
  return shuffle(BASE_DIRECTION_VECTORS.map((vector) => normalizeVelocity(vector)), rng)
}

export function clampTangyuanPosition(item, bounds) {
  const { minX, maxX, minY, maxY } = getVisibleRange(item, bounds)

  return {
    ...item,
    x: roundMotionValue(clamp(item.x, minX, maxX)),
    y: roundMotionValue(clamp(item.y, minY, maxY)),
  }
}

export function stepTangyuanMotion(items, bounds, dtMs) {
  return items.map((item) => {
    const { minX, maxX, minY, maxY } = getVisibleRange(item, bounds)
    const nextX = item.x + item.vx * dtMs
    const nextY = item.y + item.vy * dtMs
    const reflectedX = reflectAxis(nextX, item.vx, minX, maxX)
    const reflectedY = reflectAxis(nextY, item.vy, minY, maxY)

    return clampTangyuanPosition({
      ...item,
      x: reflectedX.position,
      y: reflectedY.position,
      vx: reflectedX.velocity,
      vy: reflectedY.velocity,
    }, bounds)
  })
}
