import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import {
  criticalOptimizedSrcs,
  expressionAtlas,
  optimizedCurtainSceneGroups,
} from './optimizedSceneData'
import {
  getExpressionAtlasBackgroundPosition,
  getExpressionAtlasBackgroundSize,
} from './expressionAtlasSprite'
import { loopMotion, sequenceOrder } from './sequenceConfig'
import { useImagePreload } from './useImagePreload'

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

function renderGroup(layers) {
  return layers.map((layer) => <LayerImage key={layer.name} {...layer} />)
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
  const criticalSrcs = useMemo(() => criticalOptimizedSrcs, [])
  const { error: preloadError, ready: assetsReady } = useImagePreload(criticalSrcs)
  const [lightRasterDone, setLightRasterDone] = useState(false)
  const showSequence = assetsReady && lightRasterDone

  const sequenceKey = 0
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const [expressionTransitionState, setExpressionTransitionState] = useState({
    active: expressionAtlas.activeIndex,
    exiting: null,
  })
  const [ghostEntryDone, setGhostEntryDone] = useState(false)

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

  function handlePointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    setPointer({ x: Number(x.toFixed(3)), y: Number(y.toFixed(3)) })
  }

  function handlePointerLeave() {
    setPointer({ x: 0, y: 0 })
  }

  return (
    <div
      className={`rcs-stage ${!showSequence ? 'rcs-stage--loading' : ''}`}
      data-load-error={preloadError?.message ?? undefined}
      data-sequence-key={sequenceKey}
      data-testid="curtain-stage"
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      style={{ '--mx': pointer.x, '--my': pointer.y }}
    >
      <motion.div className="rcs-stage-inner" initial={false} key={sequenceKey}>
        {renderGroup(optimizedCurtainSceneGroups.background)}

        <motion.div animate={showSequence ? 'visible' : 'hidden'} className={`rcs-group rcs-group-character ${groupSceneClasses.character}`} initial="hidden" variants={groupVariants.character}>
          {renderGroup(optimizedCurtainSceneGroups.character)}
          <div className="rcs-expression-stack">
            <ExpressionAtlas
              activeExpression={expressionTransitionState.active}
              exitingExpression={expressionTransitionState.exiting}
            />
          </div>
        </motion.div>

        <motion.div animate={showSequence ? 'visible' : 'hidden'} className={`rcs-group rcs-group-cake ${groupSceneClasses.cake}`} initial="hidden" variants={groupVariants.cake}>
          {renderGroup(optimizedCurtainSceneGroups.cake)}
        </motion.div>
        <motion.div animate={showSequence ? 'visible' : 'hidden'} className={`rcs-group rcs-group-balloons ${groupSceneClasses.balloons}`} initial="hidden" variants={groupVariants.balloons}>
          {renderGroup(optimizedCurtainSceneGroups.balloons)}
        </motion.div>
        <motion.div animate={showSequence ? 'visible' : 'hidden'} className={`rcs-group rcs-group-gifts ${groupSceneClasses.gifts}`} initial="hidden" variants={groupVariants.gifts}>
          {renderGroup(optimizedCurtainSceneGroups.gifts)}
        </motion.div>
        <motion.div animate={showSequence ? 'visible' : 'hidden'} className={`rcs-group rcs-group-mascot ${groupSceneClasses.mascot}`} initial="hidden" variants={groupVariants.mascot}>
          {renderGroup(optimizedCurtainSceneGroups.mascot)}
        </motion.div>

        {renderGroup(optimizedCurtainSceneGroups.fx)}
      </motion.div>

      {/* Ghost positioned relative to viewport (bottom-right), PSD-proportional size, 80% visible */}
      <motion.div
        animate={showSequence ? 'visible' : 'hidden'}
        className="rcs-ghost-viewport"
        initial="hidden"
        key={`ghost-${sequenceKey}`}
        variants={groupVariants.ghost}
        onAnimationComplete={() => { if (showSequence) setGhostEntryDone(true) }}
      >
        {optimizedCurtainSceneGroups.ghost.map((layer) => (
          <motion.img
            key={layer.name}
            alt={layer.name}
            className={ghostEntryDone ? 'ghost-blurred' : ''}
            src={layer.src}
            animate={
              getLoopForLayer(layer.name)
                ? { ...getLoopForLayer(layer.name), transition: { duration: getLoopForLayer(layer.name).duration, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' } }
                : undefined
            }
          />
        ))}
      </motion.div>

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
              animate={assetsReady ? { x: '110%' } : { x: '-110%' }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="rcs-light-raster__beam rcs-light-raster__beam--2"
              initial={{ x: '110%' }}
              animate={assetsReady ? { x: '-110%' } : { x: '110%' }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            />
            <motion.div
              className="rcs-light-raster__beam rcs-light-raster__beam--3"
              initial={{ x: '-110%' }}
              animate={assetsReady ? { x: '110%' } : { x: '-110%' }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              onAnimationComplete={() => { if (assetsReady) setLightRasterDone(true) }}
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
