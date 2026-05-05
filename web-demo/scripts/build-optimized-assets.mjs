import { mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { criticalOptimizedAssetNames, getOptimizedAssetBox, optimizedAssetSpec } from '../src/react-curtain-sequence/optimizedAssetSpec.js'

const projectRoot = resolve(import.meta.dirname, '..')
const sourceDir = resolve(projectRoot, 'public/extracted/layers')
const outputDir = resolve(projectRoot, 'public/extracted/optimized')
const publicPrefix = 'extracted/optimized'

await rm(outputDir, { force: true, recursive: true })
await mkdir(outputDir, { recursive: true })

const manifest = {
  generatedBy: 'web-demo/scripts/build-optimized-assets.mjs',
  critical: criticalOptimizedAssetNames,
  assets: [],
}

for (const asset of optimizedAssetSpec) {
  const box = getOptimizedAssetBox(asset.name)
  const width = box[2] - box[0]
  const height = box[3] - box[1]
  const image = await buildAssetImage(asset, box, width, height)
  const pngFile = `${asset.name}.png`
  const webpFile = `${asset.name}.webp`
  const pngPath = resolve(outputDir, pngFile)
  const webpPath = resolve(outputDir, webpFile)

  await image.png({ compressionLevel: 9, palette: true }).toFile(pngPath)
  await image.webp({ effort: 6, quality: 86 }).toFile(webpPath)

  manifest.assets.push({
    name: asset.name,
    type: asset.type,
    box,
    width,
    height,
    className: asset.className,
    loop: asset.loop ?? null,
    activeFrame: asset.activeFrame ?? null,
    frameNames: asset.frames?.map((frame) => frame.name) ?? null,
    formats: {
      png: `${publicPrefix}/${pngFile}`,
      webp: `${publicPrefix}/${webpFile}`,
    },
  })
}

await writeFile(resolve(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)

async function buildAssetImage(asset, box, width, height) {
  if (asset.type === 'atlas') {
    return buildAtlas(asset, box, width, height)
  }

  const sources = asset.sources.map((source) => ({
    input: resolve(sourceDir, source.file),
    left: source.box[0] - box[0],
    top: source.box[1] - box[1],
  }))

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(sources)
}

async function buildAtlas(asset, box, frameWidth, frameHeight) {
  const composites = asset.frames.map((frame, index) => ({
    input: resolve(sourceDir, frame.file),
    left: index * frameWidth + frame.box[0] - box[0],
    top: frame.box[1] - box[1],
  }))

  return sharp({
    create: {
      width: frameWidth * asset.frames.length,
      height: frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(composites)
}
