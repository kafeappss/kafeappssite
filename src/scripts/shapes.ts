/**
 * Formas que o metal líquido assume.
 *
 * Cada forma é uma lista ordenada de primitivas (retângulos arredondados,
 * círculos, cápsulas e anéis) combinadas em sequência: as de `op = 1` se
 * fundem ao líquido e as de `op = -1` abrem buracos no que veio antes.
 * Coordenadas locais vão de -1 a 1; a posição na tela é definida pelo
 * `place` (ex.: "stage" = coluna da direita, ao lado do texto).
 */

/** [x, y, meia-largura, meia-altura, raio do canto, rotação (rad), espessura do contorno, operação] */
export type Prim = [x: number, y: number, w: number, h: number, r: number, rot: number, shell: number, op: number];

export type Placement = 'view' | 'stage' | 'bottom' | 'center';

export type ShapeDef = {
	prims: Prim[];
	place?: Placement;
	/** Suavidade da fusão entre peças (maior = mais "gotoso"). */
	k?: number;
	/** Largura do chanfro que dá volume ao metal. */
	bevel?: number;
	/** Ondulação da superfície. */
	wob?: number;
	/** Amplitude da deriva de cada peça. */
	drift?: number;
	/** Intensidade do líquido (menor = mais discreto atrás do conteúdo). */
	dim?: number;
	/** Quanto a rolagem "sacode" o líquido. */
	inertia?: number;
	/** Peças são atraídas pelo cursor. */
	magnet?: boolean;
	/** Brilho de cromo polido (0 = líquido escuro, 1 = cromo). */
	chrome?: number;
	/** Mostra os olhos do mascote na primeira peça. */
	eyes?: boolean;
	/** Ajusta as peças a cada quadro (t em segundos). */
	anim?: (t: number, prims: Prim[]) => void;
};

const DEG = Math.PI / 180;

const circle = (x: number, y: number, r: number): Prim => [x, y, r, r, r, 0, 0, 1];
const box = (x: number, y: number, w: number, h: number, r = 0.03, rotDeg = 0): Prim => [x, y, w, h, r, rotDeg * DEG, 0, 1];
const ring = (x: number, y: number, radius: number, thickness: number): Prim => [x, y, radius, radius, radius, 0, thickness, 1];
const outline = (x: number, y: number, w: number, h: number, r: number, thickness: number): Prim => [x, y, w, h, r, 0, thickness, 1];
const hole = (prim: Prim): Prim => {
	const copy = [...prim] as Prim;
	copy[7] = -1;
	return copy;
};
const capsule = (x1: number, y1: number, x2: number, y2: number, t: number): Prim => [
	(x1 + x2) / 2,
	(y1 + y2) / 2,
	Math.hypot(x2 - x1, y2 - y1) / 2,
	t,
	t,
	Math.atan2(y2 - y1, x2 - x1),
	0,
	1,
];

/** Cápsula que gira em torno de (cx, cy), com comprimento `length`. */
const hand = (prim: Prim, cx: number, cy: number, angle: number, length: number) => {
	prim[0] = cx + (Math.cos(angle) * length) / 2;
	prim[1] = cy + (Math.sin(angle) * length) / 2;
	prim[2] = length / 2;
	prim[5] = angle;
};

const T = 0.1;
const brackets = (): Prim[] => [
	capsule(-0.95, 0, -0.5, 0.38, T),
	capsule(-0.95, 0, -0.5, -0.38, T),
	capsule(0.95, 0, 0.5, 0.38, T),
	capsule(0.95, 0, 0.5, -0.38, T),
];

/** Estrela de 4 pontas (o símbolo de IA): um quadrado com os cantos "comidos". */
const sparkle = (x: number, y: number, size: number): Prim[] => [
	box(x, y, size, size, 0.02),
	hole(circle(x + size, y + size, size * 0.92)),
	hole(circle(x - size, y + size, size * 0.92)),
	hole(circle(x + size, y - size, size * 0.92)),
	hole(circle(x - size, y - size, size * 0.92)),
];

/** Gira e escala um grupo de peças em torno de (cx, cy). */
const transform = (prims: Prim[], from: number, to: number, cx: number, cy: number, angle: number, scale = 1) => {
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	for (let i = from; i < to; i++) {
		const p = prims[i];
		const dx = (p[0] - cx) * scale;
		const dy = (p[1] - cy) * scale;
		p[0] = cx + dx * c - dy * s;
		p[1] = cy + dx * s + dy * c;
		p[2] *= scale;
		p[3] *= scale;
		p[4] *= scale;
		p[5] += angle;
	}
};

