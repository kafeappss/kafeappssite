/**
 * Pré-orçamento com a Kafeína (página /orcamento).
 *
 * Cinco etapas: projeto, problema, escopo, contato e estimativa. O mascote
 * reage a cada resposta (eventos kafe:mascot-react e kafe:mascot-say). A
 * estimativa sai da tabela em src/data/kafeina.ts; se o serviço da Kafeína
 * estiver configurado (site.contact.kafeinaEndpoint), ele escreve o resumo com
 * IA e repassa o contato ao CRM.
 */

import {
	baseFeatures,
	budgetSteps,
	keywordFeatures,
	lines,
	pricing,
	showPrices,
	urgencyFactor,
	type DeadlineId,
	type ProjectId,
	type ScopeId,
} from '../data/kafeina';
import { site } from '../data/site';

type Estimate = {
	min: number;
	max: number;
	weeksMin: number;
	weeksMax: number;
	features: string[];
};

type AiSummary = {
	/** O serviço da Kafeína confirmou que o contato chegou ao CRM. */
	entregue?: boolean;
	resumo?: string;
	escopoSugerido?: string[];
	riscos?: string[];
	proximosPassos?: string[];
};

const form = document.querySelector<HTMLFormElement>('[data-kf-form]');

if (form) {
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const steps = Array.from(form.querySelectorAll<HTMLElement>('[data-step]'));
	const dots = Array.from(document.querySelectorAll<HTMLElement>('[data-kf-dot]'));
	const back = form.querySelector<HTMLButtonElement>('[data-kf-back]')!;
	const next = form.querySelector<HTMLButtonElement>('[data-kf-next]')!;
	const nextLabel = form.querySelector<HTMLElement>('[data-kf-next-label]')!;
	const nav = form.querySelector<HTMLElement>('[data-kf-nav]')!;
	const errorBox = form.querySelector<HTMLElement>('[data-kf-error]')!;
	const replyEl = form.querySelector<HTMLElement>('[data-kf-reply]')!;
	const problem = form.querySelector<HTMLTextAreaElement>('textarea[name="problema"]')!;
	const counter = form.querySelector<HTMLElement>('[data-kf-count]')!;
	const range = form.querySelector<HTMLInputElement>('input[name="investimento"]')!;
	const budgetOut = form.querySelector<HTMLElement>('[data-kf-budget]')!;
	const thinking = form.querySelector<HTMLElement>('[data-kf-thinking]')!;
	const estimateEl = form.querySelector<HTMLElement>('[data-kf-estimate]')!;

	let step = 1;
	let sending = false;
	const said = new Set<string>();

	// ------------------------------------------------------------ mascote
	const react = (reaction?: string) => {
		if (reaction) window.dispatchEvent(new CustomEvent('kafe:mascot-react', { detail: reaction }));
	};
	// Sem o mascote (site.mascot = false), a fala aparece dentro do próprio cartão.
	const voice = form.querySelector<HTMLElement>('[data-kf-voice]');
	const say = (line: string, reaction?: string, duration = 3600) => {
		window.dispatchEvent(new CustomEvent('kafe:mascot-say', { detail: { line, reaction, duration } }));
		if (voice && line && line !== replyEl.textContent) {
			voice.textContent = line;
			voice.hidden = false;
		}
	};
	const sayOnce = (key: string, line: string, reaction?: string) => {
		if (said.has(key)) return;
		said.add(key);
		say(line, reaction);
	};

	// ------------------------------------------------------------ utilidades
	const value = (name: string) => {
		const field = form.elements.namedItem(name);
		if (field instanceof RadioNodeList) return field.value;
		if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
			return field.value.trim();
		}
		return '';
	};
	const checked = (name: string) => form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);
	const labelOf = (name: string) => checked(name)?.dataset.label ?? '';
	const money = (k: number) => (k >= 300 ? 'R$ 300 mil ou mais' : `R$ ${k} mil`);
	const escapeHtml = (text: string) =>
		text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
	const digits = (text: string) => text.replace(/\D/g, '');
	const roundTo5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

	// ------------------------------------------------------------ etapas
	function show(target: number) {
		step = target;
		steps.forEach((el) => (el.hidden = Number(el.dataset.step) !== step));
		dots.forEach((dot) => {
			const n = Number(dot.dataset.kfDot);
			if (n === step) dot.setAttribute('aria-current', 'step');
			else dot.removeAttribute('aria-current');
			if (n < step) dot.dataset.done = '';
			else delete dot.dataset.done;
		});
		back.hidden = step === 1 || step === 5;
		nav.hidden = step === 5;
		nextLabel.textContent = step === 4 ? 'Gerar pré-orçamento ✦' : 'Continuar';
		hideError();
		// Leva o foco (e a tela) para a pergunta da nova etapa.
		const current = steps.find((el) => Number(el.dataset.step) === step);
		const legend = current?.querySelector<HTMLElement>('legend');
		if (legend) {
			legend.setAttribute('tabindex', '-1');
			legend.focus({ preventScroll: true });
		}
		const top = form!.getBoundingClientRect().top + window.scrollY - 140;
		if (window.scrollY > top) window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
	}

	function showError(message: string, fields: Element[] = []) {
		errorBox.textContent = message;
		errorBox.hidden = false;
		fields.forEach((field) => field.setAttribute('aria-invalid', 'true'));
		(fields[0] as HTMLElement | undefined)?.focus();
		// O mascote balança a cabeça que não.
		say(message, 'shake', 3000);
	}

	function hideError() {
		errorBox.hidden = true;
		form!.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));
	}

	function validate(): boolean {
		if (step === 1 && !checked('projeto')) {
			showError(lines.missingChoice);
			return false;
		}
		if (step === 2 && problem.value.trim().length < 20) {
			showError(lines.missingProblem, [problem]);
			return false;
		}
		if (step === 3 && (!checked('escopo') || !checked('prazo'))) {
			showError(lines.missingChoice);
			return false;
		}
		if (step === 4) {
			const invalid: Element[] = [];
			const nome = form!.elements.namedItem('nome') as HTMLInputElement;
			const email = form!.elements.namedItem('email') as HTMLInputElement;
			const whatsapp = form!.elements.namedItem('whatsapp') as HTMLInputElement;
			if (nome.value.trim().length < 2) invalid.push(nome);
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) invalid.push(email);
			if (digits(whatsapp.value).length < 10) invalid.push(whatsapp);
			if (invalid.length) {
				showError(lines.missingContact, invalid);
				return false;
			}
		}
		return true;
	}

	// ------------------------------------------------------------ reações às respostas
	form.addEventListener('change', (event) => {
		const input = event.target as HTMLInputElement;
		// Escolher uma opção limpa o aviso. Em campos de texto, não: o "change" chega quando
		// o campo perde o foco, e o aviso sumindo bem na hora do clique faria o botão fugir.
		if (input.type === 'radio') hideError();
		if (input.name === 'projeto') {
			replyEl.textContent = input.dataset.reply ?? '';
			say(input.dataset.reply ?? '', input.dataset.reaction, 3000);
		} else if (input.name === 'contexto') {
			react('wink');
		} else if (input.name === 'escopo') {
			react(input.dataset.reaction);
		} else if (input.name === 'prazo') {
			if (input.dataset.reply) say(input.dataset.reply, input.dataset.reaction);
			else react(input.dataset.reaction);
		} else if (input.name === 'investimento') {
			if (budgetSteps[Number(input.value)] >= 150) sayOnce('budget', lines.budgetHigh, 'star');
			else react('nod');
		} else if (input.name === 'email' && input.checkValidity() && input.value) {
			react('nod');
		}
	});

	// Ao corrigir um campo, ele deixa de ficar destacado (o aviso some na próxima tentativa).
	form.addEventListener('input', (event) => {
		(event.target as HTMLElement).removeAttribute('aria-invalid');
	});

	problem.addEventListener('input', () => {
		counter.textContent = `${problem.value.length}/1500`;
		if (problem.value.trim().length >= 40) sayOnce('typing', lines.typing, 'happy');
	});

	range.addEventListener('input', () => {
		const text = money(budgetSteps[Number(range.value)]);
		budgetOut.textContent = text;
		range.setAttribute('aria-valuetext', text);
	});

	back.addEventListener('click', () => {
		if (step > 1) show(step - 1);
	});

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		if (sending || !validate()) return;
		if (step < 4) {
			show(step + 1);
			if (step === 3) say(lines.scope, 'happy');
			if (step === 4) say(lines.contact, 'nod');
			return;
		}
		void finish();
	});

	// ------------------------------------------------------------ estimativa
	function estimate(): Estimate {
		const project = value('projeto') as ProjectId;
		const scopeId = value('escopo') as ScopeId;
		const scope = scopeId === 'naosei' ? 'mvp' : scopeId;
		const deadline = value('prazo') as DeadlineId;
		const [min, max, weeksMin, weeksMax] = pricing[project][scope];
		const factor = deadline === 'urgente' ? urgencyFactor : 1;
		// Funcionalidades: a base do tipo de projeto + o que a descrição sugere.
		const text = problem.value;
		const extras = keywordFeatures.filter((rule) => rule.match.test(text)).map((rule) => rule.feature);
		const base = baseFeatures[project].slice(0, scope === 'modulo' ? 2 : 4);
		const features = [...new Set([...base.slice(0, 3), ...extras.slice(0, 3), ...base.slice(3)])].slice(0, scope === 'modulo' ? 4 : 6);
		return { min: roundTo5(min * factor), max: roundTo5(max * factor), weeksMin, weeksMax, features };
	}

	function phases(weeksMin: number, weeksMax: number) {
		const total = Math.round((weeksMin + weeksMax) / 2);
		const discovery = Math.max(1, Math.round(total * 0.12));
		const design = Math.max(1, Math.round(total * 0.2));
		const deploy = Math.max(1, Math.round(total * 0.1));
		const develop = Math.max(1, total - discovery - design - deploy);
		return [
			['Discovery', 'Entender antes de construir', discovery],
			['Design', 'Protótipo testado com usuários', design],
			['Develop', 'Código acelerado por IA, com revisão humana', develop],
			['Deploy', 'Lançamento e acompanhamento', deploy],
		] as const;
	}

	function payload(result: Estimate) {
		return {
			origem: 'site',
			pagina: window.location.href,
			criadoEm: new Date().toISOString(),
			projeto: { id: value('projeto'), nome: labelOf('projeto') },
			problema: problem.value.trim(),
			contexto: labelOf('contexto'),
			escopo: { id: value('escopo'), nome: labelOf('escopo') },
			prazo: { id: value('prazo'), nome: labelOf('prazo') },
			investimento: money(budgetSteps[Number(range.value)]),
			investimentoMil: budgetSteps[Number(range.value)],
			contato: {
				nome: value('nome'),
				empresa: value('empresa'),
				email: value('email'),
				whatsapp: value('whatsapp'),
				uf: value('uf'),
				cidade: value('cidade'),
			},
			estimativa: {
				investimentoMinMil: result.min,
				investimentoMaxMil: result.max,
				semanasMin: result.weeksMin,
				semanasMax: result.weeksMax,
				escopoSugerido: result.features,
			},
		};
	}

	/** Envia o pedido. Devolve o resumo da IA (se houver) e se o contato chegou à Kafé. */
	async function send(data: ReturnType<typeof payload>): Promise<{ ai: AiSummary | null; delivered: boolean }> {
		// Robôs preenchem o campo escondido: não envia nada.
		if (value('site')) return { ai: null, delivered: false };
		const post = async (url: string) => {
			const controller = new AbortController();
			const timer = window.setTimeout(() => controller.abort(), 20000);
			try {
				const response = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
					body: JSON.stringify(data),
					signal: controller.signal,
				});
				return response.ok ? response : null;
			} catch {
				return null;
			} finally {
				window.clearTimeout(timer);
			}
		};
		const endpoint = site.contact.kafeinaEndpoint as string;
		const formEndpoint = site.contact.formEndpoint as string;
		let ai: AiSummary | null = null;
		if (endpoint) {
			const response = await post(endpoint);
			if (response) ai = (await response.json().catch(() => null)) as AiSummary | null;
			if (ai?.entregue) return { ai, delivered: true };
		}
		if (formEndpoint) return { ai, delivered: Boolean(await post(formEndpoint)) };
		return { ai, delivered: false };
	}

	function summaryText(data: ReturnType<typeof payload>, result: Estimate) {
		return [
			`Olá, Kafé! Fiz o pré-orçamento no site.`,
			``,
			`Projeto: ${data.projeto.nome}`,
			`Problema: ${data.problema}`,
			data.contexto ? `Contexto: ${data.contexto}` : '',
			`Escopo: ${data.escopo.nome} · Prazo: ${data.prazo.nome}`,
			`Investimento que imagino: ${data.investimento}`,
			showPrices ? `Estimativa: R$ ${result.min} mil a R$ ${result.max} mil, ${result.weeksMin} a ${result.weeksMax} semanas` : '',
			``,
			`${data.contato.nome}${data.contato.empresa ? ` (${data.contato.empresa})` : ''}`,
			`${data.contato.email} · ${data.contato.whatsapp}`,
			[data.contato.cidade, data.contato.uf].filter(Boolean).join(', '),
		]
			.filter((line, index, all) => line !== '' || all[index - 1] !== '')
			.join('\n');
	}

	function render(data: ReturnType<typeof payload>, result: Estimate, ai: AiSummary | null, delivered: boolean) {
		const budget = data.investimentoMil;
		const deadline = value('prazo');
		const features = ai?.escopoSugerido?.length ? ai.escopoSugerido : result.features;
		const fit =
			budget < result.min
				? 'Com o investimento que você indicou, o melhor caminho é começar por uma versão mais enxuta ou por um módulo. Na conversa, a gente mostra como chegar lá por partes.'
				: budget > result.max
					? 'O investimento que você indicou cobre bem esse escopo, com folga para evoluir depois do lançamento.'
					: 'O investimento que você indicou está dentro da faixa estimada para esse escopo.';
		const urgentNote =
			deadline === 'urgente' && result.weeksMin > 4
				? '<p class="kf-note">Para caber em até 1 mês, o escopo precisa ser bem enxuto e o time, maior. A gente mostra as opções na conversa.</p>'
				: '';
		const noun = checked('projeto')?.dataset.noun ?? 'o seu projeto';
		const resumo =
			ai?.resumo ||
			`Pelo que você contou, a ideia é criar ${noun} para resolver: “${data.problema.slice(0, 180)}${data.problema.length > 180 ? '…' : ''}”. Recomendamos começar pela ${data.escopo.id === 'completo' ? 'base do produto completo, lançando em etapas' : 'menor versão capaz de gerar resultado'} e evoluir com dados de uso reais.`;
		const list = (items: string[]) => `<ul role="list" class="kf-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
		const plan = phases(result.weeksMin, result.weeksMax);
		const total = plan.reduce((sum, [, , weeks]) => sum + weeks, 0);
		const message = summaryText(data, result);
		const whatsapp = site.contact.whatsapp as string;
		const buttons = [
			whatsapp &&
				`<a class="btn" href="https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener">Falar com um especialista</a>`,
			`<a class="btn ${whatsapp ? 'btn-ghost' : ''}" href="mailto:${site.contact.email}?subject=${encodeURIComponent(`Pré-orçamento: ${data.projeto.nome}`)}&body=${encodeURIComponent(message)}">${delivered ? 'Mandar um e-mail' : 'Enviar por e-mail'}</a>`,
			`<button type="button" class="btn btn-ghost" data-kf-restart>Refazer</button>`,
		]
			.filter(Boolean)
			.join('');

		estimateEl.innerHTML = `
			<div>
				<p class="eyebrow">Seu pré-orçamento</p>
				<h2>${escapeHtml(data.projeto.nome)} · ${escapeHtml(data.escopo.nome)}</h2>
			</div>
			<div class="kf-boxes">
				${showPrices ? `<div class="kf-box"><span>Investimento estimado</span><strong>R$ ${result.min} mil a R$ ${result.max} mil</strong></div>` : ''}
				<div class="kf-box"><span>Prazo estimado</span><strong>${result.weeksMin} a ${result.weeksMax} semanas</strong></div>
			</div>
			${showPrices ? `<p class="kf-note">${fit}</p>` : ''}
			${urgentNote}
			<p>${escapeHtml(resumo)}</p>
			<div><h3>Escopo sugerido para a primeira versão</h3>${list(features)}</div>
			<div>
				<h3>Como seria com a Kafé (Metodologia 4Ds)</h3>
				<ol role="list" class="kf-4ds">
					${plan
						.map(
							([name, hint, weeks]) =>
								`<li><b>${name}</b><span class="kf-bar" title="${hint}"><i style="width:${Math.round((weeks / total) * 100)}%"></i></span><span>${weeks} sem.</span></li>`,
						)
						.join('')}
				</ol>
			</div>
			${ai?.riscos?.length ? `<div><h3>Pontos de atenção</h3>${list(ai.riscos)}</div>` : ''}
			${ai?.proximosPassos?.length ? `<div><h3>Próximos passos</h3>${list(ai.proximosPassos)}</div>` : ''}
			<p class="kf-small">Estimativa preliminar, calculada a partir das suas respostas. O valor final sai depois do Discovery, com o escopo fechado.</p>
			<p class="kf-sent">${
				delivered
					? `✓ Recebemos seu pré-orçamento, ${escapeHtml(data.contato.nome.split(' ')[0])}! Em breve um especialista da Kafé fala com você.`
					: 'Para o seu pré-orçamento chegar até a gente, é só enviar por um dos botões abaixo (a mensagem já vai pronta).'
			}</p>
			<div class="btn-row">${buttons}</div>
		`;
		estimateEl.querySelector('[data-kf-restart]')?.addEventListener('click', () => {
			form!.reset();
			range.dispatchEvent(new Event('input'));
			counter.textContent = '0/1500';
			replyEl.textContent = '';
			estimateEl.hidden = true;
			thinking.hidden = false;
			said.clear();
			show(1);
		});
	}

	async function finish() {
		sending = true;
		next.disabled = true;
		const result = estimate();
		const data = payload(result);
		show(5);
		thinking.hidden = false;
		estimateEl.hidden = true;
		say(lines.thinking, 'spin', 2600);
		// Os passos do "calculando" acendem um a um.
		const items = Array.from(thinking.querySelectorAll('li'));
		items.forEach((item) => item.removeAttribute('data-on'));
		items.forEach((item, index) => window.setTimeout(() => item.setAttribute('data-on', ''), 350 + index * 650));
		const minimum = new Promise((resolve) => window.setTimeout(resolve, reduced ? 300 : 2300));
		const [{ ai, delivered }] = await Promise.all([send(data), minimum]);
		render(data, result, ai, delivered);
		thinking.hidden = true;
		estimateEl.hidden = false;
		estimateEl.focus({ preventScroll: true });
		say(lines.done, 'party', 4200);
		sending = false;
		next.disabled = false;
	}

	// Resumo do pedido (sem o mascote): preenche a cada resposta.
	const summary = document.querySelectorAll<HTMLElement>('[data-kf-sum]');
	let budgetTouched = false;
	const updateSummary = (event?: Event) => {
		if ((event?.target as HTMLInputElement | undefined)?.name === 'investimento') budgetTouched = true;
		summary.forEach((el) => {
			const name = el.dataset.kfSum ?? '';
			let text = '';
			if (name === 'problema') text = problem.value.trim();
			else if (name === 'investimento') text = budgetTouched ? (budgetOut.textContent ?? '') : '';
			else text = form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.dataset.label ?? '';
			if (text.length > 90) text = `${text.slice(0, 88).trim()}…`;
			el.textContent = text || 'A definir';
			el.toggleAttribute('data-empty', !text);
		});
	};
	if (summary.length) {
		form.addEventListener('input', updateSummary);
		form.addEventListener('change', updateSummary);
	}

	// Boas-vindas, assim que o mascote aparecer na tela (ou logo, se ele estiver desligado).
	const hit = document.querySelector<HTMLElement>('[data-mascot-hit]');
	let tries = 0;
	const greet = () => {
		if (!hit || hit.dataset.visible === 'true') say(lines.hello, 'happy', 4200);
		else if (++tries < 20) window.setTimeout(greet, 300);
	};
	window.setTimeout(greet, hit ? 900 : 300);
}
