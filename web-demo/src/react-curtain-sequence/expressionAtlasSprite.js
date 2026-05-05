export function getExpressionAtlasBackgroundPosition(frameIndex, frameCount) {
  if (frameCount <= 1) return '0% 0%'
  return `${(frameIndex / (frameCount - 1)) * 100}% 0%`
}

export function getExpressionAtlasBackgroundSize(frameCount) {
  return `${frameCount * 100}% 100%`
}
