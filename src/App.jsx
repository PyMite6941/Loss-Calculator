import { useState, useEffect, useRef } from 'react';

function drawLineGraph(canvas, points, label, signed, emptyMessage) {
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	if (!ctx) return;
	const validPoints = points.filter((point) => Number.isFinite(point.value));

	const width = canvas.width;
	const height = canvas.height;
	const left = 76;
	const right = width - 15;
	const top = 20;
	const bottom = height - 30;
	const values = validPoints.map((point) => point.value);
	const scale = signed
		? Math.max(0, ...values.map((value) => Math.abs(value))) || 1
		: Math.max(...values, 0) || 1;
	const zeroY = signed ? (top + bottom) / 2 : bottom;
	const stepX = (right - left) / (points.length - 1 || 1);
	const toPoint = (point, index) => [
		left + index * stepX,
		signed
			? zeroY - (point.value / scale) * ((bottom - top) / 2)
			: bottom - (point.value / scale) * (bottom - top),
	];
	const formatAxisValue = (value) =>
		Math.abs(value) >= 100000 || (value !== 0 && Math.abs(value) < 0.01)
			? value.toExponential(2)
			: value.toFixed(2);

	ctx.clearRect(0, 0, width, height);
	ctx.strokeStyle = '#000000';
	ctx.fillStyle = '#000000';
	ctx.lineWidth = 1;
	ctx.font = '12px monospace';
	ctx.beginPath();
	ctx.moveTo(left, top);
	ctx.lineTo(left, bottom);
	ctx.moveTo(left, signed ? zeroY : bottom);
	ctx.lineTo(right, signed ? zeroY : bottom);
	ctx.stroke();
	ctx.textAlign = 'right';
	ctx.fillText(label, left - 8, top - 4);

	if (signed) {
		ctx.fillText(formatAxisValue(scale), left - 8, top + 4);
		ctx.fillText('0.00', left - 8, zeroY + 4);
		ctx.fillText(formatAxisValue(-scale), left - 8, bottom);
	} else {
		ctx.fillText(formatAxisValue(scale), left - 8, top + 4);
		ctx.fillText('0.00', left - 8, bottom);
	}

	ctx.textAlign = 'left';
	ctx.fillText('Step', right - 30, height - 8);
	if (validPoints.length === 0) {
		ctx.fillText(emptyMessage || 'No finite values', left + 8, (top + bottom) / 2);
		return;
	}
	ctx.fillText(String(validPoints[0].step), left, height - 8);
	if (validPoints.length > 1) {
		ctx.fillText(
			String(validPoints[validPoints.length - 1].step),
			right - 30,
			height - 8,
		);
	}

	ctx.lineWidth = 2;
	ctx.beginPath();
	validPoints.forEach((point, index) => {
		const [pointX, pointY] = toPoint(point, index);
		if (index === 0) {
			ctx.moveTo(pointX, pointY);
		} else {
			ctx.lineTo(pointX, pointY);
		}
	});
	ctx.stroke();

	validPoints.forEach((point, index) => {
		const [pointX, pointY] = toPoint(point, index);
		ctx.beginPath();
		ctx.arc(pointX, pointY, 3, 0, Math.PI * 2);
		ctx.fill();
	});
}

function getMaximumLearningRate(inputFeature) {
	if (inputFeature === 0) return 0.2;
	return Math.min(0.2, (0.99 / (2 * inputFeature * inputFeature)));
}

function getLossSeries(history, loss) {
	return [
		...history.map((item) => ({
			step: item.step,
			value: item.lossResult,
		})),
		{ step: history.length + 1, value: loss },
	];
}

function getFirstDerivativeSeries(lossSeries) {
	return lossSeries.slice(1).map((point, index) => ({
		step: point.step,
		value:
			(point.value - lossSeries[index].value) /
			(point.step - lossSeries[index].step),
	}));
}

function getSecondDerivativeSeries(firstDerivativeSeries) {
	return firstDerivativeSeries.slice(1).map((point, index) => ({
		step: point.step,
		value:
			(point.value - firstDerivativeSeries[index].value) /
			(point.step - firstDerivativeSeries[index].step),
	}));
}