/* -------------------------------------------------------------------------
   K da marca (a partir do desenho oficial, numa caixa de 530 × 530)
   ------------------------------------------------------------------------- */
const KS = 1.5 / 530;
const kx = (x: number) => (x - 265) * KS;
const ky = (y: number) => (265 - y) * KS;

/**
 * Retângulo que parte da quina (px, py) do desenho, segue `along` px na direção
 * `angleDeg` (y para cima) e ocupa `across` px para a esquerda (+) ou direita (-).
 */
const kRect = (px: number, py: number, angleDeg: number, along: number, across: number): Prim => {
	const a = angleDeg * DEG;
	const dx = Math.cos(a);
	const dy = Math.sin(a);
	const side = Math.sign(across);
	const nx = -dy * side;
	const ny = dx * side;
	const half = Math.abs(across) / 2;
	return [
		kx(px) + (dx * along * 0.5 + nx * half) * KS,
		ky(py) + (dy * along * 0.5 + ny * half) * KS,
		along * 0.5 * KS,
		half * KS,
		0.01,
		a,
		0,
		1,
	];
};

/**
 * O K é montado em ordem: um bloco à direita, de onde saem os dois vãos e o
 * entalhe em V, e por fim a haste (que se sobrepõe ao bloco, sem emendas).
 */
const kShape = (): Prim[] => [
	box(kx(340), 0, 190 * KS, 0.75, 0.012),
	hole(kRect(255, 165, 74.1, 292, 150)),
	hole(kRect(265, 403, -73.8, 252, -150)),
	hole(box(kx(585.6), ky(265), 110 * KS, 110 * KS, 0.01, 45)),
	box(kx(113.5), 0, 113.5 * KS, 0.75, 0.012),
];

/* -------------------------------------------------------------------------
   Formações
   ------------------------------------------------------------------------- */

const organic = { k: 0.2, bevel: 0.15, wob: 0.011, drift: 1, inertia: 1, magnet: true, chrome: 0 } as const;
const crisp = { k: 0.035, bevel: 0.06, wob: 0.003, drift: 0.25, inertia: 0.35, magnet: false, chrome: 1 } as const;

const cycle = (active: number): ShapeDef => ({
	...crisp,
	k: 0.012,
	prims: [
		ring(0, 0, 0.68, 0.045),
		...[90, 0, -90, 180].map((deg, i) =>
			circle(Math.cos(deg * DEG) * 0.68, Math.sin(deg * DEG) * 0.68, i + 1 === active ? 0.24 : 0.13),
		),
		circle(0, 0.68, 0.075),
	],
	anim: (t, p) => {
		const angle = Math.PI / 2 - t * 0.9;
		p[5][0] = Math.cos(angle) * 0.68;
		p[5][1] = Math.sin(angle) * 0.68;
		if (active) {
			const node = p[active];
			const pulse = 1 + Math.sin(t * 3) * 0.06;
			node[2] *= pulse;
			node[3] *= pulse;
			node[4] *= pulse;
		}
	},
});

