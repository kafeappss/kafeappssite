/**
 * Metodologia 4Ds, formatos de trabalho, engenharia aumentada por IA e
 * perguntas frequentes.
 */

export const methodSteps = [
	{
		id: 'discovery',
		name: 'Discovery',
		coffee: 'a escolha do grão',
		title: 'Entender antes de construir',
		description:
			'Descobrimos as prioridades do seu negócio, definimos as dores principais e desenhamos as soluções necessárias.',
		output: 'Problemas priorizados e escopo definido',
	},
	{
		id: 'design',
		name: 'Design',
		coffee: 'a torra',
		title: 'Design Inteligente (I.D.)',
		description:
			'UX research e UI para criar fluxos e telas que entregam performance, usabilidade e experiência. Tudo testado em protótipo antes do código.',
		output: 'Protótipo navegável validado',
	},
	{
		id: 'develop',
		name: 'Develop',
		coffee: 'a extração',
		title: 'Código acelerado por IA',
		description:
			'Engenheiros apoiados por IA desenvolvem em sprints curtas, com revisão humana e testes automatizados. Você acompanha tudo em tempo real.',
		output: 'Entregas testadas a cada sprint',
	},
	{
		id: 'deploy',
		name: 'Deploy',
		coffee: 'servido',
		title: 'Lançamento e evolução',
		description:
			'Publicamos, acompanhamos os primeiros usuários e seguimos com suporte e melhorias para o produto ter sucesso no mercado.',
		output: 'Produto no ar e monitorado',
	},
];

export const engagementModels = [
	{
		name: 'OnDemand™',
		badge: 'Projeto com escopo',
		description:
			'Transformamos a sua ideia em aplicativo ou sistema, com escopo, prazo e investimento combinados desde o início.',
		items: ['Definição de escopo', 'Desenvolvimento em sprints', 'Deploy no prazo estimado'],
	},
	{
		name: 'OnGoing™',
		badge: 'Squad as a Service',
		description:
			'Um squad dedicado de engenheiros e designers para criar e evoluir o seu produto continuamente, com custo previsível.',
		items: ['Plano sob medida para o seu objetivo', 'Levantamento de demandas mensais', 'Entregas constantes'],
	},
	{
		name: 'InfoScale™',
		badge: 'Para infoprodutores',
		description:
			'Transformamos o seu infoproduto ou metodologia em um aplicativo, com um time de tecnologia e produto dedicado ao seu negócio.',
		items: ['Plano adequado ao seu projeto', 'Desenvolvimento do app', 'Lançamento e evolução'],
	},
];

/** Engenharia aumentada por IA: como a IA entra no nosso jeito de construir. */
export const aiPillars = [
	{
		title: 'Mais velocidade',
		description:
			'Agentes de IA aceleram testes, documentação, telas e integrações. O que levava semanas sai em dias.',
	},
	{
		title: 'Qualidade revisada',
		description:
			'Toda entrega passa por engenheiros seniores e por testes automatizados antes de chegar a você.',
	},
	{
		title: 'Investimento menor',
		description: 'Menos horas em tarefas mecânicas: até 40% mais econômico que o desenvolvimento tradicional.',
	},
	{
		title: 'Seus dados protegidos',
		description: 'Código e informações do projeto tratados com confidencialidade e dentro da LGPD.',
	},
];

/** Perguntas frequentes gerais (home e página de contato). */
export const faq = [
	{
		q: 'Quanto custa desenvolver um aplicativo ou sistema?',
		a: 'Depende do escopo, das plataformas e das integrações. Como nossos engenheiros trabalham acelerados por IA, o tempo de desenvolvimento cai, e isso aparece no investimento. Depois da etapa de Discovery, você recebe uma proposta clara, dividida por sprints.',
	},
	{
		q: 'Como vocês usam IA no desenvolvimento?',
		a: 'Nossos engenheiros usam ferramentas e agentes de IA para acelerar tarefas como escrever testes, documentar, revisar e prototipar. As decisões de arquitetura e a revisão final são sempre de pessoas, e o código e os dados do seu projeto são tratados com confidencialidade.',
	},
	{
		q: 'Em quanto tempo meu MVP fica pronto?',
		a: 'As primeiras entregas testáveis chegam em poucas semanas. O prazo total varia conforme o escopo e é definido no planejamento, antes de qualquer linha de código.',
	},
	{
		q: 'O código e o produto ficam no nome da minha empresa?',
		a: 'Recomendamos (e ajudamos a configurar) que repositórios, contas de lojas, domínios e servidores fiquem em nome da sua empresa desde o início. Assim, você tem controle total sobre o que é seu.',
	},
	{
		q: 'Vocês assinam acordo de confidencialidade?',
		a: 'Sim. Se preferir, assinamos um NDA antes de você detalhar a sua ideia.',
	},
	{
		q: 'Atendem empresas de fora de Santa Catarina?',
		a: 'Sim. Nossa base é em Jaraguá do Sul (SC), e trabalhamos de forma remota com clientes de todo o Brasil, com reuniões on-line e acompanhamento em tempo real.',
	},
	{
		q: 'E depois do lançamento?',
		a: 'O produto continua evoluindo. Com o OnGoing™, um squad dedicado cuida de melhorias, novas funcionalidades e suporte, com prioridades definidas junto com você.',
	},
];
