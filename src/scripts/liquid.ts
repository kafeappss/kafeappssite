/**
 * Metal líquido — um único corpo de líquido em WebGL que acompanha a navegação.
 *
 * Cada seção da página declara uma "formação" com o atributo data-liquid
 * (ex.: data-liquid="hero"). Quando a seção chega ao centro da tela, as gotas
 * escorrem até as novas posições usando molas, se fundindo e se separando no
 * caminho. O cursor também é uma gota, e a rolagem dá inércia ao líquido.
 *
 * Sem WebGL, ou com "reduzir movimento" ativo no sistema, o site continua
 * funcionando com um fundo estático.
 */

type Spot = readonly [x: number, y: number, r: number];
type Formation = { dim: number; land: readonly Spot[]; port?: readonly Spot[] };

const FORMATION_SIZE = 9;
const MAX_BLOBS = FORMATION_SIZE + 1; // + a gota do cursor
const STORAGE_KEY = 'kafe:liquid';

/*
 * Coordenadas: x vai de -1 (borda esquerda) a 1 (borda direita), y de -1 (base)
 * a 1 (topo). O raio é medido em relação à menor metade da tela, então as gotas
 * mantêm a proporção no desktop e no celular.
 */
export const formations: Record<string, Formation> = {
	hero: {
		dim: 1,
		land: [
			[0.58, 0.0, 0.34],
			[0.84, 0.36, 0.2],
			[0.8, -0.4, 0.19],
			[0.44, -0.44, 0.11],
			[1.04, -0.02, 0.16],
			[0.48, 0.46, 0.085],
			[0.68, 0.68, 0.07],
			[0.96, -0.76, 0.1],
			[0.3, -0.12, 0.04],
		],
		port: [
			[0.3, -0.66, 0.58],
			[-0.5, -0.9, 0.44],
			[0.9, -0.38, 0.3],
			[-0.95, -0.55, 0.2],
			[0.8, -1.0, 0.36],
			[0.05, -0.36, 0.13],
			[1.0, 0.86, 0.36],
			[0.62, 0.66, 0.12],
			[-0.25, -1.02, 0.3],
		],
	},
	right: {
		dim: 0.8,
		land: [
			[1.02, 0.22, 0.3],
			[0.84, -0.22, 0.15],
			[1.04, -0.58, 0.22],
			[0.88, 0.62, 0.1],
			[0.74, 0.04, 0.06],
			[1.25, 0.9, 0.12],
			[1.3, -0.95, 0.12],
			[0.95, -0.95, 0.08],
			[1.2, 0.0, 0.1],
		],
		port: [
			[1.2, 0.5, 0.46],
			[1.08, 0.12, 0.2],
			[1.18, -0.6, 0.38],
			[0.96, 0.84, 0.13],
			[1.02, -0.26, 0.1],
			[1.3, 0.95, 0.2],
			[1.3, -0.95, 0.2],
			[1.0, -0.98, 0.16],
			[1.3, 0.0, 0.2],
		],
	},
	left: {
		dim: 0.8,
		land: [
			[-1.02, -0.18, 0.3],
			[-0.84, 0.24, 0.15],
			[-1.04, 0.6, 0.22],
			[-0.88, -0.62, 0.11],
			[-0.74, -0.02, 0.06],
			[-1.25, -0.9, 0.12],
			[-1.3, 0.95, 0.12],
			[-0.95, 0.95, 0.08],
			[-1.2, 0.0, 0.1],
		],
		port: [
			[-1.2, -0.5, 0.46],
			[-1.08, -0.12, 0.2],
			[-1.18, 0.6, 0.38],
			[-0.96, -0.84, 0.13],
			[-1.02, 0.26, 0.1],
			[-1.3, -0.95, 0.2],
			[-1.3, 0.95, 0.2],
			[-1.0, 0.98, 0.16],
			[-1.3, 0.0, 0.2],
		],
	},
	scatter: {
		dim: 0.72,
		land: [
			[-1.04, 0.72, 0.22],
			[1.04, -0.66, 0.26],
			[-0.94, -0.88, 0.12],
			[0.97, 0.86, 0.1],
			[-0.82, 0.92, 0.06],
			[0.86, -0.96, 0.08],
			[1.15, 0.2, 0.1],
			[-1.15, -0.2, 0.1],
			[0.0, -1.18, 0.1],
		],
	},
	stream: {
		dim: 0.85,
		land: [
			[-1.0, -0.95, 0.14],
			[-0.72, -0.98, 0.12],
			[-0.44, -0.94, 0.1],
			[-0.16, -0.99, 0.13],
			[0.12, -0.95, 0.1],
			[0.4, -0.98, 0.12],
			[0.68, -0.94, 0.11],
			[0.96, -0.97, 0.15],
			[0.3, -0.78, 0.035],
		],
		port: [
			[-1.0, 0.95, 0.3],
			[-1.04, 0.62, 0.22],
			[-0.98, 0.3, 0.2],
			[-1.05, -0.02, 0.24],
			[-0.98, -0.34, 0.2],
			[-1.04, -0.66, 0.22],
			[-1.0, -0.96, 0.28],
			[1.2, 0.5, 0.12],
			[-0.84, 0.1, 0.06],
		],
	},
	pool: {
		dim: 1,
		land: [
			[0.0, -1.08, 0.42],
			[-0.44, -0.98, 0.3],
			[0.44, -1.0, 0.32],
			[-0.84, -1.02, 0.25],
			[0.84, -0.97, 0.24],
			[0.12, -0.58, 0.085],
			[-0.24, -0.5, 0.055],
			[0.33, -0.42, 0.045],
			[-0.58, -0.66, 0.065],
		],
		port: [
			[0.0, -1.1, 0.8],
			[-0.65, -1.0, 0.56],
			[0.65, -1.02, 0.6],
			[-1.05, -0.92, 0.36],
			[1.05, -0.9, 0.34],
			[0.2, -0.7, 0.16],
			[-0.35, -0.64, 0.11],
			[0.45, -0.56, 0.09],
			[-0.7, -0.74, 0.12],
		],
	},
	page: {
		dim: 0.9,
		land: [
			[0.84, 0.74, 0.32],
			[1.04, 0.3, 0.22],
			[0.6, 0.96, 0.18],
			[0.68, 0.36, 0.085],
			[0.96, -0.1, 0.07],
			[1.2, -0.5, 0.12],
			[1.25, 0.95, 0.12],
			[0.45, 0.7, 0.05],
			[1.15, -0.85, 0.1],
		],
		port: [
			[0.85, 0.9, 0.5],
			[1.05, 0.55, 0.34],
			[0.4, 1.02, 0.3],
			[0.55, 0.62, 0.12],
			[1.0, 0.25, 0.1],
			[1.3, -0.5, 0.2],
			[1.3, 0.95, 0.2],
			[0.2, 0.86, 0.08],
			[1.25, -0.85, 0.16],
		],
	},
	rest: {
		dim: 0.6,
		land: [
			[1.1, 0.8, 0.26],
			[1.08, -0.72, 0.2],
			[-1.1, -0.9, 0.16],
			[0.96, 0.98, 0.08],
			[1.2, 0.1, 0.1],
			[-1.25, 0.6, 0.1],
			[1.3, -0.2, 0.1],
			[-1.3, -0.3, 0.1],
			[0.9, -0.98, 0.06],
		],
	},
};

