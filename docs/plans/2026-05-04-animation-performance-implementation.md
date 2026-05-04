# Animation Performance Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a generated optimized image layer set for the React curtain sequence, then switch the runtime to fewer requests and fewer animated image nodes while preserving the approved visual effects.

**Architecture:** Keep the current extracted PNG layers as source assets. Add a small asset-generation pipeline that composites static or same-motion layers into optimized PNG/WebP outputs and writes an optimized manifest, then update the React scene data and renderer to consume those optimized assets with two-phase loading.

**Tech Stack:** React 19, Motion for React, Vite, Vitest, Testing Library, Node.js ESM scripts, `sharp` for image compositing and WebP generation.

---

## Context

Read first:

- `docs/plans/2026-05-04-animation-performance-design.md`
- `web-demo/src/react-curtain-sequence/CurtainSequencePreview.jsx`
- `web-demo/src/react-curtain-sequence/sceneData.js`
- `web-demo/src/react-curtain-sequence/sequenceConfig.js`
- `web-demo/src/react-curtain-sequence/app.css`
- `web-demo/src/react-curtain-sequence/CurtainSequencePreview.test.jsx`

Current baseline:

- Runtime references 36 PNG images.
- Referenced image bytes are about 7.69MiB.
- Critical preload currently includes background, character, and expression layers, about 24 images.
- The target is about 12 image requests and about 5 critical preload images.

Do not delete `extracted/layers` or `web-demo/public/extracted/layers`; those remain the source-of-truth exports.

---

### Task 1: Extract shared scene geometry

**Files:**
- Create: `web-demo/src/react-curtain-sequence/sceneGeometry.js`
- Modify: `web-demo/src/react-curtain-sequence/sceneData.js`
- Test: `web-demo/src/react-curtain-sequence/sceneGeometry.test.js`

**Step 1: Write the failing test**

Create `web-demo/src/react-curtain-sequence/sceneGeometry.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { BASE_H, BASE_W, BG_RECT, getLayerStyle, layerBoxes } from './sceneGeometry'

describe('sceneGeometry', () => {
  it('exports the PSD coordinate system and known layer boxes', () => {
    expect(BASE_W).toBe(2283)
    expect(BASE_H).toBe(1302)
    expect(BG_RECT).toEqual({ x: 192, y: 78, w: 1920, h: 1080 })
    expect(layerBoxes.body).toEqual([1160, 347, 1892, 1150])
    expect(layerBoxes['expr-c']).toEqual([1090, 228, 1295, 408])
  })

  it('converts layer boxes to percentage styles', () => {
    expect(getLayerStyle('body')).toEqual({
      left: `${(1160 / 2283) * 100}%`,
      top: `${(347 / 1302) * 100}%`,
      width: `${((1892 - 1160) / 2283) * 100}%`,
      height: `${((1150 - 347) / 1302) * 100}%`,
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd web-demo && npm run test -- sceneGeometry.test.js
```

Expected: FAIL because `sceneGeometry.js` does not exist.

**Step 3: Write minimal implementation**

Create `web-demo/src/react-curtain-sequence/sceneGeometry.js` by moving these exports from `sceneData.js`:

```js
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
```

Modify `sceneData.js`:

```js
import { withBase } from '../basePath'
export { BASE_H, BASE_W, BG_RECT, getLayerStyle, layerBoxes } from './sceneGeometry'
```

Remove the duplicated geometry constants and `getLayerStyle()` body from `sceneData.js`.

**Step 4: Run test to verify it passes**

Run:

```bash
cd web-demo && npm run test -- sceneGeometry.test.js
```

Expected: PASS.

**Step 5: Run existing component tests**

Run:

```bash
cd web-demo && npm run test -- CurtainSequencePreview.test.jsx
```

Expected: PASS.

**Step 6: Commit**

```bash
git add web-demo/src/react-curtain-sequence/sceneGeometry.js web-demo/src/react-curtain-sequence/sceneGeometry.test.js web-demo/src/react-curtain-sequence/sceneData.js
git commit -m "refactor: extract curtain scene geometry"
```

---

### Task 2: Define the optimized asset spec

