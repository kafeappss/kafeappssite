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
	legalName: 'Kafé Apps LTDA',
	/**
	 * TODO: CNPJ da Kafé Apps LTDA (formato 00.000.000/0000-00).
	 * Enquanto estiver vazio, não aparece no rodapé nem na política de privacidade.
	 */
	cnpj: '',
	url: 'https://kafeapps.com.br',
	tagline: 'Mais negócio, menos software.',
	description:
		'Software house de Jaraguá do Sul (SC). Criamos aplicativos, plataformas, sistemas e soluções de IA sob medida, em código e com engenharia acelerada por IA, para startups e empresas que querem crescer.',
	foundingYear: 2021,
	/**
	 * Tema do site: 'claro' (padrão, visual de software house B2B) ou 'escuro'
	 * (cores do Linear com o fundo de letras). Ver src/styles/global.css.
	 */
	theme: 'claro' as 'claro' | 'escuro',
	/**
	 * Mascote interativo (feito para o tema escuro): o líquido em WebGL com olhos
	 * "//", reações, falas e as formas que ele vira em cada seção. Desligado
	 * (false), o topo da home mostra o painel de um projeto rodando e as seções
	 * mostram telas de produto animadas.
	 */
	mascot: false,
	ceo: 'Danilo Fonseca',
	location: {
		city: 'Jaraguá do Sul',
		state: 'SC',
		region: 'Santa Catarina',
		country: 'BR',
		label: 'Jaraguá do Sul, SC · atendemos todo o Brasil',
	},
	contact: {
		/** TODO: confirmar o e-mail comercial. */
		email: 'contato@kafeapps.com.br',
		/**
		 * TODO: número de WhatsApp só com dígitos, com DDI e DDD (ex.: 5547999999999).
		 * Enquanto estiver vazio, o botão flutuante de WhatsApp não aparece.
		 */
		whatsapp: '',
		/** Ex.: "(47) 99999-9999". Exibido no rodapé e na página de contato. */
		phoneDisplay: '',
		/**
		 * Endereço que recebe o formulário de contato (ex.: Formspree, Web3Forms,
		 * Getform ou um endpoint próprio). Vazio = o formulário abre o WhatsApp
		 * (se configurado) ou o e-mail do visitante com a mensagem pronta.
		 */
		formEndpoint: '',
		/**
		 * Pré-orçamento guiado pela Kafeína (página /orcamento do próprio site).
		 * Os botões principais levam para cá.
		 */
		briefUrl: '/orcamento',
		/**
		 * Serviço da Kafeína (pasta workers/kafeina): escreve o resumo do projeto com IA
		 * e repassa o contato ao CRM. Ex.: "https://kafeina.SEU-USUARIO.workers.dev".
		 * Vazio = o resumo é montado por regras no próprio navegador.
		 */
		kafeinaEndpoint: '',
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

/** Números exibidos na home e na página Sobre (vindos do site atual da Kafé). */
export const stats = [
	{ value: '2021', label: 'Ano em que a Kafé nasceu' },
	{ value: '4Ds', label: 'Metodologia própria: Discovery, Design, Develop e Deploy' },
	{ value: '10x', label: 'Mais agilidade na construção do seu produto' },
	{ value: 'até 40%', label: 'Mais econômico que o desenvolvimento tradicional' },
];

/** Diferenciais da Kafé. */
export const differentials = [
	{
		title: 'Engenharia aumentada por IA',
		description:
			'Engenheiros seniores trabalhando com agentes de IA: mais velocidade, com revisão humana em cada entrega.',
	},
	{
		title: 'Metodologia 4Ds',
		description: 'Discovery, Design, Develop e Deploy: um processo próprio para lançar com rapidez e menos risco.',
	},
	{
		title: 'CTO temporário',
		description:
			'Assumimos o papel de CTO do seu projeto, para você focar no que realmente importa: o negócio.',
	},
	{
		title: 'Design Inteligente (I.D.)',
		description:
			'UX research, testes A/B e protótipos para descobrir quais recursos o seu produto realmente precisa.',
	},
	{
		title: 'Segurança e LGPD',
		description:
			'Sistemas dentro da LGPD, na mesma infraestrutura de nuvem usada pelas big techs.',
	},
	{
		title: 'Acompanhamento em tempo real',
		description: 'Um sistema de acompanhamento do projeto e um time sempre por perto, sprint a sprint.',
	},
];

export type Testimonial = { quote: string; name: string; role: string; company?: string };

/**
 * TODO: adicionar depoimentos reais de clientes (com autorização).
 * Exemplo: { quote: '...', name: 'Nome Sobrenome', role: 'CEO', company: 'Empresa' }
 */
export const testimonials: Testimonial[] = [];

/**
 * Empresas atendidas (logos em src/assets/clients/<logo>.svg, em branco).
 * `size` ajusta o tamanho visual de cada logo para que todos pareçam equilibrados.
 */
export type Client = { name: string; logo: string; size?: number };

export const clients: Client[] = [
	{ name: 'G4 Educação', logo: 'g4', size: 1 },
	{ name: 'V4 Company', logo: 'v4-company', size: 0.92 },
	{ name: 'Grupo BMG', logo: 'grupo-bmg', size: 1.05 },
	{ name: 'FUCAPE Business School', logo: 'fucape', size: 1.05 },
	{ name: 'Aurica', logo: 'aurica', size: 0.72 },
	{ name: 'Bossanova', logo: 'bossanova', size: 0.66 },
	{ name: 'CPX', logo: 'cpx', size: 1.15 },
	{ name: 'Platta', logo: 'platta', size: 0.9 },
	{ name: 'Rufy', logo: 'rufy', size: 0.9 },
	{ name: 'Turbox', logo: 'turbox', size: 0.85 },
	{ name: 'Vision Metrics', logo: 'vision-metrics', size: 1 },
];

/** Tecnologias e plataformas (as de código e IA que aparecem no site atual). */
export const technologies: string[] = [
	'React',
	'Next.js',
	'Supabase',
	'Firebase',
	'AWS',
	'Vercel',
	'Stripe',
	'Tailwind CSS',
	'OpenAI',
	'Anthropic',
];

/** Tipos de produto que a Kafé constrói. */
export const productTypes = [
	'Marketplaces',
	'Plataformas SaaS',
	'Agentes de IA',
	'Apps de delivery e pedidos',
	'Agendamento de serviços',
	'Saúde e bem-estar',
	'Educação e cursos online',
	'Fintechs e pagamentos',
	'CRMs sob medida',
	'Painéis de indicadores',
	'Clubes de fidelidade',
	'Apps para equipes de campo',
];

export const whatsappLink = (message = 'Olá! Vim pelo site da Kafé Apps e quero conversar sobre um projeto.') =>
	site.contact.whatsapp
		? `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(message)}`
		: '';
