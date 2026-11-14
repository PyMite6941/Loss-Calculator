# Loss Calculator

A small React app for stepping through gradient descent on a single weight.
The input feature (`x`), target (`y`), weight (`w`), and learning rate (`α`)
are editable. Each equation shows its symbolic form, the current values
substituted into it, and the calculated result.

## Equations

- Prediction: `ŷ = w × x`
- Residual: `r = y − ŷ`
- Squared loss: `L = r²`
- Gradient: `dL/dw = −2 × x × (y − ŷ)`
- Weight update: `w_next = w − α × dL/dw`

The minimum-loss weight is `y / x` when `x` is nonzero. A learning rate above
`1 / x²` is unstable for this single-feature quadratic loss and can make loss
grow, so the calculator prevents updates at that rate. Stable rates above
`1 / (2x²)` may move the weight past the target while loss still decreases.
The slider is capped below `1 / (2x²)` to keep the weight from crossing the
minimum-loss point, and it lowers the rate automatically when the input grows.
When `x` is zero, the gradient is zero and the weight cannot be trained.

## Loss, rate of change, and curvature

For `n` examples, mean squared error is
`L = (1/n) Σᵢ₌₁ⁿ (yᵢ − ŷᵢ)²`. This simulator handles one example per step, so
it calculates the single-example squared error rather than a dataset average.
Squaring makes errors positive and weights their contribution quadratically;
it does not make loss grow exponentially.

Loss change over training time `t` can be described by
`L′(t) = limₕ→₀ [L(t + h) − L(t)] / h`. The graph plots calculated loss by
simulator step, not by epoch or continuous time. It plots each step's pre-update
loss and the current loss after the latest update, calculated from the displayed
weight, input, and target. The current loss is also shown before any step is run.
The `L′(t)` and `L″(t)` charts use first and second finite differences with a
one-step interval (`h = 1`); the first derivative needs two loss samples, and
the second needs three. They are discrete estimates, not continuous derivatives.
Keep the input and target fixed and use calculator updates to interpret them as
training progress.

For fixed input and target, the chain rule gives
`dL/dw = −2x(y − wx) = 2x(wx − y)`. If the weight varies over time, then
`dL/dt = 2x(wx − y) · dw/dt`. These are different rates: the first is loss
change with respect to weight, and the second is loss change with respect to
time.

The second time derivative is
`L″(t) = limₕ→₀ [L′(t + h) − L′(t)] / h`. If loss is decreasing and `L″ > 0`,
the decrease is slowing, but a positive second derivative alone does not
guarantee convergence or continued loss reduction.

## Run locally

```sh
npm install
npm run dev
```

Run `npm run build` to verify the production build and `npm run lint` to check
the source.
