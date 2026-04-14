import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

function getLoopForLayer(name) {
  if (['twin-left', 'twin-right', 'back-hair', 'front-hair', 'ahoge'].includes(name)) {
    return loopMotion.hair
  }

  if (['body', 'face', 'left-arm', 'right-arm'].includes(name)) {
    return loopMotion.breathe
  }

  if (['balloon-back-blue', 'balloon-back-pink', 'balloon-mid-b', 'balloon-mid-a'].includes(name)) {
    return loopMotion.balloons
  }

  if (['gift-blue', 'gift-red'].includes(name)) {
    return loopMotion.gifts
  }

  if (name === 'ghost-right') {
    return loopMotion.ghost
  }

  if (name === 'glow') {
    return loopMotion.glow
  }

  return null
}

function LayerImage({ activeExpression, animateLoop = true, expressionIndex, name, className, src }) {
  const loop = animateLoop ? getLoopForLayer(name) : null
  const isExpression = typeof expressionIndex === 'number'
  const isActiveExpression = isExpression ? expressionIndex === activeExpression : undefined

  return (
    <motion.img
      alt={name}
      animate={
        isExpression
          ? { opacity: isActiveExpression ? 1 : 0 }
          : loop
            ? { ...loop, transition: { duration: loop.duration, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' } }
            : undefined
      }
      className={className}
      data-active={isExpression ? String(isActiveExpression) : undefined}
      initial={isExpression ? { opacity: isActiveExpression ? 1 : 0 } : undefined}
      src={src}
      style={getLayerStyle(name)}
      transition={isExpression ? { duration: 0.4, ease: 'easeInOut' } : undefined}
    />
  )
}

function renderGroup(layers, options = {}) {
  return layers.map((layer, index) => <LayerImage key={layer.name} {...layer} {...options} expressionIndex={options.isExpression ? index : undefined} />)
}

const groupSceneClasses = {
  character: 'has-scene-z-10',
  cake: 'has-scene-z-12',
  balloons: 'has-scene-z-7',
  gifts: 'has-scene-z-11',
  ghost: 'has-scene-z-15',
  mascot: 'has-scene-z-15',
}

/** Collect all image srcs that must be loaded before starting the sequence */
function collectCriticalSrcs() {
  const srcs = []
  for (const layer of curtainSceneGroups.background) srcs.push(layer.src)
  for (const layer of curtainSceneGroups.character) srcs.push(layer.src)
  for (const layer of expressionLayers) srcs.push(layer.src)
  return srcs
}

function usePreloadImages(srcs) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const promises = srcs.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image()
          img.onload = resolve
          img.onerror = resolve
          img.src = src
        }),
    )
    Promise.all(promises).then(() => {
      if (!cancelled) setReady(true)
    })
    return () => { cancelled = true }
  }, [srcs])

  return ready
}

export default function CurtainSequencePreview({ expressionIntervalMs = 3000 }) {
  const criticalSrcs = useMemo(collectCriticalSrcs, [])
  const assetsReady = usePreloadImages(criticalSrcs)
  const [lightRasterDone, setLightRasterDone] = useState(false)
  const showSequence = assetsReady && lightRasterDone

  const [sequenceKey, setSequenceKey] = useState(0)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const [activeExpression, setActiveExpression] = useState(() => expressionLayers.findIndex((layer) => layer.className.includes('is-active')))
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
      setActiveExpression((current) => (current + 1) % expressionLayers.length)
    }, expressionIntervalMs)

    return () => window.clearInterval(timer)
  }, [expressionIntervalMs])

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
      data-sequence-key={sequenceKey}
      data-testid="curtain-stage"
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      style={{ '--mx': pointer.x, '--my': pointer.y }}
    >
      <motion.div className="rcs-stage-inner" initial={false} key={sequenceKey}>
        {renderGroup(curtainSceneGroups.background)}

        <motion.div animate={showSequence ? 'visible' : 'hidden'} className={`rcs-group rcs-group-character ${groupSceneClasses.character}`} initial="hidden" variants={groupVariants.character}>
          {renderGroup(curtainSceneGroups.character)}
          <div className="rcs-expression-stack">
            {renderGroup(expressionLayers, { activeExpression, isExpression: true })}
          </div>
        </motion.div>

        <motion.div animate={showSequence ? 'visible' : 'hidden'} className={`rcs-group rcs-group-cake ${groupSceneClasses.cake}`} initial="hidden" variants={groupVariants.cake}>
          {renderGroup(curtainSceneGroups.cake)}
        </motion.div>
        <motion.div animate={showSequence ? 'visible' : 'hidden'} className={`rcs-group rcs-group-balloons ${groupSceneClasses.balloons}`} initial="hidden" variants={groupVariants.balloons}>
          {renderGroup(curtainSceneGroups.balloons)}
        </motion.div>
        <motion.div animate={showSequence ? 'visible' : 'hidden'} className={`rcs-group rcs-group-gifts ${groupSceneClasses.gifts}`} initial="hidden" variants={groupVariants.gifts}>
          {renderGroup(curtainSceneGroups.gifts)}
        </motion.div>
        <motion.div animate={showSequence ? 'visible' : 'hidden'} className={`rcs-group rcs-group-mascot ${groupSceneClasses.mascot}`} initial="hidden" variants={groupVariants.mascot}>
          {renderGroup(curtainSceneGroups.mascot)}
        </motion.div>

        {renderGroup(curtainSceneGroups.fx)}
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
        {curtainSceneGroups.ghost.map((layer) => (
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
    </div>
  )
}
