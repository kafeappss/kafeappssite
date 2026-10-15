/**
 * Telas de produto que ilustram as seções quando o mascote está desligado
 * (site.mascot = false). Cada forma do líquido ganha a tela equivalente.
 */
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
