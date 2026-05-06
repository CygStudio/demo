import React from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getScenePositionStyle,
  optimizedCurtainSceneGroups,
  optimizedMascotTangyuanMotionItems,
  optimizedSceneBounds,
} from './optimizedSceneData'
import { sequenceOrder } from './sequenceConfig'
import { createTangyuanVelocities, stepTangyuanMotion } from './tangyuanMotion'
import CurtainSequencePreview from './CurtainSequencePreview'

vi.mock('motion/react', async () => {
  const ReactModule = await import('react')
  const { createElement, forwardRef, Fragment, useEffect } = ReactModule

  const createMotionComponent = (tag) => forwardRef((props, ref) => {
    const {
      animate,
      children,
      initial,
      onAnimationComplete,
      transition,
      variants,
      ...domProps
    } = props
    const resolvedAnimate = typeof animate === 'string' && variants ? variants[animate] : animate

    useEffect(() => {
      if (!onAnimationComplete) return undefined

      const activeTransition = resolvedAnimate?.transition ?? transition
      const delayMs = (activeTransition?.delay ?? 0) * 1000
      const durationMs = (activeTransition?.duration ?? 0) * 1000
      const timer = window.setTimeout(() => onAnimationComplete(), delayMs + durationMs)

      return () => window.clearTimeout(timer)
    }, [animate, onAnimationComplete, resolvedAnimate, transition])

    return createElement(tag, { ref, ...domProps }, children)
  })

  return {
    AnimatePresence: ({ children }) => createElement(Fragment, null, children),
    motion: new Proxy({}, {
      get: (_, tag) => createMotionComponent(tag),
    }),
  }
})

const appStyles = readFileSync(resolve(import.meta.dirname, 'app.css'), 'utf8')
const lightRasterCompleteMs = 1700
const sceneEntryCompleteMs = Math.max(...sequenceOrder.map(({ delay, duration }) => delay + duration)) * 1000

const expectedTangyuanLayout = optimizedCurtainSceneGroups.mascot.map(({ name, style }) => ({
  name,
  left: style.left,
  top: style.top,
  width: style.width,
  height: style.height,
}))

function readTangyuanLayout() {
  return optimizedCurtainSceneGroups.mascot.map(({ name }) => {
    const node = screen.getByAltText(name)

    return {
      name,
      left: node.style.left,
      top: node.style.top,
      width: node.style.width,
      height: node.style.height,
    }
  })
}

function formatTangyuanLayout(items) {
  return items.map(({ name, width, height, x, y }) => ({
    name,
    ...getScenePositionStyle({ x, y, width, height }),
  }))
}

function createMockRect({ left, top, width, height }) {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON() {
      return this
    },
  }
}

function mockVisibleSceneRects({
  stageRect = createMockRect({ left: 0, top: 0, width: 800, height: 500 }),
  sceneRect = createMockRect({ left: -400, top: -100, width: 1600, height: 700 }),
} = {}) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getBoundingClientRect() {
    if (this.dataset?.testid === 'curtain-stage') return stageRect
    if (this.classList?.contains('rcs-stage-inner')) return sceneRect
    return createMockRect({ left: 0, top: 0, width: 0, height: 0 })
  })

  return { stageRect, sceneRect }
}

function getVisiblePercentBounds(stageRect, sceneRect) {
  const left = Math.max(stageRect.left - sceneRect.left, 0)
  const right = Math.min(stageRect.right - sceneRect.left, sceneRect.width)
  const top = Math.max(stageRect.top - sceneRect.top, 0)
  const bottom = Math.min(stageRect.bottom - sceneRect.top, sceneRect.height)

  return {
    left: (left / sceneRect.width) * 100,
    right: (right / sceneRect.width) * 100,
    top: (top / sceneRect.height) * 100,
    bottom: (bottom / sceneRect.height) * 100,
  }
}

