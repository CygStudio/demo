import './style.css'
import { getAppPathname, withBase } from './basePath'

const BASE_W = 2283
const BASE_H = 1302

const assetPath = (path) => withBase(path)
const routePath = (path = '') => withBase(path)

const layerDefs = [
  ['paper', 'paper', assetPath('extracted/layers/000_紙張_1.png')],
  ['bg', 'bg', assetPath('extracted/layers/004_背景_1.png')],
  ['wall-art-left', 'bg-decor', assetPath('extracted/layers/005_畫四湯圓_1.png')],
  ['wall-art-right', 'bg-decor', assetPath('extracted/layers/006_畫婚叫_1.png')],
  ['balloon-back-blue', 'balloons back', assetPath('extracted/layers/008_藍_1.png')],
  ['balloon-back-pink', 'balloons back', assetPath('extracted/layers/009_粉_1.png')],
  ['bunting', 'decor', assetPath('extracted/layers/010_掛帶_1.png')],
  ['window-light', 'light', assetPath('extracted/layers/011_窗光_1.png')],
  ['balloon-mid-b', 'balloons mid', assetPath('extracted/layers/013_B_1.png')],
  ['balloon-mid-a', 'balloons mid', assetPath('extracted/layers/014_A_1.png')],
  ['confetti-back', 'confetti back', assetPath('extracted/layers/016_彩帶片後景_1.png')],
  ['ribbon-back', 'decor', assetPath('extracted/layers/018_彩帶_1.png')],
  ['legs', 'character back', assetPath('extracted/layers/021_腿_1.png')],
  ['twin-left', 'character back', assetPath('extracted/layers/022_雙馬尾左_1.png')],
  ['ribbon-left-b', 'character back', assetPath('extracted/layers/024_圖層_56_1.png')],
  ['ribbon-left-a', 'character back', assetPath('extracted/layers/025_圖層_55_1.png')],
  ['twin-right', 'character back', assetPath('extracted/layers/026_雙馬尾右_1.png')],
  ['ribbon-right-b', 'character back', assetPath('extracted/layers/028_B_2.png')],
  ['ribbon-right-a', 'character back', assetPath('extracted/layers/029_A_2.png')],
  ['back-hair', 'character back', assetPath('extracted/layers/030_後髮_1.png')],
  ['right-arm', 'character back', assetPath('extracted/layers/031_右手_1.png')],
  ['gift-blue', 'props', assetPath('extracted/layers/033_藍禮物_1.png')],
  ['gift-red', 'props', assetPath('extracted/layers/034_紅禮物_1.png')],
  ['cake', 'cake', assetPath('extracted/layers/037_蛋糕_1.png')],
  ['table', 'cake', assetPath('extracted/layers/038_桌子_1.png')],
  ['ribbon-front-left', 'front ribbon', assetPath('extracted/layers/040_彩帶前景_1.png')],
  ['body', 'character front', assetPath('extracted/layers/043_身體_1.png')],
  ['face', 'character front', assetPath('extracted/layers/044_臉_1.png')],
  ['front-hair', 'character front', assetPath('extracted/layers/045_前髮_1.png')],
  ['ahoge', 'character front', assetPath('extracted/layers/051_呆毛_1.png')],
  ['left-arm', 'character front', assetPath('extracted/layers/052_左手_1.png')],
  ['confetti-front', 'confetti front', assetPath('extracted/layers/053_彩帶片前景_1.png')],
  ['ghost-right', 'mascot side', assetPath('extracted/layers/055_婚叫_1.png')],
  ['mascot-cake', 'mascot cake', assetPath('extracted/layers/057_湯圓_1.png')],
  ['glow', 'fx', assetPath('extracted/layers/058_發光_1.png')],
  ['filter', 'fx', assetPath('extracted/layers/059_濾鏡_1.png')],
]

const expressionDefs = [
  ['expr-a', 'character front expression-layer', assetPath('extracted/layers/047_A_3.png')],
  ['expr-b', 'character front expression-layer', assetPath('extracted/layers/048_B_3.png')],
  ['expr-c', 'character front expression-layer is-active', assetPath('extracted/layers/049_C_1.png')],
  ['expr-d', 'character front expression-layer', assetPath('extracted/layers/050_D_1.png')],
]

