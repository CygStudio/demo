# 動畫效能優化設計

## 問題

React curtain sequence 目前會渲染 36 張 PNG 圖層，實際引用的圖片資源約 7.69MiB。初始載入流程會把 24 張圖片列為 light-raster 進場前的 critical image。這能保留 PSD 圖層細節，但會增加圖片 request 數、decode 成本、DOM node 數量，以及 animated `motion.img` 元件數量。

目標是在盡量維持核心視覺效果的前提下，提高載入速度與 runtime 效能。需要保留的核心效果包含：分層 VTuber 粉絲應援插畫、柔和進場節奏、角色微動、表情輪播、漂浮 props、glow，以及 viewport parallax。

## 核准方向

採用平衡最佳化策略：把靜態或相同 motion 的圖層產生成 composite asset，保留視覺上重要的獨立動畫群組，並把圖片載入拆成 critical 與 non-critical 兩個階段。

這個方向比單純壓縮既有 PNG 更有效，因為只壓縮不會降低 request 數。它也比激進的全場景合成更安全，因為主要動畫語彙仍會保留。

## 資源架構

保留 `extracted/layers` 作為來源圖層。最佳化後的資源產生到：

```text
web-demo/public/extracted/optimized/
```

最佳化輸出應包含 composite / atlas 圖片，以及一份 optimized manifest。React 動畫改讀 optimized manifest，但仍沿用目前 2283×1302 的 PSD 座標系。

建議合成項目：

| 最佳化資源 | 來源圖層 | 原因 |
| --- | --- | --- |
| `scene-base` | paper、background、wall art、bunting、window light | 降低靜態背景 request 數 |
| `character-hair-back` | back hair、twin tails、小緞帶 | 共用 hair sway 行為 |
| `character-body` | body、face、left arm、right arm | 共用 breathing 行為 |
| `character-hair-front` | front hair、ahoge | 共用 hair sway，同時保留前景層級 |
| `expression-atlas` | 4 張 expression layers | 表情輪播只需 1 個 request |
| `cake-table` | cake、table | 同一個進場群組，沒有獨立 loop |
| `balloons` | 所有 balloon layers | 共用 floating loop 與 scene group |
| `gifts` | blue gift、red gift | 共用 floating loop 與 scene group |
| 獨立資源 | ghost、mascot、glow、filter | 保留獨立 timing、overlay 行為或降低視覺風險 |

這樣預期可把實際 image request 從 36 個降到約 12 個，同時保留有意義的動畫層。

## 載入與資料流

圖片載入分成兩個階段。

第一階段只載入與 decode critical set：

- `scene-base`
- `character-hair-back`
- `character-body`
- `character-hair-front`
- `expression-atlas`

critical set decode 完成後，啟動 light-raster 進場並揭露主畫面。

第二階段用較低優先序預載 non-critical set：

- `cake-table`
- `balloons`
- `gifts`
- `ghost`
- `mascot`
- `glow`
- `filter`

這些群組在 sequence 中本來就比較晚進場，通常能在可見前完成載入。如果某個 non-critical group 到預定進場時間仍未完成 decode，該 group 先保持 hidden，等完成後再顯示，避免破圖或突然跳出。

optimized manifest 應優先列出 AVIF 或 WebP，並保留 PNG fallback。實作時可再決定使用 `<picture>` markup 或 JavaScript-based format selection。

## Runtime 動畫模型

保留以下可見效果：

- hair sway
- body breathing
- expression cycling
- balloon floating
- gift floating
- ghost floating 與 blur transition
- glow pulse
- stage pointer parallax

composite 內的子圖層 motion 可以簡化。例如所有 balloon pieces 可作為同一個 group 漂浮，cake 與 table 可一起進場，小緞帶可跟 back hair group 一起晃動。這些取捨可接受，因為目前動畫中許多圖層本來就共用 loop 或保持靜態。

避免在大量 child images 上套用昂貴的 CSS filter。進場 blur 保留在 group wrapper 上，靜態視覺效果則優先用 baked image pixels 承載。

## 錯誤處理

critical image 載入失敗時，不應默默視為成功。UI 應保留 loading state，並提供明確失敗訊號，例如錯誤狀態與 `console.error`，方便部署後排查。

non-critical image 載入失敗時，不應阻塞主畫面。可用 format fallback 時優先 fallback；如果所有格式都失敗，就跳過該 non-critical group 或保持 hidden。

## 測試與驗證

新增或更新測試以確認：

- optimized manifest groups 會對應到預期 scene layers。
- critical 與 non-critical image sets 分類正確。
- 核心 scene elements 仍會渲染。
- artist credit 仍在 light-raster overlay 之上。
- expression cycling 在 atlas 策略下仍可運作。
- scene stacking order 在視覺上維持等效。

用可量測目標驗收效能：

- image requests：從 36 降到約 12。
- critical preload images：從 24 降到約 5。
- referenced image bytes：明顯低於目前約 7.69MiB。
- runtime DOM image 與 motion element 數量：降低，且不失去核心動畫行為。

使用 screenshot comparison 或人工視覺檢查對照 reference image，確認 background、character、cake、balloons、glow、filter 與進場 timing 仍可接受。
