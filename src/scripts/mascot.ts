/**
 * Mascote da Kafé: um botão invisível sobre a gota (posicionado pelo
 * liquid.ts) e um balão de fala. Ao clicar, ele pula e diz alguma coisa.
 */

const LINES = [
	'Oi! Sou feito de código. E de um pouco de IA. ✦',
	'Mais negócio, menos software.',
	'Role a página: lá embaixo eu viro outras coisas.',
	'Engenheiros + IA: entregas em dias, não em meses.',
	'Bora tirar a sua ideia do papel?',
	'Psiu… o café já está passando. ☕',
];

const hit = document.querySelector<HTMLButtonElement>('[data-mascot-hit]');
const bubble = document.querySelector<HTMLElement>('[data-mascot-bubble]');
const text = document.querySelector<HTMLElement>('[data-mascot-text]');

if (hit && bubble && text) {
	let index = 0;
	let hideTimer = 0;

	const say = (line: string) => {
		text.textContent = line;
		bubble.classList.add('is-talking');
		window.clearTimeout(hideTimer);
		hideTimer = window.setTimeout(() => bubble.classList.remove('is-talking'), 4200);
	};

	hit.addEventListener('click', () => {
		window.dispatchEvent(new Event('kafe:mascot-poke'));
		say(LINES[index % LINES.length]);
		index++;
	});

	try {
		if (!sessionStorage.getItem('kafe:hello')) {
			window.setTimeout(() => {
				if (hit.dataset.visible === 'true') say('Oi! 👋 Clica em mim.');
			}, 2400);
			sessionStorage.setItem('kafe:hello', '1');
		}
	} catch {
		// Sem armazenamento: o mascote só fala quando alguém clica.
	}
}