const layerBoxes = {
  'paper': [0, 0, 2283, 1302],
  'bg': [192, 78, 2112, 1158],
  'wall-art-left': [694, 252, 1018, 551],
  'wall-art-right': [1709, 484, 2103, 915],
  'balloon-back-blue': [837, 81, 1180, 840],
  'balloon-back-pink': [466, 126, 759, 914],
  'bunting': [192, 78, 2112, 450],
  'window-light': [286, 366, 1138, 1158],
  'balloon-mid-b': [174, 0, 2253, 1200],
  'balloon-mid-a': [1524, 549, 2020, 1302],
  'confetti-back': [291, 162, 1978, 1145],
  'ribbon-back': [192, 78, 1818, 462],
  'legs': [1314, 914, 1739, 1234],
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
  'cake': [505, 473, 1381, 1181],
  'table': [430, 1119, 1497, 1239],
  'ribbon-front-left': [118, 582, 778, 1210],
  'body': [1160, 347, 1892, 1150],
  'face': [1067, 131, 1339, 442],
  'front-hair': [1017, 0, 1470, 509],
  'ahoge': [1067, 60, 1130, 163],
  'left-arm': [1160, 380, 1469, 1265],
  'confetti-front': [270, 88, 2067, 1192],
  'ghost-right': [1786, 785, 2192, 1255],
  'mascot-cake': [921, 333, 1472, 574],
  'glow': [0, 0, 2283, 1302],
  'filter': [0, 0, 2283, 1302],
  'expr-a': [1092, 234, 1295, 421],
  'expr-b': [1094, 233, 1295, 416],
  'expr-c': [1090, 228, 1295, 408],
  'expr-d': [1092, 234, 1295, 408],
}

const demoVariants = [
  { id: 'soft-float', label: '01 Soft Float Hero', desc: '整體柔和漂浮，像粉絲賀圖慢慢呼吸。', className: 'v-soft-float' },
  { id: 'celebration-pop', label: '02 Celebration Pop', desc: '派對元素依序彈出，節奏像賀圖開場。', className: 'v-celebration-pop' },
  { id: 'parallax-room', label: '03 Parallax Room', desc: '景深分層更明顯，空間感最強。', className: 'v-parallax-room' },
  { id: 'ribbon-breeze', label: '04 Ribbon Breeze', desc: '掛旗、彩帶、頭髮有微風吹拂感。', className: 'v-ribbon-breeze' },
  { id: 'sparkle-focus', label: '05 Sparkle Focus', desc: '聚焦角色臉部與蛋糕祝福感。', className: 'v-sparkle-focus' },
  { id: 'gift-surprise', label: '06 Gift Surprise', desc: '禮物與紙片有可愛驚喜節奏。', className: 'v-gift-surprise' },
  { id: 'idol-entrance', label: '07 Sweet Idol Entrance', desc: '角色與蛋糕像 MV 主視覺進場。', className: 'v-idol-entrance' },
  { id: 'dreamy-blur', label: '08 Dreamy Blur Layers', desc: '利用模糊前景做夢幻療癒氛圍。', className: 'v-dreamy-blur' },
  { id: 'fan-letter', label: '09 Fan Letter Moment', desc: '小吉祥物與牌面節奏更有應援感。', className: 'v-fan-letter' },
  { id: 'support-stage', label: '10 Support Stage Loop', desc: '整體像小型應援舞台循環。', className: 'v-support-stage' },
]

