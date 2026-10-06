/**
 * Gilroy é uma fonte paga: o site não a distribui. Quando os arquivos
 * licenciados são colocados em public/fonts/gilroy/, este módulo (que roda só
 * durante o build) gera as regras @font-face correspondentes.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const FOLDER = join(process.cwd(), 'public', 'fonts', 'gilroy');

// A ordem importa: "ExtraBold" e "SemiBold" precisam ser testados antes de "Bold".
const WEIGHTS: [RegExp, number][] = [
	[/thin|hairline/i, 100],
	[/(ultra|extra)light/i, 200],
	[/light/i, 300],
	[/medium/i, 500],
	[/semibold/i, 600],
	[/extrabold/i, 800],
	[/black/i, 900],
	[/heavy/i, 950],
	[/bold/i, 700],
];

const FORMATS: Record<string, string> = {
	woff2: 'woff2',
	woff: 'woff',
	otf: 'opentype',
	ttf: 'truetype',
};

type Face = { weight: number; style: 'normal' | 'italic'; sources: { url: string; format: string }[] };

function readFaces(): Face[] {
	let files: string[] = [];
	try {
		files = readdirSync(FOLDER);
	} catch {
		return [];
	}

	const faces = new Map<string, Face>();
	for (const file of files) {
		const extension = file.split('.').pop()?.toLowerCase() ?? '';
		if (!(extension in FORMATS)) continue;
		const weight = WEIGHTS.find(([pattern]) => pattern.test(file))?.[1] ?? 400;
		const style = /italic/i.test(file) ? 'italic' : 'normal';
		const key = `${weight}-${style}`;
		const face = faces.get(key) ?? { weight, style, sources: [] };
		face.sources.push({ url: `/fonts/gilroy/${encodeURIComponent(file)}`, format: FORMATS[extension] });
		faces.set(key, face);
	}

	const order = Object.values(FORMATS);
	return [...faces.values()]
		.map((face) => ({ ...face, sources: face.sources.sort((a, b) => order.indexOf(a.format) - order.indexOf(b.format)) }))
		.sort((a, b) => a.weight - b.weight);
}

const faces = readFaces();

export const gilroyCss = faces
	.map(
		(face) =>
			`@font-face{font-family:'Gilroy';font-style:${face.style};font-weight:${face.weight};font-display:swap;src:${face.sources
				.map((source) => `url('${source.url}') format('${source.format}')`)
				.join(',')}}`,
	)
	.join('');

/** Arquivo do peso usado nas manchetes, para pré-carregar. */
export const gilroyPreload = faces
	.find((face) => face.weight === 700 && face.style === 'normal')
	?.sources.find((source) => source.format === 'woff2')?.url;
