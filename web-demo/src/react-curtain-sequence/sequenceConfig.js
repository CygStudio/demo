export const sequenceOrder = [
  { key: 'character', delay: 0.2, duration: 2.7, x: -120, y: 180, scale: 0.88 },
  { key: 'cake', delay: 1.5, duration: 2.1, y: 260, scale: 0.85 },
  { key: 'balloons', delay: 2.6, duration: 2.4, y: -220, scale: 0.9 },
  { key: 'gifts', delay: 3.8, duration: 2.1, x: 240, y: 80, scale: 0.9 },
  { key: 'ghost', delay: 4.9, duration: 2.1, x: 20, y: -32 },
  { key: 'mascot', delay: 5.9, duration: 1.65, scale: 1.18 },
]

export const loopMotion = {
  hair: { rotate: [0, 2.5, 0], y: [0, 6, 0], duration: 4.8 },
  breathe: { y: [0, -4, 0], scale: [1, 1.008, 1], duration: 4.2 },
  balloons: { y: [0, -16, 0], rotate: [0, 1.5, 0], duration: 7 },
  gifts: { y: [0, -8, -2, 0], duration: 6 },
  ghost: { y: [0, -10, 0], rotate: [0, 2, 0], duration: 3.8 },
  glow: { opacity: [0.35, 0.75, 0.35], scale: [1, 1.03, 1], duration: 4.5 },
}
