/**
 * Mascotinho do cabeçalho (src/components/MiniMascot.astro): os olhos "//"
 * mudam de forma conforme o humor e o círculo se mexe.
 *
 * Interações (as mesmas do mascote antigo, num formato pequeno):
 * - os olhos seguem o cursor e piscam de tempos em tempos;
 * - clique: uma reação e uma fala diferentes a cada vez; cliques demais em
 *   sequência: fica tonto, depois bravo;
 * - clique duplo: dá uma volta;
 * - mouse rápido por cima: cócegas; devagar: carinho;
 * - mouse em "Tirar minha ideia do papel": acena que sim; num botão de contato:
 *   pula de alegria; em temas de IA: olhos de estrela;
 * - cursor sai da página: balança a cabeça que não, tristinho (e comemora quando volta);
 * - ninguém mexe: boceja e cochila; voltar para a aba: comemora;
 * - digitar "café" (ou "kafe") em qualquer lugar: festa;
 * - copiar um texto da página: piscadinha;
 * - voltar ao topo depois de ler a página toda: carinho;
 * - ao abrir o site, cumprimenta conforme a hora do dia.
 * Na página 404 ele começa tristinho; no pré-orçamento, ajuda a pessoa.
 */

// Módulo (e não script global): os nomes daqui não se misturam com os do mascote antigo.
export {};

type Mood = 'idle' | 'happy' | 'wink' | 'surprise' | 'love' | 'star' | 'dizzy' | 'angry' | 'sad' | 'sleep';
type Anim = 'nod' | 'bounce' | 'spin' | 'shake' | 'wobble' | 'giggle';

/** Os dois olhos de cada humor, em caracteres (fonte mono). */
const EYES: Record<Mood, [string, string]> = {
	idle: ['/', '/'],
	happy: ['^', '^'],
	wink: ['/', '-'],
	surprise: ['o', 'o'],
	love: ['♥', '♥'],
	star: ['✦', '✦'],
	dizzy: ['@', '@'],
	angry: ['\\', '/'],
	sad: ['T', 'T'],
	sleep: ['-', '-'],
};

const SEQUENCE: { mood: Mood; anim?: Anim; line: string; desktop?: boolean }[] = [
	{ mood: 'happy', anim: 'bounce', line: 'Oi! Sou feito de código. E de um pouco de IA. ✦' },
	{ mood: 'wink', line: 'Psiu… o café já está passando. ☕' },
	{ mood: 'surprise', line: 'Passa o mouse nas letras do fundo. 👀', desktop: true },
	{ mood: 'love', anim: 'bounce', line: 'Quer um pré-orçamento? A Kafeína, nossa IA, faz em minutos. 🧡' },
	{ mood: 'happy', line: 'Mais negócio, menos software.' },
	{ mood: 'wink', line: 'Engenheiros + IA: entregas em dias, não em meses.' },
	{ mood: 'surprise', line: 'Clica duas vezes rapidinho. Duvido. 😏', desktop: true },
	{ mood: 'love', line: 'Bora tirar a sua ideia do papel?' },
	{ mood: 'wink', line: 'Segredo: digita "café" em qualquer lugar da página. 🤫', desktop: true },
];

const SEQUENCE_404: typeof SEQUENCE = [
	{ mood: 'happy', line: 'Bora voltar pro início? Lá tem café fresquinho. ☕' },
	{ mood: 'wink', line: 'Essa página sumiu, mas a gente faz uma nova rapidinho. 😉' },
	{ mood: 'love', line: 'O botão ali leva pro início. 🧡' },
];

const SEQUENCE_HELPER: typeof SEQUENCE = [
	{ mood: 'happy', line: 'Pode responder do seu jeito, sem tecniquês. ☕' },
	{ mood: 'wink', line: 'Leva uns 2 minutinhos, prometo.' },
	{ mood: 'love', line: 'Seus dados ficam só com a gente. 🔒' },
	{ mood: 'happy', line: 'Na dúvida, escolhe "Ainda não sei" que tá tudo bem.' },
];

const LINES: Record<string, string[]> = {
	tickle: ['Hahaha, cócegas não!', 'Hihi, para com isso! 😆'],
	pet: ['Hmmm… carinho bom. ☺️'],
	dizzy: ['Tô ficando tonto… 😵'],
	angry: ['Ei! Calma aí. 😤'],
	wake: ['Opa! Tava só descansando os olhos. 👀', 'Hã? Eu tava acordado, juro.'],
	yawn: ['Aaaahh… 🥱', 'Tá quietinho por aí, hein?'],
	nod: ['Isso! Bora tirar do papel? 👍'],
	tap: ['Oba, vamos conversar! 🎉'],
	star: ['IA? Meu assunto favorito. ✦'],
	away: ['Ei, não vai embora! ☕', 'Volta aqui, a conversa tava boa.'],
	return: ['Voltou! 😄', 'Sabia que você voltava.'],
	back: ['Bem-vindo de volta! Esquentei o café. ☕'],
	party: ['Café! ☕🎉'],
	copy: ['Copiou? Pode usar. 😉'],
	welcome: ['Leu tudo? Você é dos meus. Bora conversar? 🧡'],
};

