import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { criticalOptimizedAssetNames } from './optimizedAssetSpec'

const manifestPath = resolve(import.meta.dirname, '../../public/extracted/optimized/manifest.json')
const legacyCombinedMascotPath = resolve(import.meta.dirname, '../../public/extracted/optimized/mascot-cake.png')

describe('generated optimized assets', () => {
  it('writes an optimized manifest with request and critical budgets', () => {
    expect(existsSync(manifestPath)).toBe(true)

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    const mascotAssets = manifest.assets.filter((asset) => asset.name.startsWith('mascot-cake'))

    expect(manifest.assets).toHaveLength(16)
    expect(manifest.critical).toEqual(criticalOptimizedAssetNames)
    expect(manifest.assets.filter((asset) => asset.formats.webp)).toHaveLength(16)
    expect(manifest.assets.filter((asset) => asset.formats.png)).toHaveLength(16)
    expect(manifest.assets.some((asset) => asset.name === 'mascot-cake')).toBe(false)
    expect(mascotAssets.map((asset) => asset.name)).toEqual([
      'mascot-cake-1',
      'mascot-cake-2',
      'mascot-cake-3',
      'mascot-cake-4',
    ])
    mascotAssets.forEach((asset) => {
      expect(asset.formats.webp).toMatch(/^extracted\/optimized\/mascot-cake-\d\.webp$/)
      expect(asset.formats.png).toMatch(/^extracted\/optimized\/mascot-cake-\d\.png$/)
    })
  })

  it('keeps generated referenced bytes below the current baseline', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    const webpBytes = manifest.assets.reduce((sum, asset) => {
      const filePath = resolve(import.meta.dirname, '../../public', asset.formats.webp)
      return sum + statSync(filePath).size
    }, 0)

    expect(webpBytes).toBeLessThan(7.69 * 1024 * 1024)
  })

  it('does not ship the legacy combined mascot asset in optimized output', () => {
    expect(existsSync(legacyCombinedMascotPath)).toBe(false)
  })
})
