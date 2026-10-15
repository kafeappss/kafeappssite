/**
 * O que ilustra cada seção quando o mascote está desligado (site.mascot = false):
 * - no tema claro, uma imagem conceitual animada (src/components/Art.astro);
 * - no tema escuro, uma tela de produto (src/components/Figure.astro).
 * A chave é a forma que o líquido teria naquela seção.
 */
export type ArtKind = 'fios' | 'tempo' | 'raios' | 'globo' | 'rede' | 'esfera' | 'ciclo' | 'onda';

export const artForShape: Record<string, ArtKind> = {
	clock: 'tempo',
	bars: 'raios',
	code: 'rede',
	'code-ai': 'esfera',
	'cycle-0': 'ciclo',
	k: 'globo',
	cup: 'raios',
	phone: 'onda',
	browser: 'ciclo',
	ai: 'esfera',
	rocket: 'raios',
	nodes: 'rede',
	layout: 'onda',
};

export type FigureName =
	| 'prazo'
	| 'metricas'
	| 'codigo'
	| 'agente'
	| 'sprint'
	| 'entregas'
	| 'orcamento'
	| 'app'
	| 'automacao'
	| 'design';

export const figureForShape: Record<string, FigureName> = {
	clock: 'prazo',
	bars: 'metricas',
	code: 'codigo',
	'code-ai': 'agente',
	'cycle-0': 'sprint',
	k: 'entregas',
	cup: 'orcamento',
	phone: 'app',
	browser: 'metricas',
	ai: 'agente',
	rocket: 'prazo',
	nodes: 'automacao',
	layout: 'design',
};