function App() {
	const [x, setX] = useState(6.0);
	const [y, setY] = useState(3.0);
	const [weight, setWeight] = useState(3.0);
	const [alpha, setAlpha] = useState(0.005);
	const [history, setHistory] = useState([]);
	const lossGraphRef = useRef(null);
	const firstDerivativeGraphRef = useRef(null);
	const secondDerivativeGraphRef = useRef(null);

	const predict = (w, x) => {
		return w * x;
	};

	const calculateLoss = (w, targetY, x) => {
		return (targetY - predict(w, x)) ** 2;
	};

	const calculateDerivative = (w, targetY, x) => {
		return -2 * x * (targetY - predict(w, x));
	};

	const prediction = predict(weight, x);
	const targetY = y;
	const residual = targetY - prediction;
	const loss = calculateLoss(weight, targetY, x);
	const derivative = calculateDerivative(weight, targetY, x);
	const nextWeight = weight - alpha * derivative;
	const formatNumber = (value) => value.toFixed(4);
	const formatRate = (value) => Number(value.toPrecision(6)).toString();
	const stableLearningRateLimit = x === 0 ? null : 1 / (x * x);
	const maximumLearningRate = getMaximumLearningRate(x);
	const calculationIsFinite = [
		prediction,
		residual,
		loss,
		derivative,
		nextWeight,
	].every(Number.isFinite);
	const learningRateIsStable =
		stableLearningRateLimit === null || alpha < stableLearningRateLimit;

	const calculateStuff = () => {
		if (!calculationIsFinite || !learningRateIsStable) return;
		const lossAfterUpdate = calculateLoss(nextWeight, targetY, x);
		const calculationRecord = {
			step: history.length + 1,
			weight,
			inputFeature: x,
			targetY,
			prediction,
			learningRate: alpha,
			lossResult: loss,
			derivativeResult: derivative,
			nextWeight,
			lossAfterUpdate,
		};
		setHistory((history) => [...history, calculationRecord]);
		setWeight(nextWeight);
	};

	const resetHistory = () => {
		setHistory([]);
	};

	const lossSeries = getLossSeries(history, loss);
	const firstDerivativeSeries = getFirstDerivativeSeries(lossSeries);
	const secondDerivativeSeries =
		getSecondDerivativeSeries(firstDerivativeSeries);

	useEffect(() => {
		const currentLossSeries = getLossSeries(history, loss);
		const currentFirstDerivativeSeries =
			getFirstDerivativeSeries(currentLossSeries);
		const currentSecondDerivativeSeries = getSecondDerivativeSeries(
			currentFirstDerivativeSeries,
		);
		drawLineGraph(
			lossGraphRef.current,
			currentLossSeries,
			'L(t)',
			false,
			'',
		);
		drawLineGraph(
			firstDerivativeGraphRef.current,
			currentFirstDerivativeSeries,
			"L'(t)",
			true,
			'Need 2 loss points',
		);
		drawLineGraph(
			secondDerivativeGraphRef.current,
			currentSecondDerivativeSeries,
			'L"(t)',
			true,
			'Need 3 loss points',
		);
	}, [history, loss]);

	const equations = [
		{
			name: 'Prediction',
			formula: <>ŷ = w · x</>,
			substitution: `ŷ = ${formatNumber(weight)} · ${formatNumber(x)}`,
			result: formatNumber(prediction),
		},
		{
			name: 'Target',
			formula: <>targetY = y</>,
			substitution: `targetY = ${formatNumber(y)}`,
			result: formatNumber(targetY),
		},
		{
			name: 'Residual',
			formula: <>r = targetY − ŷ</>,
			substitution: `r = ${formatNumber(targetY)} − ${formatNumber(prediction)}`,
			result: formatNumber(residual),
		},
		{
			name: 'Loss',
			formula: <>L = r²</>,
			substitution: `L = (${formatNumber(residual)})²`,
			result: formatNumber(loss),
		},
		{
			name: 'Gradient',
			formula: <>dL/dw = −2 · x · (targetY − ŷ)</>,
			substitution: `dL/dw = −2 · ${formatNumber(x)} · (${formatNumber(targetY)} − ${formatNumber(prediction)})`,
			result: formatNumber(derivative),
		},
		{
			name: 'Update',
			formula: <>wₙₑₓₜ = w − α · dL/dw</>,
			substitution: `wₙₑₓₜ = ${formatNumber(weight)} − ${formatRate(alpha)} · ${formatNumber(derivative)}`,
			result: formatNumber(nextWeight),
		},
	];
	return (
		<>
			<section className='header'>
				<div className='headerText'>
					<h1>Loss Calculator</h1>
					<h3>How I apply Calculus to training my AI Models</h3>
				</div>
			</section>
			<br></br>
			<section className='lossMath'>
				<section className='lossGraphs'>
					<h2>Loss and time-derivative graphs</h2>
					<div>
						<h3>L(t)</h3>
						<canvas
							ref={lossGraphRef}
							width={500}
							height={180}
							aria-label={`L(t) loss graph. Current loss is ${formatNumber(loss)}.`}
							style={{ maxWidth: '100%', border: '1px solid #000' }}></canvas>
						<p>
							Current loss: {formatNumber(loss)}. Loss is plotted by
							calculation step, not training epoch.
						</p>
					</div>
					<div>
						<h3>L′(t)</h3>
						<canvas
							ref={firstDerivativeGraphRef}
							width={500}
							height={180}
							aria-label='L prime of t graph. Finite-difference loss change per calculator step.'
							style={{ maxWidth: '100%', border: '1px solid #000' }}></canvas>
						<p>
							{firstDerivativeSeries.length > 0
								? `Latest L′(t) ≈ ${formatNumber(firstDerivativeSeries[firstDerivativeSeries.length - 1].value)} loss per step.`
								: 'L′(t) needs at least two loss samples.'}
						</p>
					</div>
					<div>
						<h3>L″(t)</h3>
						<canvas
							ref={secondDerivativeGraphRef}
							width={500}
							height={180}
							aria-label='L double prime of t graph. Finite-difference change in loss rate per calculator step.'
							style={{ maxWidth: '100%', border: '1px solid #000' }}></canvas>
						<p>
							{secondDerivativeSeries.length > 0
								? `Latest L″(t) ≈ ${formatNumber(secondDerivativeSeries[secondDerivativeSeries.length - 1].value)} loss per step squared.`
								: 'L″(t) needs at least three loss samples.'}
						</p>
					</div>
					<p>
						The derivative charts use finite differences with h = 1 calculator
						step: L′(t) ≈ ΔL/Δt and L″(t) ≈ ΔL′/Δt. These are discrete
						estimates, not continuous derivatives. Keep the input and target
						fixed to read changes as training progress.
					</p>
				</section>
				<section className='lossInput'>
					<label>
						<span>Set the Learning Rate</span>
						<input
							type='range'
							min='0'
							max={maximumLearningRate}
							step='any'
							value={alpha}
							onChange={(e) => setAlpha(parseFloat(e.target.value) || 0)}
						/>
					</label>
					<br></br>
					<label>
						<span>Set the Weights</span>
						<input
							type='number'
							step='0.1'
							value={Number(weight.toFixed(4))}
							onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
						/>
					</label>
					<br></br>
					<label>
						<span>Set the Input Feature</span>
						<input
							type='number'
							step='1'
							value={x}
							onChange={(e) => {
								const nextInput = parseFloat(e.target.value) || 0;
								setX(nextInput);
								setAlpha((currentAlpha) =>
									Math.min(
										currentAlpha,
										getMaximumLearningRate(nextInput),
									),
								);
							}}
						/>
					</label>
					<br></br>
					<label>
						<span>Set the Target Value</span>
						<input
							type='number'
							step='1'
							value={y}
							onChange={(e) => setY(parseFloat(e.target.value) || 0)}
						/>
					</label>
					<br></br>
					<button
						onClick={calculateStuff}
						disabled={!calculationIsFinite || !learningRateIsStable}>
						Calculate!
					</button>
					<button onClick={resetHistory}>Clear History</button>
				</section>
				<section className='lossOutput'>
					<p>
						Input Feature (x): {formatNumber(x)}
						<br></br>Target Value (y): {formatNumber(y)}
						<br></br>Learning Rate (α): {formatRate(alpha)}
					</p>
					<p>
						For nonzero input, the learning-rate slider is capped below
						1/(2x²) to avoid crossing the minimum-loss weight. If you increase
						the input, the rate is lowered automatically when needed.
					</p>
					<table>
						<thead>
							<tr>
								<th>Equation</th>
								<th>Formula</th>
								<th>Substitute values</th>
								<th>Result</th>
							</tr>
						</thead>
						<tbody>
							{equations.map((equation) => (
								<tr key={equation.name}>
									<th scope='row'>{equation.name}</th>
									<td>{equation.formula}</td>
									<td>{equation.substitution}</td>
									<td>= {equation.result}</td>
								</tr>
							))}
						</tbody>
					</table>
					<p className='math-note'>
						Weights are not compared directly with inputs: the prediction is
						weight × input. For a nonzero input, the zero-loss weight is target
						÷ input = {x === 0 ? 'undefined when input is 0' : formatNumber(y / x)}.
					</p>
					{!calculationIsFinite ? (
						<p>
							These values are too large to calculate safely. Use smaller
							weights and input values.
						</p>
					) : x === 0 ? (
						<p>
							With an input of 0, the gradient is 0, so training cannot change
							the weight.
						</p>
					) : alpha >= stableLearningRateLimit ? (
						<p>
							This learning rate is too high and can make loss grow. Lower α
							below {formatNumber(stableLearningRateLimit)} before calculating.
						</p>
					) : (
						<p>
							This learning rate is in the monotonic-decrease range for this
							quadratic model.
						</p>
					)}
					<p className='math-note'>
						Each click records the loss before the update and then updates the
						weight. The graph includes the current loss after the latest update.
					</p>
					{history.length === 0 ? <p>No Data Yet Calculated</p> : null}
					{history.length > 0 && (
						<table
							border='1'
							cellPadding='4'>
							<thead>
								<tr>
									<th>Step</th>
									<th>Weight before</th>
									<th>Input</th>
									<th>Prediction</th>
									<th>Target</th>
									<th>Learning rate</th>
									<th>Loss before</th>
									<th>Loss after</th>
									<th>Gradient</th>
									<th>Weight after</th>
								</tr>
							</thead>
							<tbody>
								{history.map((item) => (
									<tr key={item.step}>
										<td>{item.step}</td>
										<td>{formatNumber(item.weight)}</td>
										<td>{formatNumber(item.inputFeature)}</td>
										<td>{formatNumber(item.prediction)}</td>
										<td>{formatNumber(item.targetY)}</td>
										<td>{formatRate(item.learningRate)}</td>
										<td>{formatNumber(item.lossResult)}</td>
										<td>{formatNumber(item.lossAfterUpdate)}</td>
										<td>{formatNumber(item.derivativeResult)}</td>
										<td>{formatNumber(item.nextWeight)}</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</section>
			</section>
			<br></br>
			<section className='description'>
				<h2>Understanding loss and training</h2>
				<p>
					Loss measures how far a model's predictions are from the expected
					values. Training uses a loss function to quantify that error and
					adjust model parameters, such as weights, to reduce it. Squaring each
					error makes positive and negative differences contribute positively
					and makes larger errors count quadratically, rather than exponentially.
				</p>
				<p>
					For a dataset with <i>n</i> examples, mean squared error averages the
					squared errors. This calculator uses one example at a time, so its
					loss is the single-example squared error.
				</p>
				<p>
					Figure A — Mean squared error: L = (1/n) Σᵢ₌₁ⁿ (yᵢ − ŷᵢ)²
				</p>
				<p>
					Figure B — Instantaneous rate of loss change over training time <i>t</i>:
					L′(t) = limₕ→₀ [L(t + h) − L(t)] / h. In training, <i>t</i> may
					represent epochs. This calculator instead plots recorded loss per
					calculation step and estimates its rate of change with finite
					differences, not a continuous time derivative.
				</p>
				<p>
					Figure C — Single-example squared error used by this calculator:
					L = (y − wx)², where the prediction is ŷ = wx.
				</p>
				<p>
					Figure D — By the chain rule, the gradient used to update the weight is
					dL/dw = −2x(y − wx) = 2x(wx − y). If the weight varies over time and
					the input and target stay fixed, the loss rate is
					dL/dt = 2x(wx − y) · dw/dt. The gradient tells us how loss changes
					with the weight; dw/dt describes how quickly the weight changes over
					time. They are related, but are not the same quantity.
				</p>
				<p>
					Figure E — The second rate of change is
					L″(t) = limₕ→₀ [L′(t + h) − L′(t)] / h. When loss is decreasing
					(L′ &lt; 0) and its rate is increasing (L″ &gt; 0), the decrease is
					slowing and L′ may be approaching zero. A positive L″ alone does not
					guarantee that loss will keep decreasing or converge.
				</p>
				<p>
					Figure F — <a
						href='https://loss-calculator-chi.vercel.app'
						target='_blank'
						rel='noreferrer'>
						Loss Calculator / Simulator
					</a>
				</p>
			</section>
		</>
	);
}

export default App;
