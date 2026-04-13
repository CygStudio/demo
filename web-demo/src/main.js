import './style.css'

const variants = [
  {
    id: 'soft-float',
    label: '01 Soft Float Hero',
    desc: '整體柔和漂浮，像粉絲賀圖慢慢呼吸。',
    className: 'v-soft-float',
  },
  {
    id: 'celebration-pop',
    label: '02 Celebration Pop',
    desc: '派對元素依序彈出，節奏像賀圖開場。',
    className: 'v-celebration-pop',
  },
  {
    id: 'parallax-room',
    label: '03 Parallax Room',
    desc: '景深分層更明顯，空間感最強。',
    className: 'v-parallax-room',
  },
  {
    id: 'ribbon-breeze',
    label: '04 Ribbon Breeze',
    desc: '掛旗、彩帶、頭髮有微風吹拂感。',
    className: 'v-ribbon-breeze',
  },
  {
    id: 'sparkle-focus',
    label: '05 Sparkle Focus',
    desc: '聚焦角色臉部與蛋糕祝福感。',
    className: 'v-sparkle-focus',
  },
  {
    id: 'gift-surprise',
    label: '06 Gift Surprise',
    desc: '禮物與紙片有可愛驚喜節奏。',
    className: 'v-gift-surprise',
  },
  {
    id: 'idol-entrance',
    label: '07 Sweet Idol Entrance',
    desc: '角色與蛋糕像 MV 主視覺進場。',
    className: 'v-idol-entrance',
  },
  {
    id: 'dreamy-blur',
    label: '08 Dreamy Blur Layers',
    desc: '利用模糊前景做夢幻療癒氛圍。',
    className: 'v-dreamy-blur',
  },
  {
    id: 'fan-letter',
    label: '09 Fan Letter Moment',
    desc: '小吉祥物與牌面節奏更有應援感。',
    className: 'v-fan-letter',
  },
  {
    id: 'support-stage',
    label: '10 Support Stage Loop',
    desc: '整體像小型應援舞台循環。',
    className: 'v-support-stage',
  },
]

const layerDefs = [
  ['paper', 'paper', '/extracted/layers/000_紙張_1.png'],
  ['bg', 'bg', '/extracted/layers/004_背景_1.png'],
  ['wall-art-left', 'bg-decor', '/extracted/layers/005_畫四湯圓_1.png'],
  ['wall-art-right', 'bg-decor', '/extracted/layers/006_畫婚叫_1.png'],
  ['balloon-back-blue', 'balloons back', '/extracted/layers/008_藍_1.png'],
  ['balloon-back-pink', 'balloons back', '/extracted/layers/009_粉_1.png'],
  ['bunting', 'decor', '/extracted/layers/010_掛帶_1.png'],
  ['window-light', 'light', '/extracted/layers/011_窗光_1.png'],
  ['balloon-mid-b', 'balloons mid', '/extracted/layers/013_B_1.png'],
  ['balloon-mid-a', 'balloons mid', '/extracted/layers/014_A_1.png'],
  ['confetti-back', 'confetti back', '/extracted/layers/016_彩帶片後景_1.png'],
  ['ribbon-back', 'decor', '/extracted/layers/018_彩帶_1.png'],
  ['legs', 'character back', '/extracted/layers/021_腿_1.png'],
  ['twin-left', 'character back', '/extracted/layers/022_雙馬尾左_1.png'],
  ['ribbon-left-b', 'character back', '/extracted/layers/024_圖層_56_1.png'],
  ['ribbon-left-a', 'character back', '/extracted/layers/025_圖層_55_1.png'],
  ['twin-right', 'character back', '/extracted/layers/026_雙馬尾右_1.png'],
  ['ribbon-right-b', 'character back', '/extracted/layers/028_B_2.png'],
  ['ribbon-right-a', 'character back', '/extracted/layers/029_A_2.png'],
  ['back-hair', 'character back', '/extracted/layers/030_後髮_1.png'],
  ['right-arm', 'character back', '/extracted/layers/031_右手_1.png'],
  ['gift-blue', 'props', '/extracted/layers/033_藍禮物_1.png'],
  ['gift-red', 'props', '/extracted/layers/034_紅禮物_1.png'],
  ['cake', 'cake', '/extracted/layers/037_蛋糕_1.png'],
  ['table', 'cake', '/extracted/layers/038_桌子_1.png'],
  ['ribbon-front-left', 'front ribbon', '/extracted/layers/040_彩帶前景_1.png'],
  ['body', 'character front', '/extracted/layers/043_身體_1.png'],
  ['face', 'character front', '/extracted/layers/044_臉_1.png'],
  ['front-hair', 'character front', '/extracted/layers/045_前髮_1.png'],
  ['expression', 'character front', '/extracted/layers/049_C_1.png'],
  ['ahoge', 'character front', '/extracted/layers/051_呆毛_1.png'],
  ['left-arm', 'character front', '/extracted/layers/052_左手_1.png'],
  ['confetti-front', 'confetti front', '/extracted/layers/053_彩帶片前景_1.png'],
  ['confetti-front-blur', 'confetti front blur', '/extracted/layers/054_彩帶片前景_模糊_1.png'],
  ['ghost-right', 'mascot side', '/extracted/layers/055_婚叫_1.png'],
  ['mascot-cake', 'mascot cake', '/extracted/layers/057_湯圓_1.png'],
  ['glow', 'fx', '/extracted/layers/058_發光_1.png'],
  ['filter', 'fx', '/extracted/layers/059_濾鏡_1.png'],
]

