/**
 * Mascote da Kafé: um botão invisível sobre a gota (posicionado pelo
 * liquid.ts) e um balão de fala.
 *
 * Cada clique dispara uma reação diferente (feliz, piscadinha, surpreso,
 * apaixonado…). Cliques demais em sequência deixam ele tonto — e depois bravo.
 * O liquid.ts também avisa quando ele é arrastado, sente cócegas, dorme ou
 * acorda, e quando alguém passa o mouse no botão principal.
 */

type Reaction = 'happy' | 'wink' | 'surprise' | 'love' | 'dizzy' | 'angry';

const SEQUENCE: { reaction: Reaction; line: string }[] = [
	{ reaction: 'happy', line: 'Oi! Sou feito de código. E de um pouco de IA. ✦' },
	{ reaction: 'wink', line: 'Psiu… o café já está passando. ☕' },
	{ reaction: 'surprise', line: 'Role a página: lá embaixo eu viro outras coisas.' },
	{ reaction: 'love', line: 'Quer um pré-orçamento? A Kafeína, nossa IA, faz em minutos. 🤍' },
	{ reaction: 'happy', line: 'Mais negócio, menos software.' },
	{ reaction: 'wink', line: 'Engenheiros + IA: entregas em dias, não em meses.' },
	{ reaction: 'surprise', line: 'Dica: tenta me arrastar. 👀' }, // só com mouse (veja canDrag)
	{ reaction: 'love', line: 'Bora tirar a sua ideia do papel?' },
];

const EVENTS: Record<string, string[]> = {
	dragged: ['Boing! Sou elástico, viu?', 'Ei, me devolve pro lugar! 😄', 'Metal líquido: estica, mas não quebra.'],
	tickle: ['Hahaha, cócegas não!', 'Hihi, para com isso! 😆'],
	wake: ['Opa! Tava só descansando os olhos. 👀', 'Hã? Eu tava acordado, juro.'],
	cta: ['Isso! Clica aí. 🤍'],
};

const hit = document.querySelector<HTMLButtonElement>('[data-mascot-hit]');
const bubble = document.querySelector<HTMLElement>('[data-mascot-bubble]');
const text = document.querySelector<HTMLElement>('[data-mascot-text]');

if (hit && bubble && text) {
	// Arrastar só existe com mouse; no toque, a dica sai da lista.
	const canDrag = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
	const sequence = SEQUENCE.filter((step) => canDrag || !step.line.includes('arrastar'));
	let index = 0;
	let hideTimer = 0;
	let clicks: number[] = [];
	const used: Record<string, number> = {};
	const saidOnce = new Set<string>();

	const react = (reaction: string) => window.dispatchEvent(new CustomEvent('kafe:mascot-react', { detail: reaction }));

	const say = (line: string, duration = 4200) => {
		text.textContent = line;
		bubble.classList.add('is-talking');
		window.clearTimeout(hideTimer);
		if (duration > 0) hideTimer = window.setTimeout(() => bubble.classList.remove('is-talking'), duration);
	};

	const pick = (kind: string) => {
		const lines = EVENTS[kind];
		const line = lines[(used[kind] ?? 0) % lines.length];
		used[kind] = (used[kind] ?? 0) + 1;
		return line;
	};

	hit.addEventListener('click', () => {
		// Fim de um arrasto: não conta como clique.
		if (performance.now() - Number(hit.dataset.dragEnd ?? 0) < 400) return;
		const now = performance.now();
		clicks = clicks.filter((t) => now - t < 3200);
		clicks.push(now);
		const recent = clicks.filter((t) => now - t < 1600).length;
		if (clicks.length >= 8) {
			clicks = [];
			react('angry');
			say('Ei! Assim eu derreto. 😤');
		} else if (recent >= 4) {
			react('dizzy');
			say('Calma, calma… tô ficando tonto. 😵‍💫');
		} else {
			const step = sequence[index % sequence.length];
			index++;
			react(step.reaction);
			say(step.line);
		}
	});

	window.addEventListener('kafe:mascot-event', (event) => {
		const kind = String((event as CustomEvent).detail);
		if (kind === 'sleep') return say('Zzz…', 0);
		if (kind === 'cta') {
			if (saidOnce.has('cta')) return;
			saidOnce.add('cta');
		}
		if (EVENTS[kind]) say(pick(kind), kind === 'wake' ? 2600 : 3200);
	});

	try {
		if (!sessionStorage.getItem('kafe:hello')) {
			window.setTimeout(() => {
				if (hit.dataset.visible === 'true') {
					react('happy');
					say(canDrag ? 'Oi! 👋 Clica em mim. Ou me arrasta.' : 'Oi! 👋 Toca em mim.');
				}
			}, 2400);
			sessionStorage.setItem('kafe:hello', '1');
		}
	} catch {
		// Sem armazenamento: o mascote só fala quando alguém clica.
	}
}
