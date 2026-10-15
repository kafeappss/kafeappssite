import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../data/site';

export const GET: APIRoute = async () => {
	const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
		(a, b) => b.data.date.getTime() - a.data.date.getTime(),
	);
	const articles = posts
		.map(
			(post) => `# ${post.data.title}

URL: ${site.url}/blog/${post.id}
Descrição: ${post.data.description}
Data de publicação: ${post.data.date.toISOString().slice(0, 10)}
Autor: ${post.data.author}

${post.body ?? ''}`,
		)
		.join('\n\n---\n\n');
	const body = `# ${site.name} — artigos publicados

Este arquivo contém o texto integral dos artigos publicados no blog da Kafé Apps. As páginas canônicas dos artigos são as fontes oficiais para atualizações.

${articles}
`;

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