const BASE_W = 2283
const BASE_H = 1302
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
  'expression': [1090, 228, 1295, 408],
  'ahoge': [1067, 60, 1130, 163],
  'left-arm': [1160, 380, 1469, 1265],
  'confetti-front': [270, 88, 2067, 1192],
  'confetti-front-blur': [250, 76, 2020, 1190],
  'ghost-right': [1786, 785, 2192, 1255],
  'mascot-cake': [921, 333, 1472, 574],
  'glow': [0, 0, 2283, 1302],
  'filter': [0, 0, 2283, 1302],
}

const app = document.querySelector('#app')
app.innerHTML = `
  <div class="app-shell">
    <aside class="panel">
      <div>
        <p class="eyebrow">PSD fan support demo</p>
        <h1>日系 VTuber 應援動畫預覽</h1>
        <p class="lead">以實際 PSD 拆件素材組成，提供 10 個偏插畫、療癒、粉絲應援企劃的網頁動畫版本，並兼顧 RWD。</p>
      </div>
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
        <div class="stage ${variants[0].className}" id="stage">
          <div class="stage-inner" id="stage-inner"></div>
          <div class="spark sparkle-a"></div>
          <div class="spark sparkle-b"></div>
          <div class="spark sparkle-c"></div>
        </div>
      </section>
    </main>
  </div>
`

const stageInner = document.getElementById('stage-inner')
layerDefs.forEach(([name, className, src]) => {
  const img = document.createElement('img')
  img.className = `layer ${className}`
  img.dataset.layer = name
  img.src = src
  img.alt = name
  img.loading = 'eager'
  const box = layerBoxes[name]
  if (box) {
    const [left, top, right, bottom] = box
    img.style.left = `${(left / BASE_W) * 100}%`
    img.style.top = `${(top / BASE_H) * 100}%`
    img.style.width = `${((right - left) / BASE_W) * 100}%`
    img.style.height = `${((bottom - top) / BASE_H) * 100}%`
  }
  stageInner.appendChild(img)
})

const variantList = document.getElementById('variant-list')
const stage = document.getElementById('stage')
const title = document.getElementById('variant-title')
const desc = document.getElementById('variant-desc')
let active = 0

function renderButtons() {
  variantList.innerHTML = ''
  variants.forEach((variant, index) => {
    const btn = document.createElement('button')
    btn.className = `variant-btn ${index === active ? 'active' : ''}`
    btn.innerHTML = `<strong>${variant.label}</strong><span>${variant.desc}</span>`
    btn.addEventListener('click', () => setVariant(index))
    variantList.appendChild(btn)
  })
}

function setVariant(index) {
  active = (index + variants.length) % variants.length
  stage.className = `stage ${variants[active].className}`
  title.textContent = variants[active].label
  desc.textContent = variants[active].desc
  renderButtons()
}

document.getElementById('prev-btn').addEventListener('click', () => setVariant(active - 1))
document.getElementById('next-btn').addEventListener('click', () => setVariant(active + 1))
setVariant(0)

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
