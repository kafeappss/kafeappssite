// @ts-check
import { readdirSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// A página /cases só entra no sitemap quando existe pelo menos um case publicado
// (arquivos que começam com "_" são modelos e não são publicados).
const hasCases = readdirSync(new URL('./src/content/cases', import.meta.url)).some(
	(file) => file.endsWith('.md') && !file.startsWith('_'),
);

export default defineConfig({
	site: 'https://kafeapps.com.br',
	trailingSlash: 'ignore',
	prefetch: {
		prefetchAll: true,
		defaultStrategy: 'hover',
	},
	integrations: [
		sitemap({
			filter: (page) => !page.includes('/404') && (hasCases || !page.includes('/cases')),
		}),
	],
});
