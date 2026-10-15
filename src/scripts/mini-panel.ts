/**
 * Painel do mascotinho (src/components/MiniMascot.astro): busca no site,
 * respostas rápidas sobre a Kafé e atalhos de contato.
 *
 * - Antes de digitar: atalhos, contato, páginas e perguntas rápidas.
 * - Ao digitar: os itens que combinam com a busca (sem acento e sem diferença
 *   de maiúsculas), com prioridade para contato quando a pessoa pede para
 *   falar com alguém e para o pré-orçamento quando fala de preço. No fim, sempre
 *   dá para mandar a pergunta direto para a equipe (no WhatsApp, se houver
 *   número, ou na página de contato, com a mensagem pronta).
 * - Perguntas: a resposta aparece no próprio painel.
 * - Teclado: ↑ e ↓ escolhem, Enter abre, Esc fecha; ⌘K / Ctrl+K abre de qualquer lugar.
 */

export type PanelEvents = {
	open: () => void;
	close: () => void;
	/** A pessoa digitou; `found` diz se a busca achou alguma coisa. */
	type: (found: boolean) => void;
	/** Abriu uma resposta ou escolheu um item. */
	answer: () => void;
	pick: () => void;
};

/** Palavras que não ajudam a buscar. */
const STOP = new Set(
	'a o as os e de da do das dos em no na nos nas um uma uns umas para pra pro por com que qual quais como quando onde quem eu voce voces vcs me minha meu seu sua tem ter ser sao e ou se mais muito sobre isso esse essa ai la'.split(' '),
);
const CONTACT = /\b(whats|whatsapp|zap|wpp|chamar|chama|conversar|falar|fala|ligar|telefone|contato|humano|atendente|atendimento|pessoa)/;
const PRICE = /\b(preco|valor|custa|custo|orcamento|quanto|investimento|proposta)/;
const MAX_RESULTS = 7;

const norm = (text: string) =>
	text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9@.]+/g, ' ')
		.trim();

/** A palavra da busca começa alguma palavra do texto? */
const hasWord = (text: string, token: string) => text.startsWith(token) || text.includes(` ${token}`);

