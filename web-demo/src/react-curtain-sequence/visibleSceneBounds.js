import { BASE_H, BASE_W } from './sceneGeometry'

const fullSceneBounds = { left: 0, top: 0, right: BASE_W, bottom: BASE_H }

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export function getVisibleSceneBounds(stageRect, sceneRect) {
  if (!stageRect || !sceneRect || sceneRect.width <= 0 || sceneRect.height <= 0) {
    return fullSceneBounds
  }

  const visibleLeft = clamp(stageRect.left - sceneRect.left, 0, sceneRect.width)
  const visibleRight = clamp(stageRect.right - sceneRect.left, 0, sceneRect.width)
  const visibleTop = clamp(stageRect.top - sceneRect.top, 0, sceneRect.height)
  const visibleBottom = clamp(stageRect.bottom - sceneRect.top, 0, sceneRect.height)

  if (visibleRight <= visibleLeft || visibleBottom <= visibleTop) {
    return fullSceneBounds
  }

  return {
    left: Math.round((visibleLeft / sceneRect.width) * BASE_W),
    top: Math.round((visibleTop / sceneRect.height) * BASE_H),
    right: Math.round((visibleRight / sceneRect.width) * BASE_W),
    bottom: Math.round((visibleBottom / sceneRect.height) * BASE_H),
  }
}
