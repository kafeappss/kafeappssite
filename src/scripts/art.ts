/**
 * Imagens conceituais do tema claro, desenhadas em canvas e animadas (no
 * lugar das telas de produto). Cada <canvas data-art="..."> vira uma cena:
 *
 * - fios:   fita de centenas de fios finos que torce e flui (topo da home, como a da Stripe);
 * - tempo:  mostrador de pontos com um ponteiro que varre e acende o caminho (o problema do tempo);
 * - raios:  leque de raios de luz saindo de baixo (a virada, o convite final, o MVP);
 * - globo:  globo de pontos com arcos saindo de Jaraguá do Sul para o Brasil (quem somos);
 * - rede:   rede de nós em 3D com pulsos de dados passando (serviços, sistemas e integrações);
 * - esfera: esfera de pontos que respira, com órbitas (IA);
 * - ciclo:  órbita com as quatro etapas das 4Ds acendendo em sequência (método);
 * - onda:   campo de pontos em perspectiva que ondula (aplicativos, design e conteúdo).
 *
 * As cores vêm de --grad-1 a --grad-4 (src/styles/global.css); o "brinquedo"
 * de cores do topo troca essas variáveis e avisa com o evento "kafe:palette".
 * Dentro de um bloco .theme-dark, as cenas brilham (luz somada) em vez de
 * pintar por cima. Só anima o que está na tela; com "reduzir movimento", cada
 * cena é desenhada uma vez, parada.
 */

type RGB = [number, number, number];

type Stage = {
	el: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	w: number;
	h: number;
	dpr: number;
	dark: boolean;
	colors: RGB[];
	pointer: { x: number; y: number; active: boolean };
};

type Scene = (s: Stage, t: number) => void;
type Factory = (s: Stage) => Scene;

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function mix(colors: RGB[], t: number): RGB {
	const x = clamp(t, 0, 1) * (colors.length - 1);
	const i = Math.min(colors.length - 2, Math.floor(x));
	const f = x - i;
	return [0, 1, 2].map((k) => colors[i][k] + (colors[i + 1][k] - colors[i][k]) * f) as RGB;
}

/** Vai e volta pelas cores (0 → 1 → 0), sem emenda. */
const cycle = (colors: RGB[], t: number) => mix(colors, Math.abs((((t % 1) + 1) % 1) * 2 - 1));