**Files:**
- Create: `web-demo/src/react-curtain-sequence/optimizedAssetSpec.js`
- Test: `web-demo/src/react-curtain-sequence/optimizedAssetSpec.test.js`

**Step 1: Write the failing test**

Create `web-demo/src/react-curtain-sequence/optimizedAssetSpec.test.js`:

```js
import { describe, expect, it } from 'vitest'
import {
  criticalOptimizedAssetNames,
  getOptimizedAssetBox,
  optimizedAssetSpec,
  optimizedSceneGroups,
} from './optimizedAssetSpec'

describe('optimizedAssetSpec', () => {
  it('defines the approved optimized request budget', () => {
    expect(optimizedAssetSpec).toHaveLength(12)
    expect(criticalOptimizedAssetNames).toEqual([
      'scene-base',
      'character-hair-back',
      'character-body',
      'character-hair-front',
      'expression-atlas',
    ])
  })

  it('keeps scene groups aligned with the approved animation model', () => {
    expect(optimizedSceneGroups.background.map((layer) => layer.name)).toEqual(['scene-base'])
    expect(optimizedSceneGroups.character.map((layer) => layer.name)).toEqual([
      'character-hair-back',
      'character-body',
      'character-hair-front',
    ])
    expect(optimizedSceneGroups.cake.map((layer) => layer.name)).toEqual(['cake-table'])
    expect(optimizedSceneGroups.balloons.map((layer) => layer.name)).toEqual(['balloons'])
    expect(optimizedSceneGroups.gifts.map((layer) => layer.name)).toEqual(['gifts'])
    expect(optimizedSceneGroups.fx.map((layer) => layer.name)).toEqual(['glow', 'filter'])
  })

  it('computes union boxes for composite assets', () => {
    expect(getOptimizedAssetBox('character-body')).toEqual([814, 131, 1892, 1265])
    expect(getOptimizedAssetBox('expression-atlas')).toEqual([1090, 228, 1295, 421])
  })
})
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd web-demo && npm run test -- optimizedAssetSpec.test.js
```

Expected: FAIL because `optimizedAssetSpec.js` does not exist.

**Step 3: Write minimal implementation**

Create `web-demo/src/react-curtain-sequence/optimizedAssetSpec.js`:

```js
import { layerBoxes } from './sceneGeometry'

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
```

**Step 4: Run test to verify it passes**

Run:

```bash
cd web-demo && npm run test -- optimizedAssetSpec.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add web-demo/src/react-curtain-sequence/optimizedAssetSpec.js web-demo/src/react-curtain-sequence/optimizedAssetSpec.test.js
git commit -m "feat: define optimized curtain asset spec"
```

---

### Task 3: Generate optimized assets and manifest

**Files:**
- Modify: `web-demo/package.json`
- Modify: `web-demo/package-lock.json`
- Create: `web-demo/scripts/build-optimized-assets.mjs`
- Create after script run: `web-demo/public/extracted/optimized/manifest.json`
- Create after script run: `web-demo/public/extracted/optimized/*.png`
- Create after script run: `web-demo/public/extracted/optimized/*.webp`
- Test: `web-demo/src/react-curtain-sequence/optimizedAssets.generated.test.js`

**Step 1: Install image tooling**

Run:

```bash
cd web-demo && npm install --save-dev sharp
```

Expected: `sharp` appears in `devDependencies`, and `package-lock.json` is updated.

**Step 2: Add package script**

Modify `web-demo/package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "build:optimized-assets": "node scripts/build-optimized-assets.mjs"
  }
}
```

**Step 3: Write the failing generated-assets test**

Create `web-demo/src/react-curtain-sequence/optimizedAssets.generated.test.js`:

```js
import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { criticalOptimizedAssetNames } from './optimizedAssetSpec'

const manifestPath = resolve(import.meta.dirname, '../../public/extracted/optimized/manifest.json')

describe('generated optimized assets', () => {
  it('writes an optimized manifest with request and critical budgets', () => {
    expect(existsSync(manifestPath)).toBe(true)

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

    expect(manifest.assets).toHaveLength(12)
    expect(manifest.critical).toEqual(criticalOptimizedAssetNames)
    expect(manifest.assets.filter((asset) => asset.formats.webp)).toHaveLength(12)
    expect(manifest.assets.filter((asset) => asset.formats.png)).toHaveLength(12)
  })

  it('keeps generated referenced bytes below the current baseline', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    const webpBytes = manifest.assets.reduce((sum, asset) => {
      const filePath = resolve(import.meta.dirname, '../../public', asset.formats.webp)
      return sum + statSync(filePath).size
    }, 0)

    expect(webpBytes).toBeLessThan(7.69 * 1024 * 1024)
  })
})
```

**Step 4: Run test to verify it fails**

Run:

```bash
cd web-demo && npm run test -- optimizedAssets.generated.test.js
```

Expected: FAIL because `web-demo/public/extracted/optimized/manifest.json` does not exist.

**Step 5: Create the asset generation script**

Create `web-demo/scripts/build-optimized-assets.mjs`:

```js
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import sharp from 'sharp'
import { criticalOptimizedAssetNames, getOptimizedAssetBox, optimizedAssetSpec } from '../src/react-curtain-sequence/optimizedAssetSpec.js'

const projectRoot = resolve(import.meta.dirname, '..')
const sourceDir = resolve(projectRoot, 'public/extracted/layers')
const outputDir = resolve(projectRoot, 'public/extracted/optimized')
const publicPrefix = 'extracted/optimized'

await rm(outputDir, { force: true, recursive: true })
await mkdir(outputDir, { recursive: true })

const manifest = {
  generatedBy: 'web-demo/scripts/build-optimized-assets.mjs',
  critical: criticalOptimizedAssetNames,
  assets: [],
}

for (const asset of optimizedAssetSpec) {
  const box = getOptimizedAssetBox(asset.name)
  const width = box[2] - box[0]
  const height = box[3] - box[1]
  const image = await buildAssetImage(asset, box, width, height)
  const pngFile = `${asset.name}.png`
  const webpFile = `${asset.name}.webp`
  const pngPath = resolve(outputDir, pngFile)
  const webpPath = resolve(outputDir, webpFile)

  await image.png({ compressionLevel: 9, palette: true }).toFile(pngPath)
  await image.webp({ effort: 6, quality: 86 }).toFile(webpPath)

  manifest.assets.push({
    name: asset.name,
    type: asset.type,
    box,
    width,
    height,
    className: asset.className,
    loop: asset.loop ?? null,
    activeFrame: asset.activeFrame ?? null,
    frameNames: asset.frames?.map((frame) => frame.name) ?? null,
    formats: {
      png: `${publicPrefix}/${pngFile}`,
      webp: `${publicPrefix}/${webpFile}`,
    },
  })
}

await writeFile(resolve(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)

async function buildAssetImage(asset, box, width, height) {
  if (asset.type === 'atlas') {
    return buildAtlas(asset, box, width, height)
  }

  const sources = asset.sources.map((source) => ({
    input: resolve(sourceDir, source.file),
    left: source.box[0] - box[0],
    top: source.box[1] - box[1],
  }))

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(sources)
}

async function buildAtlas(asset, box, frameWidth, frameHeight) {
  const composites = asset.frames.map((frame, index) => ({
    input: resolve(sourceDir, frame.file),
    left: index * frameWidth + frame.box[0] - box[0],
    top: frame.box[1] - box[1],
  }))

  return sharp({
    create: {
      width: frameWidth * asset.frames.length,
      height: frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(composites)
}
```

**Step 6: Generate assets**

Run:

```bash
cd web-demo && npm run build:optimized-assets
```

Expected: `web-demo/public/extracted/optimized/` contains 12 PNG files, 12 WebP files, and `manifest.json`.

**Step 7: Run test to verify it passes**

Run:

```bash
cd web-demo && npm run test -- optimizedAssets.generated.test.js
```

Expected: PASS.

**Step 8: Commit**

```bash
git add web-demo/package.json web-demo/package-lock.json web-demo/scripts/build-optimized-assets.mjs web-demo/public/extracted/optimized web-demo/src/react-curtain-sequence/optimizedAssets.generated.test.js
git commit -m "feat: generate optimized curtain assets"
```

