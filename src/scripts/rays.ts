/**
 * Raios de luz do convite final: um leque de linhas finas saindo de um ponto
 * de luz na borda de baixo, com um pontinho na ponta de cada raio. Os raios
 * balançam devagar e se esticam na direção do cursor.
 *
 * Desenhado em canvas (nítido em telas retina), só anima com o convite na
 * tela e para com a aba em segundo plano; com "reduzir movimento", fica parado.
 */

const TAU = Math.PI * 2;

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

	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const pointer = { x: 0, y: 0, active: false };
	let rays: { angle: number; len: number; phase: number; speed: number; tip: boolean }[] = [];
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
		const n = canvas.clientWidth < 600 ? 110 : 200;
		rays = Array.from({ length: n }, () => {
			const u = rand() * 2 - 1;
			return {
				angle: Math.sign(u) * Math.pow(Math.abs(u), 1.2) * 1.42,
				len: 0.32 + rand() * 0.68,
				phase: rand() * TAU,
				speed: 0.25 + rand() * 0.45,
				tip: rand() < 0.8,
			};
		});
	}

	function draw() {
		ctx!.clearRect(0, 0, w, h);
		ctx!.globalCompositeOperation = 'lighter';
		const ox = w / 2;
		const oy = h + 4 * dpr;
		const L = Math.min(h * 1.02, w * 0.6);
		const pa = pointer.active ? Math.atan2(pointer.x - ox, oy - pointer.y) : 99;

		const glow = ctx!.createRadialGradient(ox, oy, 0, ox, oy, L * 0.75);
		glow.addColorStop(0, 'rgba(255,255,255,0.55)');
		glow.addColorStop(1, 'rgba(255,255,255,0)');
		ctx!.fillStyle = glow;
		ctx!.fillRect(0, 0, w, h);

		ctx!.lineWidth = dpr;
		for (const ray of rays) {
			const a = ray.angle + 0.035 * Math.sin(time * ray.speed + ray.phase);
			let len =
				L * ray.len * (1 - 0.3 * (Math.abs(ray.angle) / 1.42)) * (0.93 + 0.07 * Math.sin(time * ray.speed * 1.4 + ray.phase));
			const near = Math.abs(a - pa);
			if (near < 0.14) len *= 1 + 0.16 * (1 - near / 0.14);
			const x = ox + Math.sin(a) * len;
			const y = oy - Math.cos(a) * len;
			const g = ctx!.createLinearGradient(ox, oy, x, y);
			g.addColorStop(0, 'rgba(255,255,255,0)');
			g.addColorStop(0.18, 'rgba(255,255,255,0.5)');
			g.addColorStop(1, 'rgba(255,255,255,0.16)');
			ctx!.strokeStyle = g;
			ctx!.beginPath();
			ctx!.moveTo(ox, oy);
			ctx!.lineTo(x, y);
			ctx!.stroke();
			if (ray.tip) {
				ctx!.fillStyle = 'rgba(255,255,255,0.9)';
				ctx!.beginPath();
				ctx!.arc(x, y, 1.5 * dpr, 0, TAU);
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
		draw();
	}

	function start() {
		if (frame || reduced || !visible || document.hidden) return;
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
			if (!visible) return;
			const rect = canvas.getBoundingClientRect();
			pointer.active = event.pointerType === 'mouse' && event.clientY > rect.top - 200 && event.clientY < rect.bottom;
			pointer.x = (event.clientX - rect.left) * dpr;
			pointer.y = (event.clientY - rect.top) * dpr;
		},
		{ passive: true },
	);
}