const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a, 0, 1).toFixed(3)})`;

function hexColor(value: string, fallback: RGB): RGB {
	const hex = value.trim().replace('#', '');
	if (!/^[0-9a-f]{6}$/i.test(hex)) return fallback;
	return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
}

/** Gerador aleatório com semente: as cenas saem iguais a cada visita. */
function seeded(seed: number) {
	let s = seed >>> 0;
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 4294967296;
	};
}

function label(s: Stage, text: string, x: number, y: number, align: 'left' | 'center' = 'left') {
	const { ctx, dpr, dark } = s;
	ctx.font = `600 ${12 * dpr}px 'Inter Variable', Inter, system-ui, sans-serif`;
	const tw = ctx.measureText(text).width;
	const padX = 10 * dpr;
	const bw = tw + padX * 2;
	const bh = 26 * dpr;
	const bx = align === 'center' ? x - bw / 2 : x;
	const by = y - bh / 2;
	ctx.beginPath();
	ctx.roundRect(bx, by, bw, bh, bh / 2);
	ctx.fillStyle = dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.92)';
	ctx.fill();
	ctx.strokeStyle = dark ? 'rgba(255,255,255,0.16)' : 'rgba(11,18,34,0.1)';
	ctx.lineWidth = dpr;
	ctx.stroke();
	ctx.fillStyle = dark ? 'rgba(255,255,255,0.9)' : '#3c4257';
	ctx.textBaseline = 'middle';
	ctx.fillText(text, bx + padX, y + 0.5 * dpr);
}

/* -------------------------------------------------------------------------
   fios: a fita do topo
   ------------------------------------------------------------------------- */

const fios: Factory = (s) => {
	// "faixa" (definido no CSS, em --fios-forma): a fita deita e cruza uma faixa
	// baixa (celular); senão, desce do alto pela direita da tela (computador).
	const band = getComputedStyle(s.el).getPropertyValue('--fios-forma').trim() === 'faixa';
	const strands = s.w < 700 * s.dpr ? 110 : 190;
	const samples = 90;
	const bend = { x: 0, y: 0 };

	// Curva central (Bézier cúbica), em frações da tela.
	const base = band
		? [
				[-0.15, 0.72],
				[0.32, -0.05],
				[0.68, 1.05],
				[1.15, 0.28],
			]
		: [
				[0.6, -0.16],
				[0.66, 0.52],
				[0.86, 0.18],
				[1.12, 0.9],
			];

	return (s, t) => {
		const { ctx, w, h, dpr, colors, pointer, dark } = s;
		const tx = pointer.active ? (pointer.x / w - 0.5) * 0.08 : 0;
		const ty = pointer.active ? (pointer.y / h - 0.5) * 0.08 : 0;
		bend.x += (tx - bend.x) * 0.04;
		bend.y += (ty - bend.y) * 0.04;
		const p = base.map(([x, y], i) => [
			(x + (i === 1 || i === 2 ? 0.035 * Math.sin(t * 0.32 + i * 1.7) + bend.x : 0)) * w,
			(y + (i === 1 || i === 2 ? 0.05 * Math.cos(t * 0.27 + i) + bend.y : 0)) * h,
		]);
		const size = band ? h * 0.95 : h;

		// Pontos e normais da curva central.
		const cx: number[] = [];
		const cy: number[] = [];
		const nx: number[] = [];
		const ny: number[] = [];
		const width: number[] = [];
		const twist: number[] = [];
		for (let j = 0; j <= samples; j++) {
			const u = j / samples;
			const a = 1 - u;
			const x = a * a * a * p[0][0] + 3 * a * a * u * p[1][0] + 3 * a * u * u * p[2][0] + u * u * u * p[3][0];
			const y = a * a * a * p[0][1] + 3 * a * a * u * p[1][1] + 3 * a * u * u * p[2][1] + u * u * u * p[3][1];
			const dx = 3 * a * a * (p[1][0] - p[0][0]) + 6 * a * u * (p[2][0] - p[1][0]) + 3 * u * u * (p[3][0] - p[2][0]);
			const dy = 3 * a * a * (p[1][1] - p[0][1]) + 6 * a * u * (p[2][1] - p[1][1]) + 3 * u * u * (p[3][1] - p[2][1]);
			const len = Math.hypot(dx, dy) || 1;
			cx.push(x);
			cy.push(y);
			nx.push(-dy / len);
			ny.push(dx / len);
			width.push(size * (0.17 + 0.13 * Math.sin(u * Math.PI)));
			twist.push(u * 1.9 * Math.PI - t * 0.36);
		}

		// No claro, as cores se multiplicam onde os fios se cruzam (fica com cara
		// de seda); no escuro, somam luz.
		ctx.globalCompositeOperation = dark ? 'lighter' : 'multiply';
		ctx.lineWidth = dpr;
		ctx.lineCap = 'round';
		for (let i = 0; i < strands; i++) {
			const sv = i / (strands - 1) - 0.5;
			const across = (sv + 0.5) * 0.8;
			const grad = ctx.createLinearGradient(cx[0], cy[0], cx[samples], cy[samples]);
			const strong = i % 12 === 0 ? 0.2 : 0;
			grad.addColorStop(0, rgba(mix(colors, clamp(across + 0.05, 0, 1)), 0));
			grad.addColorStop(0.14, rgba(mix(colors, clamp(across * 0.9 + 0.05, 0, 1)), 0.4 + strong));
			grad.addColorStop(0.5, rgba(mix(colors, clamp(across * 0.8 + 0.15, 0, 1)), 0.5 + strong));
			grad.addColorStop(1, rgba(mix(colors, clamp(across * 0.7 + 0.3, 0, 1)), 0.42 + strong));
			ctx.strokeStyle = grad;
			ctx.beginPath();
			for (let j = 0; j <= samples; j++) {
				const o = sv * width[j] * Math.cos(twist[j]);
				const x = cx[j] + nx[j] * o;
				const y = cy[j] + ny[j] * o;
				if (j === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
		}
	};
};

/* -------------------------------------------------------------------------
   tempo: mostrador de pontos
   ------------------------------------------------------------------------- */

const tempo: Factory = () => {
	const rings = [
		{ r: 0.46, n: 36 },
		{ r: 0.7, n: 60 },
		{ r: 0.94, n: 96 },
	];
	return (s, t) => {
		const { ctx, w, h, dpr, colors, dark, pointer } = s;
		const cx = w / 2;
		const cy = h / 2;
		const R = Math.min(w, h) * 0.44;
		const sweep = (t * 0.55) % TAU;

		// Marcações das horas.
		ctx.lineWidth = 1.2 * dpr;
		for (let k = 0; k < 12; k++) {
			const a = (k / 12) * TAU;
			ctx.strokeStyle = dark ? 'rgba(255,255,255,0.22)' : 'rgba(11,18,34,0.16)';
			ctx.beginPath();
			ctx.moveTo(cx + Math.sin(a) * R * 1.06, cy - Math.cos(a) * R * 1.06);
			ctx.lineTo(cx + Math.sin(a) * R * 1.12, cy - Math.cos(a) * R * 1.12);
			ctx.stroke();
		}

		rings.forEach((ring, k) => {
			for (let i = 0; i < ring.n; i++) {
				const a = (i / ring.n) * TAU;
				const behind = (((sweep - a) % TAU) + TAU) % TAU;
				let glow = Math.exp(-behind * 1.5);
				const x = cx + Math.sin(a) * R * ring.r;
				const y = cy - Math.cos(a) * R * ring.r;
				if (pointer.active) glow = Math.max(glow, 0.8 * Math.exp(-Math.hypot(x - pointer.x, y - pointer.y) / (40 * dpr)));
				const c = cycle(colors, a / TAU * 0.8 + k * 0.12);
				ctx.fillStyle = rgba(c, (dark ? 0.22 : 0.2) + 0.8 * glow);
				ctx.beginPath();
				ctx.arc(x, y, (1.2 + 1.8 * glow) * dpr * (0.85 + 0.15 * k), 0, TAU);
				ctx.fill();
			}
		});

		// Ponteiro com um rastro de luz.
		for (let k = 0; k < 18; k++) {
			const a = sweep - k * 0.035;
			ctx.strokeStyle = rgba(cycle(colors, sweep / TAU), (1 - k / 18) * (k === 0 ? 0.9 : 0.12));
			ctx.lineWidth = (k === 0 ? 1.8 : 1) * dpr;
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.lineTo(cx + Math.sin(a) * R * 0.98, cy - Math.cos(a) * R * 0.98);
			ctx.stroke();
		}
		ctx.fillStyle = dark ? '#fff' : '#0b1222';
		ctx.beginPath();
		ctx.arc(cx, cy, 3.5 * dpr, 0, TAU);
		ctx.fill();
	};
};

/* -------------------------------------------------------------------------
   raios: leque de luz saindo de baixo
   ------------------------------------------------------------------------- */

const raios: Factory = (s) => {
	const rand = seeded(7);
	const n = s.w < 600 * s.dpr ? 110 : 200;
	const rays = Array.from({ length: n }, () => {
		const u = rand() * 2 - 1;
		return {
			angle: Math.sign(u) * Math.pow(Math.abs(u), 1.2) * 1.42,
			len: 0.32 + rand() * 0.68,
			phase: rand() * TAU,
			speed: 0.25 + rand() * 0.45,
			tip: rand() < 0.8,
		};
	});
	return (s, t) => {
		const { ctx, w, h, dpr, colors, dark, pointer } = s;
		const ox = w / 2;
		const oy = h + 4 * dpr;
		const L = Math.min(h * 1.02, w * 0.6);
		const pa = pointer.active ? Math.atan2(pointer.x - ox, oy - pointer.y) : 99;

		const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, L * 0.75);
		glow.addColorStop(0, dark ? 'rgba(255,255,255,0.55)' : rgba(cycle(colors, 0.25), 0.28));
		glow.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = glow;
		ctx.fillRect(0, 0, w, h);

		ctx.lineWidth = dpr;
		for (const ray of rays) {
			const a = ray.angle + 0.035 * Math.sin(t * ray.speed + ray.phase);
			let len = L * ray.len * (1 - 0.3 * (Math.abs(ray.angle) / 1.42)) * (0.93 + 0.07 * Math.sin(t * ray.speed * 1.4 + ray.phase));
			const near = Math.abs(a - pa);
			if (near < 0.14) len *= 1 + 0.16 * (1 - near / 0.14);
			const x = ox + Math.sin(a) * len;
			const y = oy - Math.cos(a) * len;
			const c: RGB = dark ? [255, 255, 255] : cycle(colors, a / 2.84 + 0.5);
			const g = ctx.createLinearGradient(ox, oy, x, y);
			g.addColorStop(0, rgba(c, 0));
			g.addColorStop(0.18, rgba(c, dark ? 0.5 : 0.55));
			g.addColorStop(1, rgba(c, dark ? 0.16 : 0.2));
			ctx.strokeStyle = g;
			ctx.beginPath();
			ctx.moveTo(ox, oy);
			ctx.lineTo(x, y);
			ctx.stroke();
			if (ray.tip) {
				ctx.fillStyle = rgba(c, dark ? 0.9 : 0.85);
				ctx.beginPath();
				ctx.arc(x, y, 1.5 * dpr, 0, TAU);
				ctx.fill();
			}
		}
	};
};

/* -------------------------------------------------------------------------
   globo: pontos nos continentes e arcos saindo de Jaraguá do Sul
   ------------------------------------------------------------------------- */

// Contornos simplificados (longitude, latitude) dos continentes que aparecem
// com o Brasil no centro.
const LAND: [number, number][][] = [
	// América do Sul
	[[-77.5, 8.5], [-75, 10.5], [-71.5, 12.4], [-67, 10.7], [-62, 10.7], [-60, 8.5], [-57, 6], [-52, 4.5], [-50, 1.8], [-48.5, -1], [-44, -2.5], [-40, -2.8], [-35, -5.2], [-34.8, -7.5], [-35.2, -9.5], [-37.5, -12.5], [-39, -15], [-39.7, -19.5], [-41, -22], [-44.5, -23.2], [-48.5, -26.2], [-48.8, -28.5], [-51, -31.5], [-53.4, -33.8], [-56.5, -34.9], [-57.5, -38.1], [-62, -39], [-65, -41], [-63.5, -42.6], [-65.8, -45], [-67.5, -46.5], [-65.8, -48], [-69, -51], [-68.4, -52.4], [-71, -53.8], [-74, -52], [-75.5, -48], [-74, -43], [-73.5, -39], [-71.5, -33], [-71.5, -28], [-70.5, -23], [-70.3, -18.5], [-75, -15.5], [-76.5, -13], [-79.5, -8], [-81.2, -5.5], [-80.5, -2.5], [-80, 0.8], [-78.8, 1.8], [-77.5, 4], [-77.4, 7]],
	// África
	[[-17, 21], [-16.5, 15], [-17.5, 14.7], [-16.7, 12.5], [-14.5, 10.5], [-13, 8], [-11, 6.8], [-7.5, 4.4], [-3, 5.1], [1, 6], [4.5, 6.3], [8.5, 4.5], [9.6, 2.5], [9.3, -1], [11.7, -4.5], [12.2, -6], [13, -8.8], [12.4, -13], [11.8, -17], [14.5, -22.5], [15, -27], [16.5, -28.6], [18.2, -31.8], [18.5, -34.2], [20, -34.8], [22.5, -34], [25.6, -33.8], [27.8, -33], [30.5, -31], [32.5, -28.5], [32.8, -26], [35.5, -24], [35.4, -21], [34.7, -19.8], [36.5, -18.5], [40.5, -15], [40.5, -10.5], [39.3, -8], [39.5, -5], [41, -2], [43.5, 1], [46, 2.5], [49, 6], [51.2, 10.5], [51.2, 12], [48, 11.2], [44.5, 10.4], [43.3, 11.8], [42.5, 14.5], [40, 15.8], [38.5, 18.2], [37.2, 21.5], [35.5, 23.5], [34.2, 26.8], [32.5, 30], [29, 30.9], [25, 31.6], [20, 30.5], [19.5, 32], [15, 32.4], [11, 33.2], [10.2, 37], [8, 36.9], [3, 36.8], [-2, 35.1], [-5.9, 35.8], [-9.5, 32.5], [-10, 29.5], [-13, 27.6], [-15, 25]],
	// Américas Central e do Norte
	[[-117, 32.5], [-114.8, 30], [-112, 27], [-110, 23.5], [-105.6, 20.5], [-105, 19], [-101, 17.3], [-96.5, 15.7], [-94, 16], [-92, 14.5], [-89, 13.5], [-87.5, 13], [-86, 11], [-85.6, 9.5], [-83.5, 8.3], [-81.5, 7.5], [-79.5, 9], [-77.4, 8.6], [-77.8, 9.4], [-80, 9.3], [-81.8, 9], [-83, 10.5], [-83.6, 11.5], [-83.2, 14.9], [-85, 16], [-88.2, 15.8], [-88.3, 18.5], [-87.5, 21.4], [-90.4, 21.1], [-91, 19], [-94.5, 18.2], [-97, 20.5], [-97.8, 22.5], [-97.5, 26], [-97.2, 27.8], [-94.5, 29.5], [-90, 29.2], [-85, 29.7], [-83, 29], [-82.6, 27.5], [-81, 25.2], [-80, 26.8], [-81.4, 30.5], [-80.8, 32.2], [-78, 34], [-76, 35.5], [-75.5, 38], [-74, 40.5], [-70, 41.5], [-70.5, 43], [-66.8, 44.8], [-61, 45.5], [-60, 47], [-65, 49], [-70, 47.5], [-80, 45], [-84, 46], [-88, 48], [-95, 49], [-123, 49], [-124.5, 42], [-124, 40], [-122.5, 37.5], [-120.5, 34.5]],
];

function onLand(lon: number, lat: number) {
	for (const poly of LAND) {
		let inside = false;
		for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
			const [xi, yi] = poly[i];
			const [xj, yj] = poly[j];
			if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
		}
		if (inside) return true;
	}
	return false;
}

const RAD = Math.PI / 180;
const ORIGIN: [number, number] = [-49.07, -26.48]; // Jaraguá do Sul
const CITIES: [number, number][] = [
	[-46.63, -23.55], // São Paulo
	[-43.2, -22.9], // Rio de Janeiro
	[-43.94, -19.92], // Belo Horizonte
	[-47.88, -15.79], // Brasília
	[-38.5, -12.97], // Salvador
	[-34.9, -8.05], // Recife
	[-38.52, -3.73], // Fortaleza
	[-60.02, -3.1], // Manaus
	[-48.5, -1.45], // Belém
	[-51.23, -30.03], // Porto Alegre
	[-56.1, -15.6], // Cuiabá
	[-49.25, -16.68], // Goiânia
];

const vec = (lon: number, lat: number): [number, number, number] => [
	Math.cos(lat * RAD) * Math.sin(lon * RAD),
	Math.sin(lat * RAD),
	Math.cos(lat * RAD) * Math.cos(lon * RAD),
];

const globo: Factory = (s) => {
	// Pontos espalhados por igual na esfera (Fibonacci); ficam os de terra e alguns no mar.
	const total = s.w < 600 * s.dpr ? 9000 : 16000;
	const land: { v: [number, number, number]; lon: number }[] = [];
	const sea: [number, number, number][] = [];
	const golden = Math.PI * (3 - Math.sqrt(5));
	for (let i = 0; i < total; i++) {
		const y = 1 - (i / (total - 1)) * 2;
		const r = Math.sqrt(1 - y * y);
		const a = golden * i;
		const lat = Math.asin(y) / RAD;
		const lon = ((Math.atan2(r * Math.sin(a), r * Math.cos(a)) / RAD + 540) % 360) - 180;
		if (onLand(lon, lat)) land.push({ v: vec(lon, lat), lon });
		else if (i % 9 === 0) sea.push(vec(lon, lat));
	}
	const origin = vec(...ORIGIN);
	const arcs = CITIES.map(([lon, lat]) => {
		const b = vec(lon, lat);
		const angle = Math.acos(clamp(origin[0] * b[0] + origin[1] * b[1] + origin[2] * b[2], -1, 1));
		return { b, angle, lift: 0.04 + angle * 0.35 };
	});

	return (s, t) => {
		const { ctx, w, h, dpr, colors, dark, pointer } = s;
		const R = Math.min(w * 0.46, h * 0.46);
		const cx = w / 2;
		const cy = h / 2;
		const lon0 = (-50 + 9 * Math.sin(t * 0.12) + (pointer.active ? (pointer.x / w - 0.5) * 16 : 0)) * RAD;
		const lat0 = (-13 + 2.5 * Math.sin(t * 0.09)) * RAD;
		const cl = Math.cos(-lon0);
		const sl = Math.sin(-lon0);
		const ct = Math.cos(lat0);
		const st = Math.sin(lat0);
		const project = (v: [number, number, number], scale = 1) => {
			const x1 = v[0] * cl + v[2] * sl;
			const z1 = -v[0] * sl + v[2] * cl;
			const y2 = v[1] * ct - z1 * st;
			const z2 = v[1] * st + z1 * ct;
			return [cx + x1 * R * scale, cy - y2 * R * scale, z2] as const;
		};

		// Esfera: um brilho suave e a borda.
		const body = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
		body.addColorStop(0, dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)');
		body.addColorStop(1, dark ? 'rgba(255,255,255,0.015)' : rgba(cycle(colors, 0.15), 0.07));
		ctx.fillStyle = body;
		ctx.beginPath();
		ctx.arc(cx, cy, R, 0, TAU);
		ctx.fill();
		ctx.strokeStyle = dark ? 'rgba(255,255,255,0.1)' : rgba(cycle(colors, 0.1), 0.18);
		ctx.lineWidth = dpr;
		ctx.stroke();

		for (const v of sea) {
			const [x, y, z] = project(v);
			if (z <= 0) continue;
			ctx.fillStyle = dark ? `rgba(255,255,255,${0.06 * z})` : `rgba(11,18,34,${0.05 * z})`;
			ctx.fillRect(x, y, dpr, dpr);
		}
		const dot = 1.25 * dpr;
		for (const p of land) {
			const [x, y, z] = project(p.v);
			if (z <= 0.02) continue;
			ctx.fillStyle = rgba(cycle(colors, (x - (cx - R)) / (2 * R) * 0.7 + 0.05), 0.25 + 0.7 * z);
			ctx.beginPath();
			ctx.arc(x, y, dot * (0.6 + 0.4 * z), 0, TAU);
			ctx.fill();
		}

		// Arcos: cada um cresce de Jaraguá até a cidade, segura e some.
		const period = 7.5;
		arcs.forEach((arc, i) => {
			const local = (((t - i * 0.6) % period) + period) % period;
			const head = clamp(local / 1.5, 0, 1);
			const tail = clamp((local - 2.2) / 1.2, 0, 1);
			if (head <= tail) return;
			const c = cycle(colors, i / arcs.length);
			const steps = 40;
			ctx.strokeStyle = rgba(c, 0.95);
			ctx.lineWidth = 1.6 * dpr;
			ctx.beginPath();
			let started = false;
			for (let k = 0; k <= steps; k++) {
				const u = tail + (head - tail) * (k / steps);
				const sa = Math.sin((1 - u) * arc.angle) / Math.sin(arc.angle);
				const sb = Math.sin(u * arc.angle) / Math.sin(arc.angle);
				const v: [number, number, number] = [
					origin[0] * sa + arc.b[0] * sb,
					origin[1] * sa + arc.b[1] * sb,
					origin[2] * sa + arc.b[2] * sb,
				];
				const [x, y, z] = project(v, 1 + arc.lift * Math.sin(Math.PI * u));
				if (z < -0.05) continue;
				if (!started) {
					ctx.moveTo(x, y);
					started = true;
				} else ctx.lineTo(x, y);
			}
			ctx.stroke();
			if (head >= 1) {
				const [x, y, z] = project(arc.b);
				if (z > 0) {
					const ring = clamp((local - 1.5) / 0.9, 0, 1);
					ctx.strokeStyle = rgba(c, 0.8 * (1 - ring));
					ctx.lineWidth = 1.4 * dpr;
					ctx.beginPath();
					ctx.arc(x, y, (3 + 9 * ring) * dpr, 0, TAU);
					ctx.stroke();
					ctx.fillStyle = rgba(c, 0.95 * (1 - tail));
					ctx.beginPath();
					ctx.arc(x, y, 2.6 * dpr, 0, TAU);
					ctx.fill();
				}
			}
		});

		// Jaraguá do Sul: pulso e etiqueta.
		const [ox, oy, oz] = project(origin);
		if (oz > 0) {
			const pulse = (t * 0.8) % 1;
			ctx.strokeStyle = rgba(cycle(colors, 0), 0.7 * (1 - pulse));
			ctx.lineWidth = 1.5 * dpr;
			ctx.beginPath();
			ctx.arc(ox, oy, (4 + 14 * pulse) * dpr, 0, TAU);
			ctx.stroke();
			ctx.fillStyle = dark ? '#fff' : '#0b1222';
			ctx.beginPath();
			ctx.arc(ox, oy, 3.6 * dpr, 0, TAU);
			ctx.fill();
			label(s, 'Jaraguá do Sul', ox + 12 * dpr, oy + 18 * dpr);
		}
	};
};

/* -------------------------------------------------------------------------
   rede: nós em 3D com pulsos
   ------------------------------------------------------------------------- */

const rede: Factory = (s) => {
	const rand = seeded(11);
	const n = s.w < 600 * s.dpr ? 42 : 64;
	const nodes: { p: [number, number, number]; hue: number; hub: boolean }[] = [];
	while (nodes.length < n) {
		const p: [number, number, number] = [rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1];
		if (p[0] * p[0] + (p[1] * p[1]) / 0.45 + (p[2] * p[2]) / 0.7 > 1) continue;
		nodes.push({ p, hue: (p[0] + 1) / 2, hub: rand() < 0.12 });
	}
	const edges: [number, number][] = [];
	const degree = new Array(n).fill(0);
	for (let i = 0; i < n; i++)
		for (let j = i + 1; j < n; j++) {
			const d = Math.hypot(nodes[i].p[0] - nodes[j].p[0], nodes[i].p[1] - nodes[j].p[1], nodes[i].p[2] - nodes[j].p[2]);
			if (d < 0.5 && degree[i] < 4 && degree[j] < 4) {
				edges.push([i, j]);
				degree[i]++;
				degree[j]++;
			}
		}
	const pulses = Array.from({ length: 12 }, () => ({ e: Math.floor(rand() * edges.length), u: rand(), dir: rand() < 0.5 ? 1 : -1, v: 0.35 + rand() * 0.4 }));
	const turn = { x: 0, y: 0 };
	let last = 0;

	return (s, t) => {
		const { ctx, w, h, dpr, colors, dark, pointer } = s;
		const dt = clamp(t - last, 0, 0.05);
		last = t;
		turn.x += ((pointer.active ? (pointer.x / w - 0.5) * 0.8 : 0) - turn.x) * 0.05;
		turn.y += ((pointer.active ? (pointer.y / h - 0.5) * 0.5 : 0) - turn.y) * 0.05;
		const ay = t * 0.16 + turn.x;
		const ax = 0.32 + turn.y;
		const S = Math.min(w * 0.42, h * 0.62);
		const proj = nodes.map(({ p }) => {
			const x1 = p[0] * Math.cos(ay) + p[2] * Math.sin(ay);
			const z1 = -p[0] * Math.sin(ay) + p[2] * Math.cos(ay);
			const y2 = p[1] * Math.cos(ax) - z1 * Math.sin(ax);
			const z2 = p[1] * Math.sin(ax) + z1 * Math.cos(ax);
			const f = 3 / (3 + z2);
			return { x: w / 2 + x1 * S * f, y: h / 2 + y2 * S * f, d: clamp((1 - z2) / 2, 0, 1) };
		});

		ctx.lineWidth = dpr;
		for (const [i, j] of edges) {
			const a = proj[i];
			const b = proj[j];
			const depth = (a.d + b.d) / 2;
			ctx.strokeStyle = rgba(cycle(colors, (nodes[i].hue + nodes[j].hue) / 2 * 0.7), (dark ? 0.12 : 0.14) + 0.28 * depth);
			ctx.beginPath();
			ctx.moveTo(a.x, a.y);
			ctx.lineTo(b.x, b.y);
			ctx.stroke();
		}

		for (const pulse of pulses) {
			pulse.u += pulse.dir * pulse.v * dt * 1.6;
			if (pulse.u > 1 || pulse.u < 0) {
				// Chegou num nó: segue por outra ligação dele.
				const [i, j] = edges[pulse.e];
				const at = pulse.u > 1 ? j : i;
				const next = edges.map((e, k) => [e, k] as const).filter(([e, k]) => k !== pulse.e && (e[0] === at || e[1] === at));
				if (next.length) {
					const [e, k] = next[Math.floor(Math.random() * next.length)];
					pulse.e = k;
					pulse.dir = e[0] === at ? 1 : -1;
					pulse.u = pulse.dir === 1 ? 0 : 1;
				} else {
					pulse.dir *= -1;
					pulse.u = clamp(pulse.u, 0, 1);
				}
			}
			const [i, j] = edges[pulse.e];
			const a = proj[i];
			const b = proj[j];
			const x = a.x + (b.x - a.x) * pulse.u;
			const y = a.y + (b.y - a.y) * pulse.u;
			const c = cycle(colors, nodes[i].hue * 0.7);
			const g = ctx.createRadialGradient(x, y, 0, x, y, 9 * dpr);
			g.addColorStop(0, rgba(dark ? [255, 255, 255] : c, 0.95));
			g.addColorStop(1, rgba(c, 0));
			ctx.fillStyle = g;
			ctx.beginPath();
			ctx.arc(x, y, 9 * dpr, 0, TAU);
			ctx.fill();
		}

		nodes.forEach((node, i) => {
			const p = proj[i];
			const c = cycle(colors, node.hue * 0.7);
			const r = (node.hub ? 3.6 : 2) * dpr * (0.6 + 0.6 * p.d);
			ctx.fillStyle = rgba(c, 0.45 + 0.55 * p.d);
			ctx.beginPath();
			ctx.arc(p.x, p.y, r, 0, TAU);
			ctx.fill();
			if (node.hub) {
				ctx.strokeStyle = rgba(c, 0.35 * p.d);
				ctx.beginPath();
				ctx.arc(p.x, p.y, r + 5 * dpr, 0, TAU);
				ctx.stroke();
			}
		});
	};
};

/* -------------------------------------------------------------------------
   esfera: pontos que respiram, com órbitas
   ------------------------------------------------------------------------- */

const esfera: Factory = (s) => {
	const n = s.w < 600 * s.dpr ? 520 : 900;
	const golden = Math.PI * (3 - Math.sqrt(5));
	const pts = Array.from({ length: n }, (_, i) => {
		const y = 1 - (i / (n - 1)) * 2;
		const r = Math.sqrt(1 - y * y);
		return [Math.cos(golden * i) * r, y, Math.sin(golden * i) * r] as [number, number, number];
	});
	const turn = { x: 0, y: 0 };
	return (s, t) => {
		const { ctx, w, h, dpr, colors, dark, pointer } = s;
		turn.x += ((pointer.active ? (pointer.x / w - 0.5) * 1.2 : 0) - turn.x) * 0.05;
		turn.y += ((pointer.active ? (pointer.y / h - 0.5) * 0.6 : 0) - turn.y) * 0.05;
		const ay = t * 0.22 + turn.x;
		const ax = 0.35 + turn.y;
		const R = Math.min(w, h) * 0.3;
		const cx = w / 2;
		const cy = h / 2;
		const rotate = (p: [number, number, number]) => {
			const x1 = p[0] * Math.cos(ay) + p[2] * Math.sin(ay);
			const z1 = -p[0] * Math.sin(ay) + p[2] * Math.cos(ay);
			return [x1, p[1] * Math.cos(ax) - z1 * Math.sin(ax), p[1] * Math.sin(ax) + z1 * Math.cos(ax)] as const;
		};

		const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.5);
		core.addColorStop(0, rgba(cycle(colors, 0.35), dark ? 0.35 : 0.18));
		core.addColorStop(1, rgba(cycle(colors, 0.35), 0));
		ctx.fillStyle = core;
		ctx.fillRect(0, 0, w, h);

		// Órbitas inclinadas, com partículas.
		[
			{ tilt: 1.15, spin: 0.4, r: 1.55, off: 0 },
			{ tilt: -0.75, spin: -0.3, r: 1.8, off: 2 },
		].forEach((orbit, k) => {
			const pointAt = (a: number) => {
				const p: [number, number, number] = [Math.cos(a) * orbit.r, 0, Math.sin(a) * orbit.r];
				const y = p[1] * Math.cos(orbit.tilt) - p[2] * Math.sin(orbit.tilt);
				const z = p[1] * Math.sin(orbit.tilt) + p[2] * Math.cos(orbit.tilt);
				return rotate([p[0], y, z]);
			};
			ctx.lineWidth = dpr;
			for (let i = 0; i < 120; i++) {
				const a = (i / 120) * TAU;
				const [x, y, z] = pointAt(a);
				const f = 3 / (3 + z);
				ctx.fillStyle = rgba(cycle(colors, 0.2 + k * 0.4), 0.1 + 0.25 * (1 - z) / 2);
				ctx.fillRect(cx + x * R * f, cy + y * R * f, dpr, dpr);
			}
			for (let q = 0; q < 3; q++) {
				const [x, y, z] = pointAt(t * orbit.spin + (q * TAU) / 3 + orbit.off);
				const f = 3 / (3 + z);
				ctx.fillStyle = rgba(cycle(colors, 0.6 + k * 0.2), 0.6 + 0.4 * (1 - z) / 2);
				ctx.beginPath();
				ctx.arc(cx + x * R * f, cy + y * R * f, 2.6 * dpr * f, 0, TAU);
				ctx.fill();
			}
		});

		for (const p of pts) {
			const breathe = 1 + 0.07 * Math.sin(p[0] * 3.1 + t * 1.3) * Math.cos(p[1] * 2.7 - t * 0.9);
			const [x, y, z] = rotate([p[0] * breathe, p[1] * breathe, p[2] * breathe]);
			const f = 3 / (3 + z);
			const depth = (1 - z / breathe) / 2;
			ctx.fillStyle = rgba(cycle(colors, (p[1] + 1) / 2 * 0.8), 0.12 + 0.8 * depth * depth);
			ctx.beginPath();
			ctx.arc(cx + x * R * f, cy + y * R * f, (0.6 + 1.4 * depth) * dpr, 0, TAU);
			ctx.fill();
		}
	};
};

/* -------------------------------------------------------------------------
   ciclo: órbita com as quatro etapas
   ------------------------------------------------------------------------- */

const STEPS = ['Discovery', 'Design', 'Develop', 'Deploy'];

const ciclo: Factory = () => {
	return (s, t) => {
		const { ctx, w, h, dpr, colors, dark } = s;
		const cx = w / 2;
		const cy = h / 2;
		const rx = Math.min(w * 0.4, h * 0.95);
		const ry = rx * 0.4;
		const at = (a: number, scale = 1) => [cx + Math.cos(a) * rx * scale, cy + Math.sin(a) * ry * scale, Math.sin(a)] as const;
		const comet = (t * 0.65) % TAU;

		// Núcleo.
		const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx * 0.5);
		core.addColorStop(0, rgba(cycle(colors, 0.3), dark ? 0.45 : 0.22));
		core.addColorStop(1, rgba(cycle(colors, 0.3), 0));
		ctx.fillStyle = core;
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = rgba(cycle(colors, 0.25), 0.9);
		ctx.beginPath();
		ctx.arc(cx, cy, 7 * dpr, 0, TAU);
		ctx.fill();

		// Órbitas pontilhadas (a de fora, mais fraca).
		for (const [scale, alpha] of [
			[1.32, 0.12],
			[1, 0.3],
		]) {
			for (let i = 0; i < 160; i++) {
				const a = (i / 160) * TAU;
				const [x, y, z] = at(a, scale);
				ctx.fillStyle = dark ? `rgba(255,255,255,${alpha * (0.5 + 0.5 * z) + 0.05})` : rgba(cycle(colors, 0.1), alpha * (0.5 + 0.5 * z) + 0.05);
				ctx.beginPath();
				ctx.arc(x, y, 1.1 * dpr, 0, TAU);
				ctx.fill();
			}
		}

		// Cometa com rastro.
		for (let k = 0; k < 40; k++) {
			const a = comet - k * 0.03;
			const [x, y] = at(a);
			ctx.fillStyle = rgba(cycle(colors, (a / TAU) % 1), (1 - k / 40) * 0.9);
			ctx.beginPath();
			ctx.arc(x, y, (3.4 - k * 0.07) * dpr, 0, TAU);
			ctx.fill();
		}

		// As quatro etapas: acendem quando o cometa passa.
		STEPS.forEach((step, i) => {
			const a = Math.PI + (i * TAU) / 4 - Math.PI / 4;
			const [x, y, z] = at(a);
			const since = (((comet - a) % TAU) + TAU) % TAU;
			const lit = Math.exp(-since * 1.4);
			const c = cycle(colors, i / 4);
			ctx.strokeStyle = rgba(c, 0.6 * lit);
			ctx.lineWidth = 1.4 * dpr;
			ctx.beginPath();
			ctx.arc(x, y, (8 + 14 * (1 - lit)) * dpr, 0, TAU);
			ctx.stroke();
			ctx.fillStyle = dark ? '#11142b' : '#fff';
			ctx.strokeStyle = rgba(c, 0.55 + 0.45 * lit);
			ctx.lineWidth = 2 * dpr;
			ctx.beginPath();
			ctx.arc(x, y, 7 * dpr, 0, TAU);
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = rgba(c, 0.4 + 0.6 * lit);
			ctx.beginPath();
			ctx.arc(x, y, 3.2 * dpr, 0, TAU);
			ctx.fill();
			label(s, step, x, y + (z > 0 ? 30 : -30) * dpr, 'center');
		});
	};
};

/* -------------------------------------------------------------------------
   onda: campo de pontos em perspectiva
   ------------------------------------------------------------------------- */

const onda: Factory = (s) => {
	const cols = s.w < 600 * s.dpr ? 34 : 54;
	const rows = s.w < 600 * s.dpr ? 18 : 26;
	return (s, t) => {
		const { ctx, w, h, dpr, colors, pointer } = s;
		const horizon = h * 0.12;
		const bottom = h * 0.96;
		const px = pointer.active ? pointer.x / w : -9;
		for (let r = rows - 1; r >= 0; r--) {
			const z = r / (rows - 1);
			const persp = 1 / (1 + z * 1.8);
			const ground = horizon + (bottom - horizon) * ((persp - 1 / 2.8) / (1 - 1 / 2.8));
			for (let c = 0; c < cols; c++) {
				const x = (c / (cols - 1)) * 2 - 1;
				let y = 0.13 * Math.sin(x * 3.2 + t * 0.9 + z * 4) + 0.09 * Math.sin(z * 7.5 - t * 1.15 + x);
				const sx0 = (x + 1) / 2;
				if (px > -1) y += 0.12 * Math.exp(-Math.pow((sx0 - px) * 6, 2)) * Math.sin(t * 3 - z * 6);
				const sx = w / 2 + x * w * 0.62 * persp;
				const sy = ground - y * h * 0.55 * persp;
				ctx.fillStyle = rgba(cycle(colors, sx0 * 0.75 + y * 0.6), 0.18 + 0.72 * persp);
				ctx.beginPath();
				ctx.arc(sx, sy, (0.7 + 1.9 * persp) * dpr, 0, TAU);
				ctx.fill();
			}
		}
	};
};

const scenes: Record<string, Factory> = { fios, tempo, raios, globo, rede, esfera, ciclo, onda };

/* -------------------------------------------------------------------------
   Execução
   ------------------------------------------------------------------------- */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function readColors(element: Element): RGB[] {
	const styles = getComputedStyle(element);
	const fallbacks: RGB[] = [
		[94, 106, 210],
		[155, 108, 240],
		[244, 114, 182],
		[251, 146, 60],
	];
	return fallbacks.map((fallback, i) => hexColor(styles.getPropertyValue(`--grad-${i + 1}`), fallback));
}

export function initArt(canvas: HTMLCanvasElement) {
	const factory = scenes[canvas.dataset.art ?? ''];
	const ctx = canvas.getContext('2d');
	if (!factory || !ctx) return;

	const stage: Stage = {
		el: canvas,
		ctx,
		w: 1,
		h: 1,
		dpr: 1,
		dark: Boolean(canvas.closest('.theme-dark')) || document.documentElement.dataset.theme === 'escuro',
		colors: readColors(canvas),
		pointer: { x: 0, y: 0, active: false },
	};
	let scene: Scene | null = null;
	// Cada cena começa num momento diferente (e "bonito"), não no zero.
	let time = 6 + Math.random() * 4;
	let last = 0;
	let frame = 0;
	let visible = false;

	function resize() {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
		const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
		if (w === canvas.width && h === canvas.height && scene) return;
		canvas.width = w;
		canvas.height = h;
		Object.assign(stage, { w, h, dpr });
		scene = factory(stage);
	}

	function draw() {
		if (!scene) return;
		ctx!.setTransform(1, 0, 0, 1, 0, 0);
		ctx!.clearRect(0, 0, stage.w, stage.h);
		ctx!.globalCompositeOperation = stage.dark ? 'lighter' : 'source-over';
		scene(stage, time);
		ctx!.globalCompositeOperation = 'source-over';
	}

	function loop(now: number) {
		frame = requestAnimationFrame(loop);
		const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
		last = now;
		time += dt;
		draw();
	}

	function start() {
		if (frame || reduced || !visible || document.hidden) return;
		last = 0;
		frame = requestAnimationFrame(loop);
	}

	function stop() {
		cancelAnimationFrame(frame);
		frame = 0;
	}

	resize();
	draw();
	canvas.classList.add('is-live');

	new ResizeObserver(() => {
		resize();
		draw();
	}).observe(canvas);
	new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		if (visible) start();
		else stop();
	}).observe(canvas);
	document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
	window.addEventListener(
		'pointermove',
		(event) => {
			if (!visible) return;
			const rect = canvas.getBoundingClientRect();
			const margin = 80;
			stage.pointer.active =
				event.pointerType === 'mouse' &&
				event.clientX > rect.left - margin &&
				event.clientX < rect.right + margin &&
				event.clientY > rect.top - margin &&
				event.clientY < rect.bottom + margin;
			stage.pointer.x = (event.clientX - rect.left) * stage.dpr;
			stage.pointer.y = (event.clientY - rect.top) * stage.dpr;
		},
		{ passive: true },
	);
	document.addEventListener('kafe:palette', () => {
		stage.colors = readColors(canvas);
		if (!frame) draw();
	});
	// Fontes das etiquetas: redesenha quando a Inter terminar de carregar.
	document.fonts?.ready.then(() => draw());
}
