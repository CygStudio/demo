export const BASE_W = 2283
export const BASE_H = 1302

import { withBase } from '../basePath'

export const BG_RECT = { x: 192, y: 78, w: 1920, h: 1080 }

const assetPath = (path) => withBase(path)

export const expressionLayers = [
  { name: 'expr-a', className: 'layer character front expression-layer', src: assetPath('extracted/layers/047_A_3.png') },
  { name: 'expr-b', className: 'layer character front expression-layer', src: assetPath('extracted/layers/048_B_3.png') },
  { name: 'expr-c', className: 'layer character front expression-layer is-active', src: assetPath('extracted/layers/049_C_1.png') },
  { name: 'expr-d', className: 'layer character front expression-layer', src: assetPath('extracted/layers/050_D_1.png') },
]

export const curtainSceneGroups = {
  background: [
    { name: 'paper', className: 'layer paper', src: assetPath('extracted/layers/000_紙張_1.png') },
    { name: 'bg', className: 'layer bg', src: assetPath('extracted/layers/004_背景_1.png') },
    { name: 'wall-art-left', className: 'layer bg-decor', src: assetPath('extracted/layers/005_畫四湯圓_1.png') },
    { name: 'wall-art-right', className: 'layer bg-decor', src: assetPath('extracted/layers/006_畫婚叫_1.png') },
    { name: 'bunting', className: 'layer decor', src: assetPath('extracted/layers/010_掛帶_1.png') },
    { name: 'window-light', className: 'layer light', src: assetPath('extracted/layers/011_窗光_1.png') },
  ],
  character: [
    { name: 'legs', className: 'layer character back', src: assetPath('extracted/layers/021_腿_1.png') },
    { name: 'twin-left', className: 'layer character back', src: assetPath('extracted/layers/022_雙馬尾左_1.png') },
    { name: 'ribbon-left-b', className: 'layer character back', src: assetPath('extracted/layers/024_圖層_56_1.png') },
    { name: 'ribbon-left-a', className: 'layer character back', src: assetPath('extracted/layers/025_圖層_55_1.png') },
    { name: 'twin-right', className: 'layer character back', src: assetPath('extracted/layers/026_雙馬尾右_1.png') },
    { name: 'ribbon-right-b', className: 'layer character back', src: assetPath('extracted/layers/028_B_2.png') },
    { name: 'ribbon-right-a', className: 'layer character back', src: assetPath('extracted/layers/029_A_2.png') },
    { name: 'back-hair', className: 'layer character back', src: assetPath('extracted/layers/030_後髮_1.png') },
    { name: 'right-arm', className: 'layer character back', src: assetPath('extracted/layers/031_右手_1.png') },
    { name: 'body', className: 'layer character front', src: assetPath('extracted/layers/043_身體_1.png') },
    { name: 'face', className: 'layer character front', src: assetPath('extracted/layers/044_臉_1.png') },
    { name: 'front-hair', className: 'layer character front', src: assetPath('extracted/layers/045_前髮_1.png') },
    { name: 'ahoge', className: 'layer character front', src: assetPath('extracted/layers/051_呆毛_1.png') },
    { name: 'left-arm', className: 'layer character front', src: assetPath('extracted/layers/052_左手_1.png') },
  ],
  cake: [
    { name: 'cake', className: 'layer cake', src: assetPath('extracted/layers/037_蛋糕_1.png') },
    { name: 'table', className: 'layer cake', src: assetPath('extracted/layers/038_桌子_1.png') },
  ],
  balloons: [
    { name: 'balloon-back-blue', className: 'layer balloons back', src: assetPath('extracted/layers/008_藍_1.png') },
    { name: 'balloon-back-pink', className: 'layer balloons back', src: assetPath('extracted/layers/009_粉_1.png') },
    { name: 'balloon-mid-b', className: 'layer balloons mid', src: assetPath('extracted/layers/013_B_1.png') },
    { name: 'balloon-mid-a', className: 'layer balloons mid', src: assetPath('extracted/layers/014_A_1.png') },
  ],
  gifts: [
    { name: 'gift-blue', className: 'layer props', src: assetPath('extracted/layers/033_藍禮物_1.png') },
    { name: 'gift-red', className: 'layer props', src: assetPath('extracted/layers/034_紅禮物_1.png') },
  ],
  ghost: [
    { name: 'ghost-right', className: 'layer mascot side', src: assetPath('extracted/layers/055_婚叫_1.png') },
  ],
  mascot: [
    { name: 'mascot-cake', className: 'layer mascot cake', src: assetPath('extracted/layers/057_湯圓_1.png') },
  ],
  fx: [
    { name: 'glow', className: 'layer fx', src: assetPath('extracted/layers/058_發光_1.png') },
    { name: 'filter', className: 'layer fx', src: assetPath('extracted/layers/059_濾鏡_1.png') },
  ],
}

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
