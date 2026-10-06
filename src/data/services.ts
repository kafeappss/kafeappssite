/**
 * Serviços da Kafé Apps. Cada item gera um card na home e em /servicos
 * e uma página própria em /servicos/[slug].
 *
 * Nos títulos, o trecho entre <em></em> recebe o destaque em itálico serifado.
 */

export type IconName = 'phone' | 'rocket' | 'blocks' | 'browser' | 'gear' | 'pen';

export type Service = {
	slug: string;
	title: string;
	short: string;
	icon: IconName;
	keywords: string[];
	seo: { title: string; description: string };
	hero: { title: string; lead: string };
	intro: { title: string; paragraphs: string[] };
	forWho: string[];
	deliverables: { title: string; description: string }[];
	highlights: { title: string; items: { title: string; description: string }[] };
	faq: { q: string; a: string }[];
};

export const services: Service[] = [
	{
		slug: 'desenvolvimento-de-aplicativos',
		title: 'Desenvolvimento de aplicativos',
		short:
			'Apps para iOS e Android pensados como produto: bonitos, rápidos, publicados nas lojas e prontos para crescer.',
		icon: 'phone',
		keywords: ['iOS', 'Android', 'Multiplataforma', 'Publicação nas lojas'],
		seo: {
			title: 'Desenvolvimento de aplicativos iOS e Android',
			description:
				'Criamos aplicativos para iOS e Android do protótipo à publicação nas lojas, com design de produto, painel administrativo e integrações. Peça uma proposta.',
		},
		hero: {
			title: 'Aplicativos que as pessoas <em>abrem todo dia.</em>',
			lead: 'Do primeiro rascunho à publicação na App Store e no Google Play, desenhamos e desenvolvemos aplicativos sob medida para o seu modelo de negócio — com a tecnologia que equilibra prazo, orçamento e escala.',
		},
		intro: {
			title: 'Mais do que telas <em>bonitas.</em>',
			paragraphs: [
				'Um bom aplicativo começa muito antes da primeira linha de código. Antes de desenhar telas, entendemos quem vai usar, qual problema precisa ser resolvido e como o app vai gerar resultado para o seu negócio — seja venda, retenção, produtividade ou captação de investimento.',
				'Com isso claro, escolhemos o caminho técnico mais inteligente para o seu momento: desenvolvimento multiplataforma para chegar ao iOS e ao Android de uma só vez, low-code para acelerar a entrega ou código sob medida quando o produto exige performance e flexibilidade máximas.',
			],
		},
		forWho: [
			'Startups que precisam lançar a primeira versão do produto e validar com usuários reais.',
			'Empresas que querem levar um serviço, uma loja ou um programa de fidelidade para o celular do cliente.',
			'Operações com equipes em campo que precisam registrar, consultar e acompanhar atividades pelo app.',
			'Negócios que já têm um aplicativo, mas precisam reconstruí-lo ou evoluí-lo com mais qualidade.',
		],
		deliverables: [
			{
				title: 'Discovery e escopo',
				description:
					'Imersão no negócio, mapeamento de jornadas e definição do que entra — e do que fica para depois — na primeira versão.',
			},
			{
				title: 'UX/UI e protótipo navegável',
				description: 'Interfaces desenhadas para o seu público e testáveis antes do desenvolvimento.',
			},
			{
				title: 'App para iOS e Android',
				description: 'Desenvolvimento multiplataforma ou nativo, com foco em desempenho e experiência fluida.',
			},
			{
				title: 'Painel administrativo',
				description: 'Um painel web para a sua equipe gerenciar usuários, conteúdos, pedidos e indicadores.',
			},
			{
				title: 'Integrações',
				description: 'Pagamentos, mapas, notificações push, login social, ERPs, CRMs e APIs de terceiros.',
			},
			{
				title: 'Publicação nas lojas',
				description: 'Preparação técnica, materiais e acompanhamento da revisão na App Store e no Google Play.',
			},
			{
				title: 'Métricas desde o dia 1',
				description: 'Eventos e funis configurados para decisões guiadas por dados, não por achismo.',
			},
			{
				title: 'Evolução contínua',
				description: 'Suporte pós-lançamento e novas versões com o Kafé Ongoing™.',
			},
		],
		highlights: {
			title: 'Nativo, multiplataforma <em>ou web app?</em>',
			items: [
				{
					title: 'Multiplataforma',
					description:
						'Uma única base de código para iOS e Android. É o caminho mais comum para MVPs e produtos em crescimento: menor custo e entregas mais rápidas, com experiência muito próxima da nativa.',
				},
				{
					title: 'Nativo',
					description:
						'Indicado quando o app depende intensamente de recursos do aparelho, de animações complexas ou de performance extrema.',
				},
				{
					title: 'Web app (PWA)',
					description:
						'Roda no navegador, pode ser instalado na tela inicial e dispensa as lojas. Ótimo para validar rápido ou para uso interno.',
				},
			],
		},
		faq: [
			{
				q: 'Quanto tempo leva para desenvolver um aplicativo?',
				a: 'Depende do escopo. Um MVP enxuto pode ter as primeiras entregas testáveis em poucas semanas; produtos mais completos levam alguns meses. Na etapa de definição, você recebe um cronograma por sprints, com o que será entregue em cada ciclo.',
			},
			{
				q: 'Vocês publicam o app nas lojas?',
				a: 'Sim. Cuidamos da preparação técnica e dos materiais para a App Store e o Google Play e acompanhamos o processo de revisão. Recomendamos que as contas de desenvolvedor fiquem em nome da sua empresa desde o início — e ajudamos a configurá-las.',
			},
			{
				q: 'O mesmo app funciona em iPhone e Android?',
				a: 'Sim. Na maioria dos projetos usamos tecnologias multiplataforma, que geram apps para os dois sistemas a partir de uma única base de código.',
			},
			{
				q: 'E se eu já tiver um aplicativo?',
				a: 'Fazemos um diagnóstico do que existe hoje e recomendamos o melhor caminho: evoluir a base atual, reconstruir partes críticas ou migrar de tecnologia.',
			},
		],
	},
	{
		slug: 'mvp-para-startups',
		title: 'MVP para startups',
		short:
			'Valide sua ideia com um produto mínimo viável no ar rapidamente, com investimento enxuto e foco no que importa.',
		icon: 'rocket',
		keywords: ['Método Sprint', 'Validação', 'Tração', 'Investimento'],
		seo: {
			title: 'Desenvolvimento de MVP para startups',
			description:
				'Tire sua ideia do papel com um MVP construído pelo Método Sprint: escopo enxuto, entregas rápidas e foco em validação, tração e investimento.',
		},
		hero: {
			title: 'Sua ideia no ar <em>antes que o mercado mude.</em>',
			lead: 'O MVP (produto mínimo viável) é a forma mais inteligente de testar uma ideia com usuários reais investindo apenas o necessário. Com o Método Sprint, levamos o seu do conceito à primeira versão em ciclos curtos e previsíveis.',
		},
		intro: {
			title: 'Aprender rápido <em>custa menos.</em>',
			paragraphs: [
				'Toda startup começa com hipóteses: alguém tem esse problema, está disposto a pagar pela solução e vai usar o produto do jeito que imaginamos. O MVP existe para testar essas hipóteses no mundo real, o mais cedo possível.',
				'O erro mais comum é tentar lançar o produto completo de uma vez. Isso consome meses e boa parte do orçamento antes do primeiro feedback. Na Kafé, fazemos o contrário: identificamos o menor conjunto de funcionalidades capaz de entregar valor e gerar aprendizado — e colocamos isso nas mãos dos seus usuários o quanto antes.',
			],
		},
		forWho: [
			'Fundadores com uma ideia promissora, mas ainda sem produto.',
			'Startups que precisam de tração ou de uma versão funcional para captar investimento.',
			'Empresas que querem testar um novo produto digital sem montar um time interno.',
			'Empreendedores que já tentaram tirar a ideia do papel e esbarraram em prazo ou custo.',
		],
		deliverables: [
			{
				title: 'Mapa de hipóteses',
				description: 'O que precisamos aprender primeiro e como cada funcionalidade ajuda a validar isso.',
			},
			{
				title: 'Escopo enxuto e priorizado',
				description: 'Funcionalidades essenciais separadas do que pode esperar a próxima versão.',
			},
			{
				title: 'Protótipo navegável',
				description: 'Para testar o fluxo com usuários e apresentar a ideia antes de desenvolver.',
			},
			{
				title: 'MVP funcional',
				description: 'Aplicativo ou plataforma web no ar, pronto para receber usuários reais.',
			},
			{
				title: 'Métricas de validação',
				description: 'Indicadores definidos para saber, com dados, se a ideia está funcionando.',
			},
			{
				title: 'Plano de próximos passos',
				description: 'Roadmap para evoluir o produto a partir dos primeiros aprendizados.',
			},
		],
		highlights: {
			title: 'Por que construir seu MVP <em>com a Kafé.</em>',
			items: [
				{
					title: 'Especialistas em startups',
					description: 'Falamos a língua de quem está começando: validação, tração, métricas e investimento.',
				},
				{
					title: 'A tecnologia certa para a fase',
					description:
						'No-code, low-code ou código: escolhemos o que coloca o seu MVP no ar mais rápido, sem fechar portas para o futuro.',
				},
				{
					title: 'Acompanhamento transparente',
					description: 'Você acompanha cada sprint e vê o produto ganhar forma em tempo real.',
				},
				{
					title: 'Investimento enxuto',
					description: 'Seu orçamento vai para o que gera aprendizado, não para funcionalidades que ninguém pediu.',
				},
			],
		},
		faq: [
			{
				q: 'O que entra em um MVP?',
				a: 'Somente o essencial para resolver o problema principal do seu cliente e medir se a solução funciona. Definimos isso juntos na etapa de descoberta, priorizando as funcionalidades pelo impacto na validação.',
			},
			{
				q: 'Em quanto tempo meu MVP fica pronto?',
				a: 'Com o Método Sprint, as primeiras entregas testáveis chegam em poucos dias ou semanas, conforme o escopo. O prazo total é definido no planejamento, antes do início do desenvolvimento.',
			},
			{
				q: 'Um MVP feito em no-code aguenta crescer?',
				a: 'Sim, para a grande maioria dos produtos em fase de validação. Quando o crescimento exigir, planejamos a migração gradual para código próprio, sem jogar fora o que já foi aprendido.',
			},
			{
				q: 'E depois que o MVP estiver no ar?',
				a: 'Analisamos os dados de uso com você e planejamos as próximas versões. O produto pode continuar evoluindo com o Kafé Ongoing™, nosso modelo de evolução contínua.',
			},
		],
	},
	{
		slug: 'no-code-e-low-code',
		title: 'No-code e low-code',
		short:
			'Velocidade de startup com qualidade de software: plataformas visuais para lançar e evoluir produtos em tempo recorde.',
		icon: 'blocks',
		keywords: ['No-code', 'Low-code', 'Automação', 'Kafé Ongoing™'],
		seo: {
			title: 'Desenvolvimento no-code e low-code',
			description:
				'Desenvolvemos aplicativos, plataformas e automações com no-code e low-code para lançar mais rápido e investir menos — com arquitetura pensada para escalar.',
		},
		hero: {
			title: 'Menos código. <em>Mais velocidade.</em>',
			lead: 'Plataformas no-code e low-code permitem construir aplicativos, sistemas e automações em uma fração do tempo do desenvolvimento tradicional. Nós usamos essas ferramentas com rigor de engenharia — para você ganhar velocidade sem abrir mão de qualidade.',
		},
		intro: {
			title: 'Não é atalho. <em>É estratégia.</em>',
			paragraphs: [
				'No-code e low-code deixaram de ser apenas ferramentas de protótipo. Hoje, essas plataformas sustentam marketplaces, aplicativos com milhares de usuários e sistemas internos de empresas de todos os tamanhos.',
				'O que faz a diferença é como elas são usadas. Banco de dados bem modelado, regras de negócio organizadas, segurança e performance pensadas desde o início: é isso que separa um produto que escala de um que precisa ser refeito em seis meses.',
			],
		},
		forWho: [
			'Quem precisa lançar rápido para validar uma ideia ou aproveitar uma janela de mercado.',
			'Empresas que querem digitalizar processos sem esperar meses por um sistema.',
			'Times que precisam de ferramentas internas sob medida, mas não têm desenvolvedores disponíveis.',
			'Produtos que precisam evoluir toda semana, com custo previsível.',
		],
		deliverables: [
			{
				title: 'Aplicativos móveis e web',
				description: 'Construídos em plataformas visuais modernas, com design sob medida.',
			},
			{
				title: 'Back-end e banco de dados',
				description: 'Estrutura de dados, regras de negócio e APIs organizadas para crescer.',
			},
			{
				title: 'Automações de fluxo',
				description: 'Integração entre ferramentas e fim das tarefas manuais e repetitivas.',
			},
			{
				title: 'Integrações',
				description: 'Pagamentos, e-mail, WhatsApp, planilhas, CRMs, ERPs e APIs externas.',
			},
			{
				title: 'Governança e segurança',
				description: 'Controle de acesso, boas práticas de privacidade e documentação do produto.',
			},
			{
				title: 'Plano de escala',
				description: 'Quando e como migrar partes do produto para código — se e quando fizer sentido.',
			},
		],
		highlights: {
			title: 'No-code, low-code <em>ou código?</em>',
			items: [
				{
					title: 'No-code',
					description:
						'Construção 100% visual. Ideal para MVPs, sistemas internos e produtos que precisam ir ao ar muito rápido.',
				},
				{
					title: 'Low-code',
					description:
						'Plataformas visuais com código personalizado onde é preciso. Mais flexibilidade para regras complexas e integrações.',
				},
				{
					title: 'Código sob medida',
					description:
						'Controle total de performance e arquitetura. Indicado quando o produto já validou o mercado e precisa escalar sem limites.',
				},
			],
		},
		faq: [
			{
				q: 'No-code é seguro?',
				a: 'As principais plataformas oferecem infraestrutura robusta, criptografia e controles de acesso. Somado a boas práticas de modelagem e permissões, um produto no-code pode ser tão seguro quanto um desenvolvido em código.',
			},
			{
				q: 'Vou ficar preso à plataforma?',
				a: 'Toda tecnologia traz algum grau de dependência — inclusive o código tradicional, que depende de frameworks e de quem o escreveu. Escolhemos plataformas consolidadas, documentamos o produto e, quando faz sentido, desenhamos a arquitetura para facilitar uma migração futura.',
			},
			{
				q: 'Quais plataformas vocês usam?',
				a: 'Escolhemos a ferramenta conforme o projeto: construtores de aplicativos web e móveis, bancos de dados e back-ends gerenciados e ferramentas de automação. A decisão leva em conta escopo, custo de licenças, desempenho e planos de escala.',
			},
			{
				q: 'O que é o Kafé Ongoing™?',
				a: 'É o nosso modelo de evolução contínua: um time da Kafé dedicado às demandas tecnológicas do seu negócio com no-code e low-code, de forma recorrente e com custo previsível.',
			},
		],
	},
	{
		slug: 'plataformas-web-e-saas',
		title: 'Plataformas web e SaaS',
		short:
			'Marketplaces, portais e produtos SaaS com assinatura — arquitetura sólida, experiência impecável e prontos para escalar.',
		icon: 'browser',
		keywords: ['SaaS', 'Marketplaces', 'Portais', 'Assinaturas'],
		seo: {
			title: 'Desenvolvimento de plataformas web, marketplaces e SaaS',
			description:
				'Criamos plataformas web, marketplaces, portais e produtos SaaS com pagamentos recorrentes, painéis e integrações. Do MVP à escala.',
		},
		hero: {
			title: 'Plataformas que <em>viram negócio.</em>',
			lead: 'Marketplaces, portais de clientes, plataformas de cursos e produtos SaaS com assinatura: construímos a base digital que conecta pessoas, automatiza operações e gera receita recorrente.',
		},
		intro: {
			title: 'Muitas vezes, a plataforma <em>é o negócio.</em>',
			paragraphs: [
				'Por isso olhamos além das telas: modelo de receita, jornada de cada tipo de usuário, operação por trás do produto e as métricas que mostram se ele está crescendo.',
				'Desenhamos a experiência, estruturamos o banco de dados e as regras de negócio e entregamos uma plataforma rápida, segura e preparada para receber novos módulos à medida que o negócio evolui.',
			],
		},
		forWho: [
			'Startups construindo um produto SaaS ou um marketplace.',
			'Empresas que querem oferecer um portal de autoatendimento para clientes ou parceiros.',
			'Negócios de educação, saúde, serviços e varejo que precisam de uma plataforma própria.',
			'Produtos que nasceram em planilhas e ferramentas soltas e precisam de uma casa única.',
		],
		deliverables: [
			{
				title: 'Arquitetura de produto',
				description: 'Perfis de usuário, permissões, fluxos e modelo de dados pensados para crescer.',
			},
			{
				title: 'Pagamentos e assinaturas',
				description: 'Cobrança recorrente, divisão de pagamentos, cupons e gestão de planos.',
			},
			{
				title: 'Painéis e relatórios',
				description: 'Indicadores para você e para os seus clientes acompanharem o que importa.',
			},
			{
				title: 'Área do cliente',
				description: 'Cadastro, login seguro, perfis e autoatendimento.',
			},
			{
				title: 'Integrações e APIs',
				description: 'Conexão com ERPs, CRMs, meios de pagamento, e-mail e WhatsApp.',
			},
			{
				title: 'Performance e SEO técnico',
				description: 'Páginas rápidas e bem estruturadas para atrair e converter visitantes.',
			},
		],
		highlights: {
			title: 'O que dá para <em>construir.</em>',
			items: [
				{
					title: 'Marketplaces',
					description: 'Conecte quem oferece e quem procura, com pagamentos, avaliações e mediação.',
				},
				{
					title: 'SaaS B2B',
					description: 'Software por assinatura para empresas, com vários clientes na mesma plataforma.',
				},
				{
					title: 'Conteúdo e cursos',
					description: 'Áreas de membros, trilhas de aprendizagem e comunidades.',
				},
				{
					title: 'Portais e intranets',
					description: 'Autoatendimento para clientes, parceiros e colaboradores.',
				},
			],
		},
		faq: [
			{
				q: 'Qual a diferença entre um site e uma plataforma web?',
				a: 'Um site apresenta informações. Uma plataforma tem usuários, dados e regras de negócio: as pessoas fazem login, compram, agendam, publicam ou gerenciam algo. É um software que roda no navegador.',
			},
			{
				q: 'A plataforma funciona no celular?',
				a: 'Sim. Todas as interfaces são responsivas, e a plataforma pode virar um web app instalável ou ganhar aplicativos que conversam com a mesma base de dados.',
			},
			{
				q: 'Vocês integram com o sistema que eu já uso?',
				a: 'Na maioria dos casos, sim. Se o seu sistema oferece API ou permite exportar dados, conseguimos integrar. Avaliamos isso logo na etapa de descoberta.',
			},
		],
	},
	{
		slug: 'sistemas-internos-e-automacao',
		title: 'Sistemas internos e automação',
		short:
			'Ferramentas sob medida para a sua operação: menos planilhas, menos retrabalho e processos que rodam sozinhos.',
		icon: 'gear',
		keywords: ['Sistemas de gestão', 'Painéis', 'Automação', 'Integrações'],
		seo: {
			title: 'Sistemas internos sob medida e automação de processos',
			description:
				'Desenvolvemos sistemas internos, painéis, CRMs sob medida e automações que eliminam tarefas manuais e conectam as ferramentas da sua empresa.',
		},
		hero: {
			title: 'Sua operação <em>no piloto automático.</em>',
			lead: 'Planilhas que ninguém entende, informações espalhadas em cinco ferramentas e tarefas repetidas todos os dias. Criamos sistemas internos e automações sob medida para a sua equipe trabalhar melhor — e crescer sem aumentar o caos.',
		},
		intro: {
			title: 'O software pronto <em>não te serve?</em>',
			paragraphs: [
				'Sistemas de prateleira nem sempre se encaixam no jeito que a sua empresa trabalha. O resultado costuma ser uma coleção de remendos: planilhas paralelas, controles manuais, informações duplicadas e decisões tomadas no escuro.',
				'Desenvolvemos ferramentas internas desenhadas para os seus processos — de um painel de indicadores a um sistema completo de gestão — e automatizamos o que hoje consome horas da sua equipe.',
			],
		},
		forWho: [
			'Empresas que dependem de planilhas para processos críticos.',
			'Times comerciais, operacionais ou de atendimento que precisam de um CRM ou fluxo sob medida.',
			'Gestores que querem indicadores confiáveis em tempo real.',
			'Negócios que usam várias ferramentas que não conversam entre si.',
		],
		deliverables: [
			{
				title: 'Mapeamento de processos',
				description: 'Entendemos como o trabalho acontece hoje e onde estão os gargalos.',
			},
			{
				title: 'Sistemas de gestão sob medida',
				description:
					'Cadastros, fluxos de aprovação, estoque, ordens de serviço, agendas — o que a sua operação precisar.',
			},
			{
				title: 'Painéis de indicadores',
				description: 'Dados consolidados e atualizados para decisões mais rápidas.',
			},
			{
				title: 'Automação de tarefas',
				description: 'Fluxos que disparam e-mails, mensagens, documentos e atualizações sem intervenção manual.',
			},
			{
				title: 'Integração entre ferramentas',
				description: 'ERPs, CRMs, planilhas, formulários, WhatsApp e e-mail trabalhando juntos.',
			},
			{
				title: 'Automações com IA',
				description:
					'Triagem de mensagens, leitura de documentos e respostas assistidas por inteligência artificial, onde isso fizer sentido.',
			},
		],
		highlights: {
			title: 'Os resultados <em>que buscamos.</em>',
			items: [
				{
					title: 'Menos retrabalho',
					description: 'Informação registrada uma vez e disponível para todos que precisam dela.',
				},
				{
					title: 'Mais controle',
					description: 'Visibilidade de ponta a ponta sobre o que acontece na operação.',
				},
				{
					title: 'Escala sem caos',
					description: 'Processos que suportam o crescimento sem multiplicar a equipe na mesma proporção.',
				},
				{
					title: 'Decisões com dados',
					description: 'Indicadores confiáveis no lugar de achismos e relatórios manuais.',
				},
			],
		},
		faq: [
			{
				q: 'Vale mais a pena um sistema sob medida ou um software pronto?',
				a: 'Depende. Se um software pronto atende bem ao seu processo, ele costuma ser a melhor escolha. O sistema sob medida faz sentido quando o processo é um diferencial do seu negócio ou quando as adaptações já custam mais do que construir algo próprio. Ajudamos você a fazer essa conta.',
			},
			{
				q: 'Quanto tempo leva para automatizar um processo?',
				a: 'Automações pontuais podem ficar prontas em poucos dias. Sistemas completos são entregues em módulos, para que a equipe comece a usar — e a ganhar tempo — o quanto antes.',
			},
			{
				q: 'Minha equipe vai conseguir usar?',
				a: 'Desenhamos as ferramentas junto com quem vai usá-las no dia a dia e acompanhamos a implantação, com treinamento e ajustes nas primeiras semanas.',
			},
		],
	},
	{
		slug: 'ux-ui-design',
		title: 'UX/UI design e discovery',
		short: 'Pesquisa, estratégia e interfaces que fazem sentido para quem usa — e para o seu negócio.',
		icon: 'pen',
		keywords: ['UX Research', 'Discovery', 'Protótipos', 'Design system'],
		seo: {
			title: 'UX/UI design, pesquisa e discovery de produto',
			description:
				'Pesquisa com usuários, discovery de produto, protótipos navegáveis e interfaces para apps e plataformas. Design que resolve problemas reais.',
		},
		hero: {
			title: 'Design que <em>resolve</em>, não só decora.',
			lead: 'Nosso time de UX Research e design transforma conversas, dados e hipóteses em produtos claros e fáceis de usar. Antes de desenvolver, testamos. Antes de desenhar, entendemos.',
		},
		intro: {
			title: 'Construir a coisa certa <em>vem primeiro.</em>',
			paragraphs: [
				'Grande parte do custo de um software vem de construir a coisa errada. Discovery e design existem para reduzir esse risco: entender o problema a fundo, testar soluções baratas primeiro e só então investir em desenvolvimento.',
				'Na Kafé, o design não é uma etapa isolada. Ele acompanha o produto do primeiro rascunho às versões seguintes, guiado por pesquisa com usuários e pelos indicadores do negócio. É o que chamamos de Design Inteligente.',
			],
		},
		forWho: [
			'Quem vai iniciar um produto e quer começar pelo caminho certo.',
			'Produtos com baixa adesão, muitas reclamações ou abandono em etapas importantes.',
			'Empresas que precisam de um protótipo convincente para vender a ideia internamente ou a investidores.',
			'Times de tecnologia que precisam de apoio especializado em produto e design.',
		],
		deliverables: [
			{
				title: 'Pesquisa com usuários',
				description: 'Entrevistas, questionários e análise de dados para entender comportamentos e necessidades.',
			},
			{
				title: 'Discovery de produto',
				description: 'Proposta de valor, personas, jornadas e priorização de funcionalidades.',
			},
			{
				title: 'Arquitetura de informação',
				description: 'Organização de conteúdos e fluxos para que tudo seja fácil de encontrar.',
			},
			{
				title: 'Wireframes e protótipos',
				description: 'Do rascunho ao protótipo navegável de alta fidelidade.',
			},
			{
				title: 'UI design e design system',
				description: 'Interfaces consistentes, acessíveis e prontas para o desenvolvimento.',
			},
			{
				title: 'Testes de usabilidade',
				description: 'Validação com usuários reais antes e depois do lançamento.',
			},
		],
		highlights: {
			title: 'Princípios do <em>nosso design.</em>',
			items: [
				{
					title: 'Clareza primeiro',
					description: 'Cada tela tem um objetivo. Se precisa de manual, ainda não está pronta.',
				},
				{
					title: 'Evidência acima de opinião',
					description: 'Decisões apoiadas em pesquisa, testes e dados de uso.',
				},
				{
					title: 'Acessível por padrão',
					description: 'Contraste, legibilidade e navegação pensados para todas as pessoas.',
				},
				{
					title: 'Feito para ser construído',
					description: 'Design pensado junto com o desenvolvimento, sem surpresas na implementação.',
				},
			],
		},
		faq: [
			{
				q: 'Posso contratar só o design?',
				a: 'Sim. Podemos conduzir apenas a etapa de discovery e design e entregar protótipos e arquivos prontos para o seu time de desenvolvimento.',
			},
			{
				q: 'O que é um protótipo navegável?',
				a: 'É uma simulação clicável do produto, com aparência e fluxos muito próximos da versão final. Serve para testar com usuários, alinhar expectativas e apresentar a ideia antes de investir no desenvolvimento.',
			},
			{
				q: 'Quanto tempo dura um discovery?',
				a: 'Normalmente de uma a algumas semanas, conforme a complexidade do produto e a quantidade de pesquisa necessária.',
			},
		],
	},
];

export const getService = (slug: string) => services.find((service) => service.slug === slug);