const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];

const root = document.querySelector<HTMLElement>('[data-mini]');
const face = root?.querySelector<HTMLButtonElement>('[data-mini-face]');
const eyes = root ? Array.from(root.querySelectorAll<HTMLElement>('[data-mini-eye]')) : [];
const bubble = root?.querySelector<HTMLElement>('[data-mini-bubble]');

if (root && face && bubble && eyes.length === 2) {
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
	const sadPage = document.querySelector('[data-mascot-mood="sad"]') !== null;
	const helperPage = document.querySelector('[data-mascot-mood="helper"]') !== null;
	const sequence = (sadPage ? SEQUENCE_404 : helperPage ? SEQUENCE_HELPER : SEQUENCE).filter((step) => fine || !step.desktop);
	const baseMood: Mood = sadPage ? 'sad' : 'idle';

	let mood: Mood = baseMood;
	let index = 0;
	let moodTimer = 0;
	let bubbleTimer = 0;
	let animTimer = 0;
	let idleTimer = 0;
	let clicks: number[] = [];
	let sleeping = false;
	let away = false;
	let lastLineAt = 0;
	const said = new Set<string>();

	const setMood = (next: Mood, ms = 0) => {
		mood = next;
		root.dataset.mood = next;
		eyes[0].textContent = EYES[next][0];
		eyes[1].textContent = EYES[next][1];
		clearTimeout(moodTimer);
		if (ms) moodTimer = window.setTimeout(() => setMood(sleeping ? 'sleep' : baseMood), ms);
	};

	const play = (anim: Anim) => {
		if (reduced) return;
		delete root.dataset.anim;
		// Força o navegador a recomeçar a animação, mesmo se for a mesma.
		void root.offsetWidth;
		root.dataset.anim = anim;
		clearTimeout(animTimer);
		animTimer = window.setTimeout(() => delete root.dataset.anim, 1300);
	};

	const say = (line: string, ms = 3200) => {
		bubble.textContent = line;
		bubble.classList.add('is-visible');
		lastLineAt = performance.now();
		clearTimeout(bubbleTimer);
		bubbleTimer = window.setTimeout(() => bubble.classList.remove('is-visible'), ms);
	};

	/** Fala só se não falou nada há pouco (e, se `once`, só uma vez por visita). */
	const sayMaybe = (key: string, once = false) => {
		if (once && said.has(key)) return;
		if (performance.now() - lastLineAt < 2500) return;
		said.add(key);
		say(pick(LINES[key]));
	};

	const react = (next: Mood, anim?: Anim, ms = 2200) => {
		setMood(next, ms);
		if (anim) play(anim);
	};

	// Piscadas.
	const blink = () => {
		if (!reduced && (mood === 'idle' || mood === 'happy' || mood === 'star')) {
			root.dataset.blink = '';
			setTimeout(() => delete root.dataset.blink, 130);
		}
		setTimeout(blink, 2600 + Math.random() * 3800);
	};
	setTimeout(blink, 2000);

	// Cochilo: ninguém mexe por um tempo.
	const wake = () => {
		if (sleeping) {
			sleeping = false;
			react('surprise', 'bounce', 1600);
			sayMaybe('wake');
		}
		clearTimeout(idleTimer);
		idleTimer = window.setTimeout(() => {
			sayMaybe('yawn');
			react('wink', undefined, 2400);
			idleTimer = window.setTimeout(() => {
				sleeping = true;
				setMood('sleep');
			}, 2600);
		}, 30000);
	};
	['pointermove', 'scroll', 'keydown', 'touchstart'].forEach((type) =>
		window.addEventListener(type, wake, { passive: true }),
	);
	wake();

	// Os olhos seguem o cursor.
	let lastMove = { x: 0, y: 0, t: 0 };
	window.addEventListener(
		'pointermove',
		(event) => {
			if (event.pointerType !== 'mouse' || reduced) return;
			const rect = face.getBoundingClientRect();
			const dx = event.clientX - (rect.left + rect.width / 2);
			const dy = event.clientY - (rect.top + rect.height / 2);
			const d = Math.hypot(dx, dy) || 1;
			const reach = Math.min(1, d / 160);
			root.style.setProperty('--look-x', `${((dx / d) * 3 * reach).toFixed(2)}px`);
			root.style.setProperty('--look-y', `${((dy / d) * 2.4 * reach).toFixed(2)}px`);
			lastMove = { x: event.clientX, y: event.clientY, t: performance.now() };
		},
		{ passive: true },
	);

	// Mouse por cima: rápido = cócegas; devagar = carinho.
	let hoverStart = { x: 0, y: 0, t: 0 };
	face.addEventListener('pointerenter', (event) => {
		if (event.pointerType !== 'mouse') return;
		hoverStart = { x: event.clientX, y: event.clientY, t: performance.now() };
		const speed = Math.hypot(event.clientX - lastMove.x, event.clientY - lastMove.y) / Math.max(1, performance.now() - lastMove.t);
		if (speed > 1.2) {
			react('happy', 'giggle', 1400);
			sayMaybe('tickle');
		} else if (!sleeping) setMood('happy', 1800);
	});
	face.addEventListener('pointerleave', (event) => {
		if (event.pointerType !== 'mouse') return;
		const stayed = performance.now() - hoverStart.t;
		if (stayed > 1600 && mood !== 'angry' && mood !== 'dizzy') {
			react('love', undefined, 1800);
			sayMaybe('pet');
		}
	});

	// Cliques: uma reação por vez; cliques demais deixam tonto e depois bravo.
	face.addEventListener('click', () => {
		const now = performance.now();
		clicks = clicks.filter((t) => now - t < 2600).concat(now);
		sleeping = false;
		if (clicks.length >= 8) {
			react('angry', 'shake', 2600);
			say(pick(LINES.angry));
			return;
		}
		if (clicks.length >= 5) {
			react('dizzy', 'wobble', 2200);
			say(pick(LINES.dizzy));
			return;
		}
		const step = sequence[index++ % sequence.length];
		react(step.mood, step.anim ?? 'bounce', 2400);
		say(step.line);
	});
	face.addEventListener('dblclick', () => react('happy', 'spin', 1600));

	// Reações aos elementos marcados com data-mascot-look.
	let lastLook: Element | null = null;
	document.addEventListener('pointerover', (event) => {
		const target = (event.target as Element | null)?.closest?.('[data-mascot-look]') ?? null;
		if (target === lastLook) return;
		lastLook = target;
		if (!target || sleeping) return;
		const kind = target.getAttribute('data-mascot-look');
		if (kind === 'nod') {
			react('happy', 'nod', 1800);
			sayMaybe('nod', true);
		} else if (kind === 'tap') {
			react('happy', 'bounce', 1600);
			sayMaybe('tap', true);
		} else if (kind === 'star') {
			react('star', undefined, 2200);
			sayMaybe('star', true);
		} else if (kind === 'love') react('love', 'bounce', 1800);
	});

	// Cursor sai da página: tristinho; volta: comemora.
	document.documentElement.addEventListener('pointerleave', (event) => {
		if (event.pointerType !== 'mouse') return;
		away = true;
		react('sad', 'shake', 0);
		sayMaybe('away', true);
	});
	document.documentElement.addEventListener('pointerenter', (event) => {
		if (event.pointerType !== 'mouse' || !away) return;
		away = false;
		react('happy', 'bounce', 1600);
		sayMaybe('return', true);
	});

	// Voltar para a aba: comemora.
	let hiddenAt = 0;
	document.addEventListener('visibilitychange', () => {
		if (document.hidden) hiddenAt = performance.now();
		else if (performance.now() - hiddenAt > 8000) {
			react('happy', 'bounce', 1800);
			sayMaybe('back');
		}
	});

	// Digitar "café" (ou "kafe") em qualquer lugar: festa.
	let typed = '';
	window.addEventListener('keydown', (event) => {
		if (event.key.length !== 1) return;
		typed = (typed + event.key.toLowerCase()).slice(-6);
		if (/caf[eé]$|kafe$/.test(typed)) {
			react('love', 'spin', 2400);
			say(pick(LINES.party));
			typed = '';
		}
	});

	// Copiar um texto: piscadinha.
	document.addEventListener('copy', () => {
		react('wink', 'bounce', 1800);
		sayMaybe('copy');
	});

	// Voltar ao topo depois de ler a página toda: carinho.
	let readAll = false;
	window.addEventListener(
		'scroll',
		() => {
			const bottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 200;
			if (bottom) readAll = true;
			if (readAll && window.scrollY < 80) {
				readAll = false;
				react('love', 'bounce', 2200);
				sayMaybe('welcome', true);
			}
		},
		{ passive: true },
	);

	// Cumprimenta conforme a hora do dia (uma vez por visita).
	setMood(baseMood);
	let greeted = false;
	try {
		greeted = sessionStorage.getItem('kafe:mini:greeted') === '1';
		sessionStorage.setItem('kafe:mini:greeted', '1');
	} catch {
		// Sem acesso ao armazenamento: cumprimenta mesmo assim.
	}
	if (!greeted && !sadPage) {
		const hour = new Date().getHours();
		const hello = hour < 5 ? 'Boa noite! Café a essa hora? ☕' : hour < 12 ? 'Bom dia! ☕' : hour < 18 ? 'Boa tarde! ☕' : 'Boa noite! ☕';
		setTimeout(() => {
			react('happy', 'bounce', 2000);
			say(`${hello} Clica em mim.`, 3600);
		}, 1800);
	} else if (sadPage) setTimeout(() => say(SEQUENCE_404[0].line, 3600), 1500);
}
