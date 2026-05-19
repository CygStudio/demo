import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BASE_W,
  BASE_H,
  expressionAtlas,
  initialSceneSrcs,
  optimizedCurtainSceneGroups,
  optimizedMascotTangyuanMotionItems,
  optimizedSceneBounds,
  getScenePositionStyle,
} from './optimizedSceneData'
import {
  getExpressionAtlasBackgroundPosition,
  getExpressionAtlasBackgroundSize,
} from './expressionAtlasSprite'
import { loopMotion, sequenceOrder } from './sequenceConfig'
import { createInitialFollowerItems, stepCursorFollower } from './cursorFollowerMotion'
import { useImagePreload } from './useImagePreload'

const sequenceByKey = Object.fromEntries(sequenceOrder.map((item) => [item.key, item]))
const sceneEntryCompleteMs = Math.max(...sequenceOrder.map(({ delay, duration }) => delay + duration)) * 1000
const introWarmupMs = 32
const lightRasterCompleteMs = 1700
const compositingBoostDurationMs = introWarmupMs + lightRasterCompleteMs + sceneEntryCompleteMs

function buildInitialTangyuanItems() {
  return createInitialFollowerItems(optimizedMascotTangyuanMotionItems)
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

function getLoopForLayer(name) {
  if (['character-hair-back', 'character-hair-front'].includes(name)) return loopMotion.hair
  if (name === 'character-body') return loopMotion.breathe
  if (name === 'balloons') return loopMotion.balloons
  if (name === 'gifts') return loopMotion.gifts
  if (name === 'ghost-right') return loopMotion.ghost
  if (name === 'glow') return loopMotion.glow

  return null
}

function LayerImage({ animateLoop = true, name, className, src, style }) {
  const loop = animateLoop ? getLoopForLayer(name) : null

  return (
    <motion.img
      alt={name}
      animate={
        loop
          ? { ...loop, transition: { duration: loop.duration, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' } }
          : undefined
      }
      className={className}
      src={src}
      style={style}
    />
  )
}

const expressionTransitionMs = 400
const expressionTransition = { duration: expressionTransitionMs / 1000, ease: 'easeInOut' }

function ExpressionAtlasLayer({ frameCount, frameIndex, shouldFadeIn = false, transitionState }) {
  const frameName = expressionAtlas.frameNames[frameIndex]
  const isActive = transitionState === 'active'

  return (
    <motion.div
      aria-label={frameName}
      animate={{ opacity: isActive ? 1 : 0 }}
      className="expression-layer expression-layer--atlas"
      data-active={String(isActive)}
      data-transition-state={transitionState}
      initial={{ opacity: isActive ? (shouldFadeIn ? 0 : 1) : 1 }}
      key={`${transitionState}-${frameName}`}
      role="img"
      style={{
        ...expressionAtlas.style,
        backgroundImage: `url(${expressionAtlas.src})`,
        backgroundPosition: getExpressionAtlasBackgroundPosition(frameIndex, frameCount),
        backgroundSize: getExpressionAtlasBackgroundSize(frameCount),
      }}
      transition={expressionTransition}
    />
  )
}

function ExpressionAtlas({ activeExpression, exitingExpression }) {
  const frameCount = expressionAtlas.frameNames.length
  const hasExitingLayer = typeof exitingExpression === 'number' && exitingExpression !== activeExpression

  return (
    <>
      {hasExitingLayer && (
        <ExpressionAtlasLayer
          frameCount={frameCount}
          frameIndex={exitingExpression}
          transitionState="exiting"
        />
      )}
      <ExpressionAtlasLayer
        frameCount={frameCount}
        frameIndex={activeExpression}
        shouldFadeIn={hasExitingLayer}
        transitionState="active"
      />
    </>
  )
}

function renderGroup(layers, { animateLoop = true } = {}) {
  return layers.map((layer) => <LayerImage key={layer.name} animateLoop={animateLoop} {...layer} />)
}

const groupSceneClasses = {
  character: 'has-scene-z-10',
  cake: 'has-scene-z-12',
  balloons: 'has-scene-z-7',
  gifts: 'has-scene-z-11',
  ghost: 'has-scene-z-15',
  mascot: 'has-scene-z-15',
}

export default function CurtainSequencePreview({ expressionIntervalMs = 3000 }) {
  const initialSceneImages = useMemo(() => initialSceneSrcs, [])
  const { error: preloadError, ready: assetsReady } = useImagePreload(initialSceneImages)
  const isReducedCompositing = useMemo(() => detectAndroidChromiumIframe(), [])
  const [introReady, setIntroReady] = useState(false)
  const [lightRasterDone, setLightRasterDone] = useState(false)
  const [entryCompositingActive, setEntryCompositingActive] = useState(false)
  const shouldRenderScene = assetsReady
  const showSequence = introReady && lightRasterDone

  const sequenceKey = 0
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const [expressionTransitionState, setExpressionTransitionState] = useState({
    active: expressionAtlas.activeIndex,
    exiting: null,
  })
  const [ghostEntryDone, setGhostEntryDone] = useState(false)
  const [mascotTangyuanState, setMascotTangyuanState] = useState(() => ({
    items: buildInitialTangyuanItems(),
    mode: 'home',
  }))
  const mascotTangyuanItems = mascotTangyuanState.items
  const tangyuanFrameRef = useRef(null)
  const tangyuanMotionTimerRef = useRef(null)
  const tangyuanLastTimestampRef = useRef(null)
  const tangyuanSkipBootstrapFrameRef = useRef(false)
  const pointerSceneRef = useRef(null)
  const followerStartMsRef = useRef(0)

  const groupVariants = useMemo(
    () => ({
      character: buildEnterVariant(sequenceByKey.character),
      cake: buildEnterVariant(sequenceByKey.cake),
      balloons: buildEnterVariant(sequenceByKey.balloons),
      gifts: buildEnterVariant(sequenceByKey.gifts),
      ghost: buildEnterVariant(sequenceByKey.ghost),
      mascot: buildEnterVariant(sequenceByKey.mascot),
    }),
    [],
  )

  useEffect(() => {
    setIntroReady(false)
    setLightRasterDone(false)
    setGhostEntryDone(false)
    setEntryCompositingActive(false)

    if (!assetsReady) return void 0

    setEntryCompositingActive(true)

    const introTimer = window.setTimeout(() => {
      setIntroReady(true)
    }, introWarmupMs)
    const boostTimer = window.setTimeout(() => {
      setEntryCompositingActive(false)
    }, compositingBoostDurationMs)

    return () => {
      window.clearTimeout(introTimer)
      window.clearTimeout(boostTimer)
    }
  }, [assetsReady])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setExpressionTransitionState((current) => ({
        active: (current.active + 1) % expressionAtlas.frameNames.length,
        exiting: current.active,
      }))
    }, expressionIntervalMs)

    return () => window.clearInterval(timer)
  }, [expressionIntervalMs])

  useEffect(() => {
    if (typeof expressionTransitionState.exiting !== 'number') return undefined

    const timer = window.setTimeout(() => {
      setExpressionTransitionState((current) => (
        current.exiting === expressionTransitionState.exiting
          ? { ...current, exiting: null }
          : current
      ))
    }, expressionTransitionMs)

    return () => window.clearTimeout(timer)
  }, [expressionTransitionState.exiting])

  useEffect(() => {
    setMascotTangyuanState({
      items: buildInitialTangyuanItems(),
      mode: 'home',
    })
    tangyuanLastTimestampRef.current = null
    tangyuanSkipBootstrapFrameRef.current = false
    followerStartMsRef.current = 0

    if (tangyuanMotionTimerRef.current !== null) {
      window.clearTimeout(tangyuanMotionTimerRef.current)
      tangyuanMotionTimerRef.current = null
    }

    if (tangyuanFrameRef.current !== null) {
      window.cancelAnimationFrame(tangyuanFrameRef.current)
      tangyuanFrameRef.current = null
    }

    if (!showSequence) return undefined

    tangyuanMotionTimerRef.current = window.setTimeout(() => {
      tangyuanSkipBootstrapFrameRef.current = true

      const tick = (timestamp) => {
        if (tangyuanSkipBootstrapFrameRef.current) {
          tangyuanSkipBootstrapFrameRef.current = false
          tangyuanLastTimestampRef.current = timestamp
          followerStartMsRef.current = timestamp
          tangyuanFrameRef.current = window.requestAnimationFrame(tick)
          return
        }

        const dtMs = tangyuanLastTimestampRef.current === null
          ? 16
          : timestamp - tangyuanLastTimestampRef.current
        const elapsedMs = timestamp - followerStartMsRef.current
        const pointer = pointerSceneRef.current

        tangyuanLastTimestampRef.current = timestamp

        setMascotTangyuanState((current) => {
          const next = stepCursorFollower({
            items: current.items,
            pointer,
            mode: current.mode,
            dtMs,
            elapsedMs,
            bounds: optimizedSceneBounds,
          })
          return next
        })

        tangyuanFrameRef.current = window.requestAnimationFrame(tick)
      }

      tangyuanFrameRef.current = window.requestAnimationFrame(tick)
    }, sceneEntryCompleteMs)

    return () => {
      tangyuanSkipBootstrapFrameRef.current = false

      if (tangyuanMotionTimerRef.current !== null) {
        window.clearTimeout(tangyuanMotionTimerRef.current)
        tangyuanMotionTimerRef.current = null
      }

      if (tangyuanFrameRef.current !== null) {
        window.cancelAnimationFrame(tangyuanFrameRef.current)
        tangyuanFrameRef.current = null
      }
    }
  }, [showSequence])

  function handlePointerMove(event) {
    if (isReducedCompositing) return

    const rect = event.currentTarget.getBoundingClientRect()
    const normalizedX = (event.clientX - rect.left) / rect.width - 0.5
    const normalizedY = (event.clientY - rect.top) / rect.height - 0.5
    setPointer({ x: Number(normalizedX.toFixed(3)), y: Number(normalizedY.toFixed(3)) })

    const sceneX = ((event.clientX - rect.left) / rect.width) * BASE_W
    const sceneY = ((event.clientY - rect.top) / rect.height) * BASE_H
    pointerSceneRef.current = { x: sceneX, y: sceneY }
  }

  function handlePointerLeave() {
    if (isReducedCompositing) {
      pointerSceneRef.current = null
      return
    }

    setPointer({ x: 0, y: 0 })
    pointerSceneRef.current = null
  }

  return (
    <div
      className={`rcs-stage ${!showSequence ? 'rcs-stage--loading' : ''}`}
      data-android-iframe={String(isReducedCompositing)}
      data-load-error={preloadError?.message ?? undefined}
      data-sequence-key={sequenceKey}
      data-testid="curtain-stage"
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      style={{
        '--mx': isReducedCompositing ? 0 : pointer.x,
        '--my': isReducedCompositing ? 0 : pointer.y,
      }}
    >
      {shouldRenderScene && (
        <>
          <motion.div
            className={[
              'rcs-stage-inner',
              entryCompositingActive ? 'rcs-stage-inner--entry-boost' : '',
              isReducedCompositing ? 'rcs-stage-inner--reduced-compositing' : '',
            ].filter(Boolean).join(' ')}
            initial={false}
            key={sequenceKey}
          >
            {renderGroup(optimizedCurtainSceneGroups.background)}

            <motion.div
              animate={showSequence ? 'visible' : 'hidden'}
              className={[
                'rcs-group',
                'rcs-group-character',
                groupSceneClasses.character,
                entryCompositingActive ? 'rcs-group--entry-boost' : '',
                isReducedCompositing ? 'rcs-group--reduced-compositing' : '',
              ].filter(Boolean).join(' ')}
              initial="hidden"
              variants={groupVariants.character}
            >
              {renderGroup(optimizedCurtainSceneGroups.character)}
              <div className="rcs-expression-stack">
                <ExpressionAtlas
                  activeExpression={expressionTransitionState.active}
                  exitingExpression={expressionTransitionState.exiting}
                />
              </div>
            </motion.div>

            <motion.div
              animate={showSequence ? 'visible' : 'hidden'}
              className={[
                'rcs-group',
                'rcs-group-cake',
                groupSceneClasses.cake,
                entryCompositingActive ? 'rcs-group--entry-boost' : '',
                isReducedCompositing ? 'rcs-group--reduced-compositing' : '',
              ].filter(Boolean).join(' ')}
              initial="hidden"
              variants={groupVariants.cake}
            >
              {renderGroup(optimizedCurtainSceneGroups.cake)}
            </motion.div>
            <motion.div
              animate={showSequence ? 'visible' : 'hidden'}
              className={[
                'rcs-group',
                'rcs-group-balloons',
                groupSceneClasses.balloons,
                entryCompositingActive ? 'rcs-group--entry-boost' : '',
                isReducedCompositing ? 'rcs-group--reduced-compositing' : '',
              ].filter(Boolean).join(' ')}
              initial="hidden"
              variants={groupVariants.balloons}
            >
              {renderGroup(optimizedCurtainSceneGroups.balloons)}
            </motion.div>
            <motion.div
              animate={showSequence ? 'visible' : 'hidden'}
              className={[
                'rcs-group',
                'rcs-group-gifts',
                groupSceneClasses.gifts,
                entryCompositingActive ? 'rcs-group--entry-boost' : '',
                isReducedCompositing ? 'rcs-group--reduced-compositing' : '',
              ].filter(Boolean).join(' ')}
              initial="hidden"
              variants={groupVariants.gifts}
            >
              {renderGroup(optimizedCurtainSceneGroups.gifts)}
            </motion.div>
            <motion.div
              animate={showSequence ? 'visible' : 'hidden'}
              className={[
                'rcs-group',
                'rcs-group-mascot',
                groupSceneClasses.mascot,
                entryCompositingActive ? 'rcs-group--entry-boost' : '',
                isReducedCompositing ? 'rcs-group--reduced-compositing' : '',
              ].filter(Boolean).join(' ')}
              initial="hidden"
              variants={groupVariants.mascot}
            >
              {mascotTangyuanItems.map((layer) => (
                <img
                  key={layer.name}
                  alt={layer.name}
                  className={`${layer.className} rcs-mascot-tangyuan`}
                  src={layer.src}
                  style={getScenePositionStyle(layer)}
                />
              ))}
            </motion.div>

            {renderGroup(optimizedCurtainSceneGroups.fx, { animateLoop: !isReducedCompositing })}
          </motion.div>

          {/* Ghost positioned relative to viewport (bottom-right), PSD-proportional size, 80% visible */}
          <motion.div
            animate={showSequence ? 'visible' : 'hidden'}
            className={[
              'rcs-ghost-viewport',
              entryCompositingActive ? 'rcs-ghost-viewport--entry-boost' : '',
              isReducedCompositing ? 'rcs-ghost-viewport--reduced-compositing' : '',
            ].filter(Boolean).join(' ')}
            initial="hidden"
            key={`ghost-${sequenceKey}`}
            variants={groupVariants.ghost}
            onAnimationComplete={() => { if (showSequence) setGhostEntryDone(true) }}
          >
            <motion.div
              className="rcs-ghost-loop"
              animate={{
                y: loopMotion.ghost.y,
                rotate: loopMotion.ghost.rotate,
              }}
              transition={{
                duration: loopMotion.ghost.duration,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            >
              {optimizedCurtainSceneGroups.ghost.map((layer) => {
                const isBlurred = layer.name === 'ghost-right-blurred'
                return (
                  <img
                    key={layer.name}
                    alt={layer.name}
                    className={
                      isBlurred
                        ? `ghost-blurred-img${ghostEntryDone ? ' is-active' : ''}`
                        : 'ghost-sharp-img'
                    }
                    src={layer.src}
                  />
                )
              })}
            </motion.div>
          </motion.div>
        </>
      )}

      {/* Light raster entrance overlay */}
      <AnimatePresence>
        {!lightRasterDone && (
          <motion.div
            className="rcs-light-raster"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="rcs-light-raster__beam rcs-light-raster__beam--1"
              initial={{ x: '-110%' }}
              animate={introReady ? { x: '110%' } : { x: '-110%' }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="rcs-light-raster__beam rcs-light-raster__beam--2"
              initial={{ x: '110%' }}
              animate={introReady ? { x: '-110%' } : { x: '110%' }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            />
            <motion.div
              className="rcs-light-raster__beam rcs-light-raster__beam--3"
              initial={{ x: '-110%' }}
              animate={introReady ? { x: '110%' } : { x: '-110%' }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              onAnimationComplete={() => { if (introReady) setLightRasterDone(true) }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="rcs-artist-credit">
        Art by{' '}
        <a href="https://x.com/CSS74134570" rel="noopener noreferrer" target="_blank">
          奶油醬油
        </a>{' '}
        老師
      </p>
    </div>
  )
}
