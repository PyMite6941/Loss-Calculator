# Bugs

## 1. ReferenceError: `w` is not defined (src/App.jsx:23)

In `calculateStuff`, `targetY = y - w * x` references `w`, which is never defined.
The defined state variable is `weight`. Clicking "Calculate!" threw a ReferenceError
and crashed the app.

Fix: replaced `w` with `weight` so the loss equation actually runs in the browser.

## 2. Invalid HTML: block children inside `<p>` (src/App.jsx:99-107)

The history `map` rendered `<div>` elements directly inside a `<p>` tag, plus a nested
`<p>` for "No Data Yet Calculated". A `<p>` cannot contain block-level children;
browsers auto-close the paragraph, breaking layout.

Fix: replaced the `<p>` wrapper with a `<table>` for the history rows.

## 3. Graph container was empty (src/App.jsx:47)

`<section className='lossGraph'></section>` rendered nothing. No canvas or drawing
logic existed, so the loss graph never appeared.

Fix: added a `<canvas>` and a vanilla Canvas 2D `drawGraph` that plots loss vs step
whenever `history` changes.

## 4. React key anti-pattern (src/App.jsx:100)

`key={index}` was used on history items. Not a crash, but a React warning.

Fix: use `key={item.step}` (steps are unique).

## 5. Graph x-axis drawn at the top of the canvas

The first version of `drawGraph` drew the Step axis along the top edge (y = 20)
instead of the bottom, so the "Step" label sat beneath an empty area.

Fix: axes now form an L at the bottom-left, with min/max loss and first/last step
labels. The drawing code moved into the `useEffect` (clears the oxlint
`exhaustive-deps` warning).

## 6. Learning rate was stored as a string (src/App.jsx:126)

`setAlpha(e.target.value)` stored a string like `"0.005"`. It only worked because
`*` coerces it to a number; `+` would have concatenated.

Fix: `setAlpha(parseFloat(e.target.value) || 0)`, matching the other inputs.

## 7. Display formatting

The Weights box showed raw floats like `0.251325198336` after a step. It now shows
4 decimals (the stored `weight` keeps full precision), and the Learning Rate line
shows 3 decimals. The page also lists the equations in use:
ŷ = w · x, targetY = y − w · x, L = (targetY − ŷ)², dL/dw = −2 · x · (targetY − ŷ),
w ← w − α · dL/dw.

## Reported, NOT fixed (these touch variable definitions; your call)

### 8. Learning rate starts at 0 (src/App.jsx:7)

`useState(0)` for `alpha`, but the slider's `min` is `0.001`. The slider *looks*
like it's at 0.001, yet `newWeight = weight - 0 * derivative`, so the weight never
changes and the loss line stays flat until the slider is moved.

### 9. `targetY` depends on the weight (src/App.jsx:24)

`targetY = y - weight * x`, so the loss is `(y − 2 · w · x)²`, not `(y − w · x)²`.
Gradient descent therefore converges to `w = y / (2 · x)` (0.25 with the defaults),
not `y / x` (0.5). If the intent was plain MSE, `targetY` should just be `y`.

### 10. Large learning rates diverge

With the defaults (x = 6), any alpha above about 0.014 (= 2 / (4 · x²)) overshoots and the loss
grows each step. That isn't a code bug, but the slider allows up to 0.2.

## Variable definitions

No variable definitions (`x`, `y`, `weight`, `alpha`, `history`, `predict`,
`calculateLoss`, `calculateDerivative`, `calculateStuff`) were modified. The only
behavioral changes are fixing the undefined `w` reference to use the defined `weight`,
and parsing the learning-rate slider value as a number.
