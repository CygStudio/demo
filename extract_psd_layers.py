from __future__ import annotations

from pathlib import Path
import json
from psd_tools import PSDImage

PSD_PATH = Path('/workspace/8d7e300c999ac6e9.psd')
OUT_DIR = Path('/workspace/fan-support-project/extracted')
PNG_DIR = OUT_DIR / 'layers'


def sanitize(name: str) -> str:
    keep = []
    for ch in name:
        if ch.isalnum() or ch in ('-', '_'):
            keep.append(ch)
        elif ch in (' ', '.', '/', '\\'):
            keep.append('_')
    result = ''.join(keep).strip('_')
    return result or 'unnamed'


def walk(layer, depth=0, parent='root', rows=None):
    if rows is None:
        rows = []
    row = {
        'name': layer.name,
        'visible': bool(getattr(layer, 'visible', True)),
        'is_group': bool(layer.is_group()),
        'bbox': list(layer.bbox) if getattr(layer, 'bbox', None) else None,
        'parent': parent,
        'depth': depth,
        'opacity': getattr(layer, 'opacity', None),
        'blend_mode': str(getattr(layer, 'blend_mode', '')),
        'exported': False,
        'png': None,
    }
    rows.append((layer, row))
    if layer.is_group():
        for child in layer:
            walk(child, depth + 1, layer.name or parent, rows)
    return rows


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PNG_DIR.mkdir(parents=True, exist_ok=True)
    psd = PSDImage.open(PSD_PATH)
    manifest = {
        'size': [psd.width, psd.height],
        'layers': [],
        'preview_png': None,
    }

    preview = psd.composite(force=True)
    if preview:
        preview_path = OUT_DIR / 'full-composite.png'
        preview.save(preview_path)
        manifest['preview_png'] = str(preview_path)

    rows = []
    for layer in psd:
        walk(layer, 0, 'root', rows)

    name_counter = {}
    for idx, (layer, row) in enumerate(rows):
        row['index'] = idx
        if row['is_group']:
            manifest['layers'].append(row)
            continue
        name = sanitize(row['name'] or 'layer')
        count = name_counter.get(name, 0) + 1
        name_counter[name] = count
        filename = f"{idx:03d}_{name}_{count}.png"
        out_path = PNG_DIR / filename
        try:
            rendered = layer.topil()
        except Exception:
            rendered = None
        if rendered:
            rendered.save(out_path)
            row['exported'] = True
            row['png'] = str(out_path)
        manifest['layers'].append(row)

    (OUT_DIR / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'out_dir': str(OUT_DIR), 'preview': manifest['preview_png'], 'total_layers': len(manifest['layers'])}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
