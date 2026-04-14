# React Motion Curtain Sequence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在保留現有 `web-demo` demo 頁面與 `/curtain-sequence/` route 不變的前提下，新增一個可在同專案中預覽的 React + Motion 版本，重現目前的序列進場動畫，補上 RWD，並用 Playwright 截圖驗證。

**Architecture:** 保留 `web-demo/index.html` 與 `web-demo/src/main.js` 作為原始 vanilla 版本，另外新增 Vite MPA 頁面 `web-demo/react-curtain-sequence/index.html` 作為 React 預覽入口。React 版本的靜態圖層資料從 `web-demo/src/main.js:3-192` 複製到專用資料模組，動畫改用 `motion/react` 的 variants、stagger 與 loop 驅動；RWD 透過同一套 scene data 搭配 breakpoint 設定與 CSS 控制焦點區域、縮放與動態幅度。

**Tech Stack:** Vite MPA、React、ReactDOM、Motion (`motion/react`)、Vitest、Testing Library、Playwright。

---

## Current Behavior To Preserve

- 參考來源：`web-demo/src/main.js:417-490`
- 相關樣式：`web-demo/src/style.css:364-674`
- 現有 `/curtain-sequence/` 效果重點：
  - 場景由 38 張以上的透明 PNG 絕對定位堆疊而成。
  - 主進場順序固定：人物整組 -> 蛋糕 -> 氣球 -> 禮物 -> 婚叫 -> 湯圓。
  - 進場基調為淡入 + 位移 + blur 消退。
  - 主進程後進入持續循環：頭髮擺動、呼吸、氣球浮動、禮物彈跳、婚叫 bob、光暈 pulse。
  - 表情層每 3 秒輪播一次。
  - 指標移動會改變 `--mx` / `--my`，帶出 pointer parallax。
  - 目前 mobile 只是用 CSS 強制裁切與放大，沒有真正針對 React 元件做可維護的 RWD 策略。

## Required Skills During Execution

- `@using-git-worktrees`
- `@vite`
- `@vitest`
- `@playwright`
- `@verification-before-completion`

## Preflight

1. 用 `@using-git-worktrees` 建立專用 worktree，再開始實作。
2. 不要修改 `web-demo/src/main.js` 的既有 `/curtain-sequence/` 行為。
3. React 預覽頁直接走新 route：`/react-curtain-sequence/`。
4. 所有新檔案都放在 `web-demo/` 內，方便直接 `npm run dev` 預覽。

### Task 1: 建立 React MPA 入口與測試骨架

**Files:**
- Modify: `web-demo/package.json`
- Create: `web-demo/vite.config.js`
- Create: `web-demo/react-curtain-sequence/index.html`
- Create: `web-demo/src/react-curtain-sequence/main.jsx`
- Create: `web-demo/src/react-curtain-sequence/App.jsx`
- Create: `web-demo/src/react-curtain-sequence/app.css`
- Test: `web-demo/src/react-curtain-sequence/App.test.jsx`

**Step 1: 加入依賴與 script**

把 `web-demo/package.json` 改成至少包含以下依賴與 script：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "motion": "^12.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.54.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.3.0",
    "@vitejs/plugin-react": "^5.0.0",
    "jsdom": "^26.0.0",
    "vite": "^8.0.4",
    "vitest": "^3.2.0"
  }
}
```

**Step 2: 安裝依賴**

Run: `npm install`

Expected: 安裝完成且沒有 dependency resolution error。

**Step 3: 寫 Vite MPA 設定**

建立 `web-demo/vite.config.js`：

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/react-curtain-sequence/test/setup.js'],
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        reactCurtainSequence: resolve(__dirname, 'react-curtain-sequence/index.html'),
      },
    },
  },
})
```

**Step 4: 建立新的 HTML 入口**

建立 `web-demo/react-curtain-sequence/index.html`：

```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Curtain Sequence</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/react-curtain-sequence/main.jsx"></script>
  </body>
</html>
```

**Step 5: 先寫失敗測試**

建立 `web-demo/src/react-curtain-sequence/App.test.jsx`：

```jsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('React curtain sequence shell', () => {
  it('renders the preview heading and replay button', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'React Curtain Sequence Preview' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重播主進程' })).toBeInTheDocument()
  })
})
```

**Step 6: 跑測試確認失敗**

Run: `npx vitest run src/react-curtain-sequence/App.test.jsx`

Expected: FAIL，因為 `App.jsx` 尚未存在。

**Step 7: 寫最小 React 入口實作**

建立 `web-demo/src/react-curtain-sequence/main.jsx`：

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './app.css'

createRoot(document.getElementById('app')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

建立 `web-demo/src/react-curtain-sequence/App.jsx`：

```jsx
export default function App() {
  return (
    <main>
      <h1>React Curtain Sequence Preview</h1>
      <button type="button">重播主進程</button>
    </main>
  )
}
```

建立 `web-demo/src/react-curtain-sequence/app.css`：

```css
html,
body,
#app {
  min-height: 100%;
  margin: 0;
}
```

建立 `web-demo/src/react-curtain-sequence/test/setup.js`：

```js
import '@testing-library/jest-dom/vitest'
```

**Step 8: 跑測試確認通過**

Run: `npx vitest run src/react-curtain-sequence/App.test.jsx`

Expected: PASS。

**Step 9: 手動確認新 route 可開啟**

Run: `npm run dev`

Then open: `http://127.0.0.1:5173/react-curtain-sequence/`

Expected: React 頁面可載入，原本 `http://127.0.0.1:5173/curtain-sequence/` 不受影響。

**Step 10: Commit**

```bash
git add package.json package-lock.json vite.config.js react-curtain-sequence/index.html src/react-curtain-sequence
git commit -m "feat: add React curtain sequence preview entry"
```

### Task 2: 抽出 PSD 圖層資料並建立靜態場景

**Files:**
- Create: `web-demo/src/react-curtain-sequence/sceneData.js`
- Create: `web-demo/src/react-curtain-sequence/CurtainSequencePreview.jsx`
- Modify: `web-demo/src/react-curtain-sequence/App.jsx`
- Test: `web-demo/src/react-curtain-sequence/CurtainSequencePreview.test.jsx`

**Step 1: 先寫失敗測試，確認圖層與分組有 render 出來**

建立 `web-demo/src/react-curtain-sequence/CurtainSequencePreview.test.jsx`：

```jsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CurtainSequencePreview from './CurtainSequencePreview'

describe('CurtainSequencePreview', () => {
  it('renders core scene groups and images', () => {
    render(<CurtainSequencePreview />)

    expect(screen.getByTestId('curtain-stage')).toBeInTheDocument()
    expect(screen.getByAltText('body')).toBeInTheDocument()
    expect(screen.getByAltText('cake')).toBeInTheDocument()
    expect(screen.getByAltText('ghost-right')).toBeInTheDocument()
  })
})
```

**Step 2: 跑測試確認失敗**

Run: `npx vitest run src/react-curtain-sequence/CurtainSequencePreview.test.jsx`

Expected: FAIL，因為 `CurtainSequencePreview.jsx` 尚未存在。

**Step 3: 建立 scene data 模組**

建立 `web-demo/src/react-curtain-sequence/sceneData.js`，把以下資料完整複製並轉成 export：

- `BASE_W`、`BASE_H`：來源 `web-demo/src/main.js:3-4`
- `expressionDefs`：來源 `web-demo/src/main.js:45-50`
- `layerBoxes`：來源 `web-demo/src/main.js:52-93`
- `inlineStyleFor()` 的百分比定位邏輯：來源 `web-demo/src/main.js:121-130`
- `buildCurtainCompositionHTML()` 中的場景分組順序：來源 `web-demo/src/main.js:144-191`

檔案骨架：

```js
export const BASE_W = 2283
export const BASE_H = 1302

export const expressionLayers = [/* copy from main.js */]

export const curtainSceneGroups = {
  background: [/* paper, bg, wall-art-left, wall-art-right, bunting, window-light */],
  character: [/* legs, twin-left, ... left-arm */],
  cake: [/* cake, table */],
  balloons: [/* balloon-back-blue, balloon-back-pink, balloon-mid-b, balloon-mid-a */],
  gifts: [/* gift-blue, gift-red */],
  ghost: [/* ghost-right */],
  mascot: [/* mascot-cake */],
  fx: [/* glow, filter */],
}

export const layerBoxes = { /* copy exact values from main.js */ }

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

**Step 4: 建立靜態 React 場景**

建立 `web-demo/src/react-curtain-sequence/CurtainSequencePreview.jsx`，先只做靜態圖層 render，不做 Motion：

```jsx
import { curtainSceneGroups, expressionLayers, getLayerStyle } from './sceneData'

function LayerImage({ name, className, src }) {
  return <img alt={name} className={className} src={src} style={getLayerStyle(name)} />
}

export default function CurtainSequencePreview() {
  return (
    <section className="rcs-shell">
      <div className="rcs-toolbar">
        <div>
          <p className="rcs-eyebrow">React + Motion</p>
          <h1>React Curtain Sequence Preview</h1>
        </div>
        <button type="button">重播主進程</button>
      </div>

      <div className="rcs-stage" data-testid="curtain-stage">
        <div className="rcs-stage-inner">
          {curtainSceneGroups.background.map(LayerImage)}
          <div className="rcs-group rcs-group-character">
            {curtainSceneGroups.character.map(LayerImage)}
            <div className="rcs-expression-stack">
              {expressionLayers.map(LayerImage)}
            </div>
          </div>
          <div className="rcs-group rcs-group-cake">{curtainSceneGroups.cake.map(LayerImage)}</div>
          <div className="rcs-group rcs-group-balloons">{curtainSceneGroups.balloons.map(LayerImage)}</div>
          <div className="rcs-group rcs-group-gifts">{curtainSceneGroups.gifts.map(LayerImage)}</div>
          <div className="rcs-group rcs-group-ghost">{curtainSceneGroups.ghost.map(LayerImage)}</div>
          <div className="rcs-group rcs-group-mascot">{curtainSceneGroups.mascot.map(LayerImage)}</div>
          {curtainSceneGroups.fx.map(LayerImage)}
        </div>
      </div>
    </section>
  )
}
```

**Step 5: 把 `App.jsx` 改成掛載 React 場景**

```jsx
import CurtainSequencePreview from './CurtainSequencePreview'

export default function App() {
  return <CurtainSequencePreview />
}
```

**Step 6: 在 `app.css` 補上靜態版基本樣式**

至少先補：

```css
.rcs-stage {
  position: relative;
  width: min(100%, 1200px);
  aspect-ratio: 2283 / 1302;
  overflow: hidden;
  border-radius: 24px;
}

.rcs-stage-inner,
.rcs-group,
.rcs-expression-stack {
  position: absolute;
  inset: 0;
}

.rcs-stage img {
  position: absolute;
  pointer-events: none;
  user-select: none;
}
```

**Step 7: 跑測試確認通過**

Run: `npx vitest run src/react-curtain-sequence/CurtainSequencePreview.test.jsx`

Expected: PASS。

**Step 8: 手動比對靜態視覺順序**

Run: `npm run dev`

Open both:

- `http://127.0.0.1:5173/curtain-sequence/`
- `http://127.0.0.1:5173/react-curtain-sequence/`

Expected: React 版本的靜態構圖、圖層前後順序、角色與蛋糕位置大致對齊原版。

**Step 9: Commit**

```bash
git add src/react-curtain-sequence/App.jsx src/react-curtain-sequence/CurtainSequencePreview.jsx src/react-curtain-sequence/CurtainSequencePreview.test.jsx src/react-curtain-sequence/sceneData.js src/react-curtain-sequence/app.css
git commit -m "feat: render curtain sequence scene in React"
```

### Task 3: 用 Motion 重建序列進場、輪播表情與 replay

**Files:**
- Modify: `web-demo/src/react-curtain-sequence/CurtainSequencePreview.jsx`
- Create: `web-demo/src/react-curtain-sequence/sequenceConfig.js`
- Test: `web-demo/src/react-curtain-sequence/CurtainSequencePreview.test.jsx`

**Step 1: 先寫失敗測試，鎖定序列與表情切換**

在 `CurtainSequencePreview.test.jsx` 增加：

```jsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CurtainSequencePreview from './CurtainSequencePreview'

describe('Curtain sequence interactions', () => {
  it('restarts the sequence when replay is clicked', () => {
    render(<CurtainSequencePreview />)

    const stage = screen.getByTestId('curtain-stage')
    const firstKey = stage.getAttribute('data-sequence-key')

    fireEvent.click(screen.getByRole('button', { name: '重播主進程' }))

    expect(stage.getAttribute('data-sequence-key')).not.toBe(firstKey)
  })

  it('cycles expressions every 3 seconds', () => {
    vi.useFakeTimers()
    render(<CurtainSequencePreview expressionIntervalMs={3000} />)

    expect(screen.getByAltText('expr-c')).toHaveAttribute('data-active', 'true')

    vi.advanceTimersByTime(3000)

    expect(screen.getByAltText('expr-d')).toHaveAttribute('data-active', 'true')
    vi.useRealTimers()
  })
})
```

**Step 2: 跑測試確認失敗**

Run: `npx vitest run src/react-curtain-sequence/CurtainSequencePreview.test.jsx`

Expected: FAIL，因為目前沒有 sequence state 與 expression state。

**Step 3: 定義 Motion 序列設定**

建立 `web-demo/src/react-curtain-sequence/sequenceConfig.js`：

```js
export const sequenceOrder = [
  { key: 'character', delay: 0.2, duration: 0.9, blurFrom: 18, y: 24 },
  { key: 'cake', delay: 1.2, duration: 0.7, blurFrom: 18, y: 18 },
  { key: 'balloons', delay: 2.0, duration: 0.8, blurFrom: 18, y: 22 },
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
```

**Step 4: 在 React 元件接上 Motion**

把 `CurtainSequencePreview.jsx` 改成使用 `motion.div` / `motion.img`，最少要包含：

```jsx
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { curtainSceneGroups, expressionLayers, getLayerStyle } from './sceneData'
import { loopMotion, sequenceOrder } from './sequenceConfig'

const sequenceByKey = Object.fromEntries(sequenceOrder.map((item) => [item.key, item]))

function buildEnterVariant(config) {
  return {
    hidden: {
      opacity: 0,
      x: config.x ?? 0,
      y: config.y ?? 0,
      scale: config.scale ?? 0.98,
      filter: `blur(${config.blurFrom}px)`,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        delay: config.delay,
        duration: config.duration,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }
}

export default function CurtainSequencePreview({ expressionIntervalMs = 3000 }) {
  const [sequenceKey, setSequenceKey] = useState(0)
  const [activeExpression, setActiveExpression] = useState(2)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveExpression((current) => (current + 1) % expressionLayers.length)
    }, expressionIntervalMs)

    return () => window.clearInterval(timer)
  }, [expressionIntervalMs])

  return (
    <section className="rcs-shell">
      <div className="rcs-toolbar">
        <div>
          <p className="rcs-eyebrow">React + Motion</p>
          <h1>React Curtain Sequence Preview</h1>
        </div>
        <button type="button" onClick={() => setSequenceKey((value) => value + 1)}>
          重播主進程
        </button>
      </div>

      <div className="rcs-stage" data-sequence-key={sequenceKey} data-testid="curtain-stage">
        <motion.div animate={{ x: 0, y: 0 }} className="rcs-stage-inner" initial={false} key={sequenceKey}>
          {/* render each group with initial="hidden" animate="visible" and group-specific loop animation */}
        </motion.div>
      </div>
    </section>
  )
}
```

實作要求：

- 角色、蛋糕、氣球、禮物、婚叫、湯圓六組都要依 `sequenceOrder` 進場。
- 角色內的頭髮、呆毛、身體、手要套用 loop motion。
- `expr-a` 到 `expr-d` 要保留，且只有一張 `data-active="true"`。
- replay 必須透過 `key` 重新掛載 Motion subtree，而不是手動改 DOM class。

**Step 5: 加入 pointer parallax，但改成 React state / CSS variable**

在 `CurtainSequencePreview.jsx` 加上：

```jsx
const [pointer, setPointer] = useState({ x: 0, y: 0 })

function handlePointerMove(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width - 0.5
  const y = (event.clientY - rect.top) / rect.height - 0.5
  setPointer({ x, y })
}

function handlePointerLeave() {
  setPointer({ x: 0, y: 0 })
}
```

然後把值寫進 `style={{ '--mx': pointer.x, '--my': pointer.y }}`，讓 CSS 延續視差效果。

**Step 6: 跑測試確認通過**

Run: `npx vitest run src/react-curtain-sequence/CurtainSequencePreview.test.jsx`

Expected: PASS。

**Step 7: 手動確認動畫節奏**

Run: `npm run dev`

Open: `http://127.0.0.1:5173/react-curtain-sequence/`

Checklist：

- 人物先進場。
- 蛋糕第二個進場。
- 表情每 3 秒切換。
- 點擊 `重播主進程` 可以完整重播。
- 滑鼠移動仍可看到 parallax。

**Step 8: Commit**

```bash
git add src/react-curtain-sequence/CurtainSequencePreview.jsx src/react-curtain-sequence/CurtainSequencePreview.test.jsx src/react-curtain-sequence/sequenceConfig.js
git commit -m "feat: animate curtain sequence with Motion"
```

### Task 4: 補齊 RWD、reduced motion 與可截圖的穩定狀態

**Files:**
- Create: `web-demo/src/react-curtain-sequence/responsiveConfig.js`
- Modify: `web-demo/src/react-curtain-sequence/CurtainSequencePreview.jsx`
- Modify: `web-demo/src/react-curtain-sequence/app.css`
- Test: `web-demo/src/react-curtain-sequence/responsiveConfig.test.js`

**Step 1: 先寫失敗測試，鎖定 breakpoint 策略**

建立 `web-demo/src/react-curtain-sequence/responsiveConfig.test.js`：

```js
import { describe, expect, it } from 'vitest'
import { getViewportMode } from './responsiveConfig'

describe('getViewportMode', () => {
  it('returns mobile below 720px', () => {
    expect(getViewportMode(390)).toBe('mobile')
  })

  it('returns tablet below 1100px', () => {
    expect(getViewportMode(1024)).toBe('tablet')
  })

  it('returns desktop at 1100px and above', () => {
    expect(getViewportMode(1440)).toBe('desktop')
  })
})
```

**Step 2: 跑測試確認失敗**

Run: `npx vitest run src/react-curtain-sequence/responsiveConfig.test.js`

Expected: FAIL，因為 `responsiveConfig.js` 尚未存在。

**Step 3: 建立 responsive 設定**

建立 `web-demo/src/react-curtain-sequence/responsiveConfig.js`：

```js
export function getViewportMode(width) {
  if (width < 720) return 'mobile'
  if (width < 1100) return 'tablet'
  return 'desktop'
}

export const viewportTransforms = {
  desktop: { scale: 1.01, translateY: '0%', origin: 'center center', parallax: 1 },
  tablet: { scale: 1.12, translateY: '2%', origin: 'center 40%', parallax: 0.72 },
  mobile: { scale: 1.28, translateY: '4%', origin: 'center 38%', parallax: 0.5 },
}
```

**Step 4: 在 React 元件接上 viewport 與 reduced motion**

在 `CurtainSequencePreview.jsx`：

- 監聽 `window.innerWidth`，取得 `viewportMode`。
- 使用 `useReducedMotion()` 控制 loop motion 與進場時間。
- 支援 query string：`?scene=settled`，直接跳到完成進場後的靜態 loop 狀態，方便 Playwright 截圖。

最少加入這段：

```jsx
import { useReducedMotion } from 'motion/react'
import { getViewportMode, viewportTransforms } from './responsiveConfig'

const searchParams = new URLSearchParams(window.location.search)
const forcedScene = searchParams.get('scene')
const reduceMotion = useReducedMotion()
```

實作要求：

- `scene=settled` 時不要跑進場動畫，直接顯示最終位置。
- mobile 要優先保住臉、身體、蛋糕、湯圓，不要讓主要焦點被裁掉。
- tablet / mobile 要降低 parallax 幅度。

**Step 5: 把 `app.css` 補成三段式 RWD**

至少要有以下規則：

```css
.rcs-stage {
  width: 100%;
  aspect-ratio: 2283 / 1302;
}

.rcs-stage-inner {
  transform:
    translate3d(calc(var(--mx, 0) * -8px), calc(var(--my, 0) * -8px), 0)
    scale(var(--scene-scale, 1.01))
    translateY(var(--scene-shift-y, 0%));
  transform-origin: var(--scene-origin, center center);
}

@media (max-width: 1099px) {
  .rcs-shell {
    padding: 20px;
  }
}

@media (max-width: 719px) {
  .rcs-stage {
    aspect-ratio: 4 / 5;
  }

  .rcs-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

**Step 6: 跑測試確認通過**

Run: `npx vitest run src/react-curtain-sequence/responsiveConfig.test.js src/react-curtain-sequence/CurtainSequencePreview.test.jsx`

Expected: PASS。

**Step 7: 手動確認三個 viewport**

Run: `npm run dev`

Open `http://127.0.0.1:5173/react-curtain-sequence/?scene=settled`，至少檢查：

- 1440px：整體構圖完整。
- 1024px：主要角色與蛋糕仍在可視區域中央。
- 390px：臉、身體、蛋糕、湯圓都清楚可見。

**Step 8: Commit**

```bash
git add src/react-curtain-sequence/CurtainSequencePreview.jsx src/react-curtain-sequence/app.css src/react-curtain-sequence/responsiveConfig.js src/react-curtain-sequence/responsiveConfig.test.js
git commit -m "feat: add responsive layout for React curtain sequence"
```

### Task 5: 建立 Playwright 截圖驗證

**Files:**
- Create: `web-demo/playwright.config.js`
- Create: `web-demo/tests/e2e/react-curtain-sequence.spec.js`
- Modify: `web-demo/package.json`

**Step 1: 先寫 Playwright 測試檔**

建立 `web-demo/tests/e2e/react-curtain-sequence.spec.js`：

```js
import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'desktop', width: 1440, height: 1100 },
  { name: 'tablet', width: 1024, height: 1366 },
  { name: 'mobile', width: 390, height: 844 },
]

for (const viewport of viewports) {
  test(`react curtain sequence settled layout - ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/react-curtain-sequence/?scene=settled`)

    await expect(page.getByRole('heading', { name: 'React Curtain Sequence Preview' })).toBeVisible()
    await expect(page.locator('[data-testid="curtain-stage"]')).toBeVisible()
    await expect(page.getByAltText('body')).toBeVisible()
    await expect(page.getByAltText('cake')).toBeVisible()

    await page.screenshot({
      path: `test-results/react-curtain-sequence-${viewport.name}.png`,
      fullPage: true,
    })
  })
}
```

**Step 2: 建立 Playwright 設定**

建立 `web-demo/playwright.config.js`：

```js
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/react-curtain-sequence/',
    reuseExistingServer: true,
    timeout: 120000,
  },
})
```

**Step 3: 安裝瀏覽器**

Run: `npx playwright install chromium`

Expected: Chromium 安裝完成。

**Step 4: 執行 E2E 截圖**

Run: `npm run test:e2e -- react-curtain-sequence.spec.js`

Expected: PASS，並輸出：

- `web-demo/test-results/react-curtain-sequence-desktop.png`
- `web-demo/test-results/react-curtain-sequence-tablet.png`
- `web-demo/test-results/react-curtain-sequence-mobile.png`

**Step 5: 人工檢查截圖**

檢查三張圖是否符合：

- Desktop：整體構圖完整、沒有奇怪空白。
- Tablet：角色與蛋糕沒有被 panel 或 viewport 擠出畫面。
- Mobile：臉、身體、蛋糕、湯圓仍是視覺中心。

**Step 6: Commit**

```bash
git add playwright.config.js tests/e2e/react-curtain-sequence.spec.js package.json package-lock.json
git commit -m "test: add Playwright screenshot checks for React curtain sequence"
```

### Task 6: 完成 build 驗證與 `pixi.js` 評估文件

**Files:**
- Create: `docs/research/2026-04-13-react-motion-vs-pixi-curtain-sequence.md`
- Modify: `web-demo/package.json`

**Step 1: 跑完整驗證**

Run: `npm run test && npm run build && npm run test:e2e -- react-curtain-sequence.spec.js`

Expected: 全部 PASS，`dist/` 同時輸出原頁與 React MPA 頁面。

**Step 2: 用 Chrome / Playwright 記錄觀察指標**

至少記錄：

- 初次載入請求數量與總張數。
- 主進場期間是否有掉幀。
- mobile viewport 是否有明顯 jank。
- `filter: blur()` 與大量 PNG 疊圖是否成為主要瓶頸。

**Step 3: 撰寫評估文件**

建立 `docs/research/2026-04-13-react-motion-vs-pixi-curtain-sequence.md`，至少包含以下結論骨架：

```md
# React Motion vs Pixi.js for Curtain Sequence

## 現況
- 場景主要是 2D PNG 圖層。
- 互動僅包含 replay、表情輪播、pointer parallax。
- 動畫大多是 transform、opacity、scale、少量 blur。

## React + Motion 的優點
- 與未來 Next.js 整合成本最低。
- 元件切分、狀態控制、RWD、可測試性較單純。
- 對目前這種低互動、低粒子數的序列動畫已足夠。

## Pixi.js 可能帶來的提升
- 若未來要加大量粒子、遮罩、shader、動態光暈、鏡頭運動，Pixi.js 會更有優勢。
- 若要同時操作數百個 sprite 或更重的 filter，Canvas / WebGL 通常比 DOM 疊圖更穩。

## Pixi.js 的代價
- 與 Next.js / React UI 層的整合更複雜。
- 無障礙、DOM 測試、RWD 調整成本變高。
- 美術資產 slicing、hit area、renderer lifecycle 需要更多維護。

## Recommendation
- 目前先維持 React + Motion。
- 只有在以下條件成立時才值得導入 Pixi.js：
  1. 需要大幅增加粒子數或 shader 效果。
  2. DOM 版在目標 mobile 裝置明顯掉幀。
  3. 需要更電影感的 camera 與合成特效。
```

**Step 4: 若要更有依據，再補一個小型結論表**

在研究文件加入：

```md
| 面向 | React + Motion | Pixi.js |
| --- | --- | --- |
| 導入成本 | 低 | 高 |
| Next.js 整合 | 佳 | 中 |
| DOM 可測試性 | 高 | 低 |
| 大量粒子/濾鏡 | 中 | 高 |
| 本案適配度 | 高 | 條件式 |
```

**Step 5: Commit**

```bash
git add docs/research/2026-04-13-react-motion-vs-pixi-curtain-sequence.md
git commit -m "docs: evaluate Pixi.js for curtain sequence animation"
```

## Final Verification Checklist

- [ ] `http://127.0.0.1:5173/curtain-sequence/` 仍維持原本的 vanilla 行為。
- [ ] `http://127.0.0.1:5173/react-curtain-sequence/` 可預覽 React + Motion 版本。
- [ ] React 版主進場順序與原版一致。
- [ ] replay、表情輪播、pointer parallax 都存在。
- [ ] Desktop / Tablet / Mobile 都有 Playwright 截圖產物。
- [ ] `npm run test`、`npm run build`、`npm run test:e2e` 全部通過。
- [ ] `pixi.js` 評估文件已寫完，且結論是基於本案場景特性，不是泛泛而談。
