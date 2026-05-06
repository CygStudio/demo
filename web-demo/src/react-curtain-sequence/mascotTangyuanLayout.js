const MASCOT_CAKE_SCENE_ORIGIN = [921, 333]

const toSceneBox = (cropBox) => {
  const [left, top, right, bottom] = cropBox
  const [originX, originY] = MASCOT_CAKE_SCENE_ORIGIN

  return [originX + left, originY + top, originX + right, originY + bottom]
}

const tangyuan = (name, cropBox) => ({
  name,
  cropBox,
  sceneBox: toSceneBox(cropBox),
})

export const mascotTangyuanLayout = [
  tangyuan('mascot-cake-1', [0, 28, 76, 91]),
  tangyuan('mascot-cake-2', [151, 177, 222, 241]),
  tangyuan('mascot-cake-3', [266, 111, 322, 165]),
  tangyuan('mascot-cake-4', [478, 1, 551, 82]),
]
