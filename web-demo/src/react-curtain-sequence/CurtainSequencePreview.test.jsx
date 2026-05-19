import React from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { optimizedCurtainSceneGroups } from './optimizedSceneData'
import CurtainSequencePreview from './CurtainSequencePreview'

// Mock motion/react: render plain DOM, fire onAnimationComplete after declared duration.
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
      exit,
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
    motion: new Proxy({}, { get: (_, tag) => createMotionComponent(tag) }),
  }
})

// Mock pixiScene: jsdom has no WebGL. We expose a tiny fake handle and
// invoke first-frame / intro-complete callbacks synchronously so React
// state transitions can be exercised.
vi.mock('./pixiScene', () => {
  const sceneEntryCompleteMs = 7550
  return {
    sceneEntryCompleteMs,
    createPixiScene: vi.fn(async ({ container, onFirstFrame, onIntroComplete }) => {
      const canvas = document.createElement('canvas')
      canvas.setAttribute('data-mock-pixi', 'true')
      container?.appendChild(canvas)
      // Notify first-frame synchronously so consumers can render the scene UI.
      onFirstFrame?.()
      // intro-complete fires on next macrotask so we can assert intermediate state.
      const introTimer = window.setTimeout(() => onIntroComplete?.(), 0)
      return {
        destroy: () => {
          window.clearTimeout(introTimer)
          canvas.remove()
        },
        setPointerFromClient: vi.fn(),
        clearPointer: vi.fn(),
        cycleExpression: vi.fn(),
        canvas,
      }
    }),
  }
})

const appStyles = readFileSync(resolve(import.meta.dirname, 'app.css'), 'utf8')
let originalImage
let originalMatchMedia

async function flushAsync() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

beforeEach(() => {
  originalImage = globalThis.Image
  originalMatchMedia = window.matchMedia
  globalThis.Image = class {
    decode() { return Promise.resolve() }
    set src(_value) { queueMicrotask(() => this.onload?.()) }
  }
  window.matchMedia = vi.fn((query) => ({
    matches: query === '(hover: hover) and (pointer: fine)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

afterEach(() => {
  globalThis.Image = originalImage
  window.matchMedia = originalMatchMedia
  vi.clearAllMocks()
})

describe('CurtainSequencePreview', () => {
  it('mounts the stage with a PIXI canvas host', async () => {
    render(<CurtainSequencePreview />)
    await flushAsync()

    expect(screen.getByTestId('curtain-stage')).toBeInTheDocument()
    expect(document.querySelector('.rcs-pixi-host')).toBeInTheDocument()
    expect(document.querySelector('.rcs-pixi-host canvas[data-mock-pixi="true"]')).toBeInTheDocument()
  })

  it('renders ghost layers in the DOM after the ghost images preload', async () => {
    render(<CurtainSequencePreview />)
    await flushAsync()

    for (const layer of optimizedCurtainSceneGroups.ghost) {
      expect(screen.getByAltText(layer.name)).toBeInTheDocument()
    }
    expect(document.querySelector('.rcs-ghost-viewport')).toBeInTheDocument()
  })

  it('renders the artist credit with a safe external link', () => {
    render(<CurtainSequencePreview />)

    const link = screen.getByRole('link', { name: '奶油醬油' })
    expect(link.closest('p')).toHaveTextContent('Art by 奶油醬油 老師')
    expect(link).toHaveAttribute('href', 'https://x.com/CSS74134570')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
  })

  it('keeps the artist credit layered above the light raster overlay', async () => {
    const style = document.createElement('style')
    style.textContent = appStyles
    document.head.appendChild(style)

    try {
      render(<CurtainSequencePreview />)
      await flushAsync()

      const artistCredit = document.querySelector('.rcs-artist-credit')
      const lightRaster = document.querySelector('.rcs-light-raster')
      expect(artistCredit).toBeInTheDocument()
      expect(lightRaster).toBeInTheDocument()
      expect(Number.parseInt(window.getComputedStyle(lightRaster).zIndex, 10)).toBe(100)
      expect(Number.parseInt(window.getComputedStyle(artistCredit).zIndex, 10)).toBeGreaterThan(100)
    } finally {
      style.remove()
    }
  })

  it('marks the stage as loading until the PIXI scene reports first frame', async () => {
    let resolveFirstFrame
    const { createPixiScene } = await import('./pixiScene')
    createPixiScene.mockImplementationOnce(async ({ container, onFirstFrame }) => {
      const canvas = document.createElement('canvas')
      container?.appendChild(canvas)
      await new Promise((r) => {
        resolveFirstFrame = () => { onFirstFrame?.(); r() }
      })
      return {
        destroy: () => canvas.remove(),
        setPointerFromClient: vi.fn(),
        clearPointer: vi.fn(),
        cycleExpression: vi.fn(),
      }
    })

    render(<CurtainSequencePreview />)
    await flushAsync()

    expect(screen.getByTestId('curtain-stage')).toHaveClass('rcs-stage--loading')

    await act(async () => {
      resolveFirstFrame()
      await Promise.resolve()
    })

    expect(screen.getByTestId('curtain-stage')).not.toHaveClass('rcs-stage--loading')
  })

  it('reports Android iframe reduced mode is opt-in (default false outside Android iframe)', async () => {
    render(<CurtainSequencePreview />)
    await flushAsync()

    expect(screen.getByTestId('curtain-stage')).toHaveAttribute('data-android-iframe', 'false')
  })

  it('keeps pointer parallax enabled by default on fine pointers', async () => {
    render(<CurtainSequencePreview />)
    await flushAsync()

    expect(screen.getByTestId('curtain-stage')).toHaveAttribute('data-pointer-parallax', 'true')
  })

  it('disables pointer parallax on coarse touch devices so scrolling stays native', async () => {
    window.matchMedia = vi.fn((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    render(<CurtainSequencePreview />)
    await flushAsync()

    expect(screen.getByTestId('curtain-stage')).toHaveAttribute('data-pointer-parallax', 'false')
  })

  it('cleans up the PIXI handle on unmount', async () => {
    const { createPixiScene } = await import('./pixiScene')
    const destroySpy = vi.fn()
    createPixiScene.mockImplementationOnce(async ({ container, onFirstFrame }) => {
      const canvas = document.createElement('canvas')
      container?.appendChild(canvas)
      onFirstFrame?.()
      return {
        destroy: destroySpy,
        setPointerFromClient: vi.fn(),
        clearPointer: vi.fn(),
        cycleExpression: vi.fn(),
      }
    })

    const { unmount } = render(<CurtainSequencePreview />)
    await flushAsync()
    unmount()

    expect(destroySpy).toHaveBeenCalled()
  })
})
