import { Application, Assets, Container, Rectangle, Sprite, Texture } from 'pixi.js'
import {
  BASE_H,
  BASE_W,
  expressionAtlas,
  initialSceneSrcs,
  optimizedCurtainSceneGroups,
  optimizedMascotTangyuanMotionItems,
  optimizedSceneBounds,
} from './optimizedSceneData'
import { sequenceOrder, loopMotion } from './sequenceConfig'
import { createInitialFollowerItems, stepCursorFollower } from './cursorFollowerMotion'

const TWO_PI = Math.PI * 2

export const sequenceByKey = Object.fromEntries(sequenceOrder.map((item) => [item.key, item]))

export const sceneEntryCompleteMs = Math.max(
  ...sequenceOrder.map(({ delay, duration }) => delay + duration),
) * 1000

const LOOP_LAYER_ASSIGNMENT = {
  'character-hair-back': 'hair',
  'character-hair-front': 'hair',
  'character-body': 'breathe',
  balloons: 'balloons',
  gifts: 'gifts',
  glow: 'glow',
}

const FX_BLEND_MODE = 'screen'

const GROUP_Z = {
  background: 0,
  balloons: 7,
  character: 10,
  gifts: 11,
  cake: 12,
  mascot: 15,
  fx: 18,
}

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export function computeCoverTransform(viewportW, viewportH) {
  // Mirror the original CSS cover logic:
  //   .rcs-stage-inner sized to canvas/bg ratio so BG (1920x1080) fills viewport width.
  //   @media (max-aspect-ratio: 16/9) scales by height instead.
  const canvasAspect = BASE_W / BASE_H // 2283 / 1302 ≈ 1.7535
  const bgAspect = 1920 / 1080         // 1.7778
  const viewportAspect = viewportW / viewportH

  let scale
  if (viewportAspect >= 16 / 9) {
    // wide: scale by width so 1920-wide BG = viewport width
    scale = (viewportW * (BASE_W / 1920)) / BASE_W
  } else {
    // tall/portrait: scale by height so 1080-tall BG = viewport height
    scale = (viewportH * (BASE_H / 1080)) / BASE_H
  }

  const scaledW = BASE_W * scale
  const scaledH = BASE_H * scale

  // BG center within the canvas (PSD info)
  const bgCenterX = 0.5046
  const bgCenterY = 0.4747

  return {
    scale,
    scaledW,
    scaledH,
    offsetX: viewportW / 2 - scaledW * bgCenterX,
    offsetY: viewportH / 2 - scaledH * bgCenterY,
    viewportAspect,
    canvasAspect,
    bgAspect,
  }
}

function detectAndroidChromiumIframe() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const userAgent = navigator.userAgent
  const isAndroid = /Android/i.test(userAgent)
  const isFirefox = /Firefox|FxiOS/i.test(userAgent)
  const isChromiumFamily = /Chrome|Chromium|CriOS|EdgA|SamsungBrowser/i.test(userAgent)
  let isEmbedded = false
  try {
    isEmbedded = window.self !== window.top
  } catch {
    isEmbedded = true
  }
  return isAndroid && isChromiumFamily && !isFirefox && isEmbedded
}

function placeSpriteFromBox(sprite, box) {
  const [left, top, right, bottom] = box
  sprite.x = left
  sprite.y = top
  sprite.width = right - left
  sprite.height = bottom - top
}

function makeLoopState(sprite, loop) {
  // CSS keyframes (e.g. [0, 6, 0]) are symmetric, so a sin wave with amplitude
  // = (max - min)/2 and offset = midpoint reproduces them perfectly when the
  // start/end are equal. We use the sign of the peak to keep direction.
  const computeAmp = (arr) => (Math.max(...arr) - Math.min(...arr)) / 2
  const computeMid = (arr) => (Math.max(...arr) + Math.min(...arr)) / 2

  return {
    sprite,
    box: null, // set later by caller
    durationMs: loop.duration * 1000,
    phase: Math.random() * TWO_PI,
    yAmp: Array.isArray(loop.y) ? computeAmp(loop.y) : 0,
    ySign: Array.isArray(loop.y) ? (loop.y[1] >= loop.y[0] ? 1 : -1) : 0,
    rotateAmpDeg: Array.isArray(loop.rotate) ? computeAmp(loop.rotate) : 0,
    rotateSign: Array.isArray(loop.rotate) ? (loop.rotate[1] >= loop.rotate[0] ? 1 : -1) : 0,
    scaleMid: Array.isArray(loop.scale) ? computeMid(loop.scale) : 1,
    scaleAmp: Array.isArray(loop.scale) ? computeAmp(loop.scale) : 0,
    alphaMid: Array.isArray(loop.opacity) ? computeMid(loop.opacity) : 1,
    alphaAmp: Array.isArray(loop.opacity) ? computeAmp(loop.opacity) : 0,
    hasAlpha: Array.isArray(loop.opacity),
  }
}

