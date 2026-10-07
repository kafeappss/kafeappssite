/**
 * Kafeína: o pré-orçamento guiado do site (página /orcamento).
 *
 * Aqui ficam as perguntas, as falas do mascote em cada resposta e a tabela que
 * calcula a estimativa. Para mudar preços e prazos, edite só `pricing`.
 */

export type ProjectId = 'app' | 'saas' | 'ia' | 'sistema';
export type ScopeId = 'mvp' | 'completo' | 'modulo' | 'naosei';
export type DeadlineId = 'urgente' | 'curto' | 'medio' | 'flexivel';

export type Option<T extends string> = {
	id: T;
	label: string;
	hint?: string;
	/** Como a opção aparece no meio de uma frase (ex.: "um app mobile"). */
	noun?: string;
	icon?: string;
	/** O que o mascote diz quando a pessoa escolhe esta opção. */
	reply?: string;
	/** Reação do mascote (veja REACTIONS em src/scripts/liquid.ts). */
	reaction?: string;
};

export const projects: Option<ProjectId>[] = [
	{
		id: 'app',
		label: 'App mobile',
		hint: 'Um app para celular, nas lojas ou na web',
		noun: 'um app mobile',
		icon: 'phone',
		reply: 'Apps mobile têm um potencial enorme. 📱',
		reaction: 'nod',
	},
	{
		id: 'saas',
		label: 'SaaS ou plataforma',
		hint: 'Produto web com login, planos e receita recorrente',
		noun: 'um SaaS ou plataforma',
		icon: 'browser',
		reply: 'Plataforma com receita recorrente? Adoro. ☁️',
		reaction: 'nod',
	},
	{
		id: 'ia',
		label: 'IA sob medida',
		hint: 'Agentes, assistentes e automações com IA',
		noun: 'uma solução de IA sob medida',
		icon: 'spark',
		reply: 'IA? Meu assunto favorito. ✦',
		reaction: 'star',
	},
	{
		id: 'sistema',
		label: 'Sistema ou software interno',
		hint: 'ERP, painéis, B2B e integrações para a operação',
		noun: 'um sistema interno',
		icon: 'gear',
		reply: 'Organizar a operação muda o jogo. 💻',
		reaction: 'nod',
	},
];

export const contexts: Option<string>[] = [
	{ id: 'sem-concorrente', label: 'Não há concorrente direto' },
	{ id: 'concorrentes-com-gaps', label: 'Há concorrentes, mas com falhas' },
	{ id: 'processo-manual', label: 'Vai substituir um processo manual' },
	{ id: 'ferramenta-atual', label: 'Vai substituir uma ferramenta atual' },
];

export const scopes: Option<ScopeId>[] = [
	{ id: 'mvp', label: 'MVP rápido', hint: 'A menor versão que já resolve o problema', reaction: 'nod' },
	{ id: 'completo', label: 'Produto completo', hint: 'Mais funcionalidades desde o lançamento', reaction: 'happy' },
	{ id: 'modulo', label: 'Módulo ou funcionalidade', hint: 'Algo novo num produto que já existe', reaction: 'nod' },
	{ id: 'naosei', label: 'Ainda não sei', hint: 'A gente ajuda a definir', reaction: 'wink' },
];

export const deadlines: Option<DeadlineId>[] = [
	{
		id: 'urgente',
		label: 'Urgente',
		hint: 'Até 1 mês',
		reply: 'Pra ontem? Com engenharia acelerada por IA, dá pra correr. ⚡',
		reaction: 'surprise',
	},
	{ id: 'curto', label: '2 a 3 meses', reaction: 'nod' },
	{ id: 'medio', label: '3 a 6 meses', reaction: 'nod' },
	{ id: 'flexivel', label: 'Flexível', hint: 'Mais de 6 meses', reaction: 'happy' },
];

/** Faixa de investimento que a pessoa indica (em mil reais), do controle deslizante. */
export const budgetSteps = [5, 10, 15, 20, 30, 40, 50, 60, 80, 100, 150, 200, 300];
export const budgetDefault = 5; // índice de "R$ 40 mil"

