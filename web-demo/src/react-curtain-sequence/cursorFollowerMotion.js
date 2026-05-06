export const ORBIT_RADIUS_PX = 160
export const ORBIT_PERIOD_MS = 6000
export const ORBIT_ANGULAR_VELOCITY = -(2 * Math.PI) / ORBIT_PERIOD_MS
export const CHASE_LERP_PER_FRAME = 0.06
export const FRAME_REFERENCE_MS = 1000 / 60
export const ENTER_ORBIT_BAND_PX = 24
export const EXIT_ORBIT_BAND_PX = 80
export const HOME_BOB_AMPLITUDE_PX = 4
export const HOME_BOB_PERIOD_MS = 3000
export const HOME_BOB_PHASE_STEP = (2 * Math.PI) / 5

const TWO_PI = Math.PI * 2

const roundMotionValue = (value) => Number(value.toFixed(6))

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const getDtAwareLerp = (alphaPerFrame, dtMs) => {
  if (dtMs <= 0) return 0
  return 1 - Math.pow(1 - alphaPerFrame, dtMs / FRAME_REFERENCE_MS)
}

const lerp = (current, target, t) => current + (target - current) * t

const applyClamp = (item, bounds) => {
  if (!bounds) return item
  const maxX = Math.max(bounds.left, bounds.right - item.width)
  const maxY = Math.max(bounds.top, bounds.bottom - item.height)
  return {
    ...item,
    x: roundMotionValue(clamp(item.x, bounds.left, maxX)),
    y: roundMotionValue(clamp(item.y, bounds.top, maxY)),
  }
}

const getCenter = (item) => ({
  cx: item.x + item.width / 2,
  cy: item.y + item.height / 2,
})

const distanceToPointer = (item, pointer) => {
  const { cx, cy } = getCenter(item)
  return Math.hypot(cx - pointer.x, cy - pointer.y)
}

export function createInitialFollowerItems(layoutItems) {
  return layoutItems.map((item, index) => ({
    ...item,
    homeX: item.x,
    homeY: item.y,
    bobPhase: index * HOME_BOB_PHASE_STEP,
    orbitPhase: index * (Math.PI / 2),
  }))
}

export function getHomeTarget(item, elapsedMs) {
  const phase = (elapsedMs / HOME_BOB_PERIOD_MS) * TWO_PI + item.bobPhase
  return {
    x: item.homeX,
    y: item.homeY + Math.sin(phase) * HOME_BOB_AMPLITUDE_PX,
  }
}

export function getOrbitTarget(pointer, item, elapsedMs) {
  const angle = item.orbitPhase + ORBIT_ANGULAR_VELOCITY * elapsedMs
  const targetCenterX = pointer.x + Math.cos(angle) * ORBIT_RADIUS_PX
  const targetCenterY = pointer.y + Math.sin(angle) * ORBIT_RADIUS_PX
  return {
    x: targetCenterX - item.width / 2,
    y: targetCenterY - item.height / 2,
  }
}

export function getChaseTarget(pointer, item) {
  return {
    x: pointer.x - item.width / 2,
    y: pointer.y - item.height / 2,
  }
}

const resolveNextMode = (currentMode, items, pointer) => {
  if (!pointer) return 'returning'

  const distances = items.map((item) => distanceToPointer(item, pointer))
  const minDistance = Math.min(...distances)
  const enterDistance = ORBIT_RADIUS_PX + ENTER_ORBIT_BAND_PX
  const exitDistance = ORBIT_RADIUS_PX + EXIT_ORBIT_BAND_PX

  if (currentMode === 'orbit') {
    if (distances.every((d) => d > exitDistance)) return 'chase'
    return 'orbit'
  }

  if (minDistance <= enterDistance) return 'orbit'
  return 'chase'
}

const isAtHome = (item) =>
  Math.abs(item.x - item.homeX) < 0.5 &&
  Math.abs(item.y - item.homeY) < HOME_BOB_AMPLITUDE_PX + 1

export function stepCursorFollower({ items, pointer, mode, dtMs, elapsedMs, bounds }) {
  const incomingMode = pointer ? (mode === 'returning' || mode === 'home' ? 'chase' : mode) : mode
  const nextMode = resolveNextMode(incomingMode, items, pointer)
  const lerpT = getDtAwareLerp(CHASE_LERP_PER_FRAME, dtMs)

  const nextItems = items.map((item) => {
    let target
    if (nextMode === 'orbit') {
      target = getOrbitTarget(pointer, item, elapsedMs)
    } else if (nextMode === 'chase') {
      target = getChaseTarget(pointer, item)
    } else {
      target = getHomeTarget(item, elapsedMs)
    }

    const nextX = lerp(item.x, target.x, lerpT)
    const nextY = lerp(item.y, target.y, lerpT)

    return applyClamp(
      {
        ...item,
        x: roundMotionValue(nextX),
        y: roundMotionValue(nextY),
      },
      bounds,
    )
  })

  let resolvedMode = nextMode
  if (resolvedMode === 'returning' && nextItems.every(isAtHome)) {
    resolvedMode = 'home'
  }

  return { items: nextItems, mode: resolvedMode }
}