---

### Task 4: Add optimized scene data for the React runtime

**Files:**
- Create: `web-demo/src/react-curtain-sequence/optimizedSceneData.js`
- Test: `web-demo/src/react-curtain-sequence/optimizedSceneData.test.js`

**Step 1: Write the failing test**

Create `web-demo/src/react-curtain-sequence/optimizedSceneData.test.js`:

```js
import { describe, expect, it } from 'vitest'
import {
  criticalOptimizedSrcs,
  expressionAtlas,
  optimizedCurtainSceneGroups,
  optimizedLayerByName,
} from './optimizedSceneData'

describe('optimizedSceneData', () => {
  it('exposes a five-image critical set', () => {
    expect(criticalOptimizedSrcs).toHaveLength(5)
    expect(criticalOptimizedSrcs.every((src) => src.includes('/extracted/optimized/'))).toBe(true)
  })

  it('maps generated assets into runtime scene groups', () => {
    expect(optimizedCurtainSceneGroups.background.map((layer) => layer.name)).toEqual(['scene-base'])
    expect(optimizedCurtainSceneGroups.character.map((layer) => layer.name)).toEqual([
      'character-hair-back',
      'character-body',
      'character-hair-front',
    ])
    expect(optimizedLayerByName.get('balloons').loop).toBe('balloons')
    expect(optimizedLayerByName.get('glow').loop).toBe('glow')
  })

  it('exposes expression atlas frames with the original active frame', () => {
    expect(expressionAtlas.frameNames).toEqual(['expr-a', 'expr-b', 'expr-c', 'expr-d'])
    expect(expressionAtlas.activeIndex).toBe(2)
  })
})
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd web-demo && npm run test -- optimizedSceneData.test.js
```

Expected: FAIL because `optimizedSceneData.js` does not exist.

**Step 3: Write minimal implementation**

Create `web-demo/src/react-curtain-sequence/optimizedSceneData.js`:

```js
import manifest from '../../public/extracted/optimized/manifest.json'
import { withBase } from '../basePath'
import { criticalOptimizedAssetNames, optimizedSceneGroups } from './optimizedAssetSpec'
import { BASE_H, BASE_W } from './sceneGeometry'

export { BASE_H, BASE_W }

export const optimizedLayerByName = new Map(
  manifest.assets.map((asset) => [
    asset.name,
    {
      ...asset,
      src: withBase(asset.formats.webp ?? asset.formats.png),
      fallbackSrc: withBase(asset.formats.png),
      className: asset.className,
      style: getOptimizedLayerStyle(asset),
    },
  ]),
)

export const optimizedCurtainSceneGroups = Object.fromEntries(
  Object.entries(optimizedSceneGroups).map(([group, layers]) => [
    group,
    layers.map((layer) => optimizedLayerByName.get(layer.name)),
  ]),
)

export const criticalOptimizedSrcs = criticalOptimizedAssetNames.map((name) => optimizedLayerByName.get(name).src)

export const expressionAtlas = {
  ...optimizedLayerByName.get('expression-atlas'),
  activeIndex: optimizedLayerByName.get('expression-atlas').frameNames.indexOf(optimizedLayerByName.get('expression-atlas').activeFrame),
}

function getOptimizedLayerStyle(asset) {
  const [left, top, right, bottom] = asset.box

  return {
    left: `${(left / BASE_W) * 100}%`,
    top: `${(top / BASE_H) * 100}%`,
    width: `${((right - left) / BASE_W) * 100}%`,
    height: `${((bottom - top) / BASE_H) * 100}%`,
  }
}
```

**Step 4: Run test to verify it passes**

Run:

```bash
cd web-demo && npm run test -- optimizedSceneData.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add web-demo/src/react-curtain-sequence/optimizedSceneData.js web-demo/src/react-curtain-sequence/optimizedSceneData.test.js
git commit -m "feat: add optimized curtain scene data"
```

---

### Task 5: Implement image preloading state with explicit failure handling

**Files:**
- Create: `web-demo/src/react-curtain-sequence/useImagePreload.js`
- Test: `web-demo/src/react-curtain-sequence/useImagePreload.test.jsx`

