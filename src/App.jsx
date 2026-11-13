import { useState, useEffect, useRef } from 'react';

function App() {

	const [x, setX] = useState(6.0);
	const [y, setY] = useState(3.0);
	const [weight, setWeight] = useState(3.0);
	const [alpha, setAlpha] = useState(0.005);
	const [history, setHistory] = useState([]);
	const graphRef = useRef(null);

	const predict = (w, x) => {
		return w * x;
	};

	const calculateLoss = (w, targetY, x) => {
		return (targetY - predict(w, x)) ** 2;
	};

	const calculateDerivative = (w, targetY, x) => {
		return -2 * x * (targetY - predict(w, x));
	};

	const calculateStuff = () => {
		const targetY = y;
		const loss = calculateLoss(weight, targetY, x);
		const derivative = calculateDerivative(weight, targetY, x);
		const newWeight = weight - alpha * derivative;
		const calculationRecord = {
			step: history.length + 1,
			weight: weight,
			lossResult: loss,
			derivativeResult: derivative,
		};
		setHistory((history) => [...history, calculationRecord]);
		setWeight(newWeight);
	};

	useEffect(() => {
		const canvas = graphRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		const width = canvas.width;
		const height = canvas.height;
		const left = 70;
		const right = width - 15;
		const top = 20;
		const bottom = height - 30;
		ctx.clearRect(0, 0, width, height);

		// Axes: Loss (vertical, left) and Step (horizontal, bottom)
		ctx.strokeStyle = '#000000';
		ctx.fillStyle = '#000000';
		ctx.lineWidth = 1;
		ctx.font = '12px monospace';
		ctx.beginPath();
		ctx.moveTo(left, top);
		ctx.lineTo(left, bottom);
		ctx.lineTo(right, bottom);
		ctx.stroke();
		ctx.fillText('Loss', 8, top + 4);
		ctx.fillText('Step', right - 30, height - 8);

		if (history.length === 0) return;

		const losses = history.map((h) => h.lossResult);
		const maxLoss = Math.max(...losses);
		const minLoss = Math.min(...losses);
		const range = maxLoss - minLoss || 1;
		const stepX = (right - left) / (history.length - 1 || 1);
		const toPoint = (h, i) => [
			left + i * stepX,
			bottom - ((h.lossResult - minLoss) / range) * (bottom - top),
		];

		ctx.fillText(maxLoss.toFixed(2), 8, top + 18);
		ctx.fillText(minLoss.toFixed(2), 8, bottom);
		ctx.fillText('1', left, height - 8);
		ctx.fillText(String(history.length), right - 70, height - 8);

		ctx.lineWidth = 2;
		ctx.beginPath();
		history.forEach((h, i) => {
			const [px, py] = toPoint(h, i);
			if (i === 0) {
				ctx.moveTo(px, py);
			} else {
				ctx.lineTo(px, py);
			}
		});
		ctx.stroke();

		history.forEach((h, i) => {
			const [px, py] = toPoint(h, i);
			ctx.beginPath();
			ctx.arc(px, py, 3, 0, Math.PI * 2);
			ctx.fill();
		});
	}, [history]);

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
				<section className='lossGraph'>
					<canvas
						ref={graphRef}
						width={500}
						height={250}
						style={{ maxWidth: '100%', border: '1px solid #000' }}></canvas>
				</section>
				<section className='lossInput'>
					<label>
						<span>Set the Learning Rate</span>
						<input
							type='range'
							min='0.001'
							max='0.2'
							step='0.001'
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
							onChange={(e) => setX(parseFloat(e.target.value) || 0)}
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
					<button onClick={calculateStuff}>Calculate!</button>
				</section>
				<section className='lossOutput'>
					<p>
						Input Feature: {x}
						<br></br>Target Value: {y}
						<br></br>Learning Rate: {alpha.toFixed(3)}
					</p>
					<p>
						Prediction: Ň = w · x
						<br></br>Target: targetY = y − w · x
						<br></br>Loss: L = (targetY − Ň)²
						<br></br>Gradient: dL/dw = −2 · x · (targetY − Ň)
						<br></br>Update: w ← w − α · dL/dw
					</p>
					{history.length === 0 ? <p>No Data Yet Calculated</p> : null}
					{history.length > 0 && (
						<table
							border='1'
							cellPadding='4'>
							<thead>
								<tr>
									<th>Step</th>
									<th>Weight</th>
									<th>Loss</th>
									<th>Gradient</th>
								</tr>
							</thead>
							<tbody>
								{history.map((item) => (
									<tr key={item.step}>
										<td>{item.step}</td>
										<td>{item.weight.toFixed(4)}</td>
										<td>{item.lossResult.toFixed(4)}</td>
										<td>{item.derivativeResult.toFixed(4)}</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</section>
			</section>
			<br></br>
			<section className='description'>
				<p>
					I chose this as my project because I needed a way to learn how
					eveyrthing works in regards to AI loss. I have learned the equations
					that are used and also learned a lot about how to train AI and remove
					loss.
				</p>
				<p>
					Loss calculation setup:
					<br></br>Ň = w · x (prediction)
					<br></br>targetY = y − w · x (target)
					<br></br>L = (targetY − Ň)² (loss, mean squared error)
					<br></br>dL/dw = −2 · x · (targetY − Ň) (gradient of loss w.r.t. weight)
					<br></br>w ← w − α · dL/dw (weight update via gradient descent)
					<br></br>Each click runs one step: predict → compute loss → compute gradient → update weight → record history.
				</p>
			</section>
		</>
	);
}

export default App;