async function flushPreloadMicrotasks() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('CurtainSequencePreview', () => {
  it('renders optimized scene groups and images', () => {
    render(<CurtainSequencePreview />)

    expect(screen.getByTestId('curtain-stage')).toBeInTheDocument()
    expect(screen.getByAltText('character-body')).toBeInTheDocument()
    expect(screen.getByAltText('cake-table')).toBeInTheDocument()
    expect(screen.getByAltText('ghost-right')).toBeInTheDocument()
    expect(screen.getByAltText('mascot-cake-1')).toBeInTheDocument()
    expect(screen.getByAltText('mascot-cake-2')).toBeInTheDocument()
    expect(screen.getByAltText('mascot-cake-3')).toBeInTheDocument()
    expect(screen.getByAltText('mascot-cake-4')).toBeInTheDocument()
    expect(screen.queryByAltText('mascot-cake')).not.toBeInTheDocument()

    expect(document.querySelectorAll('.rcs-stage img')).toHaveLength(14)
    expect(document.querySelectorAll('.rcs-group-mascot img')).toHaveLength(4)
    expect(document.querySelector('.rcs-expression-stack [role="img"]')).toHaveAccessibleName('expr-c')
    expect(document.querySelector('.rcs-group-character')).toBeInTheDocument()
    expect(document.querySelector('.rcs-group-cake')).toBeInTheDocument()
  })

  it('renders the artist credit with a safe external link', () => {
    render(<CurtainSequencePreview />)

    const artistLink = screen.getByRole('link', { name: '奶油醬油' })
    expect(artistLink.closest('p')).toHaveTextContent('Art by 奶油醬油 老師')
    expect(artistLink).toHaveAttribute('href', 'https://x.com/CSS74134570')
    expect(artistLink).toHaveAttribute('target', '_blank')
    expect(artistLink).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(artistLink).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
  })

  it('keeps the artist credit layered above the light raster overlay', () => {
    const style = document.createElement('style')
    style.textContent = appStyles
    document.head.appendChild(style)

    try {
      render(<CurtainSequencePreview />)

      const artistCredit = document.querySelector('.rcs-artist-credit')
      const lightRaster = document.querySelector('.rcs-light-raster')
      const rasterZIndex = Number.parseInt(window.getComputedStyle(lightRaster).zIndex, 10)
      const artistCreditZIndex = Number.parseInt(window.getComputedStyle(artistCredit).zIndex, 10)

      expect(artistCredit).toBeInTheDocument()
      expect(lightRaster).toBeInTheDocument()
      expect(rasterZIndex).toBe(100)
      expect(artistCreditZIndex).toBeGreaterThan(100)
    } finally {
      style.remove()
    }
  })

  it('preserves the original scene stacking order on group wrappers', () => {
    render(<CurtainSequencePreview />)

    expect(document.querySelector('.rcs-group-character')).toHaveClass('has-scene-z-10')
    expect(document.querySelector('.rcs-group-cake')).toHaveClass('has-scene-z-12')
    expect(document.querySelector('.rcs-group-balloons')).toHaveClass('has-scene-z-7')
    expect(document.querySelector('.rcs-group-gifts')).toHaveClass('has-scene-z-11')
    expect(document.querySelector('.rcs-ghost-viewport')).toBeInTheDocument()
    expect(document.querySelector('.rcs-group-mascot')).toHaveClass('has-scene-z-15')
  })
})

