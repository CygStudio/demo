import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CurtainSequencePreview from './CurtainSequencePreview'

describe('CurtainSequencePreview', () => {
  it('renders core scene groups and images', () => {
    render(<CurtainSequencePreview />)

    expect(screen.getByTestId('curtain-stage')).toBeInTheDocument()
    expect(screen.getByAltText('body')).toBeInTheDocument()
    expect(screen.getByAltText('cake')).toBeInTheDocument()
    expect(screen.getByAltText('ghost-right')).toBeInTheDocument()

    expect(document.querySelector('.rcs-group-character')).toBeInTheDocument()
    expect(document.querySelector('.rcs-group-cake')).toBeInTheDocument()
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

  it('cycles expressions every 3 seconds', () => {
    render(<CurtainSequencePreview expressionIntervalMs={3000} />)

    expect(screen.getByAltText('expr-c')).toHaveAttribute('data-active', 'true')

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByAltText('expr-d')).toHaveAttribute('data-active', 'true')
  })
})