**Step 1: Write the failing test**

Create `web-demo/src/react-curtain-sequence/useImagePreload.test.jsx`:

```jsx
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useImagePreload } from './useImagePreload'

function Harness({ srcs }) {
  const state = useImagePreload(srcs)
  return (
    <output data-error={state.error?.message ?? ''} data-ready={String(state.ready)}>
      {state.ready ? 'ready' : 'loading'}
    </output>
  )
}

describe('useImagePreload', () => {
  it('sets ready after all images load', async () => {
    const OriginalImage = globalThis.Image
    globalThis.Image = class {
      set src(_value) {
        queueMicrotask(() => this.onload?.())
      }
    }

    render(<Harness srcs={['/a.webp', '/b.webp']} />)

    await waitFor(() => expect(screen.getByText('ready')).toBeInTheDocument())
    globalThis.Image = OriginalImage
  })

  it('surfaces critical image failures', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const OriginalImage = globalThis.Image
    globalThis.Image = class {
      set src(value) {
        queueMicrotask(() => this.onerror?.(new Error(`failed ${value}`)))
      }
    }

    render(<Harness srcs={['/missing.webp']} />)

    await waitFor(() => {
      expect(screen.getByText('loading')).toHaveAttribute('data-error', 'Unable to preload image: /missing.webp')
    })
    expect(errorSpy).toHaveBeenCalled()

    globalThis.Image = OriginalImage
    errorSpy.mockRestore()
  })
})
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd web-demo && npm run test -- useImagePreload.test.jsx
```

Expected: FAIL because `useImagePreload.js` does not exist.

**Step 3: Write minimal implementation**

Create `web-demo/src/react-curtain-sequence/useImagePreload.js`:

```js
import { useEffect, useState } from 'react'

export function useImagePreload(srcs, { failOnError = true } = {}) {
  const [state, setState] = useState({ error: null, ready: false })

  useEffect(() => {
    let cancelled = false
    setState({ error: null, ready: false })

    const promises = srcs.map((src) => preloadImage(src, failOnError))

    Promise.all(promises)
      .then(() => {
        if (!cancelled) setState({ error: null, ready: true })
      })
      .catch((error) => {
        console.error(error)
        if (!cancelled) setState({ error, ready: false })
      })

    return () => {
      cancelled = true
    }
  }, [failOnError, srcs])

  return state
}

function preloadImage(src, failOnError) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = resolve
    img.onerror = () => {
      const error = new Error(`Unable to preload image: ${src}`)
      if (failOnError) reject(error)
      else resolve()
    }
    img.src = src
  })
}
```

**Step 4: Run test to verify it passes**

Run:

```bash
cd web-demo && npm run test -- useImagePreload.test.jsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add web-demo/src/react-curtain-sequence/useImagePreload.js web-demo/src/react-curtain-sequence/useImagePreload.test.jsx
git commit -m "feat: add image preload state handling"
```

---

### Task 6: Switch `CurtainSequencePreview` to optimized assets

**Files:**
- Modify: `web-demo/src/react-curtain-sequence/CurtainSequencePreview.jsx`
- Modify: `web-demo/src/react-curtain-sequence/CurtainSequencePreview.test.jsx`
- Modify: `web-demo/src/react-curtain-sequence/app.css`

**Step 1: Update component tests first**

Modify `CurtainSequencePreview.test.jsx` core render test:

```jsx
it('renders optimized scene groups and images', () => {
  render(<CurtainSequencePreview />)

  expect(screen.getByTestId('curtain-stage')).toBeInTheDocument()
  expect(screen.getByAltText('character-body')).toBeInTheDocument()
  expect(screen.getByAltText('cake-table')).toBeInTheDocument()
  expect(screen.getByAltText('ghost-right')).toBeInTheDocument()

  expect(document.querySelectorAll('.rcs-stage img')).toHaveLength(11)
  expect(document.querySelector('.rcs-expression-stack [role="img"]')).toHaveAccessibleName('expr-c')
  expect(document.querySelector('.rcs-group-character')).toBeInTheDocument()
  expect(document.querySelector('.rcs-group-cake')).toBeInTheDocument()
})
```