const entranceVariants = [
  { id: 'petal-rise', label: '01 花瓣上浮', desc: '整體由下往上柔順浮現，像祝福花瓣推上舞台。', className: 'v-enter-petal-rise' },
  { id: 'curtain-fade', label: '02 窗簾揭幕', desc: '背景先亮起，角色與蛋糕像被布幕揭開。', className: 'v-enter-curtain-fade' },
  { id: 'gift-popline', label: '03 禮物連彈', desc: '禮物、蛋糕、角色依序 pop in，適合慶生感。', className: 'v-enter-gift-popline' },
  { id: 'halo-focus', label: '04 光暈聚焦', desc: '窗光與發光層先聚焦，再帶出主角與蛋糕。', className: 'v-enter-halo-focus' },
  { id: 'parallax-drift-in', label: '05 景深滑入', desc: '背景、角色、前景紙片分層滑入，MV 感較強。', className: 'v-enter-parallax-drift-in' },
  { id: 'idol-step-in', label: '06 偶像登台', desc: '角色主體稍晚進場，像應援主視覺正式登台。', className: 'v-enter-idol-step-in' },
  { id: 'sweet-zoom', label: '07 甜感鏡頭推進', desc: '整體緩慢 zoom in，蛋糕與臉部同時聚焦。', className: 'v-enter-sweet-zoom' },
  { id: 'confetti-reveal', label: '08 紙片揭露', desc: '以前景彩紙遮擋後再揭露主視覺，轉場感強。', className: 'v-enter-confetti-reveal' },
  { id: 'soft-flash-memory', label: '09 柔光記憶閃現', desc: '白光閃一下再回到柔和漂浮，像回憶片段切入。', className: 'v-enter-soft-flash-memory' },
  { id: 'ribbon-sweep', label: '10 緞帶掃場', desc: '彩帶與掛旗先動，再把角色與蛋糕帶進畫面。', className: 'v-enter-ribbon-sweep' },
]

function inlineStyleFor(name) {
  const box = layerBoxes[name]
  const [left, top, right, bottom] = box
  return [
    `left:${(left / BASE_W) * 100}%`,
    `top:${(top / BASE_H) * 100}%`,
    `width:${((right - left) / BASE_W) * 100}%`,
    `height:${((bottom - top) / BASE_H) * 100}%`,
  ].join(';')
}

function buildLayerHTML() {
  return layerDefs.map(([name, className, src]) => {
    return `<img class="layer ${className}" data-layer="${name}" src="${src}" alt="${name}" style="${inlineStyleFor(name)}" />`
  }).join('')
}

function buildExpressionHTML() {
  return expressionDefs.map(([name, className, src]) => `
    <img class="layer ${className}" data-layer="${name}" src="${src}" alt="${name}" style="${inlineStyleFor(name)}" />
  `).join('')
}