export const states = [
	'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
	'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

/**
 * Tabela da estimativa: [investimento mínimo, máximo (mil reais), semanas mínimas, máximas].
 * "Ainda não sei" usa a linha do MVP.
 *
 * TODO: valores provisórios. Ajuste com as faixas reais da Kafé antes de publicar.
 */
export const pricing: Record<ProjectId, Record<Exclude<ScopeId, 'naosei'>, [number, number, number, number]>> = {
	app: { mvp: [35, 70, 8, 12], completo: [90, 200, 16, 28], modulo: [12, 35, 3, 6] },
	saas: { mvp: [40, 80, 8, 14], completo: [100, 240, 18, 32], modulo: [15, 40, 3, 7] },
	ia: { mvp: [20, 50, 4, 8], completo: [60, 160, 10, 20], modulo: [10, 28, 2, 5] },
	sistema: { mvp: [30, 65, 6, 12], completo: [80, 180, 14, 26], modulo: [10, 30, 3, 6] },
};

/** Prazo urgente: mais gente no time, o investimento sobe um pouco. */
export const urgencyFactor = 1.15;

/** Mostra a faixa de investimento no resultado (false = só prazo e escopo). */
export const showPrices = true;

/** Funcionalidades que costumam entrar na primeira versão, por tipo de projeto. */
export const baseFeatures: Record<ProjectId, string[]> = {
	app: ['Cadastro e login', 'Telas da jornada principal', 'Painel administrativo', 'Publicação na App Store e no Google Play'],
	saas: ['Cadastro, login e planos', 'Área do cliente', 'Painel administrativo', 'Cobrança recorrente'],
	ia: ['Diagnóstico dos processos', 'Agente treinado com os seus dados', 'Integração com os seus canais', 'Painel de acompanhamento'],
	sistema: ['Cadastros e fluxos do processo', 'Permissões por perfil', 'Painel de indicadores', 'Integração com o que você já usa'],
};

/** Palavras na descrição do problema que sugerem funcionalidades extras. */
export const keywordFeatures: { match: RegExp; feature: string }[] = [
	{ match: /agend|hor[aá]rio|reserva|consulta/i, feature: 'Agenda e agendamento online' },
	{ match: /pag(ar|amento)|checkout|cobran|pix|cart[aã]o|assinatura/i, feature: 'Pagamentos e assinaturas' },
	{ match: /notifica|lembrete|aviso|alerta/i, feature: 'Notificações e lembretes' },
	{ match: /chat|mensag|whats/i, feature: 'Chat e mensagens' },
	{ match: /mapa|localiza|entrega|delivery|rota|rastre/i, feature: 'Mapa, localização e rastreio' },
	{ match: /relat[oó]rio|dashboard|painel|indicador|m[eé]trica/i, feature: 'Relatórios e indicadores' },
	{ match: /marketplace|vendedor|fornecedor|lojista/i, feature: 'Área para vendedores e fornecedores' },
	{ match: /\bia\b|intelig[eê]ncia artificial|chatbot|agente|gpt|llm/i, feature: 'Assistente com IA' },
	{ match: /integra|\bapi\b|\berp\b|\bcrm\b|planilha/i, feature: 'Integrações com os sistemas atuais' },
	{ match: /estoque|pedido|ordem de servi|venda/i, feature: 'Pedidos, estoque e vendas' },
];

/** Falas do mascote ao longo do formulário. */
export const lines = {
	hello: 'Oi! Bora montar seu pré-orçamento? Leva uns 2 minutinhos. ☕',
	problemAsk: 'Me conta: qual problema esse projeto vai resolver?',
	typing: 'Hmm, tô entendendo… 👀',
	scope: 'Agora vamos calibrar: escopo, prazo e investimento.',
	contact: 'Quase lá! Para onde a gente manda seu pré-orçamento?',
	missingChoice: 'Falta escolher uma opção. 😉',
	missingProblem: 'Me conta um pouquinho mais, pode ser em poucas linhas.',
	missingContact: 'Confere os campos destacados, por favor.',
	thinking: 'Deixa comigo… tô montando seu pré-orçamento. ☕',
	done: 'Prontinho! Olha só o que preparei. 🎉',
	budgetHigh: 'Uau, dá pra fazer bonito com isso! ✦',
};
