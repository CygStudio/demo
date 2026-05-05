import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { criticalOptimizedAssetNames } from './optimizedAssetSpec'

const manifestPath = resolve(import.meta.dirname, '../../public/extracted/optimized/manifest.json')

describe('generated optimized assets', () => {
  it('writes an optimized manifest with request and critical budgets', () => {
    expect(existsSync(manifestPath)).toBe(true)

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

    expect(manifest.assets).toHaveLength(12)
    expect(manifest.critical).toEqual(criticalOptimizedAssetNames)
    expect(manifest.assets.filter((asset) => asset.formats.webp)).toHaveLength(12)
    expect(manifest.assets.filter((asset) => asset.formats.png)).toHaveLength(12)
  })

  it('keeps generated referenced bytes below the current baseline', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    const webpBytes = manifest.assets.reduce((sum, asset) => {
      const filePath = resolve(import.meta.dirname, '../../public', asset.formats.webp)
      return sum + statSync(filePath).size
    }, 0)

    expect(webpBytes).toBeLessThan(7.69 * 1024 * 1024)
  })
})