function buildCurtainCompositionHTML() {
  return `
    <img class="layer paper" data-layer="paper" src="${assetPath('extracted/layers/000_紙張_1.png')}" alt="paper" style="${inlineStyleFor('paper')}" />
    <img class="layer bg" data-layer="bg" src="${assetPath('extracted/layers/004_背景_1.png')}" alt="bg" style="${inlineStyleFor('bg')}" />
    <img class="layer bg-decor" data-layer="wall-art-left" src="${assetPath('extracted/layers/005_畫四湯圓_1.png')}" alt="wall-art-left" style="${inlineStyleFor('wall-art-left')}" />
    <img class="layer bg-decor" data-layer="wall-art-right" src="${assetPath('extracted/layers/006_畫婚叫_1.png')}" alt="wall-art-right" style="${inlineStyleFor('wall-art-right')}" />
    <img class="layer decor" data-layer="bunting" src="${assetPath('extracted/layers/010_掛帶_1.png')}" alt="bunting" style="${inlineStyleFor('bunting')}" />
    <img class="layer light" data-layer="window-light" src="${assetPath('extracted/layers/011_窗光_1.png')}" alt="window-light" style="${inlineStyleFor('window-light')}" />
    <div class="curtain-scene-layer curtain-character-group has-blur-layer" data-motion="character">
      <img class="layer character back" data-layer="legs" src="${assetPath('extracted/layers/021_腿_1.png')}" alt="legs" style="${inlineStyleFor('legs')}" />
      <img class="layer character back" data-layer="twin-left" src="${assetPath('extracted/layers/022_雙馬尾左_1.png')}" alt="twin-left" style="${inlineStyleFor('twin-left')}" />
      <img class="layer character back" data-layer="ribbon-left-b" src="${assetPath('extracted/layers/024_圖層_56_1.png')}" alt="ribbon-left-b" style="${inlineStyleFor('ribbon-left-b')}" />
      <img class="layer character back" data-layer="ribbon-left-a" src="${assetPath('extracted/layers/025_圖層_55_1.png')}" alt="ribbon-left-a" style="${inlineStyleFor('ribbon-left-a')}" />
      <img class="layer character back" data-layer="twin-right" src="${assetPath('extracted/layers/026_雙馬尾右_1.png')}" alt="twin-right" style="${inlineStyleFor('twin-right')}" />
      <img class="layer character back" data-layer="ribbon-right-b" src="${assetPath('extracted/layers/028_B_2.png')}" alt="ribbon-right-b" style="${inlineStyleFor('ribbon-right-b')}" />
      <img class="layer character back" data-layer="ribbon-right-a" src="${assetPath('extracted/layers/029_A_2.png')}" alt="ribbon-right-a" style="${inlineStyleFor('ribbon-right-a')}" />
      <img class="layer character back" data-layer="back-hair" src="${assetPath('extracted/layers/030_後髮_1.png')}" alt="back-hair" style="${inlineStyleFor('back-hair')}" />
      <img class="layer character back" data-layer="right-arm" src="${assetPath('extracted/layers/031_右手_1.png')}" alt="right-arm" style="${inlineStyleFor('right-arm')}" />
      <img class="layer character front" data-layer="body" src="${assetPath('extracted/layers/043_身體_1.png')}" alt="body" style="${inlineStyleFor('body')}" />
      <img class="layer character front" data-layer="face" src="${assetPath('extracted/layers/044_臉_1.png')}" alt="face" style="${inlineStyleFor('face')}" />
      <div class="expression-stack">${buildExpressionHTML()}</div>
      <img class="layer character front" data-layer="front-hair" src="${assetPath('extracted/layers/045_前髮_1.png')}" alt="front-hair" style="${inlineStyleFor('front-hair')}" />
      <img class="layer character front" data-layer="ahoge" src="${assetPath('extracted/layers/051_呆毛_1.png')}" alt="ahoge" style="${inlineStyleFor('ahoge')}" />
      <img class="layer character front" data-layer="left-arm" src="${assetPath('extracted/layers/052_左手_1.png')}" alt="left-arm" style="${inlineStyleFor('left-arm')}" />
    </div>
    <div class="curtain-scene-layer curtain-cake-group has-blur-layer" data-motion="cake">
      <img class="layer cake" data-layer="cake" src="${assetPath('extracted/layers/037_蛋糕_1.png')}" alt="cake" style="${inlineStyleFor('cake')}" />
      <img class="layer cake" data-layer="table" src="${assetPath('extracted/layers/038_桌子_1.png')}" alt="table" style="${inlineStyleFor('table')}" />
    </div>
    <div class="curtain-scene-layer curtain-balloon-group has-blur-layer" data-motion="balloons">
      <img class="layer balloons back" data-layer="balloon-back-blue" src="${assetPath('extracted/layers/008_藍_1.png')}" alt="balloon-back-blue" style="${inlineStyleFor('balloon-back-blue')}" />
      <img class="layer balloons back" data-layer="balloon-back-pink" src="${assetPath('extracted/layers/009_粉_1.png')}" alt="balloon-back-pink" style="${inlineStyleFor('balloon-back-pink')}" />
      <img class="layer balloons mid" data-layer="balloon-mid-b" src="${assetPath('extracted/layers/013_B_1.png')}" alt="balloon-mid-b" style="${inlineStyleFor('balloon-mid-b')}" />
      <img class="layer balloons mid" data-layer="balloon-mid-a" src="${assetPath('extracted/layers/014_A_1.png')}" alt="balloon-mid-a" style="${inlineStyleFor('balloon-mid-a')}" />
    </div>
    <div class="curtain-scene-layer curtain-gift-group has-blur-layer" data-motion="gifts">
      <img class="layer props" data-layer="gift-blue" src="${assetPath('extracted/layers/033_藍禮物_1.png')}" alt="gift-blue" style="${inlineStyleFor('gift-blue')}" />
      <img class="layer props" data-layer="gift-red" src="${assetPath('extracted/layers/034_紅禮物_1.png')}" alt="gift-red" style="${inlineStyleFor('gift-red')}" />
    </div>
    <div class="curtain-scene-layer curtain-ghost-group has-blur-layer" data-motion="ghost">
      <img class="layer mascot side" data-layer="ghost-right" src="${assetPath('extracted/layers/055_婚叫_1.png')}" alt="ghost-right" style="${inlineStyleFor('ghost-right')}" />
    </div>
    <div class="curtain-scene-layer curtain-mascot-group" data-motion="mascot">
      <img class="layer mascot cake" data-layer="mascot-cake" src="${assetPath('extracted/layers/057_湯圓_1.png')}" alt="mascot-cake" style="${inlineStyleFor('mascot-cake')}" />
    </div>
    <img class="layer fx" data-layer="glow" src="${assetPath('extracted/layers/058_發光_1.png')}" alt="glow" style="${inlineStyleFor('glow')}" />
    <img class="layer fx" data-layer="filter" src="${assetPath('extracted/layers/059_濾鏡_1.png')}" alt="filter" style="${inlineStyleFor('filter')}" />
  `
}

