export const BASE_W = 2283
export const BASE_H = 1302

export const BG_RECT = { x: 192, y: 78, w: 1920, h: 1080 }

export const layerBoxes = {
  paper: [0, 0, 2283, 1302],
  bg: [192, 78, 2112, 1158],
  'wall-art-left': [694, 252, 1018, 551],
  'wall-art-right': [1709, 484, 2103, 915],
  'balloon-back-blue': [837, 81, 1180, 840],
  'balloon-back-pink': [466, 126, 759, 914],
  bunting: [192, 78, 2112, 450],
  'window-light': [286, 366, 1138, 1158],
  'balloon-mid-b': [174, 0, 2253, 1200],
  'balloon-mid-a': [1524, 549, 2020, 1302],
  legs: [1314, 914, 1739, 1234],
  'twin-left': [1302, 127, 1840, 816],
  'ribbon-left-b': [1291, 212, 1456, 346],
  'ribbon-left-a': [1287, 73, 1406, 281],
  'twin-right': [575, 199, 1117, 884],
  'ribbon-right-b': [986, 282, 1087, 450],
  'ribbon-right-a': [988, 154, 1087, 356],
  'back-hair': [839, 120, 1614, 836],
  'right-arm': [814, 474, 1318, 1181],
  'gift-blue': [146, 554, 674, 1236],
  'gift-red': [62, 774, 557, 1274],
  cake: [505, 473, 1381, 1181],
  table: [430, 1119, 1497, 1239],
  body: [1160, 347, 1892, 1150],
  face: [1067, 131, 1339, 442],
  'front-hair': [1017, 0, 1470, 509],
  ahoge: [1067, 60, 1130, 163],
  'left-arm': [1160, 380, 1469, 1265],
  'ghost-right': [1786, 785, 2192, 1255],
  'mascot-cake': [921, 333, 1472, 574],
  glow: [0, 0, 2283, 1302],
  filter: [0, 0, 2283, 1302],
  'expr-a': [1092, 234, 1295, 421],
  'expr-b': [1094, 233, 1295, 416],
  'expr-c': [1090, 228, 1295, 408],
  'expr-d': [1092, 234, 1295, 408],
}

export function getLayerStyle(name) {
  const [left, top, right, bottom] = layerBoxes[name]

  return {
    left: `${(left / BASE_W) * 100}%`,
    top: `${(top / BASE_H) * 100}%`,
    width: `${((right - left) / BASE_W) * 100}%`,
    height: `${((bottom - top) / BASE_H) * 100}%`,
  }
}
