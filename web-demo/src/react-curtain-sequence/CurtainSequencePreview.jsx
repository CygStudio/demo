import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  expressionAtlas,
  optimizedCurtainSceneGroups,
} from './optimizedSceneData'
import { loopMotion } from './sequenceConfig'
import { useImagePreload } from './useImagePreload'
import { createPixiScene, sceneEntryCompleteMs } from './pixiScene'

const ghostLoopAmpY = (Math.max(...loopMotion.ghost.y) - Math.min(...loopMotion.ghost.y)) / 2
const ghostLoopAmpRotateDeg = (Math.max(...loopMotion.ghost.rotate) - Math.min(...loopMotion.ghost.rotate)) / 2

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

function detectFinePointer() {
  if (typeof window === 'undefined') return true
  if (typeof window.matchMedia !== 'function') {
    return (navigator?.maxTouchPoints ?? 0) === 0
  }
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

export default function CurtainSequencePreview({ expressionIntervalMs = 3000 }) {
  // Only preload DOM ghost images here; PIXI handles its own asset loading.
  const ghostSrcs = useMemo(
    () => optimizedCurtainSceneGroups.ghost.map((layer) => layer.src),
    [],
  )
  const { error: preloadError, ready: ghostReady } = useImagePreload(ghostSrcs)

  const isReducedCompositing = useMemo(() => detectAndroidChromiumIframe(), [])
  const enablePointerParallax = useMemo(
    () => !isReducedCompositing && detectFinePointer(),
    [isReducedCompositing],
  )

  const stageRef = useRef(null)
  const pixiContainerRef = useRef(null)
  const sceneHandleRef = useRef(null)

  const [pixiReady, setPixiReady] = useState(false)
  const [introComplete, setIntroComplete] = useState(false)
  const [lightRasterDone, setLightRasterDone] = useState(false)
  const [ghostEntered, setGhostEntered] = useState(false)
  const [ghostEntryDone, setGhostEntryDone] = useState(false)
  const [pixiError, setPixiError] = useState(null)

  const showSequence = pixiReady

  // ---- Mount PIXI ----
  useEffect(() => {
    let cancelled = false
    const container = pixiContainerRef.current
    if (!container) return undefined

    createPixiScene({
      container,
      reduced: isReducedCompositing,
      onFirstFrame: () => {
        if (cancelled) return
        setPixiReady(true)
      },
      onIntroComplete: () => {
        if (cancelled) return
        setIntroComplete(true)
      },
    })
      .then((handle) => {
        if (cancelled) {
          handle.destroy()
          return
        }
        sceneHandleRef.current = handle
      })
      .catch((error) => {
        if (cancelled) return
        console.error('createPixiScene failed', error)
        setPixiError(error)
      })

    return () => {
      cancelled = true
      const handle = sceneHandleRef.current
      sceneHandleRef.current = null
      if (handle) handle.destroy()
    }
  }, [isReducedCompositing])

  // ---- Trigger PIXI intros only after light raster overlay finishes ----
  useEffect(() => {
    if (!lightRasterDone) return undefined
    sceneHandleRef.current?.startIntro?.()
    return undefined
  }, [lightRasterDone])

  // ---- Drive expression cycling from React (kept as canonical timer) ----
  useEffect(() => {
    if (!pixiReady) return undefined
    const timer = window.setInterval(() => {
      sceneHandleRef.current?.cycleExpression?.()
    }, expressionIntervalMs)
    return () => window.clearInterval(timer)
  }, [expressionIntervalMs, pixiReady])

  // ---- Ghost entry timing (after scene-entry completes) ----
  useEffect(() => {
    if (!introComplete) {
      setGhostEntered(false)
      setGhostEntryDone(false)
      return undefined
    }
    // Trigger ghost slide-in immediately after main scene intros finish.
    setGhostEntered(true)
    // Crossfade sharp → blurred after the entry settles (entry 1.6s + 0.8s hold).
    const timer = window.setTimeout(() => setGhostEntryDone(true), 1400)
    return () => window.clearTimeout(timer)
  }, [introComplete])

  // ---- Pointer handlers ----
  function handlePointerMove(event) {
    if (!enablePointerParallax || event.pointerType === 'touch' || event.pointerType === 'pen') return
    sceneHandleRef.current?.setPointerFromClient(event.clientX, event.clientY)
  }
  function handlePointerLeave() {
    if (!enablePointerParallax) return
    sceneHandleRef.current?.clearPointer()
  }

  const stageClass = [
    'rcs-stage',
    !showSequence ? 'rcs-stage--loading' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={stageClass}
      data-android-iframe={String(isReducedCompositing)}
      data-load-error={preloadError?.message ?? pixiError?.message ?? undefined}
      data-pointer-parallax={String(enablePointerParallax)}
      data-testid="curtain-stage"
      onPointerLeave={enablePointerParallax ? handlePointerLeave : void 0}
      onPointerMove={enablePointerParallax ? handlePointerMove : void 0}
      ref={stageRef}
    >
      <div className="rcs-pixi-host" ref={pixiContainerRef} />

      {/* Ghost: viewport-pinned (bottom-right). Outer wrapper handles entry slide,
          inner motion.div handles continuous loop. Sharp → blurred crossfade once settled.
          Entry direction mirrors original sequenceConfig (`x: +20, y: -32`):
          starts upper-right, swoops down-left into rest position. */}
      {ghostReady && (
        <div className="rcs-ghost-viewport">
          <motion.div
            className="rcs-ghost-entry"
            initial={{ x: '35%', y: '-35%', opacity: 0 }}
            animate={ghostEntered
              ? { x: '0%', y: '0%', opacity: 1 }
              : { x: '35%', y: '-35%', opacity: 0 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="rcs-ghost-loop"
              animate={ghostEntered
                ? { y: [0, -ghostLoopAmpY, 0], rotate: [0, ghostLoopAmpRotateDeg, 0] }
                : { y: 0, rotate: 0 }}
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
        </div>
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
              animate={showSequence ? { x: '110%' } : { x: '-110%' }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="rcs-light-raster__beam rcs-light-raster__beam--2"
              initial={{ x: '110%' }}
              animate={showSequence ? { x: '-110%' } : { x: '110%' }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            />
            <motion.div
              className="rcs-light-raster__beam rcs-light-raster__beam--3"
              initial={{ x: '-110%' }}
              animate={showSequence ? { x: '110%' } : { x: '-110%' }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              onAnimationComplete={() => { if (showSequence) setLightRasterDone(true) }}
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

// Suppress unused warnings for values exposed only for tests / future use
void expressionAtlas
void sceneEntryCompleteMs
