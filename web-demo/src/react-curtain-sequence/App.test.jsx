import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('React curtain sequence shell', () => {
  it('renders the curtain stage', () => {
    render(<App />)

    expect(screen.getByTestId('curtain-stage')).toBeInTheDocument()
  })
})