function buildExpressionAtlas(textures, atlasInfo, transitionDurationMs = 600) {
  const container = new Container()
  container.label = 'expression-atlas'
  const [left, top, right, bottom] = atlasInfo.box
  const targetW = right - left
  const targetH = bottom - top
  const frameCount = atlasInfo.frameNames.length

  const baseTex = textures[atlasInfo.src] ?? Texture.from(atlasInfo.src)
  const sourceW = baseTex.source?.width ?? baseTex.width * frameCount
  const sourceH = baseTex.source?.height ?? baseTex.height
  const frameW = sourceW / frameCount

  const frameTextures = atlasInfo.frameNames.map(
    (_, idx) => new Texture({
      source: baseTex.source,
      frame: new Rectangle(idx * frameW, 0, frameW, sourceH),
    }),
  )

  const layerActive = new Sprite(frameTextures[atlasInfo.activeIndex])
  const layerExiting = new Sprite(frameTextures[atlasInfo.activeIndex])
  for (const layer of [layerActive, layerExiting]) {
    layer.x = left
    layer.y = top
    layer.width = targetW
    layer.height = targetH
  }
  layerActive.alpha = 1
  layerExiting.alpha = 0
  container.addChild(layerExiting)
  container.addChild(layerActive)

  let activeIdx = atlasInfo.activeIndex
  let cycling = false
  let cycleProgress = 0

  function cycle() {
    if (cycling) {
      // Finalize current transition before starting a new one
      layerExiting.alpha = 0
      activeIdx = ((activeIdx) % frameCount)
    }
    const nextIdx = (activeIdx + 1) % frameCount
    layerExiting.texture = frameTextures[activeIdx]
    layerExiting.alpha = 1
    layerActive.texture = frameTextures[nextIdx]
    layerActive.alpha = 0
    activeIdx = nextIdx
    cycleProgress = 0
    cycling = true
  }

  function tick(dtMs) {
    if (!cycling) return
    cycleProgress += dtMs
    const t = Math.min(1, cycleProgress / transitionDurationMs)
    const eased = easeInOutQuad(t)
    layerActive.alpha = eased
    layerExiting.alpha = 1 - eased
    if (t >= 1) {
      cycling = false
      layerActive.alpha = 1
      layerExiting.alpha = 0
    }
  }

  return { container, cycle, tick }
}

