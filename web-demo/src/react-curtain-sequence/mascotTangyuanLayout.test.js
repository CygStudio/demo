import { describe, expect, test } from 'vitest'
import { mascotTangyuanLayout } from './mascotTangyuanLayout.js'

const MASCOT_CAKE_SCENE_BOX = [921, 333, 1472, 574]
const EXPECTED_LAYOUT = [
  {
    name: 'mascot-cake-1',
    cropBox: [0, 28, 76, 91],
    sceneBox: [921, 361, 997, 424],
  },
  {
    name: 'mascot-cake-2',
    cropBox: [151, 177, 222, 241],
    sceneBox: [1072, 510, 1143, 574],
  },
  {
    name: 'mascot-cake-3',
    cropBox: [266, 111, 322, 165],
    sceneBox: [1187, 444, 1243, 498],
  },
  {
    name: 'mascot-cake-4',
    cropBox: [478, 1, 551, 82],
    sceneBox: [1399, 334, 1472, 415],
  },
]

const isWithinBox = (inner, outer) => {
  const [innerLeft, innerTop, innerRight, innerBottom] = inner
  const [outerLeft, outerTop, outerRight, outerBottom] = outer

  return innerLeft >= outerLeft
    && innerTop >= outerTop
    && innerRight <= outerRight
    && innerBottom <= outerBottom
}

const fullyOverlaps = (boxA, boxB) => isWithinBox(boxA, boxB) || isWithinBox(boxB, boxA)

describe('mascotTangyuanLayout', () => {
  test('defines four named tangyuan split entries with crop and scene boxes', () => {
    expect(mascotTangyuanLayout).toEqual(EXPECTED_LAYOUT)

    mascotTangyuanLayout.forEach(({ cropBox, sceneBox }) => {
      expect(cropBox).toBeDefined()
      expect(sceneBox).toBeDefined()
      expect(cropBox).toHaveLength(4)
      expect(sceneBox).toHaveLength(4)
      expect(isWithinBox(sceneBox, MASCOT_CAKE_SCENE_BOX)).toBe(true)
    })
  })

  test('does not fully overlap any two tangyuan scene boxes', () => {
    mascotTangyuanLayout.forEach(({ sceneBox }, index) => {
      mascotTangyuanLayout.slice(index + 1).forEach(({ sceneBox: otherSceneBox }) => {
        expect(fullyOverlaps(sceneBox, otherSceneBox)).toBe(false)
      })
    })
  })
})
