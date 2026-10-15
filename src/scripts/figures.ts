/**
 * Movimento das telas de produto (src/components/Figure.astro).
 *
 * - Cada tela ganha .is-in quando aparece: as partes de dentro se montam
 *   (barras crescem, gráfico se desenha, listas entram uma a uma).
 * - Números de painel (ex.: "1.284") contam do zero até o valor.
 * - No computador, a janela se inclina de leve na direção do cursor.
 *
 * Com "reduzir movimento", tudo aparece direto no estado final.
 */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const figures = Array.from(document.querySelectorAll<HTMLElement>('.figure'));

const ease = (x: number) => 1 - Math.pow(1 - x, 3);

/** Anima de 0 a 1 em `ms`, chamando `step` a cada quadro. */
function tween(ms: number, step: (x: number) => void) {
	return new Promise<void>((resolve) => {
		const start = performance.now();
		const frame = (now: number) => {
			const x = Math.min(1, (now - start) / ms);
			step(ease(x));
			if (x < 1) requestAnimationFrame(frame);
			else resolve();
		};
		requestAnimationFrame(frame);
	});
}

/* Números que contam ------------------------------------------------------- */

function countUp(element: HTMLElement, ms = 1400) {
	const text = element.textContent ?? '';
	const match = text.match(/\d[\d.]*(,\d+)?/);
	if (!match) return;
	const raw = match[0];
	const decimals = raw.includes(',') ? raw.split(',')[1].length : 0;
	const value = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
	const format = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
	tween(ms, (x) => {
		element.textContent = text.replace(raw, format.format(value * x));
	}).then(() => (element.textContent = text));
}

/* Entrada das telas -------------------------------------------------------- */

if (reduced) {
	figures.forEach((figure) => figure.classList.add('is-in'));
} else {
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				const figure = entry.target as HTMLElement;
				figure.classList.add('is-in');
				figure.querySelectorAll<HTMLElement>('[data-count]').forEach((element) => countUp(element));
				observer.unobserve(figure);
			}
		},
		{ threshold: 0.25 },
	);
	figures.forEach((figure) => observer.observe(figure));
}

/* Inclinação com o cursor --------------------------------------------------- */

if (fine && !reduced) {
	let scheduled = false;
	let mouseX = 0;
	let mouseY = 0;

	const update = () => {
		scheduled = false;
		for (const figure of figures) {
			const rect = figure.getBoundingClientRect();
			if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
			const dx = (mouseX - (rect.left + rect.width / 2)) / Math.max(rect.width, 400);
			const dy = (mouseY - (rect.top + rect.height / 2)) / Math.max(rect.height, 300);
			// Só reage com o cursor perto; longe, volta ao normal.
			const near = Math.max(0, 1 - Math.hypot(dx, dy) / 1.6);
			figure.style.setProperty('--ry', `${(dx * 5 * near).toFixed(2)}deg`);
			figure.style.setProperty('--rx', `${(-dy * 4 * near).toFixed(2)}deg`);
		}
	};

	window.addEventListener(
		'pointermove',
		(event) => {
			mouseX = event.clientX;
			mouseY = event.clientY;
			if (!scheduled) {
				scheduled = true;
				requestAnimationFrame(update);
			}
		},
		{ passive: true },
	);
}
