import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
	new Response(
		`User-agent: *
Allow: /

# Índice de conteúdo para sistemas de IA: ${new URL('llms.txt', site).href}
Sitemap: ${new URL('sitemap-index.xml', site).href}
`,
		{
			headers: { 'Content-Type': 'text/plain; charset=utf-8' },
		},
	);
