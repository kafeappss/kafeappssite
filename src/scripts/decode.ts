/**
 * Destaque de terminal no título que tem um cursor (.ai-caret), como o
 * "Acelerado por IA." da home: quando o título aparece, as palavras em destaque
 * (<em>) se "decodificam" (cada letra passa por caracteres aleatórios, em fonte
 * mono e na cor da marca, até assentar), e o cursor fica piscando no fim.
 * Com o mouse por cima do título, decodifica de novo. Com "reduzir
 * movimento", o texto fica parado (só o cursor aparece).
 */

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const random = () => CHARS[Math.floor(Math.random() * CHARS.length)];

function setup(heading: HTMLElement) {
	// Uma caixa por letra, com a largura da letra final: trocar o caractere não
	// mexe no resto da linha.
	const letters: { box: HTMLSpanElement; char: string }[] = [];
	heading.querySelectorAll('em').forEach((em) => {
		const text = em.textContent ?? '';
		em.textContent = '';
		for (const char of text) {
			const box = document.createElement('span');
			box.className = 'dc';
			box.textContent = char;
			em.append(box);
			if (char.trim()) letters.push({ box, char });
		}
	});
	const fixWidths = () => {
		letters.forEach(({ box }) => (box.style.width = ''));
		letters.forEach(({ box }) => (box.style.width = `${box.getBoundingClientRect().width}px`));
	};

	let running = 0;
	let lastRun = 0;

	const run = () => {
		const now = performance.now();
		if (now - lastRun < 1800) return;
		lastRun = now;
		fixWidths();
		const id = ++running;
		const start = now;
		// Cada letra assenta numa hora, da esquerda para a direita, com um pouco de sorteio.
		const settle = letters.map((_, i) => 250 + i * 55 + Math.random() * 220);
		let tick = 0;
		const step = (time: number) => {
			if (id !== running) return;
			const elapsed = time - start;
			const change = time - tick > 55;
			if (change) tick = time;
			let pending = false;
			letters.forEach(({ box, char }, i) => {
				if (elapsed >= settle[i]) {
					if (box.classList.contains('is-scrambling')) {
						box.textContent = char;
						box.classList.remove('is-scrambling');
					}
				} else {
					pending = true;
					box.classList.add('is-scrambling');
					if (change) box.textContent = random();
				}
			});
			if (pending) requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	};

	// Começa quando o título entra na tela (depois das palavras aparecerem).
	const begin = () => setTimeout(run, 650);
	if (heading.classList.contains('is-in')) begin();
	else {
		const watch = new MutationObserver(() => {
			if (!heading.classList.contains('is-in')) return;
			watch.disconnect();
			begin();
		});
		watch.observe(heading, { attributes: true, attributeFilter: ['class'] });
	}
	if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) heading.addEventListener('pointerenter', run);
	window.addEventListener('resize', fixWidths, { passive: true });
	document.fonts?.ready.then(fixWidths);
}

if (!reduced) {
	document.querySelectorAll<HTMLElement>('.ai-caret').forEach((caret) => {
		const heading = caret.closest<HTMLElement>('h1, h2, h3');
		if (heading) setup(heading);
	});
}