function attachPointerParallax(stage) {
  stage.addEventListener('pointermove', (event) => {
    const rect = stage.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3)
    const y = ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3)
    stage.style.setProperty('--mx', x)
    stage.style.setProperty('--my', y)
  })
  stage.addEventListener('pointerleave', () => {
    stage.style.setProperty('--mx', '0')
    stage.style.setProperty('--my', '0')
  })
}

function setupExpressionCycle(root) {
  const expressions = Array.from(root.querySelectorAll('.expression-layer'))
  if (!expressions.length) return
  let active = expressions.findIndex((el) => el.classList.contains('is-active'))
  if (active < 0) active = 0

  const activate = (index) => {
    expressions.forEach((el, i) => {
      el.classList.toggle('is-active', i === index)
    })
  }

  activate(active)
  return window.setInterval(() => {
    active = (active + 1) % expressions.length
    activate(active)
  }, 3000)
}

function renderOriginalDemo() {
  const app = document.querySelector('#app')
  app.innerHTML = `
    <div class="app-shell">
      <aside class="panel">
        <div>
          <p class="eyebrow">PSD fan support demo</p>
          <h1>日系 VTuber 應援動畫預覽</h1>
          <p class="lead">以實際 PSD 拆件素材組成，提供 10 個偏插畫、療癒、粉絲應援企劃的網頁動畫版本，並兼顧 RWD。</p>
        </div>
        <nav class="route-nav">
          <a class="route-link active" href="${routePath()}">原版 demo</a>
          <a class="route-link" href="${routePath('entrance/')}">01 進場提案</a>
          <a class="route-link" href="${routePath('curtain-sequence/')}">02 進場序列</a>
        </nav>
        <div class="variant-list" id="variant-list"></div>
        <div class="notes">
          <h2>動畫方向</h2>
          <ul>
            <li>角色微動：呼吸、髮絲擺動、呆毛彈性</li>
            <li>派對氛圍：氣球浮動、彩帶搖擺、紙片漂移</li>
            <li>應援感：蛋糕、吉祥物、光感與祝福聚焦</li>
            <li>RWD：手機版保留角色臉＋蛋糕為核心</li>
          </ul>
        </div>
      </aside>
      <main class="stage-wrap">
        <div class="toolbar">
          <div>
            <strong id="variant-title"></strong>
            <p id="variant-desc"></p>
          </div>
          <div class="toolbar-actions">
            <button id="prev-btn">上一版</button>
            <button id="next-btn">下一版</button>
          </div>
        </div>
        <section class="stage-card">
          <div class="stage ${demoVariants[0].className}" id="stage">
            <div class="stage-inner">${buildLayerHTML()}</div>
            <div class="spark sparkle-a"></div>
            <div class="spark sparkle-b"></div>
            <div class="spark sparkle-c"></div>
          </div>
        </section>
      </main>
    </div>
  `

  const variantList = document.getElementById('variant-list')
  const stage = document.getElementById('stage')
  const title = document.getElementById('variant-title')
  const desc = document.getElementById('variant-desc')
  let active = 0

  function renderButtons() {
    variantList.innerHTML = ''
    demoVariants.forEach((variant, index) => {
      const btn = document.createElement('button')
      btn.className = `variant-btn ${index === active ? 'active' : ''}`
      btn.innerHTML = `<strong>${variant.label}</strong><span>${variant.desc}</span>`
      btn.addEventListener('click', () => setVariant(index))
      variantList.appendChild(btn)
    })
  }

  function setVariant(index) {
    active = (index + demoVariants.length) % demoVariants.length
    stage.className = `stage ${demoVariants[active].className}`
    title.textContent = demoVariants[active].label
    desc.textContent = demoVariants[active].desc
    renderButtons()
  }

  document.getElementById('prev-btn').addEventListener('click', () => setVariant(active - 1))
  document.getElementById('next-btn').addEventListener('click', () => setVariant(active + 1))
  setVariant(0)
  attachPointerParallax(stage)
}