Modify expression test:

```jsx
it('cycles expression atlas frames every 3 seconds', () => {
  render(<CurtainSequencePreview expressionIntervalMs={3000} />)

  expect(screen.getByRole('img', { name: 'expr-c' })).toHaveAttribute('data-active', 'true')

  act(() => {
    vi.advanceTimersByTime(3000)
  })

  expect(screen.getByRole('img', { name: 'expr-d' })).toHaveAttribute('data-active', 'true')
})
```

Keep the artist credit and stacking tests, but update assertions only if class names change.

**Step 2: Run tests to verify they fail**

Run:

```bash
cd web-demo && npm run test -- CurtainSequencePreview.test.jsx
```

Expected: FAIL because the runtime still renders old layer names and four expression PNGs.

**Step 3: Refactor runtime imports**

Modify `CurtainSequencePreview.jsx` imports:

```js
import {
  criticalOptimizedSrcs,
  expressionAtlas,
  optimizedCurtainSceneGroups,
} from './optimizedSceneData'
import { useImagePreload } from './useImagePreload'
```

Replace references to `curtainSceneGroups` with `optimizedCurtainSceneGroups`.

Replace `expressionLayers` state initialization:

```js
const [activeExpression, setActiveExpression] = useState(expressionAtlas.activeIndex)
```

Replace `collectCriticalSrcs()` and `usePreloadImages()` usage:

```js
const criticalSrcs = useMemo(() => criticalOptimizedSrcs, [])
const { error: preloadError, ready: assetsReady } = useImagePreload(criticalSrcs)
```

Set stage error data for debugging:

```jsx
<div
  className={`rcs-stage ${!showSequence ? 'rcs-stage--loading' : ''}`}
  data-load-error={preloadError?.message ?? undefined}
  data-sequence-key={sequenceKey}
  data-testid="curtain-stage"
  ...
>
```

**Step 4: Render optimized layers**

Update `getLoopForLayer(name)` to include optimized names:

```js
function getLoopForLayer(name) {
  if (['character-hair-back', 'character-hair-front'].includes(name)) return loopMotion.hair
  if (name === 'character-body') return loopMotion.breathe
  if (name === 'balloons') return loopMotion.balloons
  if (name === 'gifts') return loopMotion.gifts
  if (name === 'ghost-right') return loopMotion.ghost
  if (name === 'glow') return loopMotion.glow
  return null
}
```

Update `LayerImage` to use generated styles:

```jsx
function LayerImage({ animateLoop = true, name, className, src, style }) {
  const loop = animateLoop ? getLoopForLayer(name) : null

  return (
    <motion.img
      alt={name}
      animate={loop ? { ...loop, transition: { duration: loop.duration, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' } } : undefined}
      className={className}
      src={src}
      style={style}
    />
  )
}
```

Add expression atlas renderer:

```jsx
function ExpressionAtlas({ activeExpression }) {
  return expressionAtlas.frameNames.map((frameName, index) => {
    const isActive = index === activeExpression
    return (
      <motion.div
        aria-label={frameName}
        className="expression-layer expression-layer--atlas"
        data-active={String(isActive)}
        initial={{ opacity: isActive ? 1 : 0 }}
        key={frameName}
        role="img"
        animate={{ opacity: isActive ? 1 : 0 }}
        style={{
          ...expressionAtlas.style,
          '--expression-frame': index,
          '--expression-frame-count': expressionAtlas.frameNames.length,
          backgroundImage: `url(${expressionAtlas.src})`,
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      />
    )
  })
}
```

Render it inside `.rcs-expression-stack`:

```jsx
<div className="rcs-expression-stack">
  <ExpressionAtlas activeExpression={activeExpression} />
</div>
```

Update interval modulo:

```js
setActiveExpression((current) => (current + 1) % expressionAtlas.frameNames.length)
```

**Step 5: Update CSS for atlas expressions**

Add to `app.css`:

