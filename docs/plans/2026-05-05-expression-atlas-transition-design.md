# Expression Atlas Transition Design

## 問題

目前 optimized runtime 已把表情切換改為單一 `expression-atlas` sprite。雖然這保留了 1 個 request 的優勢，但視覺上比舊版多張表情圖片的做法更乾、更俐落，少了原本短暫重疊淡入淡出的柔和感。

## 核准方向

保留 atlas，不退回多張獨立圖片。

改用「active frame + previous frame」雙層短暫重疊的做法：

- 新表情 frame 淡入。
- 前一個表情 frame 在短時間內維持可見，再淡出。
- 同一時間最多只保留兩個表情 layer，避免無限制堆疊。

這樣可以維持目前 optimized asset 架構與 request 數，同時把表情切換調回接近舊版的觀感。

## Runtime 行為

`CurtainSequencePreview.jsx` 仍以 atlas 為資料來源，但表情 state 不只記錄 `activeExpression`，還要額外追蹤前一個正在退場的 frame。

切換時：

1. `activeExpression` 更新為新 frame。
2. 舊 frame 進入 exiting 狀態。
3. exiting frame 以較短的 duration 淡出。
4. 淡出完成後，自畫面樹移除。

初始 render 時不應有 exiting frame，避免載入後第一個表情被蓋掉或多出不必要的透明層。

## 視覺細節

- 仍沿用 atlas sprite 的 `background-position` / `background-size` 計算。
- active frame 使用較柔和的 easing 淡入。
- exiting frame 使用稍快但不突兀的淡出。
- 不新增新的 request，不改 manifest，不動既有 preload 策略。

## 測試與驗證

更新 `CurtainSequencePreview.test.jsx`，確認：

- 初始 render 時，預設表情 `expr-c` 會顯示。
- 表情切換後，新的 active frame 與上一個 exiting frame 會短暫同時存在。
- exiting frame 淡出後會被移除，不會永久堆在 DOM 中。

此外仍需確認既有 artist credit、stacking order 與表情輪播測試維持通過。
