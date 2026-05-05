import React from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CurtainSequencePreview from './CurtainSequencePreview'

const appStyles = readFileSync(resolve(import.meta.dirname, 'app.css'), 'utf8')

describe('CurtainSequencePreview', () => {
  it('renders optimized scene groups and images', () => {
    render(<CurtainSequencePreview />)

    expect(screen.getByTestId('curtain-stage')).toBeInTheDocument()
    expect(screen.getByAltText('character-body')).toBeInTheDocument()
    expect(screen.getByAltText('cake-table')).toBeInTheDocument()
    expect(screen.getByAltText('ghost-right')).toBeInTheDocument()

    expect(document.querySelectorAll('.rcs-stage img')).toHaveLength(11)
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
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cycles expression atlas frames every 3 seconds', () => {
    render(<CurtainSequencePreview expressionIntervalMs={3000} />)

    expect(screen.getByRole('img', { name: 'expr-c' })).toHaveAttribute('data-active', 'true')

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByRole('img', { name: 'expr-d' })).toHaveAttribute('data-active', 'true')
  })
})
