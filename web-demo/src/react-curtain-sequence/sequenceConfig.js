export const sequenceOrder = [
  { key: 'character', delay: 0.2, duration: 0.9, blurFrom: 18, y: 24 },
  { key: 'cake', delay: 1.2, duration: 0.7, blurFrom: 18, y: 18 },
  { key: 'balloons', delay: 2, duration: 0.8, blurFrom: 18, y: 22 },
  { key: 'gifts', delay: 2.8, duration: 0.7, blurFrom: 18, x: 20 },
  { key: 'ghost', delay: 3.5, duration: 0.7, blurFrom: 18, x: 10, y: -16 },
  { key: 'mascot', delay: 4.2, duration: 0.55, blurFrom: 18, scale: 1.04 },
]

export const loopMotion = {
  hair: { rotate: [0, 2.5, 0], y: [0, 6, 0], duration: 4.8 },
  breathe: { y: [0, -4, 0], scale: [1, 1.008, 1], duration: 4.2 },
  balloons: { y: [0, -16, 0], rotate: [0, 1.5, 0], duration: 7 },
  gifts: { y: [0, -8, -2, 0], duration: 6 },
  ghost: { y: [0, -10, 0], rotate: [0, 2, 0], duration: 3.8 },
  glow: { opacity: [0.35, 0.75, 0.35], scale: [1, 1.03, 1], duration: 4.5 },
}
