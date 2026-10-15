/**
 * Logos correndo sobre dois arcos (src/components/ToolsOrbit.astro).
 *
 * Os arcos são curvas de Bézier desenhadas no tamanho real do bloco (em px,
 * para a linha não deformar). Cada logo tem uma posição fixa numa "esteira" um
 * pouco maior que o arco e anda com ela: entra por uma ponta, aparece aos
 * poucos, atravessa o arco e some na outra ponta. O arco de fora anda da
 * direita para a esquerda; o de dentro, ao contrário.
 *
 * De tempos em tempos, um pulso de luz percorre um dos arcos (branco na frente,
 * cor da marca na cauda), e cada logo acende na cor da marca quando ele passa.
 *
 * Só anima com o bloco na tela e a aba à vista; com "reduzir movimento", as
 * logos ficam paradas nos arcos e não há pulso.
 */

type Point = [number, number];

/** Pontos dos arcos, em frações da largura e da altura do bloco. */
const ARCS: Record<string, { points: [Point, Point, Point]; reverse: boolean }> = {
	outer: {
		points: [
			[0.03, 0.94],
			[0.5, -0.62],
			[0.97, 0.94],
		],
		reverse: true,
	},
	inner: {
		points: [
			[0.2, 0.96],
			[0.5, 0.16],
			[0.8, 0.96],
		],
		reverse: false,
	},
};

/** Segundos para a esteira dar uma volta inteira. */
const PERIOD = 30;
/** Trecho de cada ponta em que a logo aparece/some (fração do arco). */
const FADE = 0.13;
/** Espaço mínimo entre duas logos, em tamanhos de logo. */
const GAP = 1.45;
/** Pulso: intervalo, duração, pedaços do rastro e tamanho da cauda (fração do arco). */
const PULSE_EVERY = 4200;
const PULSE_LAP = 1700;
const PULSE_SEGMENTS = 28;
const PULSE_TAIL = 0.45;
/** Quanto tempo a logo fica acesa depois que o pulso passa (ms). */
const LIT = 900;
/** Cores do rastro do pulso, da frente para trás (as mesmas da linha da metodologia). */
const COLORS: [number, number, number][] = [
	[247, 248, 248],
	[113, 112, 255],
	[98, 102, 109],
];

const SVG = 'http://www.w3.org/2000/svg';
const smooth = (value: number) => {
	const x = Math.min(1, Math.max(0, value));
	return x * x * (3 - 2 * x);
};

function mix(t: number) {
	const scaled = Math.min(0.999, Math.max(0, t)) * (COLORS.length - 1);
	const i = Math.floor(scaled);
	const f = scaled - i;
	return COLORS[i].map((value, k) => Math.round(value + (COLORS[i + 1][k] - value) * f)).join(',');
}

type Logo = { el: HTMLElement; phase: number; at: number; litUntil: number };

type Ring = {
	name: string;
	path: SVGPathElement;
	logos: Logo[];
	reverse: boolean;
	/** Pontos do arco em px e tabela de comprimento acumulado (para andar por distância). */
	p: [Point, Point, Point];
	table: number[];
	length: number;
	loop: number;
};

const bezier = ([p0, pc, p2]: [Point, Point, Point], t: number): Point => {
	const o = 1 - t;
	return [o * o * p0[0] + 2 * o * t * pc[0] + t * t * p2[0], o * o * p0[1] + 2 * o * t * pc[1] + t * t * p2[1]];
};

const SAMPLES = 160;