function renderEntranceDemo() {
  const app = document.querySelector('#app')
  app.innerHTML = `
    <div class="app-shell entrance-shell">
      <aside class="panel">
        <div>
          <p class="eyebrow">Soft Float Hero / entrance lab</p>
          <h1>01 進場動畫提案</h1>
          <p class="lead">保留原本的柔和浮動基調，專注比較不同的進場、揭露與轉場語言，方便你評估哪種最適合粉絲應援企劃首頁。</p>
        </div>
        <nav class="route-nav">
          <a class="route-link" href="${routePath()}">原版 demo</a>
          <a class="route-link active" href="${routePath('entrance/')}">01 進場提案</a>
          <a class="route-link" href="${routePath('curtain-sequence/')}">02 進場序列</a>
        </nav>
        <div class="variant-list" id="entrance-list"></div>
        <div class="notes">
          <h2>評估重點</h2>
          <ul>
            <li>主角與蛋糕誰先進場</li>
            <li>背景、紙片、窗光誰負責揭露</li>
            <li>轉場節奏是柔和、儀式感、還是 MV 感</li>
            <li>手機版是否依然能快速看懂主視覺</li>
          </ul>
        </div>
      </aside>
      <main class="stage-wrap">
        <div class="toolbar">
          <div>
            <strong id="entrance-title"></strong>
            <p id="entrance-desc"></p>
          </div>
          <div class="toolbar-actions">
            <button id="replay-btn">重播</button>
            <button id="next-entrance-btn">下一版</button>
          </div>
        </div>
        <section class="entrance-grid" id="entrance-grid"></section>
      </main>
    </div>
  `

  const list = document.getElementById('entrance-list')
  const grid = document.getElementById('entrance-grid')
  const title = document.getElementById('entrance-title')
  const desc = document.getElementById('entrance-desc')
  let active = 0

  function renderGrid() {
    grid.innerHTML = entranceVariants.map((variant, index) => `
      <article class="entrance-card ${index === active ? 'is-focus' : ''}" data-card-index="${index}">
        <div class="mini-stage-wrap">
          <div class="mini-stage stage v-soft-float ${variant.className}" data-stage-index="${index}">
            <div class="stage-inner">${buildLayerHTML()}</div>
            <div class="spark sparkle-a"></div>
            <div class="spark sparkle-b"></div>
            <div class="spark sparkle-c"></div>
          </div>
        </div>
        <div class="mini-meta">
          <strong>${variant.label}</strong>
          <p>${variant.desc}</p>
        </div>
      </article>
    `).join('')

    grid.querySelectorAll('.mini-stage').forEach((stage) => attachPointerParallax(stage))
  }

  function renderList() {
    list.innerHTML = ''
    entranceVariants.forEach((variant, index) => {
      const btn = document.createElement('button')
      btn.className = `variant-btn ${index === active ? 'active' : ''}`
      btn.innerHTML = `<strong>${variant.label}</strong><span>${variant.desc}</span>`
      btn.addEventListener('click', () => setActive(index, true))
      list.appendChild(btn)
    })
  }

  function replayStage(stage) {
    stage.classList.remove('replay')
    void stage.offsetWidth
    stage.classList.add('replay')
  }

  function setActive(index, replay = false) {
    active = (index + entranceVariants.length) % entranceVariants.length
    title.textContent = entranceVariants[active].label
    desc.textContent = entranceVariants[active].desc
    renderList()
    grid.querySelectorAll('.entrance-card').forEach((card, i) => {
      card.classList.toggle('is-focus', i === active)
    })
    if (replay) {
      const stage = grid.querySelector(`[data-stage-index="${active}"]`)
      if (stage) replayStage(stage)
    }
  }

  renderGrid()
  setActive(0)

  document.getElementById('replay-btn').addEventListener('click', () => {
    const stage = grid.querySelector(`[data-stage-index="${active}"]`)
    if (stage) replayStage(stage)
  })
  document.getElementById('next-entrance-btn').addEventListener('click', () => setActive(active + 1, true))
}