```css
.expression-layer--atlas {
  position: absolute;
  background-position: calc(var(--expression-frame) * -100%) 0;
  background-repeat: no-repeat;
  background-size: calc(var(--expression-frame-count) * 100%) 100%;
  pointer-events: none;
  user-select: none;
}
```

**Step 6: Run tests to verify they pass**

Run:

```bash
cd web-demo && npm run test -- CurtainSequencePreview.test.jsx
```

Expected: PASS.

**Step 7: Commit**

```bash
git add web-demo/src/react-curtain-sequence/CurtainSequencePreview.jsx web-demo/src/react-curtain-sequence/CurtainSequencePreview.test.jsx web-demo/src/react-curtain-sequence/app.css
git commit -m "feat: render optimized curtain assets"
```

---

### Task 7: Gate non-critical groups without blocking the main scene

**Files:**
- Modify: `web-demo/src/react-curtain-sequence/optimizedSceneData.js`
- Modify: `web-demo/src/react-curtain-sequence/CurtainSequencePreview.jsx`
- Modify: `web-demo/src/react-curtain-sequence/CurtainSequencePreview.test.jsx`

**Step 1: Write failing tests**

Add to `optimizedSceneData.test.js`:

```js
import { nonCriticalOptimizedSrcs } from './optimizedSceneData'

it('exposes non-critical sources separately from critical sources', () => {
  expect(nonCriticalOptimizedSrcs).toHaveLength(7)
  for (const src of nonCriticalOptimizedSrcs) {
    expect(criticalOptimizedSrcs).not.toContain(src)
  }
})
```

Add to `CurtainSequencePreview.test.jsx`:

```jsx
it('does not block the main loading sequence on non-critical assets', () => {
  render(<CurtainSequencePreview />)

  expect(screen.getByTestId('curtain-stage')).toBeInTheDocument()
  expect(document.querySelector('.rcs-group-cake')).toHaveAttribute('data-non-critical-ready')
})
```

**Step 2: Run tests to verify they fail**

Run:

```bash
cd web-demo && npm run test -- optimizedSceneData.test.js CurtainSequencePreview.test.jsx
```

Expected: FAIL because non-critical source tracking is not implemented.

**Step 3: Implement non-critical source exports**

Modify `optimizedSceneData.js`:

```js
export const nonCriticalOptimizedSrcs = manifest.assets
  .filter((asset) => !criticalOptimizedAssetNames.includes(asset.name))
  .map((asset) => optimizedLayerByName.get(asset.name).src)
```

**Step 4: Preload non-critical images without failing the main scene**

Modify `CurtainSequencePreview.jsx`:

```js
import {
  criticalOptimizedSrcs,
  expressionAtlas,
  nonCriticalOptimizedSrcs,
  optimizedCurtainSceneGroups,
} from './optimizedSceneData'
```

Inside the component:

```js
const { ready: nonCriticalReady } = useImagePreload(nonCriticalOptimizedSrcs, { failOnError: false })
```

Add data attributes to non-critical group wrappers:

```jsx
<motion.div
  animate={showSequence && nonCriticalReady ? 'visible' : 'hidden'}
  className={`rcs-group rcs-group-cake ${groupSceneClasses.cake}`}
  data-non-critical-ready={String(nonCriticalReady)}
  initial="hidden"
  variants={groupVariants.cake}
>
```

Apply the same pattern to cake, balloons, gifts, mascot, ghost, and fx if fx is wrapped. If fx stays outside a group, wrap it in:

```jsx
<motion.div
  animate={showSequence && nonCriticalReady ? 'visible' : 'hidden'}
  className="rcs-group rcs-group-fx"
  data-non-critical-ready={String(nonCriticalReady)}
  initial="hidden"
  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
>
  {renderGroup(optimizedCurtainSceneGroups.fx)}
</motion.div>
```

**Step 5: Run tests to verify they pass**

Run:

```bash
cd web-demo && npm run test -- optimizedSceneData.test.js CurtainSequencePreview.test.jsx
```

Expected: PASS.

**Step 6: Commit**

```bash
git add web-demo/src/react-curtain-sequence/optimizedSceneData.js web-demo/src/react-curtain-sequence/CurtainSequencePreview.jsx web-demo/src/react-curtain-sequence/CurtainSequencePreview.test.jsx
git commit -m "feat: preload non-critical curtain assets"
```

