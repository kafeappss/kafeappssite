/**
 * Raios de luz do convite final, na linha do da Stripe: uma "esfera" de raios
 * finos saindo de um ponto de luz forte na borda de baixo, em 3D. Os raios da
 * frente ficam mais longos e claros, os de trás mais curtos e apagados; o
 * leque inteiro gira devagar e se inclina para o lado do cursor.
 *
 * Desenhado em canvas (nítido em telas retina), só anima com o convite na
 * tela e para com a aba em segundo plano.
 */

const TAU = Math.PI * 2;

/** Quantos raios (no computador e no celular) e a velocidade do giro. */
const RAYS = 360;
const RAYS_SMALL = 180;
const SPIN = 0.07;

/** Gerador aleatório com semente: o leque sai igual a cada visita. */
function seeded(seed: number) {
	let s = seed >>> 0;
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 4294967296;
	};
}

export function initRays(canvas: HTMLCanvasElement) {
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
	/** Cada raio: direção na meia esfera de cima (x, y, z), comprimento e brilho da ponta. */
	let rays: { x: number; y: number; z: number; len: number; tip: number; phase: number }[] = [];
	let w = 1;
	let h = 1;
	let dpr = 1;
	let time = 8;
	let last = 0;
	let frame = 0;
	let visible = false;

	function resize() {
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
		const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
		if (width === canvas.width && height === canvas.height && rays.length) return;
		canvas.width = w = width;
		canvas.height = h = height;
		const rand = seeded(7);
		const n = canvas.clientWidth < 600 ? RAYS_SMALL : RAYS;
		rays = [];
		while (rays.length < n) {
			// Direção sorteada por igual na esfera; ficam só as de cima.
			const z = rand() * 2 - 1;
			const a = rand() * TAU;
			const r = Math.sqrt(1 - z * z);
			const y = r * Math.sin(a);
			if (y < 0.04) continue;
			rays.push({ x: r * Math.cos(a), y, z, len: 0.45 + rand() * 0.55, tip: rand(), phase: rand() * TAU });
		}
	}

	function draw() {
		ctx!.clearRect(0, 0, w, h);
		ctx!.globalCompositeOperation = 'lighter';
		const ox = w / 2;
		const oy = h + 6 * dpr;
		const R = Math.min(h * 1.05, w * 0.48);

		// O leque gira devagar e se inclina para o lado do cursor.
		const yaw = time * SPIN + (pointer.x - 0.5) * 0.9;
		const pitch = 0.18 + (pointer.y - 0.5) * 0.25;
		const cy = Math.cos(yaw);
		const sy = Math.sin(yaw);
		const cp = Math.cos(pitch);
		const sp = Math.sin(pitch);

		// Luz forte no ponto de onde saem os raios.
		const glow = ctx!.createRadialGradient(ox, oy, 0, ox, oy, R * 0.85);
		glow.addColorStop(0, 'rgba(255,255,255,0.85)');
		glow.addColorStop(0.18, 'rgba(225,228,255,0.45)');
		glow.addColorStop(0.55, 'rgba(180,186,255,0.12)');
		glow.addColorStop(1, 'rgba(255,255,255,0)');
		ctx!.fillStyle = glow;
		ctx!.fillRect(0, 0, w, h);
		// Névoa clara e larga na base, como um nascer do sol.
		ctx!.save();
		ctx!.translate(ox, oy);
		ctx!.scale(1.9, 0.62);
		const haze = ctx!.createRadialGradient(0, 0, 0, 0, 0, R * 0.9);
		haze.addColorStop(0, 'rgba(240,242,255,0.38)');
		haze.addColorStop(0.45, 'rgba(200,206,255,0.12)');
		haze.addColorStop(1, 'rgba(200,206,255,0)');
		ctx!.fillStyle = haze;
		ctx!.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 1.2);
		ctx!.restore();

		for (const ray of rays) {
			// Gira em torno do eixo vertical e inclina um pouco para a frente.
			const x1 = ray.x * cy + ray.z * sy;
			const z1 = -ray.x * sy + ray.z * cy;
			const y2 = ray.y * cp - z1 * sp;
			const z2 = ray.y * sp + z1 * cp;
			if (y2 < 0.02) continue;
			// Perspectiva: os da frente (z2 > 0) ficam maiores e mais claros.
			const depth = (z2 + 1) / 2;
			const f = 1 / (1 - z2 * 0.35);
			const len = R * ray.len * (0.94 + 0.06 * Math.sin(time * 0.6 + ray.phase));
			const x = ox + x1 * len * f;
			const y = oy - y2 * len * f;
			const alpha = 0.12 + 0.5 * depth * depth;
			const g = ctx!.createLinearGradient(ox, oy, x, y);
			g.addColorStop(0, 'rgba(255,255,255,0)');
			g.addColorStop(0.12, `rgba(255,255,255,${(alpha * 1.1).toFixed(3)})`);
			g.addColorStop(1, `rgba(214,218,255,${(alpha * 0.35).toFixed(3)})`);
			ctx!.strokeStyle = g;
			ctx!.lineWidth = (0.6 + 0.6 * depth) * dpr;
			ctx!.beginPath();
			ctx!.moveTo(ox, oy);
			ctx!.lineTo(x, y);
			ctx!.stroke();
			if (ray.tip < 0.85) {
				ctx!.fillStyle = `rgba(255,255,255,${(0.35 + 0.6 * depth).toFixed(3)})`;
				ctx!.beginPath();
				ctx!.arc(x, y, (0.9 + 1.1 * depth) * dpr, 0, TAU);
				ctx!.fill();
			}
		}
		ctx!.globalCompositeOperation = 'source-over';
	}

	function loop(now: number) {
		frame = requestAnimationFrame(loop);
		const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
		last = now;
		time += dt;
		pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 2);
		pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 2);
		draw();
	}

	function start() {
		if (frame || !visible || document.hidden) return;
		last = 0;
		frame = requestAnimationFrame(loop);
	}

	function stop() {
		cancelAnimationFrame(frame);
		frame = 0;
	}

	resize();
	draw();

	new ResizeObserver(() => {
		resize();
		draw();
	}).observe(canvas);
	new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		if (visible) start();
		else stop();
	}).observe(canvas);
	document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
	window.addEventListener(
		'pointermove',
		(event) => {
			if (!visible || event.pointerType !== 'mouse') return;
			const rect = canvas.getBoundingClientRect();
			pointer.tx = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
			pointer.ty = Math.min(1, Math.max(0, (event.clientY - rect.top + rect.height) / (rect.height * 2)));
		},
		{ passive: true },
	);
}
