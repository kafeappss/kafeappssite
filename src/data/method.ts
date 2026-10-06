/**
 * Método Sprint e Metodologia 4D.
 * TODO: confirmar com o time se os quatro "D" usados aqui (Descobrir, Definir,
 * Desenvolver e Decolar) são os mesmos da metodologia oficial da Kafé.
 */

export const methodSteps = [
	{
		id: 'descobrir',
		name: 'Descobrir',
		coffee: 'a escolha do grão',
		title: 'Imersão no seu negócio',
		description:
			'Entrevistas, análise de mercado e mapeamento de hipóteses. Entendemos o problema, o público e o que significa sucesso para você.',
		output: 'Mapa do produto e hipóteses priorizadas',
	},
	{
		id: 'definir',
		name: 'Definir',
		coffee: 'a torra',
		title: 'Escopo, protótipo e plano',
		description:
			'Desenhamos os fluxos e o protótipo navegável, escolhemos a tecnologia ideal — no-code, low-code ou código — e dividimos o projeto em sprints com entregas claras.',
		output: 'Protótipo navegável e plano de sprints',
	},
	{
		id: 'desenvolver',
		name: 'Desenvolver',
		coffee: 'a extração',
		title: 'Sprints curtas e transparentes',
		description:
			'Construímos em ciclos curtos, com entregas testáveis. Você acompanha o andamento em tempo real e valida cada etapa antes da próxima.',
		output: 'Entregas incrementais testadas',
	},
	{
		id: 'decolar',
		name: 'Decolar',
		coffee: 'servido',
		title: 'Lançamento e primeiros usuários',
		description:
			'Publicamos nas lojas ou na web, configuramos as métricas e acompanhamos de perto os primeiros dias de uso.',
		output: 'Produto no ar e painel de métricas',
	},
];

export const engagementModels = [
	{
		name: 'Projeto Sprint',
		badge: 'Para começar',
		description:
			'Para tirar uma ideia do papel ou lançar um MVP. Escopo enxuto, entregas por sprint e prazo definido desde o início.',
		items: ['Discovery e protótipo navegável', 'Desenvolvimento em sprints', 'Publicação e métricas de validação'],
	},
	{
		name: 'Projeto sob medida',
		badge: 'Para estruturar',
		description:
			'Para produtos e sistemas mais robustos, com vários módulos, integrações e perfis de usuário.',
		items: ['Arquitetura e roadmap do produto', 'Entregas por módulos', 'Integrações com sistemas existentes'],
	},
	{
		name: 'Kafé Ongoing™',
		badge: 'Para evoluir',
		description:
			'Evolução contínua com custo previsível: um time da Kafé dedicado às demandas tecnológicas do seu negócio, com no-code e low-code.',
		items: ['Melhorias e novas funcionalidades todo mês', 'Suporte e monitoramento', 'Prioridades definidas com você'],
	},
];

/** Comparativo geral entre as três formas de construir (escala de 1 a 5). */
export const buildModes = [
	{
		name: 'No-code',
		summary: 'Construção 100% visual, para lançar em tempo recorde.',
		bestFor: 'MVPs, sistemas internos e validação rápida',
		scores: { Velocidade: 5, Economia: 5, Flexibilidade: 3, Escala: 3 },
	},
	{
		name: 'Low-code',
		summary: 'Visual onde dá, código onde precisa.',
		bestFor: 'Produtos em crescimento e regras de negócio complexas',
		scores: { Velocidade: 4, Economia: 4, Flexibilidade: 4, Escala: 4 },
	},
	{
		name: 'Código',
		summary: 'Controle total de arquitetura e performance.',
		bestFor: 'Produtos validados que precisam escalar sem limites',
		scores: { Velocidade: 3, Economia: 2, Flexibilidade: 5, Escala: 5 },
	},
];

/** Perguntas frequentes gerais (home e página de contato). */
export const faq = [
	{
		q: 'Quanto custa desenvolver um aplicativo ou sistema?',
		a: 'Depende do escopo, das plataformas, das integrações e da tecnologia escolhida — no-code e low-code costumam reduzir bastante o investimento. Depois de uma conversa inicial e da etapa de descoberta, você recebe uma proposta clara, dividida por sprints.',
	},
	{
		q: 'Em quanto tempo meu MVP fica pronto?',
		a: 'Com o Método Sprint, as primeiras entregas testáveis chegam em poucos dias ou semanas. O prazo total varia conforme o escopo e é definido no planejamento, antes de qualquer linha de código.',
	},
	{
		q: 'No-code é coisa séria? Meu produto vai aguentar crescer?',
		a: 'Sim. As plataformas atuais sustentam produtos com milhares de usuários. Quando o crescimento pedir, planejamos a migração gradual para código próprio, sem perder o que já foi construído e aprendido.',
	},
	{
		q: 'O produto fica no nome da minha empresa?',
		a: 'Recomendamos — e ajudamos a configurar — que contas de lojas, domínios e plataformas fiquem em nome da sua empresa desde o início. Assim, você tem controle total sobre o que é seu.',
	},
	{
		q: 'Vocês assinam acordo de confidencialidade?',
		a: 'Sim. Se preferir, assinamos um NDA antes de você detalhar a sua ideia.',
	},
	{
		q: 'Atendem empresas de fora do Rio de Janeiro?',
		a: 'Sim. Nossa base é em Niterói (RJ), e trabalhamos de forma remota com clientes de todo o Brasil, com reuniões on-line e acompanhamento em tempo real.',
	},
	{
		q: 'E depois do lançamento?',
		a: 'O produto continua evoluindo. Com o Kafé Ongoing™, um time da Kafé cuida de melhorias, novas funcionalidades e suporte, com prioridades definidas junto com você.',
	},
];
