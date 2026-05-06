import manifest from '../../public/extracted/optimized/manifest.json'
import { withBase } from '../basePath'
import { criticalOptimizedAssetNames, optimizedSceneGroups } from './optimizedAssetSpec'
import { BASE_H, BASE_W } from './sceneGeometry'

export { BASE_H, BASE_W }
export const optimizedSceneBounds = { left: 0, top: 0, right: BASE_W, bottom: BASE_H }

export const optimizedLayerByName = new Map(
  manifest.assets.map((asset) => [
    asset.name,
    {
      ...asset,
      src: withBase(asset.formats.webp ?? asset.formats.png),
      fallbackSrc: withBase(asset.formats.png),
      className: asset.className,
      style: getOptimizedLayerStyle(asset),
    },
  ]),
)

export const optimizedCurtainSceneGroups = Object.fromEntries(
  Object.entries(optimizedSceneGroups).map(([group, layers]) => [
    group,
    layers.map((layer) => optimizedLayerByName.get(layer.name)),
  ]),
)

export const criticalOptimizedSrcs = criticalOptimizedAssetNames.map((name) => optimizedLayerByName.get(name).src)

export const expressionAtlas = {
  ...optimizedLayerByName.get('expression-atlas'),
  activeIndex: optimizedLayerByName.get('expression-atlas').frameNames.indexOf(
    optimizedLayerByName.get('expression-atlas').activeFrame,
  ),
}

export const optimizedMascotTangyuanMotionItems = optimizedCurtainSceneGroups.mascot.map((layer) => {
  const [left, top, right, bottom] = layer.box

  return {
    id: layer.name,
    name: layer.name,
    src: layer.src,
    className: layer.className,
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    style: layer.style,
  }
})

function getOptimizedLayerStyle(asset) {
  const [left, top, right, bottom] = asset.box

  return getScenePositionStyle({
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  })
}

export function getScenePositionStyle({ x, y, width, height }) {
  return {
    left: `${(x / BASE_W) * 100}%`,
    top: `${(y / BASE_H) * 100}%`,
    width: `${(width / BASE_W) * 100}%`,
    height: `${(height / BASE_H) * 100}%`,
  }
}