export async function createPixiScene({
  container,
  onIntroComplete,
  onFirstFrame,
  reduced,
} = {}) {
  if (!container) throw new Error('createPixiScene requires a container element')

  const reducedMode = reduced ?? detectAndroidChromiumIframe()

  const handle = {
    destroyed: false,
    reduced: reducedMode,
    pointerNormalized: { x: 0, y: 0 },
    pointerScene: null,
    setPointerFromClient: () => {},
    clearPointer: () => {},
    cycleExpression: () => {},
    destroy: () => {},
    app: null,
    canvas: null,
  }

  let disposed = false
  handle.destroy = () => {
    disposed = true
    if (handle._cleanup) handle._cleanup()
  }

  const app = new Application()

  try {
    await app.init({
      antialias: false,
      autoDensity: false,
      resolution: 1,
      backgroundAlpha: 0,
      resizeTo: container,
      preference: 'webgl',
    })
  } catch (error) {
    console.error('PIXI Application.init failed', error)
    handle.destroyed = true
    throw error
  }

  if (disposed) {
    try { app.destroy(true, { children: true }) } catch (_) { void 0 }
    handle.destroyed = true
    return handle
  }

  handle.app = app
  const canvas = app.canvas
  canvas.style.display = 'block'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.position = 'absolute'
  canvas.style.inset = '0'
  container.appendChild(canvas)
  handle.canvas = canvas

  // Load textures
  let textures
  try {
    const srcs = Array.from(new Set(initialSceneSrcs))
    textures = await Assets.load(srcs)
  } catch (error) {
    console.error('PIXI Assets.load failed', error)
    handle._cleanup?.()
    handle.destroyed = true
    throw error
  }

  if (disposed) {
    handle._cleanup?.()
    return handle
  }

  // ---- Build scene graph
  const sceneRoot = new Container()
  sceneRoot.label = 'sceneRoot'
  sceneRoot.sortableChildren = true
  app.stage.addChild(sceneRoot)

  const groups = {}
  const loops = []

  function makeSprite(layer) {
    const tex = textures[layer.src] ?? Texture.from(layer.src)
    const sprite = new Sprite(tex)
    sprite.label = layer.name
    placeSpriteFromBox(sprite, layer.box)
    return sprite
  }

  function addGroup(key, layers, { blend = null } = {}) {
    const g = new Container()
    g.label = `group:${key}`
    g.zIndex = GROUP_Z[key] ?? 0
    sceneRoot.addChild(g)
    groups[key] = g

    for (const layer of layers) {
      const sprite = makeSprite(layer)
      if (blend) sprite.blendMode = blend
      g.addChild(sprite)

      const loopKey = LOOP_LAYER_ASSIGNMENT[layer.name]
      if (loopKey) {
        const loopDef = loopMotion[loopKey]
        const state = makeLoopState(sprite, loopDef)
        state.box = layer.box
        loops.push(state)
      }
    }
    return g
  }

  addGroup('background', optimizedCurtainSceneGroups.background)
  addGroup('balloons', optimizedCurtainSceneGroups.balloons)
  const characterGroup = addGroup('character', optimizedCurtainSceneGroups.character)

  // Expression atlas inside character group, layered above hair-front
  const expr = buildExpressionAtlas(textures, expressionAtlas)
  characterGroup.addChild(expr.container)
  handle.cycleExpression = expr.cycle

  addGroup('cake', optimizedCurtainSceneGroups.cake)
  addGroup('gifts', optimizedCurtainSceneGroups.gifts)

  // Mascot tangyuan group (no intro fade — they're tied to scene entry timing via parent)
  const mascotGroup = new Container()
  mascotGroup.label = 'group:mascot'
  mascotGroup.zIndex = GROUP_Z.mascot
  sceneRoot.addChild(mascotGroup)
  groups.mascot = mascotGroup

  const followerItems = createInitialFollowerItems(optimizedMascotTangyuanMotionItems)
  const tangyuanSprites = followerItems.map((item) => {
    const tex = textures[item.src] ?? Texture.from(item.src)
    const sprite = new Sprite(tex)
    sprite.label = item.name
    sprite.x = item.x
    sprite.y = item.y
    sprite.width = item.width
    sprite.height = item.height
    mascotGroup.addChild(sprite)
    return sprite
  })
  let followerState = { items: followerItems, mode: 'home' }

  // FX group last (highest z) with screen blend
  addGroup('fx', optimizedCurtainSceneGroups.fx, { blend: FX_BLEND_MODE })

  sceneRoot.sortChildren()

  // ---- Intro state: pivot groups around scene center, animate alpha+offset+scale
  const introState = []
  const animatedGroupKeys = ['character', 'cake', 'balloons', 'gifts', 'mascot']
  for (const key of animatedGroupKeys) {
    const config = sequenceByKey[key]
    if (!config) continue
    const g = groups[key]
    if (!g) continue
    g.pivot.set(BASE_W / 2, BASE_H / 2)
    g.position.set(BASE_W / 2 + (config.x ?? 0), BASE_H / 2 + (config.y ?? 0))
    g.scale.set(config.scale ?? 0.98)
    g.alpha = 0
    introState.push({
      key,
      container: g,
      delayMs: config.delay * 1000,
      durationMs: config.duration * 1000,
      offsetX: config.x ?? 0,
      offsetY: config.y ?? 0,
      scaleFrom: config.scale ?? 0.98,
      done: false,
    })
  }

  // ---- Cover transform & parallax
  function applyCoverTransform() {
    if (handle.destroyed) return
    const w = app.renderer.width / app.renderer.resolution
    const h = app.renderer.height / app.renderer.resolution
    const { scale, offsetX, offsetY } = computeCoverTransform(w, h)
    sceneRoot.scale.set(scale)
    const parallaxPx = reducedMode ? 0 : -8
    sceneRoot.position.set(
      offsetX + handle.pointerNormalized.x * parallaxPx,
      offsetY + handle.pointerNormalized.y * parallaxPx,
    )
  }
  applyCoverTransform()

  const resizeObserver = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => applyCoverTransform())
    : null
  if (resizeObserver) resizeObserver.observe(container)
  const onWindowResize = () => applyCoverTransform()
  if (typeof window !== 'undefined') window.addEventListener('resize', onWindowResize)

  // ---- Pointer interface
  handle.setPointerFromClient = (clientX, clientY) => {
    if (reducedMode || handle.destroyed) return
    const rect = container.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    handle.pointerNormalized = {
      x: (clientX - rect.left) / rect.width - 0.5,
      y: (clientY - rect.top) / rect.height - 0.5,
    }
    const { scale, offsetX, offsetY } = computeCoverTransform(rect.width, rect.height)
    handle.pointerScene = {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale,
    }
  }
  handle.clearPointer = () => {
    handle.pointerScene = null
    if (!reducedMode) handle.pointerNormalized = { x: 0, y: 0 }
  }

  // ---- WebGL context lost / restore
  const onContextLost = (e) => e.preventDefault()
  const onContextRestored = () => applyCoverTransform()
  canvas.addEventListener('webglcontextlost', onContextLost, false)
  canvas.addEventListener('webglcontextrestored', onContextRestored, false)

  // ---- Ticker
  let introStartMs = null
  let lastTickMs = performance.now()
  let allIntrosDone = false
  let firstFrameNotified = false
  let followerEnabled = false

  handle.startIntro = () => {
    if (introStartMs !== null) return
    introStartMs = performance.now()
  }

  app.ticker.add(() => {
    if (handle.destroyed) return
    const now = performance.now()
    const dtMs = Math.min(now - lastTickMs, 64)
    lastTickMs = now

    // Intros — only run after startIntro() is called (gated by light raster end)
    if (!allIntrosDone && introStartMs !== null) {
      const elapsedMs = now - introStartMs
      let pending = 0
      for (const intro of introState) {
        if (intro.done) continue
        const localT = (elapsedMs - intro.delayMs) / intro.durationMs
        if (localT <= 0) { pending++; continue }
        const t = Math.min(1, localT)
        const eased = easeOutCubic(t)
        intro.container.alpha = eased
        const sx = intro.scaleFrom + (1 - intro.scaleFrom) * eased
        intro.container.scale.set(sx)
        intro.container.position.set(
          BASE_W / 2 + intro.offsetX * (1 - eased),
          BASE_H / 2 + intro.offsetY * (1 - eased),
        )
        if (t < 1) pending++
        else intro.done = true
      }
      if (pending === 0) {
        allIntrosDone = true
        followerEnabled = true
        onIntroComplete?.()
      }
    }

    // Loops drive off wall-clock for stable phase regardless of intro gating.
    const loopMs = now

    // Loops
    for (const L of loops) {
      // skip fx loops in reduced mode
      if (reducedMode && (L.sprite.label === 'glow' || L.sprite.label === 'filter')) {
        continue
      }
      const phaseTau = ((loopMs / L.durationMs) * TWO_PI + L.phase) % TWO_PI
      const sinW = Math.sin(phaseTau)
      const [left, top, right, bottom] = L.box
      const baseW = right - left
      const baseH = bottom - top
      const centerX = left + baseW / 2
      const centerY = top + baseH / 2

      const scaleVal = L.scaleMid + sinW * L.scaleAmp
      const yOff = sinW * L.yAmp * L.ySign
      L.sprite.width = baseW * scaleVal
      L.sprite.height = baseH * scaleVal
      L.sprite.x = centerX - (baseW * scaleVal) / 2
      L.sprite.y = centerY - (baseH * scaleVal) / 2 + yOff
      L.sprite.rotation = (sinW * L.rotateAmpDeg * L.rotateSign * Math.PI) / 180
      if (L.hasAlpha) {
        L.sprite.alpha = L.alphaMid + sinW * L.alphaAmp
      }
    }

    // Follower
    if (followerEnabled) {
      const next = stepCursorFollower({
        items: followerState.items,
        pointer: reducedMode ? null : handle.pointerScene,
        mode: followerState.mode,
        dtMs,
        elapsedMs: loopMs,
        bounds: optimizedSceneBounds,
      })
      followerState = next
      for (let i = 0; i < tangyuanSprites.length; i++) {
        const sprite = tangyuanSprites[i]
        const item = next.items[i]
        sprite.x = item.x
        sprite.y = item.y
        sprite.width = item.width
        sprite.height = item.height
      }
    }

    // Cover transform every frame to follow parallax + container size
    applyCoverTransform()

    // Expression
    expr.tick(dtMs)

    if (!firstFrameNotified) {
      firstFrameNotified = true
      onFirstFrame?.()
    }
  })

  // ---- Cleanup
  handle._cleanup = () => {
    if (handle.destroyed) return
    handle.destroyed = true
    if (resizeObserver) resizeObserver.disconnect()
    if (typeof window !== 'undefined') window.removeEventListener('resize', onWindowResize)
    if (canvas) {
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
    }
    try {
      app.destroy(true, { children: true, texture: false, baseTexture: false })
    } catch (error) {
      console.warn('PIXI app.destroy failed', error)
    }
  }

  return handle
}