export function initOrbit(root: HTMLElement) {
	const pulseGroup = root.querySelector<SVGGElement>('[data-orbit-pulse]');
	const rings: Ring[] = Object.entries(ARCS).flatMap(([name, arc]) => {
		const path = root.querySelector<SVGPathElement>(`[data-arc="${name}"]`);
		if (!path) return [];
		const logos = Array.from(root.querySelectorAll<HTMLElement>(`.orbit-logo[data-ring="${name}"]`)).map((el) => ({
			el,
			phase: parseFloat(el.dataset.phase ?? '0'),
			at: -1,
			litUntil: 0,
		}));
		return [{ name, path, logos, reverse: arc.reverse, p: arc.points, table: [], length: 0, loop: 1 }];
	});
	if (!rings.length) return;

	let size = 52;
	let time = 0;

	const layout = () => {
		const w = root.clientWidth;
		const h = root.clientHeight;
		size = rings[0].logos[0]?.el.offsetWidth || 52;
		for (const ring of rings) {
			const scaled = ARCS[ring.name].points.map(([x, y]) => [x * w, y * h] as Point) as [Point, Point, Point];
			ring.p = scaled;
			ring.path.setAttribute(
				'd',
				`M${scaled[0][0].toFixed(1)} ${scaled[0][1].toFixed(1)} Q${scaled[1][0].toFixed(1)} ${scaled[1][1].toFixed(1)} ${scaled[2][0].toFixed(1)} ${scaled[2][1].toFixed(1)}`,
			);
			// Comprimento acumulado ao longo da curva.
			const table = [0];
			let prev = bezier(scaled, 0);
			for (let i = 1; i <= SAMPLES; i++) {
				const point = bezier(scaled, i / SAMPLES);
				table.push(table[i - 1] + Math.hypot(point[0] - prev[0], point[1] - prev[1]));
				prev = point;
			}
			ring.table = table;
			ring.length = table[SAMPLES];
			// A esteira é um pouco maior que o arco quando não cabem todas as logos nele.
			ring.loop = Math.max(ring.length * 1.06, ring.logos.length * size * GAP);
		}
		place();
	};

	/** Ponto do arco a `distance` px do começo (da esquerda). */
	const pointAt = (ring: Ring, distance: number): Point => {
		const { table } = ring;
		let lo = 0;
		let hi = SAMPLES;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (table[mid] < distance) lo = mid + 1;
			else hi = mid;
		}
		const i = Math.max(1, lo);
		const span = table[i] - table[i - 1] || 1;
		const t = (i - 1 + (distance - table[i - 1]) / span) / SAMPLES;
		return bezier(ring.p, Math.min(1, Math.max(0, t)));
	};

	const place = () => {
		const now = performance.now();
		const half = size / 2;
		for (const ring of rings) {
			const speed = ring.loop / PERIOD;
			for (const logo of ring.logos) {
				const s = (((logo.phase * ring.loop + speed * time) % ring.loop) + ring.loop) % ring.loop;
				if (s > ring.length) {
					logo.at = -1;
					logo.el.style.opacity = '0';
					logo.el.style.visibility = 'hidden';
					continue;
				}
				const distance = ring.reverse ? ring.length - s : s;
				logo.at = distance;
				const [x, y] = pointAt(ring, distance);
				const u = s / ring.length;
				logo.el.style.transform = `translate3d(${(x - half).toFixed(1)}px, ${(y - half).toFixed(1)}px, 0)`;
				logo.el.style.opacity = (smooth(u / FADE) * smooth((1 - u) / FADE)).toFixed(3);
				logo.el.style.visibility = '';
				logo.el.toggleAttribute('data-placed', true);
				logo.el.classList.toggle('is-lit', now < logo.litUntil);
			}
		}
	};

	// Pulso de luz: pedaços de traço com as cores da linha da metodologia.
	const trail = pulseGroup
		? Array.from({ length: PULSE_SEGMENTS }, (_, i) => {
				const node = document.createElementNS(SVG, 'path');
				node.setAttribute('stroke', `rgb(${mix(i / (PULSE_SEGMENTS - 1))})`);
				node.setAttribute('stroke-opacity', Math.pow(1 - i / PULSE_SEGMENTS, 1.3).toFixed(3));
				node.setAttribute('stroke-dashoffset', '99999');
				pulseGroup.append(node);
				return node;
			})
		: [];
	let pulse: { ring: Ring; start: number } | null = null;
	let nextPulse = 1500;
	let pulseCount = 0;

	const drawPulse = (now: number) => {
		if (!pulse) return;
		const { ring } = pulse;
		const tail = ring.length * PULSE_TAIL;
		const piece = tail / PULSE_SEGMENTS;
		const t = Math.min(1, (now - pulse.start) / PULSE_LAP);
		const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
		const front = eased * (ring.length + tail);
		trail.forEach((node, i) => {
			node.setAttribute('stroke-dasharray', `${(piece + 0.6).toFixed(2)} ${(ring.length * 3).toFixed(1)}`);
			node.setAttribute('stroke-dashoffset', (-(front - (i + 1) * piece)).toFixed(2));
		});
		// A logo acende quando a frente do pulso passa por ela.
		for (const logo of ring.logos) {
			if (logo.at >= 0 && front >= logo.at && front - logo.at < 60) logo.litUntil = now + LIT;
		}
		if (t >= 1) {
			trail.forEach((node) => node.setAttribute('stroke-dashoffset', '99999'));
			pulse = null;
		}
	};

	let frame = 0;
	let last = 0;
	let visible = false;
	let elapsed = 0;

	const loop = (now: number) => {
		frame = requestAnimationFrame(loop);
		const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
		last = now;
		time += dt;
		elapsed += dt * 1000;
		if (!pulse && elapsed >= nextPulse) {
			// Alterna entre o arco de fora e o de dentro.
			pulse = { ring: rings[pulseCount++ % rings.length], start: now };
			const d = pulse.ring.path.getAttribute('d') ?? '';
			trail.forEach((node) => node.setAttribute('d', d));
			elapsed = 0;
			nextPulse = PULSE_EVERY;
		}
		drawPulse(now);
		place();
	};

	const start = () => {
		if (frame || !visible || document.hidden) return;
		last = 0;
		frame = requestAnimationFrame(loop);
	};

	const stop = () => {
		cancelAnimationFrame(frame);
		frame = 0;
	};

	// Começa com as logos já espalhadas pelo arco.
	time = PERIOD * 0.37;
	layout();
	new ResizeObserver(layout).observe(root);
	new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		if (visible) start();
		else stop();
	}).observe(root);
	document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}