describe('Curtain sequence interactions', () => {
  let originalImage

  beforeEach(() => {
    vi.useFakeTimers()
    originalImage = globalThis.Image
    globalThis.Image = class {
      set src(_value) {
        queueMicrotask(() => this.onload?.())
      }
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.Image = originalImage
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('cycles expression atlas frames every 3 seconds', () => {
    render(<CurtainSequencePreview expressionIntervalMs={3000} />)

    expect(screen.getByRole('img', { name: 'expr-c' })).toHaveAttribute('data-active', 'true')
    expect(document.querySelector('[data-transition-state="exiting"]')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByRole('img', { name: 'expr-d' })).toHaveAttribute('data-active', 'true')
  })

  it('keeps the previous expression atlas frame briefly as an exiting layer during transitions', () => {
    render(<CurtainSequencePreview expressionIntervalMs={3000} />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByRole('img', { name: 'expr-d' })).toHaveAttribute('data-active', 'true')
    expect(screen.getByRole('img', { name: 'expr-c' })).toHaveAttribute('data-transition-state', 'exiting')
  })

  it('removes the exiting expression atlas frame after the fade-out completes', () => {
    render(<CurtainSequencePreview expressionIntervalMs={3000} />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(screen.getByRole('img', { name: 'expr-d' })).toHaveAttribute('data-active', 'true')
    expect(screen.queryByRole('img', { name: 'expr-c' })).not.toBeInTheDocument()
    expect(document.querySelectorAll('.rcs-expression-stack [role="img"]')).toHaveLength(1)
  })

  it('keeps tangyuan at their original positions until scene entry completes, then starts independent motion', async () => {
    render(<CurtainSequencePreview />)
    await flushPreloadMicrotasks()

    expect(readTangyuanLayout()).toEqual(expectedTangyuanLayout)

    act(() => {
      vi.advanceTimersByTime(lightRasterCompleteMs)
    })

    expect(readTangyuanLayout()).toEqual(expectedTangyuanLayout)

    act(() => {
      vi.advanceTimersByTime(sceneEntryCompleteMs - 1)
    })

    expect(readTangyuanLayout()).toEqual(expectedTangyuanLayout)

    act(() => {
      vi.advanceTimersByTime(1)
    })

    const movedLayout = readTangyuanLayout()
    expect(movedLayout).not.toEqual(expectedTangyuanLayout)

    movedLayout.forEach((item, index) => {
      expect(item.left).not.toBe(expectedTangyuanLayout[index].left)
      expect(item.top).not.toBe(expectedTangyuanLayout[index].top)
    })

    const deltaDirections = movedLayout.map((item, index) => {
      const initial = expectedTangyuanLayout[index]

      return [
        Math.sign(parseFloat(item.left) - parseFloat(initial.left)),
        Math.sign(parseFloat(item.top) - parseFloat(initial.top)),
      ].join(',')
    })

    expect(new Set(deltaDirections).size).toBe(4)
  })

  it('does not double-step on the first post-start animation frame', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const velocities = createTangyuanVelocities(() => 0)
    const startedItems = optimizedMascotTangyuanMotionItems.map((item, index) => ({
      ...item,
      ...velocities[index],
    }))
    const firstStepLayout = formatTangyuanLayout(stepTangyuanMotion(startedItems, optimizedSceneBounds, 16))
    const secondStepLayout = formatTangyuanLayout(
      stepTangyuanMotion(stepTangyuanMotion(startedItems, optimizedSceneBounds, 16), optimizedSceneBounds, 16),
    )

    render(<CurtainSequencePreview />)
    await flushPreloadMicrotasks()

    act(() => {
      vi.advanceTimersByTime(lightRasterCompleteMs)
    })

    act(() => {
      vi.advanceTimersByTime(sceneEntryCompleteMs)
    })

    expect(readTangyuanLayout()).toEqual(firstStepLayout)

    act(() => {
      vi.advanceTimersByTime(16)
    })

    expect(readTangyuanLayout()).toEqual(firstStepLayout)

    act(() => {
      vi.advanceTimersByTime(16)
    })

    expect(readTangyuanLayout()).toEqual(secondStepLayout)
  })

  it('keeps tangyuan inside the visible scene bounds while bouncing', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const { stageRect, sceneRect } = mockVisibleSceneRects()
    const visibleBounds = getVisiblePercentBounds(stageRect, sceneRect)

    render(<CurtainSequencePreview />)
    await flushPreloadMicrotasks()

    act(() => {
      vi.advanceTimersByTime(lightRasterCompleteMs + sceneEntryCompleteMs + 5000)
    })

    readTangyuanLayout().forEach((item) => {
      const left = parseFloat(item.left)
      const top = parseFloat(item.top)
      const width = parseFloat(item.width)
      const height = parseFloat(item.height)

      expect(left).toBeGreaterThanOrEqual(visibleBounds.left)
      expect(left + width).toBeLessThanOrEqual(visibleBounds.right)
      expect(top).toBeGreaterThanOrEqual(visibleBounds.top)
      expect(top + height).toBeLessThanOrEqual(visibleBounds.bottom)
    })
  })
})
