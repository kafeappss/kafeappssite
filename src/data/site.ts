/**
 * Dados centrais da Kafé Apps.
 *
 * Tudo o que é "fato" sobre a empresa (contatos, redes, números, depoimentos,
 * clientes) fica aqui, para que o site inteiro seja atualizado editando um só
 * arquivo. Seções que dependem de listas vazias (depoimentos, clientes,
 * tecnologias) simplesmente não aparecem até receberem conteúdo.
 */

export const site = {
	name: 'Kafé Apps',
	shortName: 'Kafé',
	/** TODO: confirmar razão social e CNPJ antes de publicar. */
	legalName: 'Fonseca Media LTDA',
	cnpj: '41.770.123/0001-99',
	url: 'https://kafeapps.com.br',
	tagline: 'Mais negócio, menos software.',
	description:
		'Estúdio de produto digital em Niterói (RJ). Transformamos ideias em aplicativos, MVPs, plataformas e sistemas — com código, low-code ou no-code — para startups e empresas que querem crescer.',
	foundingYear: 2021,
	ceo: 'Danilo Fonseca',
	location: {
		city: 'Niterói',
		state: 'RJ',
		region: 'Rio de Janeiro',
		country: 'BR',
		label: 'Niterói, RJ — atendemos todo o Brasil',
	},
	contact: {
		/** TODO: confirmar o e-mail comercial. */
		email: 'contato@kafeapps.com.br',
		/**
		 * TODO: número de WhatsApp só com dígitos, com DDI e DDD (ex.: 5521999999999).
		 * Enquanto estiver vazio, o botão flutuante de WhatsApp não aparece.
		 */
		whatsapp: '',
		/** Ex.: "(21) 99999-9999". Exibido no rodapé e na página de contato. */
		phoneDisplay: '',
		/**
		 * Endereço que recebe o formulário de contato (ex.: Formspree, Web3Forms,
		 * Getform ou um endpoint próprio). Vazio = o formulário abre o WhatsApp
		 * (se configurado) ou o e-mail do visitante com a mensagem pronta.
		 */
		formEndpoint: '',
	},
	social: [
		{ label: 'Instagram', handle: '@kafeapps', href: 'https://www.instagram.com/kafeapps/' },
		{ label: 'LinkedIn', handle: 'Kafé Apps', href: 'https://br.linkedin.com/company/kafe-apps' },
		{ label: 'YouTube', handle: 'PodKafé', href: 'https://www.youtube.com/@kafeapps' },
		{
			label: 'Facebook',
			handle: 'Kafé Apps',
			href: 'https://www.facebook.com/p/Kaf%C3%A9-Apps-100090161434702/',
		},
	],
} as const;

export type NavItem = { label: string; href: string };

export const nav: NavItem[] = [
	{ label: 'Serviços', href: '/servicos' },
	{ label: 'Método', href: '/metodo' },
	{ label: 'Cases', href: '/cases' },
	{ label: 'Sobre', href: '/sobre' },
	{ label: 'Blog', href: '/blog' },
];

/** Números exibidos na home e na página Sobre. Use apenas dados verificáveis. */
export const stats = [
	{ value: '2021', label: 'Ano em que a Kafé nasceu, em Niterói (RJ)' },
	{ value: '4D', label: 'Metodologia própria para criar soluções digitais' },
	{ value: '3', label: 'Formas de construir: no-code, low-code e código' },
	/** TODO: manter apenas se houver base para a comparação (dado da landing page atual). */
	{ value: 'até 40%', label: 'Mais econômico que o desenvolvimento tradicional' },
];

/** Diferenciais da Kafé (vindos da comunicação atual da empresa). */
export const differentials = [
	{
		title: 'Acompanhamento contínuo',
		description:
			'Você acompanha o projeto em tempo real, sprint a sprint, com um sistema próprio de acompanhamento e um time sempre por perto.',
	},
	{
		title: 'Metodologia 4D',
		description:
			'Um método próprio para descobrir, definir, desenvolver e lançar soluções com rapidez, organização e menos risco.',
	},
	{
		title: 'Especialistas em startups',
		description:
			'Experiência em MVPs e em produtos que precisam provar valor rápido para conquistar usuários e investidores.',
	},
	{
		title: 'Design Inteligente',
		description:
			'Um time de UX Research que baseia cada decisão de produto em pesquisa, testes e dados de uso.',
	},
	{
		title: 'Tecnologia na medida',
		description:
			'No-code, low-code ou código: escolhemos o caminho que entrega mais resultado pelo seu investimento.',
	},
	{
		title: 'Investimento enxuto',
		description:
			'Escopo priorizado e entregas por ciclo: seu orçamento vai para o que gera aprendizado e receita.',
	},
];

export type Testimonial = { quote: string; name: string; role: string; company?: string };

/**
 * TODO: adicionar depoimentos reais de clientes (com autorização).
 * Exemplo: { quote: '...', name: 'Nome Sobrenome', role: 'CEO', company: 'Empresa' }
 */
export const testimonials: Testimonial[] = [];

export type Client = { name: string; logo?: string; href?: string };

/**
 * TODO: adicionar clientes que autorizaram a divulgação.
 * Coloque os logos em /public/clientes/ e informe o caminho em `logo` (ex.: '/clientes/marca.svg').
 */
export const clients: Client[] = [];

/**
 * TODO: liste as tecnologias e plataformas que a Kafé usa de fato
 * (ex.: 'Flutter', 'Bubble', 'FlutterFlow', 'Supabase'...). A faixa de tecnologias
 * aparece na página Método assim que houver itens.
 */
export const technologies: string[] = [];

/** Tipos de produto que a Kafé constrói (usados na home). */
export const productTypes = [
	'Marketplaces',
	'Apps de delivery e pedidos',
	'Agendamento de serviços',
	'Plataformas SaaS',
	'Saúde e bem-estar',
	'Educação e cursos online',
	'Fintechs e pagamentos',
	'Comunidades e redes',
	'CRMs sob medida',
	'Painéis de indicadores',
	'Clubes de fidelidade',
	'Apps para equipes de campo',
];

export const whatsappLink = (message = 'Olá! Vim pelo site da Kafé Apps e quero conversar sobre um projeto.') =>
	site.contact.whatsapp
		? `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(message)}`
		: '';
