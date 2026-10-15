/**
 * Pulso de luz no contorno das letras de uma frase de destaque (elementos com
 * data-pulse, como o "Acelerado por IA." da home), no estilo da linha que liga
 * as etapas da metodologia: de tempos em tempos, uma luz atravessa a frase da
 * esquerda para a direita acendendo o contorno de cada letra, branca na frente
 * e na cor da marca na cauda longa, que vai se apagando; o texto acende junto.
 *
 * Como funciona: duas cópias da frase, só com o contorno das letras (uma branca
 * para a frente do pulso, outra na cor da marca para a cauda), ficam por cima
 * do texto, e uma máscara em degradê mostra só o trecho por onde o pulso passa.
 *
 * O primeiro pulso vem logo depois que o título aparece; os outros, a cada
 * poucos segundos enquanto a frase está na tela, e de novo ao passar o mouse.
 */

/** Duração de uma passada e intervalo entre o começo de uma e da próxima, em ms. */
const LAP = 1900;
const EVERY = 4000;
/** Tamanho da cauda em relação à largura da frase (e o mínimo, em px). */
const TAIL = 1.15;
const TAIL_MIN = 240;

/** Sai devagar, acelera no meio e freia no fim. */
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function setup(box: HTMLElement) {
	// Cópias da frase (com as mesmas palavras, para quebrar a linha no mesmo lugar).
	const source = Array.from(box.childNodes);
	const layer = (name: string) => {
		const node = document.createElement('span');
		node.className = `pulse-ink ${name}`;
		node.setAttribute('aria-hidden', 'true');
		source.forEach((child) => node.append(child.cloneNode(true)));
		box.append(node);
		return node;
	};
	layer('pulse-tail');
	layer('pulse-head');

	let width = 0;
	let tail = 0;
	const measure = () => {
		width = box.offsetWidth;
		tail = Math.max(width * TAIL, TAIL_MIN);
		box.style.setProperty('--pulse-tail', `${tail.toFixed(1)}px`);
	};
	measure();
	new ResizeObserver(measure).observe(box);

	let running = false;
	let lastRun = 0;
	let visible = false;
	let timer = 0;

	const pulse = () => {
		if (running || !width) return;
		running = true;
		lastRun = performance.now();
		box.classList.add('is-pulsing');
		// A frente do pulso vai de antes da primeira letra até a cauda sair da última.
		const from = -12;
		const to = width + tail + 12;
		const t0 = performance.now();
		const step = (now: number) => {
			const t = Math.min(1, (now - t0) / LAP);
			const x = from + (to - from) * ease(t);
			box.style.setProperty('--pulse-x', `${x.toFixed(1)}px`);
			if (x > width * 0.9) box.classList.remove('is-pulsing');
			if (t < 1) requestAnimationFrame(step);
			else {
				box.style.removeProperty('--pulse-x');
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
		if (event.pointerType !== 'mouse' || performance.now() - lastRun < LAP) return;
		pulse();
		schedule(EVERY);
	});
}

document.querySelectorAll<HTMLElement>('[data-pulse]').forEach(setup);
