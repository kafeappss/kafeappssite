/**
 * Indica se existe algum case publicado (arquivos que começam com "_" são modelos).
 * Usado para mostrar ou esconder "Cases" no menu sem acionar o carregamento da coleção.
 */
const files = import.meta.glob('../content/cases/[^_]*.md');

export const hasCases = Object.keys(files).length > 0;
