import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useImagePreload } from './useImagePreload'

function Harness({ srcs }) {
  const state = useImagePreload(srcs)
  return (
    <output data-error={state.error?.message ?? ''} data-ready={String(state.ready)}>
      {state.ready ? 'ready' : 'loading'}
    </output>
  )
}

describe('useImagePreload', () => {
  it('sets ready after all images load', async () => {
    const OriginalImage = globalThis.Image
    globalThis.Image = class {
      set src(_value) {
        queueMicrotask(() => this.onload?.())
      }
    }

    render(<Harness srcs={['/a.webp', '/b.webp']} />)

    await waitFor(() => expect(screen.getByText('ready')).toBeInTheDocument())
    globalThis.Image = OriginalImage
  })

  it('surfaces critical image failures', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const OriginalImage = globalThis.Image
    globalThis.Image = class {
      set src(value) {
        queueMicrotask(() => this.onerror?.(new Error(`failed ${value}`)))
      }
    }

    render(<Harness srcs={['/missing.webp']} />)

    await waitFor(() => {
      expect(screen.getByText('loading')).toHaveAttribute('data-error', 'Unable to preload image: /missing.webp')
    })
    expect(errorSpy).toHaveBeenCalled()

    globalThis.Image = OriginalImage
    errorSpy.mockRestore()
  })
})
