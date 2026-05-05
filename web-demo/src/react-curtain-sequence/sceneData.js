import { withBase } from '../basePath'

export { BASE_H, BASE_W, BG_RECT, getLayerStyle, layerBoxes } from './sceneGeometry'

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
