# Expression Atlas Transition Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore the softer overlapping expression transition while keeping the optimized single-request atlas approach.

**Architecture:** Keep `expression-atlas` as the only expression asset, but render at most two atlas-backed layers at a time: the active frame and the previous frame while it fades out. Track the exiting frame in React state, remove it after the exit transition completes, and keep sprite positioning in the existing atlas helper.

**Tech Stack:** React 19, Motion for React, Vite, Vitest, Testing Library, existing optimized curtain sequence runtime.

---

### Task 1: Add transition-overlap coverage

**Files:**
- Modify: `web-demo/src/react-curtain-sequence/CurtainSequencePreview.test.jsx`

**Step 1: Write the failing test**

Add a new test that checks overlap during expression switching:

```jsx
it('keeps the previous expression visible briefly during atlas transitions', () => {
  render(<CurtainSequencePreview expressionIntervalMs={3000} />)

  act(() => {
    vi.advanceTimersByTime(3000)
  })

  const activeFrame = screen.getByRole('img', { name: 'expr-d' })
  const exitingFrame = screen.getByRole('img', { name: 'expr-c' })

  expect(activeFrame).toHaveAttribute('data-active', 'true')
  expect(exitingFrame).toHaveAttribute('data-transition-state', 'exiting')
})
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd web-demo && npm run test -- CurtainSequencePreview.test.jsx
```

Expected: FAIL because the runtime currently switches directly between atlas frames and does not mark any previous frame as exiting.

**Step 3: Commit**

Do not commit yet.

---

### Task 2: Implement atlas overlap transition

**Files:**
- Modify: `web-demo/src/react-curtain-sequence/CurtainSequencePreview.jsx`
- Modify: `web-demo/src/react-curtain-sequence/app.css`

**Step 1: Write minimal implementation**

Update `CurtainSequencePreview.jsx` so expression state tracks both the active frame and the previous frame:

```jsx
const [activeExpression, setActiveExpression] = useState(expressionAtlas.activeIndex)
const [exitingExpression, setExitingExpression] = useState(null)
```

Update the interval effect so the current frame becomes the exiting frame before advancing:

```jsx
setActiveExpression((current) => {
  setExitingExpression(current)
  return (current + 1) % expressionAtlas.frameNames.length
})
```

Render only the active frame and optional exiting frame:

```jsx
const visibleFrameIndexes = exitingExpression == null
  ? [activeExpression]
  : [exitingExpression, activeExpression]
```

For the exiting frame, add:

```jsx
data-transition-state="exiting"
animate={{ opacity: 0 }}
```

For the active frame, add:

```jsx
data-transition-state="active"
animate={{ opacity: 1 }}
```

Use `onAnimationComplete` on the exiting frame to clear it:

```jsx
if (!isActive) {
  setExitingExpression((current) => (current === index ? null : current))
}
```

**Step 2: Keep atlas sprite positioning**

Keep using:

```jsx
backgroundPosition: getExpressionAtlasBackgroundPosition(index, frameCount),
backgroundSize: getExpressionAtlasBackgroundSize(frameCount),
```

Do not add new images or requests.

**Step 3: Add minimal style support**

If needed, add only the styles required to support overlapping layers in `app.css`. Keep `.expression-layer--atlas` absolutely positioned and non-interactive.

**Step 4: Run tests to verify it passes**

Run:

```bash
cd web-demo && npm run test -- CurtainSequencePreview.test.jsx
```

Expected: PASS, including the new overlap test.

**Step 5: Commit**

```bash
git add web-demo/src/react-curtain-sequence/CurtainSequencePreview.jsx web-demo/src/react-curtain-sequence/CurtainSequencePreview.test.jsx web-demo/src/react-curtain-sequence/app.css
git commit -m "feat: soften expression atlas transitions"
```

---

### Task 3: Final validation

**Files:**
- No additional file changes expected unless validation exposes a bug.

**Step 1: Run focused frontend validation**

Run:

```bash
cd web-demo && npm run test -- CurtainSequencePreview.test.jsx expressionAtlasSprite.test.js
```

Expected: PASS.

**Step 2: Run full frontend validation**

Run:

```bash
cd web-demo && npm run test && npm run build
```

Expected: all Vitest tests PASS and the Vite production build succeeds.

**Step 3: Commit**

Only if validation required follow-up fixes:

```bash
git add web-demo
git commit -m "fix: finalize expression atlas transition"
```