export const shapes = {
	/* --- Mascote: o próprio líquido ganha olhos ------------------------- */
	// Uma forma só, desenhada em traço (os pezinhos entram pelo motor quando ele bate o pé).
	mascot: {
		...organic,
		eyes: true,
		prims: [circle(0, 0, 0.82)],
		anim: (t, p) => {
			const body = p[0];
			body[1] += Math.sin(t * 1.3) * 0.04;
			const breathe = Math.sin(t * 2.1) * 0.025;
			body[2] *= 1 + breathe;
			body[3] *= 1 - breathe;
		},
	},

	/* --- Conceitos ------------------------------------------------------- */
	clock: {
		...crisp,
		k: 0.015,
		prims: [
			ring(0, 0, 0.78, 0.085),
			circle(0, 0, 0.09),
			capsule(0, 0, 0, 0.52, 0.045),
			capsule(0, 0, 0.32, 0, 0.06),
			box(0, 0.55, 0.04, 0.08, 0.03),
			box(0.55, 0, 0.08, 0.04, 0.03),
			box(0, -0.55, 0.04, 0.08, 0.03),
			box(-0.55, 0, 0.08, 0.04, 0.03),
		],
		anim: (t, p) => {
			hand(p[2], 0, 0, Math.PI / 2 - t * 1.6, 0.54);
			hand(p[3], 0, 0, Math.PI / 2 - t * 0.14 - 1.2, 0.34);
		},
	},
	bars: {
		...crisp,
		prims: [
			box(0, -0.7, 0.86, 0.04, 0.04),
			box(-0.5, -0.5, 0.17, 0.18, 0.05),
			box(0, -0.34, 0.17, 0.34, 0.05),
			box(0.5, -0.12, 0.17, 0.56, 0.05),
			circle(0.5, 0.64, 0.1),
		],
		anim: (t, p) => {
			for (let i = 1; i <= 3; i++) {
				const grow = 1 + Math.sin(t * 1.6 + i) * 0.05;
				const h = p[i][3] * grow;
				p[i][1] = -0.68 + h;
				p[i][3] = h;
			}
			p[4][1] = p[3][1] + p[3][3] + 0.2 + Math.sin(t * 2.4) * 0.05;
		},
	},
	code: {
		...crisp,
		prims: [...brackets(), capsule(-0.18, -0.5, 0.18, 0.5, T)],
	},
	'code-ai': {
		...crisp,
		prims: [...sparkle(0, 0, 0.34), ...brackets()],
		anim: (t, p) => transform(p, 0, 5, 0, 0, Math.sin(t * 1.2) * 0.25, 1 + Math.sin(t * 2.2) * 0.05),
	},
	ai: {
		...crisp,
		k: 0.05,
		prims: [...sparkle(0, 0, 0.62), circle(0.8, 0.74, 0.1), circle(1.02, 0.42, 0.055)],
		anim: (t, p) => {
			transform(p, 0, 5, 0, 0, Math.sin(t * 0.9) * 0.2, 1 + Math.sin(t * 1.8) * 0.04);
			const twinkle = 1 + Math.sin(t * 3.2) * 0.25;
			p[5][2] *= twinkle;
			p[5][3] *= twinkle;
			p[5][4] *= twinkle;
		},
	},
	phone: {
		...crisp,
		k: 0.02,
		prims: [
			outline(0, 0, 0.44, 0.82, 0.14, 0.08),
			box(0, 0.64, 0.11, 0.035, 0.035),
			box(0, 0.3, 0.27, 0.17, 0.05),
			box(0, -0.06, 0.27, 0.05, 0.05),
			box(-0.07, -0.22, 0.2, 0.05, 0.05),
			box(0, -0.64, 0.12, 0.03, 0.03),
		],
	},
	browser: {
		...crisp,
		k: 0.02,
		prims: [
			outline(0, 0, 0.92, 0.64, 0.08, 0.075),
			box(0, 0.34, 0.92, 0.035, 0.03),
			circle(-0.76, 0.49, 0.05),
			circle(-0.62, 0.49, 0.05),
			circle(-0.48, 0.49, 0.05),
			box(-0.6, -0.13, 0.18, 0.33, 0.04),
			box(0.22, 0.12, 0.5, 0.09, 0.04),
			box(0.22, -0.14, 0.5, 0.09, 0.04),
			box(0.08, -0.38, 0.36, 0.06, 0.04),
		],
	},
	rocket: {
		...crisp,
		k: 0.06,
		prims: [
			box(0, 0.1, 0.24, 0.6, 0.24),
			box(0, 0.6, 0.13, 0.22, 0.13),
			box(-0.3, -0.36, 0.08, 0.22, 0.06, -25),
			box(0.3, -0.36, 0.08, 0.22, 0.06, 25),
			hole(circle(0, 0.24, 0.1)),
			circle(0, -0.72, 0.1),
			circle(0, -0.93, 0.06),
		],
		anim: (t, p) => {
			const bob = Math.sin(t * 2.2) * 0.04;
			for (const prim of p) prim[1] += bob;
			const flicker = 1 + Math.sin(t * 13) * 0.18;
			for (const i of [5, 6]) {
				p[i][2] *= flicker;
				p[i][3] *= flicker;
				p[i][4] *= flicker;
			}
		},
	},
	nodes: {
		...crisp,
		k: 0.05,
		prims: [
			circle(0, 0, 0.2),
			circle(0.66, 0.5, 0.13),
			circle(-0.66, 0.5, 0.13),
			circle(0.66, -0.5, 0.13),
			circle(-0.66, -0.5, 0.13),
			capsule(0, 0, 0.66, 0.5, 0.055),
			capsule(0, 0, -0.66, 0.5, 0.055),
			capsule(0, 0, 0.66, -0.5, 0.055),
			capsule(0, 0, -0.66, -0.5, 0.055),
		],
		anim: (t, p) => {
			for (let i = 1; i <= 4; i++) {
				const pulse = 1 + Math.max(0, Math.sin(t * 2.4 - i * 1.4)) * 0.35;
				p[i][2] *= pulse;
				p[i][3] *= pulse;
				p[i][4] *= pulse;
			}
		},
	},
	layout: {
		...crisp,
		k: 0.02,
		prims: [
			outline(0, 0, 0.86, 0.62, 0.06, 0.07),
			box(0, 0.42, 0.72, 0.06, 0.04),
			box(-0.56, -0.12, 0.16, 0.36, 0.04),
			box(0.2, 0.14, 0.44, 0.14, 0.04),
			box(0.2, -0.3, 0.44, 0.14, 0.04),
		],
		anim: (t, p) => {
			p[3][2] = 0.44 * (0.8 + 0.2 * Math.sin(t * 1.4));
			p[3][0] = 0.2 - (0.44 - p[3][2]);
		},
	},
	'cycle-0': cycle(0),
	'cycle-1': cycle(1),
	'cycle-2': cycle(2),
	'cycle-3': cycle(3),
	'cycle-4': cycle(4),
	k: {
		...crisp,
		k: 0.006,
		bevel: 0.07,
		prims: kShape(),
	},
	cup: {
		...crisp,
		k: 0.05,
		prims: [
			box(0, -0.08, 0.48, 0.44, 0.16),
			box(0, 0.33, 0.52, 0.06, 0.06),
			ring(0.56, -0.02, 0.2, 0.08),
			box(0, -0.62, 0.8, 0.06, 0.06),
			circle(-0.22, 0.5, 0.07),
			circle(0, 0.5, 0.07),
			circle(0.22, 0.5, 0.07),
		],
		anim: (t, p) => {
			for (let i = 0; i < 3; i++) {
				const phase = (t * 0.32 + i / 3) % 1;
				const steam = p[4 + i];
				steam[0] = (i - 1) * 0.22 + Math.sin(phase * 7 + i * 2) * 0.05;
				steam[1] = 0.48 + phase * 0.62;
				const r = 0.085 * Math.sin(phase * Math.PI);
				steam[2] = steam[3] = steam[4] = r;
			}
		},
	},

	/* --- Formações livres (coordenadas da tela) -------------------------- */
	pool: {
		...organic,
		place: 'view',
		prims: [
			circle(0, -1.08, 0.42),
			circle(-0.44, -0.98, 0.3),
			circle(0.44, -1, 0.32),
			circle(-0.84, -1.02, 0.25),
			circle(0.84, -0.97, 0.24),
			circle(0.12, -0.58, 0.085),
			circle(-0.24, -0.5, 0.055),
			circle(0.33, -0.42, 0.045),
			circle(-0.58, -0.66, 0.065),
		],
	},
	rest: {
		...organic,
		place: 'view',
		dim: 0.38,
		prims: [
			circle(1.1, 0.8, 0.26),
			circle(1.08, -0.72, 0.2),
			circle(-1.1, -0.9, 0.16),
			circle(0.96, 0.98, 0.08),
			circle(1.2, 0.1, 0.1),
			circle(-1.25, 0.6, 0.1),
			circle(1.3, -0.2, 0.1),
			circle(-1.3, -0.3, 0.1),
			circle(0.9, -0.98, 0.06),
		],
	},
	page: {
		...organic,
		place: 'view',
		dim: 0.85,
		prims: [
			circle(0.84, 0.74, 0.32),
			circle(1.04, 0.3, 0.22),
			circle(0.6, 0.96, 0.18),
			circle(0.68, 0.36, 0.085),
			circle(0.96, -0.1, 0.07),
			circle(1.2, -0.5, 0.12),
			circle(1.25, 0.95, 0.12),
			circle(0.45, 0.7, 0.05),
			circle(1.15, -0.85, 0.1),
		],
	},
} satisfies Record<string, ShapeDef>;

export type ShapeName = keyof typeof shapes;
