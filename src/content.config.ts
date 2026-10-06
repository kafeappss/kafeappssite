import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Arquivos que começam com "_" são modelos e não são publicados.
const published = '**/[^_]*.md';

const blog = defineCollection({
	loader: glob({ pattern: published, base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		date: z.coerce.date(),
		updated: z.coerce.date().optional(),
		author: z.string().default('Equipe Kafé Apps'),
		tags: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
	}),
});

const cases = defineCollection({
	loader: glob({ pattern: published, base: './src/content/cases' }),
	schema: z.object({
		title: z.string(),
		client: z.string(),
		segment: z.string(),
		summary: z.string(),
		services: z.array(z.string()).default([]),
		year: z.number().optional(),
		/** Caminho de uma imagem em /public (ex.: '/cases/nome-do-case.jpg'). */
		cover: z.string().optional(),
		results: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
		order: z.number().default(0),
		draft: z.boolean().default(false),
	}),
});

export const collections = { blog, cases };