---

### Task 8: Add measurable asset budget validation

**Files:**
- Create: `web-demo/scripts/report-optimized-assets.mjs`
- Modify: `web-demo/package.json`

**Step 1: Add reporting script**

Create `web-demo/scripts/report-optimized-assets.mjs`:

```js
import { statSync } from 'node:fs'
import { resolve } from 'node:path'
import manifest from '../public/extracted/optimized/manifest.json' with { type: 'json' }

const projectRoot = resolve(import.meta.dirname, '..')
const webpBytes = manifest.assets.reduce((sum, asset) => {
  return sum + statSync(resolve(projectRoot, 'public', asset.formats.webp)).size
}, 0)

const result = {
  assetRequests: manifest.assets.length,
  criticalRequests: manifest.critical.length,
  webpMiB: Number((webpBytes / 1024 / 1024).toFixed(2)),
}

console.log(JSON.stringify(result, null, 2))

if (result.assetRequests > 12) {
  throw new Error(`Expected at most 12 optimized asset requests, got ${result.assetRequests}`)
}

if (result.criticalRequests > 5) {
  throw new Error(`Expected at most 5 critical requests, got ${result.criticalRequests}`)
}

if (webpBytes >= 7.69 * 1024 * 1024) {
  throw new Error(`Expected optimized WebP bytes below 7.69MiB, got ${result.webpMiB}MiB`)
}
```

**Step 2: Add package script**

Modify `web-demo/package.json`:

```json
{
  "scripts": {
    "check:optimized-assets": "node scripts/report-optimized-assets.mjs"
  }
}
```

Keep all existing scripts.

**Step 3: Run the budget check**

Run:

```bash
cd web-demo && npm run check:optimized-assets
```

Expected: PASS and prints JSON with `assetRequests` no greater than 12, `criticalRequests` no greater than 5, and `webpMiB` below 7.69.

**Step 4: Commit**

```bash
git add web-demo/scripts/report-optimized-assets.mjs web-demo/package.json
git commit -m "test: add curtain asset budget check"
```

---

### Task 9: Run final validation

**Files:**
- No file changes expected unless a previous task exposed a bug.

**Step 1: Regenerate optimized assets**

Run:

```bash
cd web-demo && npm run build:optimized-assets
```

Expected: exits 0 and rewrites `web-demo/public/extracted/optimized`.

**Step 2: Run unit tests**

Run:

```bash
cd web-demo && npm run test
```

Expected: all Vitest tests PASS.

**Step 3: Run production build**

Run:

```bash
cd web-demo && npm run build
```

Expected: Vite build succeeds.

**Step 4: Run asset budget check**

Run:

```bash
cd web-demo && npm run check:optimized-assets
```

Expected: exits 0 with request and byte budgets within target.

**Step 5: Manual visual verification**

Run:

```bash
cd web-demo && npm run dev
```

Open the local Vite URL and verify:

- background, character, cake, balloons, gifts, ghost, mascot, glow, and filter appear in the expected stacking order.
- hair sway, breathing, expression cycling, balloon floating, gift floating, ghost motion, glow pulse, and pointer parallax still work.
- the artist credit remains above the light-raster overlay.
- no broken images appear in the browser Network panel.

Stop the Vite server after checking.

**Step 6: Final commit if validation caused fixes**

Only run this if Step 1-5 required additional edits:

```bash
git add web-demo
git commit -m "fix: finalize optimized curtain sequence"
```

---

## Execution notes

- Use `git --no-pager status --short` before each commit to avoid committing unrelated user changes.
- Do not modify source PSD extraction outputs except by reading from `web-demo/public/extracted/layers`.
- If WebP generation fails because local `sharp` lacks WebP support, stop and fix the toolchain instead of silently falling back to PNG-only output.
- Keep generated optimized assets committed so GitHub Pages can serve them without running the generation script during deployment.
- If a visual issue appears after grouping, prefer adjusting the composite grouping in `optimizedAssetSpec.js` over adding ad hoc CSS offsets in `CurtainSequencePreview.jsx`.
