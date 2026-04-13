# Fan Support VTuber PSD Animation Plan

## Source asset summary
- PSD size: 2283x1302
- Exported visible layers: 38
- Main groups identified from PSD: 背景、氣球(後景/中景)、掛帶、窗光、彩帶(後景/前景)、禮物、蛋糕、桌子、歌 後景（腿、雙馬尾、後髮、右手、緞帶）、歌(前景)（身體、臉、前髮、表情、呆毛、左手）、婚叫/湯圓/發光/濾鏡
- Style target: 日系 VTuber、插畫、療癒、粉絲應援企劃

## Recommended CLI workflow for PSD拆件
1. Use `psd-tools` (Python) as the primary CLI-capable extraction library for PSD reading/compositing/export.
2. Open the PSD with `PSDImage.open()`.
3. Export a full composite PNG for reference/verification.
4. Traverse layers recursively and export visible pixel layers with `layer.topil()` to transparent PNG.
5. Build a JSON manifest containing layer name, bbox, visibility, parent group, and export path.
6. For web implementation, regroup PNGs into animation-friendly buckets: background, midground, character-back, character-front, props, particles, glow.
7. Implement each animation variant as CSS/JS transforms over the extracted transparent PNG layers.
8. Verify each output with screenshots plus visual inspection.

## Animation language buckets
- Background ambience: slow scale drift, window light pulse, banner sway.
- Party decor: balloon bobbing, bunting swing, ribbons wave, confetti drift.
- Character micro-motion: breathing, hair sway, ahoge spring, hand hover, subtle blink/expression swap.
- Cake focus: soft pop, plaque shimmer, mascot bounce.
- Foreground depth: confetti parallax, blur-layer sweep, sparkle glint.
- Fan-support mood: warm timing, soft easing, no harsh glitch, gentle celebratory rhythm.

## 10 animation variants to build
1. Soft Float Hero — all elements breathe and float softly.
2. Celebration Pop — staggered festive pop-in of balloons, gifts, cake, character.
3. Parallax Room — deeper depth with cursor-based or auto parallax.
4. Ribbon Breeze — ribbons and hair respond to a soft side wind.
5. Sparkle Focus — glow/sparkles emphasize face and cake plaque.
6. Gift Surprise — gifts and confetti animate with playful bounce.
7. Sweet Idol Entrance — character and cake cinematic upward reveal.
8. Dreamy Blur Layers — use blur foreground/background sheets for dreamy MV feeling.
9. Fan Letter Moment — plaque/mascot/ghost accents become the emotional focal rhythm.
10. Support Stage Loop — stage-like loop mixing sway, glow, confetti, and spotlight timing.

## RWD strategy
- Desktop: preserve layered tableau with full parallax.
- Tablet: reduce depth offsets, keep all major props visible.
- Mobile: prioritize face, cake, mascot, and a subset of decor; crop wide background gracefully; reduce particle count and motion amplitude.
- Use aspect-ratio container with absolute-positioned layers and CSS clamp() for scale and spacing.

## Deliverables in implementation
- extracted/manifest.json
- extracted/full-composite.png
- extracted/layers/*.png
- web demo with 10 selectable variants
- screenshots for verification
