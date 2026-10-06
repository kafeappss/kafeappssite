/**
 * Animações de entrada ao rolar a página.
 * - [data-reveal]: o elemento sobe e aparece.
 * - [data-split]: o texto entra palavra por palavra.
 */

function splitWords(root: HTMLElement) {
	let index = 0;

	const wrap = (word: string, emphasis: boolean) => {
		const span = document.createElement('span');
		span.className = 'w';
		span.style.setProperty('--i', String(index++));
		if (emphasis) {
			const em = document.createElement('em');
			em.textContent = word;
			span.append(em);
		} else {
			span.textContent = word;
		}
		return span;
	};

	const splitText = (text: string, emphasis: boolean) => {
		const fragment = document.createDocumentFragment();
		for (const part of text.split(/(\s+)/)) {
			if (!part) continue;
			fragment.append(/^\s+$/.test(part) ? document.createTextNode(part) : wrap(part, emphasis));
		}
		return fragment;
	};

	const walk = (node: Node) => {
		for (const child of Array.from(node.childNodes)) {
			if (child.nodeType === Node.TEXT_NODE) {
				if (child.textContent?.trim()) child.replaceWith(splitText(child.textContent, false));
			} else if (child instanceof HTMLElement) {
				// Cada palavra em itálico vira seu próprio <em>, para quebrar linha normalmente.
				if (child.tagName === 'EM') child.replaceWith(splitText(child.textContent ?? '', true));
				else if (child.tagName !== 'BR') walk(child);
			}
		}
	};

	const label = root.textContent?.replace(/\s+/g, ' ').trim() ?? '';
	walk(root);
	// Leitores de tela leem o título inteiro, e não palavra por palavra.
	if (/^H[1-6]$/.test(root.tagName)) root.setAttribute('aria-label', label);
}

document.querySelectorAll<HTMLElement>('[data-split]').forEach(splitWords);

/*
 * A posição dos elementos pendentes é conferida a cada quadro de rolagem.
 * Assim nada fica invisível, mesmo quando a pessoa rola muito rápido e
 * "pula" um trecho da página.
 */
let pending = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal], [data-split]'));
let scheduled = false;

const check = () => {
	scheduled = false;
	const limit = window.innerHeight * 0.92;
	const ready = pending.filter((element) => element.getBoundingClientRect().top < limit);
	if (!ready.length) return;
	ready.forEach((element) => element.classList.add('is-in'));
	pending = pending.filter((element) => !ready.includes(element));
	if (!pending.length) {
		window.removeEventListener('scroll', schedule);
		window.removeEventListener('resize', schedule);
	}
};

const schedule = () => {
	if (scheduled) return;
	scheduled = true;
	requestAnimationFrame(check);
};

window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', schedule, { passive: true });
schedule();