const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPos;
void main() {
	gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uTime;
uniform float uDim;
uniform vec2 uLight;
uniform vec4 uB[${MAX_BLOBS}];

const vec3 BG = vec3(0.0);

float hash(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
	           mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
	for (int i = 0; i < 4; i++) {
		v += a * noise(p);
		p = m * p;
		a *= 0.5;
	}
	return v;
}

// União suave entre gotas: é o que faz o líquido "grudar" ao se aproximar.
float smin(float a, float b, float k) {
	float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
	return mix(b, a, h) - k * h * (1.0 - h);
}

float field(vec2 p) {
	p += 0.011 * vec2(sin(p.y * 7.0 + uTime * 0.9), cos(p.x * 6.0 - uTime * 0.7));
	float d = 8.0;
	for (int i = 0; i < ${MAX_BLOBS}; i++) {
		vec4 b = uB[i];
		if (b.z > 0.001) {
			d = smin(d, length(p - b.xy) - b.z, 0.2);
		}
	}
	return d;
}

// Perfil arredondado da borda: dá volume de gota ao campo de distância.
float bevel(float d) {
	float t = clamp(-d / 0.15, 0.0, 1.0);
	return sqrt(1.0 - (1.0 - t) * (1.0 - t));
}

void main() {
	vec2 uv = gl_FragCoord.xy / uRes;
	float aspect = uRes.x / uRes.y;
	vec2 p = (uv * 2.0 - 1.0) * vec2(aspect, 1.0);
	float px = 2.0 / uRes.y;

	float d = field(p);
	vec3 col = BG;

	// Brilho discreto em volta do metal e uma névoa subindo devagar.
	float aura = exp(-max(d, 0.0) * 3.6);
	col += vec3(0.22) * aura * 0.07;
	vec2 q = p * 1.3 + vec2(0.0, -uTime * 0.045);
	float m = fbm(q + vec2(fbm(q * 0.9 + uTime * 0.02), 0.0) * 1.3);
	float mist = smoothstep(0.42, 0.95, m) * (0.3 + 0.7 * aura);
	col += vec3(0.9) * mist * 0.035;

	if (d < px * 2.0) {
		float e = px * 1.5;
		float h = bevel(d);
		float hx = bevel(field(p + vec2(e, 0.0)));
		float hy = bevel(field(p + vec2(0.0, e)));
		vec3 n = normalize(vec3((h - hx) / e * 0.075, (h - hy) / e * 0.075, 1.0));

		vec3 V = vec3(0.0, 0.0, 1.0);
		vec3 L = normalize(vec3(-0.45 + uLight.x * 0.35, 0.6 + uLight.y * 0.25, 0.66));
		vec3 L2 = normalize(vec3(0.7, -0.35, 0.6));
		float diff = max(dot(n, L), 0.0);
		float spec = pow(max(dot(n, normalize(L + V)), 0.0), 140.0);
		float spec2 = pow(max(dot(n, normalize(L2 + V)), 0.0), 36.0);
		float fres = pow(1.0 - max(n.z, 0.0), 2.2);

		// Metal líquido escuro: o corpo quase preto, e a cor vem dos reflexos.
		vec3 deep = vec3(0.01);
		vec3 body = vec3(0.045);
		vec3 rim = vec3(0.22);
		vec3 liquid = mix(rim, mix(body, deep, smoothstep(0.35, 1.0, h)), smoothstep(0.0, 0.42, h));
		float swirl = fbm(p * 2.1 + vec2(uTime * 0.05, -uTime * 0.03));
		liquid += vec3(0.05) * smoothstep(0.55, 0.92, swirl) * h;
		liquid *= 0.6 + 0.5 * diff;

		// Estúdio refletido: luz forte no alto, uma linha de horizonte e uma
		// luz lateral; o que aponta para quem olha reflete o escuro.
		vec3 r = reflect(-V, n);
		float sky = smoothstep(0.15, 0.85, r.y);
		float horizon = exp(-pow((r.y + 0.08) * 9.0, 2.0));
		float side = smoothstep(0.35, 0.95, r.x) * smoothstep(-0.5, 0.3, r.y);
		vec3 env = vec3(0.015) + vec3(1.0) * sky * 0.95 + vec3(0.5) * horizon + vec3(0.3) * side;
		env *= smoothstep(0.98, 0.3, r.z);
		liquid = mix(liquid, env, clamp(0.1 + fres * 0.9, 0.0, 1.0));
		liquid += vec3(1.0) * spec;
		liquid += vec3(0.7) * spec2 * 0.3;

		col = mix(col, liquid, smoothstep(px, -px, d));
	}

	col = mix(BG, col, 0.4 + 0.6 * uDim);
	vec2 vv = uv - 0.5;
	col *= 1.0 - dot(vv, vv) * 0.5;
	col += (hash(gl_FragCoord.xy + fract(uTime * 7.0) * 100.0) - 0.5) / 255.0;
	gl_FragColor = vec4(col, 1.0);
}
`;

type Blob = {
	x: number;
	y: number;
	r: number;
	vx: number;
	vy: number;
	vr: number;
	tx: number;
	ty: number;
	tr: number;
	phase: number;
	ampX: number;
	ampY: number;
	freqX: number;
	freqY: number;
	drag: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.warn('[liquid]', gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

function createProgram(gl: WebGLRenderingContext) {
	const vertex = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
	const fragment = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
	if (!vertex || !fragment) return null;
	const program = gl.createProgram();
	if (!program) return null;
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.warn('[liquid]', gl.getProgramInfoLog(program));
		return null;
	}
	return program;
}

export function initLiquid(canvas: HTMLCanvasElement) {
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const finePointer = window.matchMedia('(pointer: fine)').matches;

	const gl = canvas.getContext('webgl', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		premultipliedAlpha: false,
		preserveDrawingBuffer: false,
	});
	if (!gl) return;

	const program = createProgram(gl);
	if (!program) return;
	gl.useProgram(program);

	// Um triângulo que cobre a tela inteira.
	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	const aPos = gl.getAttribLocation(program, 'aPos');
	gl.enableVertexAttribArray(aPos);
	gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

	const uRes = gl.getUniformLocation(program, 'uRes');
	const uTime = gl.getUniformLocation(program, 'uTime');
	const uDim = gl.getUniformLocation(program, 'uDim');
	const uLight = gl.getUniformLocation(program, 'uLight');
	const uB = gl.getUniformLocation(program, 'uB[0]');
	const blobData = new Float32Array(MAX_BLOBS * 4);

	// ---------------------------------------------------------------- estado
	let width = 1;
	let height = 1;
	let aspect = 1;
	let quality = window.innerWidth < 768 ? 0.7 : 0.72;
	let time = 0;
	let dim = 1;
	let targetDim = 1;
	let formationName = 'page';
	let running = false;
	let frame = 0;
	let lastFrame = 0;
	let skipFrame = false;
	let lastInteraction = performance.now();

	const random = (seed: number) => {
		const x = Math.sin(seed * 91.17 + 7.31) * 43758.5453;
		return x - Math.floor(x);
	};

	const blobs: Blob[] = Array.from({ length: MAX_BLOBS }, (_, i) => ({
		x: 0,
		y: 0,
		r: 0,
		vx: 0,
		vy: 0,
		vr: 0,
		tx: 0,
		ty: 0,
		tr: 0,
		phase: random(i + 1) * Math.PI * 2,
		ampX: 0.025 + random(i + 11) * 0.05,
		ampY: 0.025 + random(i + 21) * 0.05,
		freqX: 0.18 + random(i + 31) * 0.22,
		freqY: 0.16 + random(i + 41) * 0.22,
		drag: 0.6 + random(i + 51) * 0.8,
	}));
	const cursor = blobs[MAX_BLOBS - 1];

	const pointer = { x: 0, y: 0, active: false, lastMove: 0, lightX: 0, lightY: 0 };

	function applyFormation(name: string, instant = false) {
		const formation = formations[name] ?? formations.page;
		formationName = name in formations ? name : 'page';
		const portrait = aspect < 0.9;
		const spots = (portrait && formation.port) || formation.land;
		const radiusScale = Math.min(aspect, 1);
		targetDim = formation.dim;
		for (let i = 0; i < FORMATION_SIZE; i++) {
			const [x, y, r] = spots[i] ?? [1.4, 0, 0];
			const blob = blobs[i];
			blob.tx = x * aspect;
			blob.ty = y;
			blob.tr = r * radiusScale;
			if (instant) {
				blob.x = blob.tx;
				blob.y = blob.ty;
				blob.r = blob.tr;
				blob.vx = blob.vy = blob.vr = 0;
			}
		}
		if (instant) dim = targetDim;
	}

	function resize() {
		const rect = canvas.getBoundingClientRect();
		const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
		const nextWidth = Math.max(1, Math.round(rect.width * dpr * quality));
		const nextHeight = Math.max(1, Math.round(rect.height * dpr * quality));
		if (nextWidth === width && nextHeight === height) return;
		width = canvas.width = nextWidth;
		height = canvas.height = nextHeight;
		aspect = rect.width / Math.max(rect.height, 1);
		gl!.viewport(0, 0, width, height);
		applyFormation(formationName, reducedMotion);
	}

	// ----------------------------------------------------- continuidade entre páginas
	function restore() {
		try {
			const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
			if (!saved || Date.now() - saved.savedAt > 15 * 60 * 1000) return false;
			time = Number(saved.time) || 0;
			(saved.blobs as number[][]).slice(0, FORMATION_SIZE).forEach(([x, y, r], i) => {
				blobs[i].x = x;
				blobs[i].y = y;
				blobs[i].r = r;
			});
			return true;
		} catch {
			return false;
		}
	}

	function save() {
		try {
			sessionStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					savedAt: Date.now(),
					time,
					blobs: blobs.slice(0, FORMATION_SIZE).map((b) => [b.x, b.y, b.r]),
				}),
			);
		} catch {
			// Armazenamento indisponível (aba anônima, por exemplo): sem problemas.
		}
	}

	// ------------------------------------------------------------ formações
	const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-liquid]'));
	const visible = new Set<HTMLElement>();
	if (sections[0]) formationName = sections[0].dataset.liquid ?? 'page';

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				const element = entry.target as HTMLElement;
				if (entry.isIntersecting) visible.add(element);
				else visible.delete(element);
			}
			const current = sections.filter((section) => visible.has(section)).at(-1);
			const name = current?.dataset.liquid;
			if (name && name !== formationName) {
				applyFormation(name, reducedMotion);
				if (reducedMotion) render();
			}
		},
		{ rootMargin: '-45% 0px -45% 0px' },
	);
	sections.forEach((section) => observer.observe(section));

	// --------------------------------------------------------- interação
	let lastScroll = window.scrollY;

	if (!reducedMotion && finePointer) {
		window.addEventListener(
			'pointermove',
			(event) => {
				const rect = canvas.getBoundingClientRect();
				pointer.x = ((event.clientX / rect.width) * 2 - 1) * aspect;
				pointer.y = -((event.clientY / rect.height) * 2 - 1);
				pointer.active = true;
				pointer.lastMove = performance.now();
				lastInteraction = pointer.lastMove;
			},
			{ passive: true },
		);
		document.documentElement.addEventListener('pointerleave', () => {
			pointer.active = false;
		});
	}

	// ------------------------------------------------------------- física
	function step(dt: number) {
		time += dt;
		const now = performance.now();
		if (pointer.active && now - pointer.lastMove > 4000) pointer.active = false;

		// Inércia da rolagem: o líquido "atrasa" um pouco em relação à página.
		const scrollY = window.scrollY;
		const scrollDelta = clamp(scrollY - lastScroll, -160, 160);
		if (scrollDelta !== 0) lastInteraction = now;
		lastScroll = scrollY;
		const impulse = (scrollDelta / Math.max(window.innerHeight, 1)) * 2 * 2.4;

		const stiffness = 6.5;
		const damping = 3.7;

		for (let i = 0; i < FORMATION_SIZE; i++) {
			const b = blobs[i];
			let tx = b.tx + b.ampX * Math.sin(time * b.freqX + b.phase);
			let ty = b.ty + b.ampY * Math.cos(time * b.freqY + b.phase * 1.3);
			const tr = b.tr * (1 + 0.05 * Math.sin(time * 0.6 + b.phase * 2));

			if (pointer.active) {
				const dx = pointer.x - tx;
				const dy = pointer.y - ty;
				const distance = Math.hypot(dx, dy);
				const reach = 0.6;
				if (distance < reach) {
					const pull = (1 - distance / reach) * 0.09;
					tx += dx * pull;
					ty += dy * pull;
				}
			}

			b.vy += impulse * b.drag;
			b.vx += ((tx - b.x) * stiffness - b.vx * damping) * dt;
			b.vy += ((ty - b.y) * stiffness - b.vy * damping) * dt;
			b.vr += ((tr - b.r) * stiffness - b.vr * damping) * dt;
			b.vx = clamp(b.vx, -4, 4);
			b.vy = clamp(b.vy, -4, 4);
			b.x += b.vx * dt;
			b.y += b.vy * dt;
			b.r = Math.max(0, b.r + b.vr * dt);
		}

		// A gota do cursor segue o mouse de perto.
		const cursorTarget = pointer.active ? 0.055 * Math.min(aspect, 1) : 0;
		if (cursor.r < 0.002 && pointer.active) {
			cursor.x = pointer.x;
			cursor.y = pointer.y;
		}
		cursor.vx += ((pointer.x - cursor.x) * 40 - cursor.vx * 11) * dt;
		cursor.vy += ((pointer.y - cursor.y) * 40 - cursor.vy * 11) * dt;
		cursor.vr += ((cursorTarget - cursor.r) * 30 - cursor.vr * 9) * dt;
		cursor.x += cursor.vx * dt;
		cursor.y += cursor.vy * dt;
		cursor.r = Math.max(0, cursor.r + cursor.vr * dt);

		pointer.lightX += ((pointer.active ? pointer.x / aspect : 0) - pointer.lightX) * Math.min(1, dt * 2);
		pointer.lightY += ((pointer.active ? pointer.y : 0) - pointer.lightY) * Math.min(1, dt * 2);
		dim += (targetDim - dim) * Math.min(1, dt * 1.5);
	}

	function render() {
		for (let i = 0; i < MAX_BLOBS; i++) {
			const b = blobs[i];
			blobData[i * 4] = b.x;
			blobData[i * 4 + 1] = b.y;
			blobData[i * 4 + 2] = b.r;
			blobData[i * 4 + 3] = 0;
		}
		gl!.uniform2f(uRes, width, height);
		gl!.uniform1f(uTime, time);
		gl!.uniform1f(uDim, dim);
		gl!.uniform2f(uLight, pointer.lightX, pointer.lightY);
		gl!.uniform4fv(uB, blobData);
		gl!.drawArrays(gl!.TRIANGLES, 0, 3);
	}

	// --------------------------------------------- qualidade adaptativa
	const frameTimes: number[] = [];
	function adapt(delta: number) {
		frameTimes.push(delta);
		if (frameTimes.length < 90) return;
		const sorted = [...frameTimes].sort((a, b) => a - b);
		const median = sorted[Math.floor(sorted.length / 2)];
		frameTimes.length = 0;
		if (median > 24) {
			if (quality > 0.36) {
				quality = Math.max(0.35, quality * 0.75);
				resize();
			} else {
				skipFrame = true; // aparelhos mais modestos: 30 quadros por segundo
			}
		}
	}

	function loop(now: number) {
		if (!running) return;
		frame = requestAnimationFrame(loop);
		const delta = lastFrame ? now - lastFrame : 16.7;
		// Parado (sem rolagem nem mouse), o líquido só deriva devagar: 30 quadros
		// por segundo bastam e poupam bateria.
		const idle = now - lastInteraction > 3000;
		if ((skipFrame || idle) && delta < 30) return;
		lastFrame = now;
		if (!idle) adapt(delta);
		step(Math.min(delta / 1000, 1 / 20));
		render();
	}

	function start() {
		if (running || reducedMotion) return;
		running = true;
		lastFrame = 0;
		frame = requestAnimationFrame(loop);
	}

	function stop() {
		running = false;
		cancelAnimationFrame(frame);
	}

	// --------------------------------------------------------------- início
	resize();
	const restored = restore();
	applyFormation(formationName, reducedMotion);
	if (!restored && !reducedMotion) {
		// Primeira visita: as gotas brotam e sobem até a posição inicial.
		for (let i = 0; i < FORMATION_SIZE; i++) {
			blobs[i].x = blobs[i].tx;
			blobs[i].y = blobs[i].ty - 0.5;
			blobs[i].r = 0;
		}
	}

	render();
	canvas.classList.add('is-live');
	start();

	new ResizeObserver(() => {
		resize();
		if (reducedMotion) render();
	}).observe(canvas);

	document.addEventListener('visibilitychange', () => {
		if (document.hidden) stop();
		else start();
	});

	window.addEventListener('pagehide', save);

	canvas.addEventListener('webglcontextlost', (event) => {
		event.preventDefault();
		stop();
		canvas.classList.remove('is-live');
	});
}
