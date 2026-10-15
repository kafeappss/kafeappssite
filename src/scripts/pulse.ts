/**
 * Pulso de luz em volta de uma frase de destaque (elementos com data-pulse,
 * como o "Acelerado por IA." da home), no estilo da linha que liga as etapas
 * da metodologia: de tempos em tempos, um traço de luz (branco na frente,
 * depois a cor da marca, depois cinza, com uma cauda longa) dá uma volta
 * rápida em torno da frase, sem caixa nenhuma, e o texto acende enquanto ele passa.
 *
 * O primeiro pulso vem logo depois que o título aparece; os outros, a cada
 * alguns segundos enquanto a frase está na tela, e de novo ao passar o mouse.
 * Com "reduzir movimento", não há pulso (a frase fica como as outras).
 */

const SVG = 'http://www.w3.org/2000/svg';
/** Quantos pedaços formam o rastro (mais pedaços = degradê mais suave). */
const SEGMENTS = 44;
/** Tamanho da cauda: parte da volta e limite em px. */
const TAIL = 0.72;
const TAIL_MAX = 680;
/** Duração de uma volta e intervalo entre as voltas, em ms. */
const LAP = 1500;
const EVERY = 6000;
/** Cores do rastro, da frente para trás (as mesmas da linha da metodologia). */
const COLORS: [number, number, number][] = [
	[247, 248, 248],
	[113, 112, 255],
	[98, 102, 109],
];

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function mix(t: number) {
	const scaled = Math.min(0.999, Math.max(0, t)) * (COLORS.length - 1);
	const i = Math.floor(scaled);
	const f = scaled - i;
	const [a, b] = [COLORS[i], COLORS[i + 1]];
	return a.map((value, k) => Math.round(value + (b[k] - value) * f)).join(',');
}

function rect(svg: SVGSVGElement) {
	const node = document.createElementNS(SVG, 'rect');
	svg.append(node);
	return node;
}

function setup(box: HTMLElement) {
	// Com "reduzir movimento", não desenha nada.
	if (reduced) return;
	const run = document.createElementNS(SVG, 'svg');
	run.setAttribute('class', 'pulse-svg');
	run.setAttribute('aria-hidden', 'true');
	const trail = Array.from({ length: SEGMENTS }, () => rect(run));
	box.append(run);

	let perimeter = 0;
	let length = 0;

	const layout = () => {
		const w = box.offsetWidth;
		const h = box.offsetHeight;
		// Cantos bem arredondados: o pulso contorna a frase, sem cara de caixa.
		const r = Math.min(h * 0.42, 26);
		for (const node of trail) {
			node.setAttribute('x', '0.75');
			node.setAttribute('y', '0.75');
			node.setAttribute('width', String(Math.max(0, w - 1.5)));
			node.setAttribute('height', String(Math.max(0, h - 1.5)));
			node.setAttribute('rx', r.toFixed(2));
		}
		const iw = w - 1.5;
		const ih = h - 1.5;
		perimeter = 2 * (iw + ih) - 8 * r + 2 * Math.PI * r;
		length = Math.min(perimeter * TAIL, TAIL_MAX);
		const piece = length / SEGMENTS;
		trail.forEach((node, i) => {
			// Cada pedaço do rastro: um traço só (o resto da volta fica vazio).
			node.setAttribute('stroke-dasharray', `${(piece + 0.6).toFixed(2)} ${(perimeter * 3).toFixed(2)}`);
			node.setAttribute('stroke', `rgb(${mix(i / (SEGMENTS - 1))})`);
			// A cauda vai sumindo até o fim.
			node.setAttribute('stroke-opacity', Math.pow(1 - i / SEGMENTS, 1.3).toFixed(3));
		});
	};
	layout();
	new ResizeObserver(layout).observe(box);

	let running = false;
	let lastRun = 0;
	let visible = false;
	let timer = 0;

	/** Põe a frente do pulso a `front` px do começo da borda (no canto de cima, à esquerda). */
	const place = (front: number) => {
		const piece = length / SEGMENTS;
		trail.forEach((node, i) => {
			const start = front - (i + 1) * piece;
			node.setAttribute('stroke-dashoffset', (-start).toFixed(2));
		});
	};
	place(-1);

	const pulse = () => {
		if (running || !perimeter) return;
		running = true;
		lastRun = performance.now();
		box.classList.add('is-pulsing');
		const total = perimeter + length;
		const t0 = performance.now();
		const step = (now: number) => {
			const t = Math.min(1, (now - t0) / LAP);
			// Sai rápido e freia no fim, como um pulso.
			const eased = 1 - Math.pow(1 - t, 2.4);
			place(eased * total);
			if (t > 0.7) box.classList.remove('is-pulsing');
			if (t < 1) requestAnimationFrame(step);
			else {
				place(-1);
				running = false;
			}
		};
		requestAnimationFrame(step);
	};

	const schedule = (delay: number) => {
		clearTimeout(timer);
		timer = window.setTimeout(() => {
			if (!visible || document.hidden) return;
			pulse();
			schedule(EVERY);
		}, delay);
	};

	// O primeiro pulso vem quando o título termina de aparecer.
	const heading = box.closest<HTMLElement>('[data-split]');
	const ready = () => !heading || heading.classList.contains('is-in');
	const whenReady = () => {
		if (ready()) {
			schedule(1100);
			return;
		}
		const watch = new MutationObserver(() => {
			if (!ready()) return;
			watch.disconnect();
			schedule(1100);
		});
		watch.observe(heading!, { attributes: true, attributeFilter: ['class'] });
	};

	new IntersectionObserver(([entry]) => {
		const was = visible;
		visible = entry.isIntersecting;
		if (visible && !was) whenReady();
		if (!visible) clearTimeout(timer);
	}).observe(box);

	document.addEventListener('visibilitychange', () => {
		if (!document.hidden && visible && ready()) schedule(800);
	});

	box.addEventListener('pointerenter', (event) => {
		if (event.pointerType !== 'mouse' || performance.now() - lastRun < 1600) return;
		pulse();
		schedule(EVERY);
	});
}

document.querySelectorAll<HTMLElement>('[data-pulse]').forEach(setup);
