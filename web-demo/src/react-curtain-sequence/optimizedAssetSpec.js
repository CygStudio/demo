import { layerBoxes } from './sceneGeometry.js'

const source = (name, file) => ({ name, file, box: layerBoxes[name] })

export const optimizedAssetSpec = [
  {
    name: 'scene-base',
    type: 'composite',
    className: 'layer optimized-scene-base',
    sources: [
      source('paper', '000_紙張_1.png'),
      source('bg', '004_背景_1.png'),
      source('wall-art-left', '005_畫四湯圓_1.png'),
      source('wall-art-right', '006_畫婚叫_1.png'),
      source('bunting', '010_掛帶_1.png'),
      source('window-light', '011_窗光_1.png'),
    ],
  },
  {
    name: 'character-hair-back',
    type: 'composite',
    className: 'layer character back',
    loop: 'hair',
    sources: [
      source('legs', '021_腿_1.png'),
      source('twin-left', '022_雙馬尾左_1.png'),
      source('ribbon-left-b', '024_圖層_56_1.png'),
      source('ribbon-left-a', '025_圖層_55_1.png'),
      source('twin-right', '026_雙馬尾右_1.png'),
      source('ribbon-right-b', '028_B_2.png'),
      source('ribbon-right-a', '029_A_2.png'),
      source('back-hair', '030_後髮_1.png'),
    ],
  },
  {
    name: 'character-body',
    type: 'composite',
    className: 'layer character front',
    loop: 'breathe',
    sources: [
      source('right-arm', '031_右手_1.png'),
      source('body', '043_身體_1.png'),
      source('face', '044_臉_1.png'),
      source('left-arm', '052_左手_1.png'),
    ],
  },
  {
    name: 'character-hair-front',
    type: 'composite',
    className: 'layer character front',
    loop: 'hair',
    sources: [
      source('front-hair', '045_前髮_1.png'),
      source('ahoge', '051_呆毛_1.png'),
    ],
  },
  {
    name: 'expression-atlas',
    type: 'atlas',
    className: 'layer character front expression-layer',
    frames: [
      source('expr-a', '047_A_3.png'),
      source('expr-b', '048_B_3.png'),
      source('expr-c', '049_C_1.png'),
      source('expr-d', '050_D_1.png'),
    ],
    activeFrame: 'expr-c',
  },
  {
    name: 'cake-table',
    type: 'composite',
    className: 'layer cake',
    sources: [
      source('cake', '037_蛋糕_1.png'),
      source('table', '038_桌子_1.png'),
    ],
  },
  {
    name: 'balloons',
    type: 'composite',
    className: 'layer balloons',
    loop: 'balloons',
    sources: [
      source('balloon-back-blue', '008_藍_1.png'),
      source('balloon-back-pink', '009_粉_1.png'),
      source('balloon-mid-b', '013_B_1.png'),
      source('balloon-mid-a', '014_A_1.png'),
    ],
  },
  {
    name: 'gifts',
    type: 'composite',
    className: 'layer props',
    loop: 'gifts',
    sources: [
      source('gift-blue', '033_藍禮物_1.png'),
      source('gift-red', '034_紅禮物_1.png'),
    ],
  },
  {
    name: 'ghost-right',
    type: 'standalone',
    className: 'layer mascot side',
    loop: 'ghost',
    sources: [source('ghost-right', '055_婚叫_1.png')],
  },
  {
    name: 'mascot-cake',
    type: 'standalone',
    className: 'layer mascot cake',
    sources: [source('mascot-cake', '057_湯圓_1.png')],
  },
  {
    name: 'glow',
    type: 'standalone',
    className: 'layer fx',
    loop: 'glow',
    sources: [source('glow', '058_發光_1.png')],
  },
  {
    name: 'filter',
    type: 'standalone',
    className: 'layer fx',
    sources: [source('filter', '059_濾鏡_1.png')],
  },
]

export const criticalOptimizedAssetNames = [
  'scene-base',
  'character-hair-back',
  'character-body',
  'character-hair-front',
  'expression-atlas',
]

export const optimizedSceneGroups = {
  background: layerRefs(['scene-base']),
  character: layerRefs(['character-hair-back', 'character-body', 'character-hair-front']),
  cake: layerRefs(['cake-table']),
  balloons: layerRefs(['balloons']),
  gifts: layerRefs(['gifts']),
  ghost: layerRefs(['ghost-right']),
  mascot: layerRefs(['mascot-cake']),
  fx: layerRefs(['glow', 'filter']),
}

export function getOptimizedAssetBox(name) {
  const asset = optimizedAssetSpec.find((item) => item.name === name)
  if (!asset) throw new Error(`Unknown optimized asset: ${name}`)
  const boxes = asset.type === 'atlas' ? asset.frames.map((frame) => frame.box) : asset.sources.map((item) => item.box)
  return unionBoxes(boxes)
}

function layerRefs(names) {
  return names.map((name) => optimizedAssetSpec.find((item) => item.name === name))
}

function unionBoxes(boxes) {
  return [
    Math.min(...boxes.map((box) => box[0])),
    Math.min(...boxes.map((box) => box[1])),
    Math.max(...boxes.map((box) => box[2])),
    Math.max(...boxes.map((box) => box[3])),
  ]
}