function renderCurtainSequenceDemo() {
  const app = document.querySelector('#app')
  app.innerHTML = `
    <div class="app-shell curtain-shell">
      <aside class="panel">
        <div>
          <p class="eyebrow">Curtain reveal / sequential entrance</p>
          <h1>02 窗簾揭幕－序列版</h1>
          <p class="lead">人物作為完整一組先淡入，接著以視差與時間差帶入蛋糕、氣球、禮物、婚叫、湯圓。主進程結束後進入維持效果，並讓表情每 3 秒淡入淡出切換。</p>
        </div>
        <nav class="route-nav">
          <a class="route-link" href="${routePath()}">原版 demo</a>
          <a class="route-link" href="${routePath('entrance/')}">01 進場提案</a>
          <a class="route-link active" href="${routePath('curtain-sequence/')}">02 進場序列</a>
        </nav>
        <div class="notes">
          <h2>進入順序</h2>
          <ol class="order-list">
            <li>人物（整組）</li>
            <li>蛋糕</li>
            <li>氣球</li>
            <li>禮物</li>
            <li>婚叫</li>
            <li>湯圓</li>
          </ol>
          <p class="note-tip">所有進場皆以淡入為基底；有模糊感的段落改用 CSS blur，主進程後逐漸進入柔焦維持狀態。</p>
        </div>
      </aside>
      <main class="stage-wrap">
        <div class="toolbar">
          <div>
            <strong>單一路線精修版</strong>
            <p>以 02 窗簾揭幕作為母體，改為明確的進場時間序列與維持循環。</p>
          </div>
          <div class="toolbar-actions">
            <button id="curtain-replay-btn">重播主進程</button>
          </div>
        </div>
        <section class="stage-card curtain-stage-card">
          <div class="stage curtain-sequence-stage replay" id="curtain-sequence-stage">
            <div class="stage-inner curtain-sequence-inner" id="curtain-sequence-inner">
              ${buildCurtainCompositionHTML()}
            </div>
            <div class="spark sparkle-a"></div>
            <div class="spark sparkle-b"></div>
            <div class="spark sparkle-c"></div>
          </div>
        </section>
      </main>
    </div>
  `

  const stage = document.getElementById('curtain-sequence-stage')
  attachPointerParallax(stage)
  const expressionTimer = setupExpressionCycle(stage)

  function replayCurtain() {
    stage.classList.remove('replay')
    void stage.offsetWidth
    stage.classList.add('replay')
  }

  document.getElementById('curtain-replay-btn').addEventListener('click', replayCurtain)
  window.addEventListener('beforeunload', () => {
    if (expressionTimer) window.clearInterval(expressionTimer)
  }, { once: true })
}

const currentAppPath = getAppPathname()

if (currentAppPath.startsWith('/curtain-sequence')) {
  renderCurtainSequenceDemo()
} else if (currentAppPath.startsWith('/entrance')) {
  renderEntranceDemo()
} else {
  renderOriginalDemo()
}
