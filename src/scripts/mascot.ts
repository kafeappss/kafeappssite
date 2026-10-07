/**
 * Mascote da Kafé: um botão invisível sobre o corpo (posicionado pelo
 * liquid.ts), o balão de fala e o botão "Diga oi".
 *
 * Interações:
 * - clique: uma reação diferente a cada vez (feliz, piscadinha, surpreso, apaixonado…);
 * - cliques demais em sequência: fica tonto, depois bravo;
 * - clique duplo: dá uma cambalhota;
 * - arrastar (mouse): estica como goma e volta com um "boing";
 * - toque longo (celular): enche de ar;
 * - mouse rápido por cima: cócegas; mouse devagar por cima: carinho;
 * - mouse no botão principal: apaixonado; em temas de IA: olhos de estrela;
 * - cursor sai da página: fica triste (e comemora quando ele volta);
 * - ninguém mexe: boceja e cochila; voltar para a aba: comemora;
 * - digitar "café" (ou "kafe") em qualquer lugar: festa;
 * - copiar um texto da página: piscadinha;
 * - voltar ao topo depois de ler a página toda: recebe com carinho.
 * As reações (expressões e movimentos) ficam no liquid.ts; aqui ficam as falas.
 */

type Reaction = 'happy' | 'wink' | 'surprise' | 'love' | 'dizzy' | 'angry' | 'spin' | 'party';

const SEQUENCE: { reaction: Reaction; line: string }[] = [
	{ reaction: 'happy', line: 'Oi! Sou feito de código. E de um pouco de IA. ✦' },
	{ reaction: 'wink', line: 'Psiu… o café já está passando. ☕' },
	{ reaction: 'surprise', line: 'Role a página: lá embaixo eu viro outras coisas.' },
	{ reaction: 'love', line: 'Quer um pré-orçamento? A Kafeína, nossa IA, faz em minutos. 🧡' },
	{ reaction: 'happy', line: 'Mais negócio, menos software.' },
	{ reaction: 'wink', line: 'Engenheiros + IA: entregas em dias, não em meses.' },
	{ reaction: 'surprise', line: 'Dica: tenta me arrastar. 👀' },
	{ reaction: 'happy', line: 'Clica duas vezes rapidinho. Duvido. 😏' },
	{ reaction: 'love', line: 'Bora tirar a sua ideia do papel?' },
	{ reaction: 'wink', line: 'Segredo: digita "café" em qualquer lugar da página. 🤫' },
];

/** Na página 404 ele começa tristinho e tenta animar a pessoa. */
const SEQUENCE_404: { reaction: Reaction; line: string }[] = [
	{ reaction: 'happy', line: 'Bora voltar pro início? Lá tem café fresquinho. ☕' },
	{ reaction: 'wink', line: 'Essa página sumiu, mas a gente faz uma nova rapidinho. 😉' },
	{ reaction: 'love', line: 'Me conta o que você procurava? O botão ali leva pro início.' },
];

const EVENTS: Record<string, string[]> = {
	dragged: ['Boing! Sou elástico, viu?', 'Ei, me devolve pro lugar! 😄', 'Estica, mas não quebra.'],
	tickle: ['Hahaha, cócegas não!', 'Hihi, para com isso! 😆'],
	pet: ['Hmmm… carinho bom. ☺️', 'Pode continuar, tô gostando.'],
	wake: ['Opa! Tava só descansando os olhos. 👀', 'Hã? Eu tava acordado, juro.'],
	yawn: ['Aaaahh… 🥱', 'Tá quietinho por aí, hein?'],
	cta: ['Isso! Clica aí. 🧡'],
	star: ['IA? Meu assunto favorito. ✦'],
	away: ['Ei, não vai embora! ☕', 'Volta aqui, a conversa tava boa.'],
	return: ['Voltou! 😄', 'Sabia que você voltava.'],
	back: ['Bem-vindo de volta! Esquentei o café. ☕'],
	inflate: ['Tô cheio de ideias! 🎈'],
	welcome: ['Leu tudo? Você é dos meus. Bora conversar? 🧡'],
};

const hit = document.querySelector<HTMLButtonElement>('[data-mascot-hit]');
const bubble = document.querySelector<HTMLElement>('[data-mascot-bubble]');
const text = document.querySelector<HTMLElement>('[data-mascot-text]');