export function initPanel(panel: HTMLElement, trigger: HTMLButtonElement, on: PanelEvents) {
	const input = panel.querySelector<HTMLInputElement>('[data-mini-input]')!;
	const body = panel.querySelector<HTMLElement>('[data-mini-body]')!;
	const home = panel.querySelector<HTMLElement>('[data-mini-home]')!;
	const search = panel.querySelector<HTMLElement>('[data-mini-search]')!;
	const answer = panel.querySelector<HTMLElement>('[data-mini-answer]')!;
	const count = panel.querySelector<HTMLElement>('[data-mini-count]')!;
	const empty = panel.querySelector<HTMLElement>('[data-mini-empty]')!;
	const ask = panel.querySelector<HTMLAnchorElement>('[data-mini-ask]')!;
	const askText = panel.querySelector<HTMLElement>('[data-mini-ask-text]')!;
	const askAnswer = panel.querySelector<HTMLAnchorElement>('[data-mini-ask-answer]')!;
	const question = panel.querySelector<HTMLElement>('[data-mini-q]')!;
	const reply = panel.querySelector<HTMLElement>('[data-mini-a]')!;
	const results = Array.from(search.querySelectorAll<HTMLLIElement>('li[data-t]'));
	const whatsapp = panel.dataset.whatsapp ?? '';
	const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	let open = false;
	let active = -1;
	let previous: HTMLElement = home;
	let openedAtY = 0;

	/** Link para mandar uma pergunta à equipe, com a mensagem pronta. */
	const askLink = (text: string) => {
		const message = `Olá, Kafé! Vim pelo site e queria saber: ${text}`;
		return whatsapp
			? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`
			: `/contato?mensagem=${encodeURIComponent(message)}#mensagem`;
	};
	if (whatsapp) {
		ask.target = askAnswer.target = '_blank';
		ask.rel = askAnswer.rel = 'noopener';
	}

	const view = () => [home, search, answer].find((node) => !node.hidden)!;
	const commands = () =>
		Array.from(view().querySelectorAll<HTMLElement>('[data-cmd]')).filter((node) => !node.closest('[hidden]'));

	/** Destaca o item `index` da tela atual (-1: nenhum). */
	const setActive = (index: number, scroll = true) => {
		const list = commands();
		list.forEach((node) => node.classList.remove('is-active'));
		active = list.length && index >= 0 ? index % list.length : -1;
		const node = list[active];
		if (!node) return;
		node.classList.add('is-active');
		if (scroll) node.scrollIntoView({ block: 'nearest' });
	};

	const show = (next: HTMLElement) => {
		for (const node of [home, search, answer]) node.hidden = node !== next;
		body.scrollTop = 0;
		setActive(fine ? 0 : -1, false);
	};

	const run = () => {
		const query = input.value.trim();
		if (!query) {
			show(home);
			return;
		}
		const text = norm(query);
		const tokens = text.split(' ').filter((token) => token.length > 1 && !STOP.has(token));
		const wantsContact = CONTACT.test(text);
		const wantsPrice = PRICE.test(text);
		const scored = results.map((item, order) => {
			const title = item.dataset.t ?? '';
			const keys = item.dataset.k ?? '';
			let hits = 0;
			let score = 0;
			for (const token of tokens) {
				if (hasWord(title, token)) {
					hits++;
					score += 5;
				} else if (hasWord(keys, token)) {
					hits++;
					score += 2;
				}
			}
			if (hits && wantsContact && item.dataset.intent === 'contact') score += 10;
			if (hits && wantsPrice && item.dataset.intent === 'price') score += 10;
			return { item, hits, score, order };
		});
		const need = Math.max(1, Math.ceil(tokens.length * 0.5));
		const found = scored
			.filter((entry) => entry.hits >= need)
			.sort((a, b) => b.hits - a.hits || b.score - a.score || a.order - b.order)
			.slice(0, MAX_RESULTS);
		results.forEach((item) => (item.hidden = true));
		found.forEach((entry, index) => {
			entry.item.hidden = false;
			entry.item.style.order = String(index);
		});
		count.hidden = !found.length;
		count.textContent = found.length === 1 ? '1 resultado' : `${found.length} resultados`;
		empty.hidden = found.length > 0;
		askText.textContent = `“${query}”`;
		ask.href = askLink(query);
		show(search);
		on.type(found.length > 0);
	};

	const openAnswer = (q: string, a: string) => {
		previous = view();
		question.textContent = q;
		reply.textContent = a;
		askAnswer.href = askLink(q);
		show(answer);
		on.answer();
	};

	const setOpen = (value: boolean, focusBack = false) => {
		if (open === value) return;
		open = value;
		panel.hidden = !value;
		trigger.setAttribute('aria-expanded', String(value));
		if (value) {
			openedAtY = window.scrollY;
			input.value = '';
			show(home);
			// No celular, o teclado só abre quando a pessoa toca na busca.
			if (fine) input.focus({ preventScroll: true });
			on.open();
		} else {
			if (focusBack) trigger.focus({ preventScroll: true });
			on.close();
		}
	};

	trigger.addEventListener('click', () => setOpen(!open));
	panel.querySelector('[data-mini-close]')?.addEventListener('click', () => setOpen(false, true));
	panel.querySelector('[data-mini-back]')?.addEventListener('click', (event) => {
		event.stopPropagation();
		show(previous === answer ? home : previous);
		input.focus({ preventScroll: true });
	});

	input.addEventListener('input', run);

	panel.addEventListener('click', (event) => {
		const target = (event.target as Element).closest<HTMLElement>('[data-cmd]');
		if (!target || target.matches('[data-mini-back]')) return;
		if (target.dataset.q && target.dataset.a) {
			openAnswer(target.dataset.q, target.dataset.a);
			return;
		}
		if (target instanceof HTMLAnchorElement) {
			on.pick();
			// Links da própria página (ou que abrem em outra aba): fecha o painel.
			setTimeout(() => setOpen(false), 120);
		}
	});

	panel.addEventListener('pointermove', (event) => {
		const target = (event.target as Element).closest<HTMLElement>('[data-cmd]');
		if (!target) return;
		const index = commands().indexOf(target);
		if (index !== active && index >= 0) setActive(index, false);
	});

	panel.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			const total = commands().length;
			const step = event.key === 'ArrowDown' ? 1 : -1;
			setActive(active < 0 ? (step > 0 ? 0 : total - 1) : (active + step + total) % total);
		} else if (event.key === 'Enter' && event.target === input) {
			event.preventDefault();
			const node = commands()[active] ?? commands()[0];
			node?.click();
		}
	});

	document.addEventListener('keydown', (event) => {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			setOpen(!open);
		} else if (event.key === 'Escape' && open) {
			if (!answer.hidden) show(previous === answer ? home : previous);
			else setOpen(false, true);
		}
	});

	// Clique fora (ou rolar bastante a página): fecha.
	document.addEventListener('pointerdown', (event) => {
		if (!open) return;
		const target = event.target as Node;
		if (!panel.contains(target) && !trigger.contains(target)) setOpen(false);
	});
	window.addEventListener(
		'scroll',
		() => {
			if (open && Math.abs(window.scrollY - openedAtY) > 160) setOpen(false);
		},
		{ passive: true },
	);

	return {
		isOpen: () => open,
		setOpen,
	};
}
