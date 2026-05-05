import manifest from '../../public/extracted/optimized/manifest.json'
import { withBase } from '../basePath'
import { criticalOptimizedAssetNames, optimizedSceneGroups } from './optimizedAssetSpec'
import { BASE_H, BASE_W } from './sceneGeometry'

export { BASE_H, BASE_W }

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

function getOptimizedLayerStyle(asset) {
  const [left, top, right, bottom] = asset.box

  return {
    left: `${(left / BASE_W) * 100}%`,
    top: `${(top / BASE_H) * 100}%`,
    width: `${((right - left) / BASE_W) * 100}%`,
    height: `${((bottom - top) / BASE_H) * 100}%`,
  }
}