if (hit && bubble && text) {
	const sad = document.querySelector('[data-mascot-mood="sad"]') !== null;
	const canDrag = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
	// Sem mouse e teclado, as dicas de arrastar, clique duplo e palavra secreta saem da lista.
	const sequence = (sad ? SEQUENCE_404 : SEQUENCE).filter((step) => canDrag || !/arrastar|duas vezes|digita/.test(step.line));
	let index = 0;
	let hideTimer = 0;
	let clicks: number[] = [];
	const used: Record<string, number> = {};
	const saidOnce = new Set<string>();

	const react = (reaction: string) => window.dispatchEvent(new CustomEvent('kafe:mascot-react', { detail: reaction }));
	const visible = () => hit.dataset.visible === 'true';

	// No celular (tela em pé), a fala aparece dentro do botão "Diga oi", que vira um balão.
	const portrait = window.matchMedia('(max-aspect-ratio: 9/10)');
	const pill = document.querySelector<HTMLElement>('[data-mascot-talk]');
	const label = pill?.querySelector<HTMLElement>('[data-mascot-label]');
	const pillText = label?.textContent ?? '';

	const say = (line: string, duration = 4200) => {
		window.clearTimeout(hideTimer);
		const inPill = Boolean(pill && label && portrait.matches);
		if (inPill) {
			label!.textContent = line;
			pill!.dataset.talking = 'true';
			bubble.classList.remove('is-talking');
		} else {
			text.textContent = line;
			bubble.classList.add('is-talking');
		}
		if (duration > 0) {
			hideTimer = window.setTimeout(() => {
				bubble.classList.remove('is-talking');
				if (inPill) {
					label!.textContent = pillText;
					delete pill!.dataset.talking;
				}
			}, duration);
		}
	};

	const pick = (kind: string) => {
		const lines = EVENTS[kind];
		const line = lines[(used[kind] ?? 0) % lines.length];
		used[kind] = (used[kind] ?? 0) + 1;
		return line;
	};

	const poke = () => {
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
	};

	hit.addEventListener('click', () => {
		// Fim de um arrasto (ou de um toque longo): não conta como clique.
		if (performance.now() - Number(hit.dataset.dragEnd ?? 0) < 400) return;
		poke();
	});

	// Clique duplo: cambalhota.
	hit.addEventListener('dblclick', () => {
		clicks = [];
		react('spin');
		say('Wheee! 🌀', 2400);
	});

	// Botão "Diga oi": o mesmo que clicar no mascote.
	document.querySelectorAll<HTMLElement>('[data-mascot-talk]').forEach((button) => {
		button.addEventListener('click', () => {
			if (visible()) poke();
		});
	});

	window.addEventListener('kafe:mascot-event', (event) => {
		const kind = String((event as CustomEvent).detail);
		if (kind === 'sleep') return say('Zzz…', 0);
		if (kind === 'cta' || kind === 'star' || kind === 'welcome') {
			if (saidOnce.has(kind)) return;
			saidOnce.add(kind);
		}
		if (EVENTS[kind]) say(pick(kind), kind === 'wake' || kind === 'return' ? 2600 : 3400);
	});

	// Palavra secreta: digitar "café" ou "kafe" em qualquer lugar (fora de campos de texto).
	let typed = '';
	window.addEventListener('keydown', (event) => {
		const target = event.target as HTMLElement;
		if (target.closest('input, textarea, select, [contenteditable]')) return;
		if (event.key.length !== 1) return;
		typed = (typed + event.key.toLowerCase()).slice(-6);
		if (/(caf[eé]|kafe)$/.test(typed) && visible()) {
			typed = '';
			react('party');
			say('Alguém falou em café? ☕☕☕', 3600);
		}
	});

	// Copiou um texto da página: ele aprova.
	document.addEventListener('copy', () => {
		if (!visible() || saidOnce.has('copy')) return;
		saidOnce.add('copy');
		react('wink');
		say('Copiou? Pode usar, é presente. 😉', 3000);
	});

	// Primeira visita: cumprimenta conforme a hora do dia.
	try {
		if (sad) {
			window.setTimeout(() => {
				if (visible()) say('Ops… essa página esfriou. 😢 Me clica que eu te animo.');
			}, 1600);
		} else if (!sessionStorage.getItem('kafe:hello')) {
			const hour = new Date().getHours();
			const hello = hour < 5 ? 'Boa madrugada, coruja! 🦉' : hour < 12 ? 'Bom dia! ☕' : hour < 18 ? 'Boa tarde! 👋' : 'Boa noite! 🌙';
			window.setTimeout(() => {
				if (visible()) {
					react('happy');
					say(`${hello} ${canDrag ? 'Clica em mim. Ou me arrasta.' : 'Toca em mim.'}`);
				}
			}, 2400);
			sessionStorage.setItem('kafe:hello', '1');
		}
	} catch {
		// Sem armazenamento: o mascote só fala quando alguém clica.
	}
}
