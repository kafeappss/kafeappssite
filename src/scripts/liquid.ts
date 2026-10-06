/**
 * Metal líquido — um único corpo de líquido em WebGL que acompanha a navegação
 * e muda de forma para ilustrar o que está escrito.
 *
 * Cada seção (ou bloco) declara uma formação com data-liquid, por exemplo
 * data-liquid="clock" ou data-liquid="cup bottom" (forma + posicionamento).
 * Quando o elemento chega ao centro da tela, as peças do líquido escorrem e se
 * remodelam até a nova forma. No topo, o líquido ganha olhos: é o mascote.
 *
 * Sem WebGL, ou com "reduzir movimento" ativo no sistema, o site continua
 * funcionando com um fundo estático (e as formas aparecem sem animação).
 */

import { shapes, type Placement, type Prim, type ShapeDef } from './shapes';

const SLOTS = 14;
const STORAGE_KEY = 'kafe:liquid:v2';

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

#define SLOTS ${SLOTS}

uniform vec2 uRes;
uniform float uTime;
uniform float uDim;
uniform float uK;
uniform float uBevel;
uniform float uWob;
uniform float uChrome;
uniform vec2 uLight;
uniform vec4 uA[SLOTS];
uniform vec4 uB[SLOTS];
uniform vec3 uCur;
uniform vec4 uEye;
uniform vec4 uEye2;

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

float smin(float a, float b, float k) {
	float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
	return mix(b, a, h) - k * h * (1.0 - h);
}

float smax(float a, float b, float k) {
	return -smin(-a, -b, k);
}

float sdRBox(vec2 p, vec2 b, float r) {
	r = min(r, min(b.x, b.y));
	vec2 q = abs(p) - b + r;
	return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float prim(vec2 p, vec4 a, vec4 b) {
	vec2 q = p - a.xy;
	float c = cos(b.y);
	float s = sin(b.y);
	q = vec2(c * q.x + s * q.y, -s * q.x + c * q.y);
	float d = sdRBox(q, a.zw, b.x);
	if (b.z > 0.0) d = abs(d) - b.z;
	return d;
}

// Combina as peças em ordem: união suave ou buraco suave.
float field(vec2 p) {
	p += uWob * vec2(sin(p.y * 7.0 + uTime * 0.9), cos(p.x * 6.0 - uTime * 0.7));
	float d = 8.0;
	for (int i = 0; i < SLOTS; i++) {
		vec4 a = uA[i];
		if (max(a.z, a.w) < 0.002) continue;
		vec4 b = uB[i];
		float di = prim(p, a, b);
		d = b.w > 0.0 ? smin(d, di, uK) : smax(d, -di, uK * 0.6);
	}
	if (uCur.z > 0.002) d = smin(d, length(p - uCur.xy) - uCur.z, 0.18);
	return d;
}

float bevel(float d) {
	float t = clamp(-d / uBevel, 0.0, 1.0);
	return sqrt(1.0 - (1.0 - t) * (1.0 - t));
}

// Olhos do mascote: paralelogramos inclinados, como os recortes das letras do logo.
float eyes(vec2 p) {
	float s = uEye.z;
	vec2 q = p - uEye.xy - uEye2.xy * s * 0.22;
	float open = max(uEye2.z, 0.06);
	float d = 1e3;
	for (int j = 0; j < 2; j++) {
		float side = j == 0 ? -1.0 : 1.0;
		vec2 e = q - vec2(side * 0.34 * s, 0.1 * s);
		e.x -= e.y * 0.3;
		d = min(d, sdRBox(e, vec2(0.085 * s, 0.2 * s * open), 0.02 * s));
	}
	return d;
}

void main() {
	vec2 uv = gl_FragCoord.xy / uRes;
	float aspect = uRes.x / uRes.y;
	vec2 p = (uv * 2.0 - 1.0) * vec2(aspect, 1.0);
	float px = 2.0 / uRes.y;

	float d = field(p);
	vec3 col = BG;

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
		float slope = uBevel * 0.5;
		vec3 n = normalize(vec3((h - hx) / e * slope, (h - hy) / e * slope, 1.0));

		vec3 V = vec3(0.0, 0.0, 1.0);
		vec3 L = normalize(vec3(-0.45 + uLight.x * 0.35, 0.6 + uLight.y * 0.25, 0.66));
		vec3 L2 = normalize(vec3(0.7, -0.35, 0.6));
		float diff = max(dot(n, L), 0.0);
		float spec = pow(max(dot(n, normalize(L + V)), 0.0), 140.0);
		float spec2 = pow(max(dot(n, normalize(L2 + V)), 0.0), 36.0);
		float fres = pow(1.0 - max(n.z, 0.0), 2.2);

		// Metal escuro: o corpo é quase preto, a cor vem dos reflexos.
		vec3 liquid = mix(vec3(0.22), mix(vec3(0.045 + 0.05 * uChrome), vec3(0.01), smoothstep(0.35, 1.0, h)), smoothstep(0.0, 0.42, h));
		float swirl = fbm(p * 2.1 + vec2(uTime * 0.05, -uTime * 0.03));
		liquid += vec3(0.05) * smoothstep(0.55, 0.92, swirl) * h;
		liquid *= 0.6 + 0.5 * diff;

		vec3 r = reflect(-V, n);
		float sky = smoothstep(0.15, 0.85, r.y);
		float horizon = exp(-pow((r.y + 0.08) * 9.0, 2.0));
		float side = smoothstep(0.35, 0.95, r.x) * smoothstep(-0.5, 0.3, r.y);
		vec3 env = vec3(0.015) + vec3(1.0) * sky * 0.95 + vec3(0.5) * horizon + vec3(0.3) * side;
		env *= smoothstep(0.98, 0.3, r.z);
		liquid = mix(liquid, env, clamp(mix(0.1, 0.4, uChrome) + fres * 0.9, 0.0, 1.0));
		liquid += vec3(1.0) * spec * (1.0 + 0.6 * uChrome);
		liquid += vec3(0.7) * spec2 * 0.3;

		col = mix(col, liquid, smoothstep(px, -px, d));
	}

	if (uEye.w > 0.01) {
		float ed = eyes(p);
		col = mix(col, vec3(1.0), smoothstep(px, -px, ed) * uEye.w);
		col += vec3(1.0) * exp(-max(ed, 0.0) * 55.0) * 0.18 * uEye.w;
	}

	col = mix(BG, col, 0.4 + 0.6 * uDim);
	vec2 vv = uv - 0.5;
	col *= 1.0 - dot(vv, vv) * 0.5;
	col += (hash(gl_FragCoord.xy + fract(uTime * 7.0) * 100.0) - 0.5) / 255.0;
	gl_FragColor = vec4(col, 1.0);
}
`;

/* ---------------------------------------------------------------------------
   Física
   --------------------------------------------------------------------------- */

type Slot = {
	/** x, y, w, h, r, rot, shell */
	v: number[];
	vel: number[];
	op: number;
	phase: number;
	ampX: number;
	ampY: number;
	freqX: number;
	freqY: number;
	drag: number;
};

type Formation = { name: string; def: ShapeDef; place: Placement };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const random = (seed: number) => {
	const x = Math.sin(seed * 91.17 + 7.31) * 43758.5453;
	return x - Math.floor(x);
};

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

function parseFormation(value: string | undefined): Formation {
	const [name = 'page', place] = (value ?? 'page').trim().split(/\s+/);
	const def: ShapeDef = (shapes as Record<string, ShapeDef>)[name] ?? shapes.page;
	const resolved = name in shapes ? name : 'page';
	return { name: resolved, def, place: (place as Placement) ?? def.place ?? 'stage' };
}

/** Onde a forma fica na tela: centro (cx, cy) e escala, em unidades do WebGL. */
function placementOf(place: Placement, aspect: number, isMascot: boolean) {
	const R = Math.min(aspect, 1);
	const portrait = aspect < 0.9;
	// No celular o texto ocupa a largura toda: as formas ficam menores, num canto
	// e mais discretas, para nunca competir com o conteúdo.
	switch (place) {
		case 'view':
			return { cx: 0, cy: 0, s: R, sx: aspect, view: true, dim: 1 };
		case 'bottom':
			return portrait
				? { cx: 0, cy: -0.74, s: 0.36 * R, sx: 0, view: false, dim: 0.8 }
				: { cx: 0, cy: -0.68, s: 0.27, sx: 0, view: false, dim: 1 };
		case 'center':
			return { cx: 0, cy: 0, s: portrait ? 0.62 * R : 0.38, sx: 0, view: false, dim: 1 };
		default:
			if (portrait) {
				return isMascot
					? { cx: 0.5 * aspect, cy: -0.76, s: 0.3 * R, sx: 0, view: false, dim: 1 }
					: { cx: 0.64 * aspect, cy: 0.6, s: 0.3 * R, sx: 0, view: false, dim: 0.5 };
			}
			if (aspect < 1.25) return { cx: 0.6 * aspect, cy: 0, s: 0.3, sx: 0, view: false, dim: 1 };
			return { cx: 0.52 * aspect, cy: 0, s: isMascot ? 0.36 : 0.4, sx: 0, view: false, dim: 1 };
	}
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

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	const aPos = gl.getAttribLocation(program, 'aPos');
	gl.enableVertexAttribArray(aPos);
	gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

	const u = (name: string) => gl.getUniformLocation(program, name);
	const uniforms = {
		res: u('uRes'),
		time: u('uTime'),
		dim: u('uDim'),
		k: u('uK'),
		bevel: u('uBevel'),
		wob: u('uWob'),
		chrome: u('uChrome'),
		light: u('uLight'),
		a: u('uA[0]'),
		b: u('uB[0]'),
		cur: u('uCur'),
		eye: u('uEye'),
		eye2: u('uEye2'),
	};
	const dataA = new Float32Array(SLOTS * 4);
	const dataB = new Float32Array(SLOTS * 4);

	// ---------------------------------------------------------------- estado
	let width = 1;
	let height = 1;
	let aspect = 1;
	let quality = window.innerWidth < 768 ? 0.7 : 0.72;
	let time = 0;
	let running = false;
	let frame = 0;
	let lastFrame = 0;
	let skipFrame = false;
	let lastInteraction = performance.now();

	const globals = { dim: 1, k: 0.2, bevel: 0.15, wob: 0.011, chrome: 0 };
	const eye = { alpha: 0, open: 1, gx: 0, gy: 0, nextBlink: 2, blinkUntil: 0, happyUntil: 0 };

	const slots: Slot[] = Array.from({ length: SLOTS }, (_, i) => ({
		v: [0, 0, 0, 0, 0, 0, 0],
		vel: [0, 0, 0, 0, 0, 0, 0],
		op: 1,
		phase: random(i + 1) * Math.PI * 2,
		ampX: 0.02 + random(i + 11) * 0.04,
		ampY: 0.02 + random(i + 21) * 0.04,
		freqX: 0.18 + random(i + 31) * 0.22,
		freqY: 0.16 + random(i + 41) * 0.22,
		drag: 0.6 + random(i + 51) * 0.8,
	}));
	const cursor = { x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0 };
	const pointer = { x: 0, y: 0, active: false, lastMove: 0, lightX: 0, lightY: 0 };

	const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-liquid]'));
	let formation = parseFormation(sections[0]?.dataset.liquid);
	let formationEl: HTMLElement | undefined = sections[0];

	/**
	 * Se a seção tiver um espaço reservado ([data-liquid-anchor] visível), a forma
	 * mora ali e rola junto com o conteúdo, como o mascote no celular.
	 */
	function anchorPlacement() {
		const anchor = formationEl?.querySelector<HTMLElement>('[data-liquid-anchor]');
		if (!anchor) return null;
		const r = anchor.getBoundingClientRect();
		if (!r.width || !r.height) return null;
		const c = canvas.getBoundingClientRect();
		return {
			cx: (((r.left + r.width / 2 - c.left) / c.width) * 2 - 1) * aspect,
			cy: 1 - ((r.top + r.height / 2 - c.top) / c.height) * 2,
			s: (Math.min(r.height, r.width * 0.6) / c.height) * 0.95,
			sx: 0,
			view: false,
			dim: 1,
			anchored: true,
		};
	}

	function currentPlacement() {
		return anchorPlacement() ?? { ...placementOf(formation.place, aspect, Boolean(formation.def.eyes)), anchored: false };
	}

	const hit = document.querySelector<HTMLElement>('[data-mascot-hit]');
	const bubble = document.querySelector<HTMLElement>('[data-mascot-bubble]');

	/** Alvos de cada peça para a formação atual, já em coordenadas da tela. */
	function targets(t: number, place = currentPlacement()) {
		const def = formation.def;
		const prims: Prim[] = def.prims.map((prim) => [...prim] as Prim);
		def.anim?.(t, prims);
		const drift = (def.drift ?? 1) * (place.view ? 1 : place.s * 2.2);
		const out: { v: number[]; op: number }[] = [];
		let sumX = 0;
		let sumY = 0;
		for (let i = 0; i < SLOTS; i++) {
			const prim = prims[i];
			if (!prim) {
				out.push({ v: [], op: 0 });
				continue;
			}
			const slot = slots[i];
			const [x, y, w, h, r, rot, shell, op] = prim;
			const wx = place.view ? x * place.sx : place.cx + x * place.s;
			const wy = place.view ? y : place.cy + y * place.s;
			const dx = slot.ampX * drift * Math.sin(t * slot.freqX + slot.phase);
			const dy = slot.ampY * drift * Math.cos(t * slot.freqY + slot.phase * 1.3);
			const v = [wx + dx, wy + dy, w * place.s, h * place.s, r * place.s, rot, shell * place.s];
			sumX += v[0];
			sumY += v[1];
			out.push({ v, op });
		}
		const count = Math.max(1, prims.length);
		const centerX = sumX / count;
		const centerY = sumY / count;
		// Peças que sobram derretem para dentro da forma.
		for (let i = prims.length; i < SLOTS; i++) {
			out[i] = { v: [centerX, centerY, 0, 0, 0, slots[i].v[5], 0], op: slots[i].op };
		}
		return out;
	}

	function settle() {
		const place = currentPlacement();
		const out = targets(time, place);
		out.forEach(({ v, op }, i) => {
			slots[i].v = [...v];
			slots[i].vel = [0, 0, 0, 0, 0, 0, 0];
			slots[i].op = op || slots[i].op;
		});
		const def = formation.def;
		globals.dim = (def.dim ?? 0.95) * place.dim;
		globals.k = def.k ?? 0.2;
		globals.bevel = def.bevel ?? 0.15;
		globals.wob = def.wob ?? 0.011;
		globals.chrome = def.chrome ?? 0;
		eye.alpha = def.eyes ? 1 : 0;
	}

	function resize() {
		const rect = canvas.getBoundingClientRect();
		const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
		const nextWidth = Math.max(1, Math.round(rect.width * dpr * quality));
		const nextHeight = Math.max(1, Math.round(rect.height * dpr * quality));
		aspect = rect.width / Math.max(rect.height, 1);
		if (nextWidth === width && nextHeight === height) return;
		width = canvas.width = nextWidth;
		height = canvas.height = nextHeight;
		gl!.viewport(0, 0, width, height);
		if (reducedMotion) settle();
	}

	// ----------------------------------------------------- continuidade entre páginas
	function restore() {
		try {
			const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
			if (!saved || Date.now() - saved.savedAt > 15 * 60 * 1000) return false;
			time = Number(saved.time) || 0;
			(saved.slots as { v: number[]; op: number }[]).slice(0, SLOTS).forEach((s, i) => {
				slots[i].v = s.v.slice(0, 7);
				slots[i].op = s.op;
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
				JSON.stringify({ savedAt: Date.now(), time, slots: slots.map((s) => ({ v: s.v, op: s.op })) }),
			);
		} catch {
			// Armazenamento indisponível (aba anônima, por exemplo): sem problemas.
		}
	}

	// ------------------------------------------------------------ formações
	const visible = new Set<HTMLElement>();
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				const element = entry.target as HTMLElement;
				if (entry.isIntersecting) visible.add(element);
				else visible.delete(element);
			}
			const current = sections.filter((section) => visible.has(section)).at(-1);
			if (!current) return;
			const next = parseFormation(current.dataset.liquid);
			if (current === formationEl || (next.name === formation.name && next.place === formation.place)) {
				formationEl = current;
				return;
			}
			formation = next;
			formationEl = current;
			if (reducedMotion) {
				settle();
				render();
			}
		},
		{ rootMargin: '-45% 0px -45% 0px' },
	);
	sections.forEach((section) => observer.observe(section));

	// --------------------------------------------------------- interação
	let lastScroll = window.scrollY;
	const toWorld = (clientX: number, clientY: number) => {
		const rect = canvas.getBoundingClientRect();
		return { x: ((clientX / rect.width) * 2 - 1) * aspect, y: -((clientY / rect.height) * 2 - 1) };
	};

	if (!reducedMotion) {
		window.addEventListener(
			'pointermove',
			(event) => {
				const world = toWorld(event.clientX, event.clientY);
				pointer.x = world.x;
				pointer.y = world.y;
				pointer.active = finePointer || event.pointerType === 'mouse';
				pointer.lastMove = performance.now();
				lastInteraction = pointer.lastMove;
			},
			{ passive: true },
		);
		document.documentElement.addEventListener('pointerleave', () => {
			pointer.active = false;
		});
	}

	/** Cutucada no mascote: ele pula, as gotinhas se espalham e os olhos sorriem. */
	window.addEventListener('kafe:mascot-poke', () => {
		lastInteraction = performance.now();
		eye.happyUntil = time + 1.1;
		const body = slots[0];
		body.vel[2] += 1.6;
		body.vel[3] -= 1.6;
		body.vel[1] += 1.2;
		for (let i = 1; i < 6; i++) {
			const s = slots[i];
			const dx = s.v[0] - body.v[0];
			const dy = s.v[1] - body.v[1];
			const len = Math.hypot(dx, dy) || 1;
			s.vel[0] += (dx / len) * 1.4;
			s.vel[1] += (dy / len) * 1.4;
		}
		if (reducedMotion) render();
	});

	// ------------------------------------------------------------- física
	function step(dt: number) {
		time += dt;
		const now = performance.now();
		if (pointer.active && now - pointer.lastMove > 4000) pointer.active = false;

		const scrollY = window.scrollY;
		const scrollDelta = clamp(scrollY - lastScroll, -160, 160);
		if (scrollDelta !== 0) lastInteraction = now;
		lastScroll = scrollY;
		const def = formation.def;
		const place = currentPlacement();
		// Formas ancoradas já acompanham a rolagem; o empurrão extra seria em dobro.
		const impulse = place.anchored
			? 0
			: (scrollDelta / Math.max(window.innerHeight, 1)) * 2 * 2.4 * (def.inertia ?? 1);

		const out = targets(time, place);
		const stiffness = 6.5;
		const damping = 3.7;

		for (let i = 0; i < SLOTS; i++) {
			const slot = slots[i];
			const target = out[i];
			let tv = target.v;
			// Ao trocar entre "peça" e "buraco", a peça some antes de reaparecer.
			if (target.op && target.op !== slot.op) {
				tv = [...tv];
				tv[2] = tv[3] = tv[4] = 0;
				if (Math.max(slot.v[2], slot.v[3]) < 0.004) slot.op = target.op;
			}

			let tx = tv[0];
			let ty = tv[1];
			if (def.magnet && pointer.active && i > 0) {
				const dx = pointer.x - tx;
				const dy = pointer.y - ty;
				const distance = Math.hypot(dx, dy);
				if (distance < 0.6) {
					const pull = (1 - distance / 0.6) * 0.09;
					tx += dx * pull;
					ty += dy * pull;
				}
			}
			if (def.eyes && i === 0 && pointer.active) {
				tx += clamp(pointer.x - tx, -0.6, 0.6) * 0.05;
				ty += clamp(pointer.y - ty, -0.6, 0.6) * 0.05;
			}

			slot.vel[1] += impulse * slot.drag;
			const goal = [tx, ty, tv[2], tv[3], tv[4], tv[5], tv[6]];
			// Rotação pelo caminho mais curto.
			goal[5] = slot.v[5] + ((((goal[5] - slot.v[5] + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
			for (let k = 0; k < 7; k++) {
				slot.vel[k] += ((goal[k] - slot.v[k]) * stiffness - slot.vel[k] * damping) * dt;
				slot.vel[k] = clamp(slot.vel[k], -5, 5);
				slot.v[k] += slot.vel[k] * dt;
			}
			for (const k of [2, 3, 4, 6]) slot.v[k] = Math.max(0, slot.v[k]);
		}

		// Gota do cursor (só nas formações "orgânicas").
		const cursorTarget = pointer.active && def.magnet ? 0.055 * Math.min(aspect, 1) : 0;
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

		// Olhos: aparecem só no mascote, piscam e acompanham o cursor.
		eye.alpha += ((def.eyes ? 1 : 0) - eye.alpha) * Math.min(1, dt * 4);
		if (time > eye.nextBlink) {
			eye.blinkUntil = time + 0.14;
			eye.nextBlink = time + 2 + random(time) * 3.5;
		}
		const happy = time < eye.happyUntil;
		const openTarget = time < eye.blinkUntil ? 0.06 : happy ? 0.3 : 1;
		eye.open += (openTarget - eye.open) * Math.min(1, dt * 18);
		const body = slots[0].v;
		let gx = Math.sin(time * 0.5) * 0.4;
		let gy = Math.sin(time * 0.37) * 0.2;
		if (pointer.active) {
			const dx = pointer.x - body[0];
			const dy = pointer.y - body[1];
			const len = Math.hypot(dx, dy) || 1;
			const reach = Math.min(1, len / 0.6);
			gx = (dx / len) * reach;
			gy = (dy / len) * reach;
		}
		eye.gx += (gx - eye.gx) * Math.min(1, dt * 6);
		eye.gy += (gy - eye.gy) * Math.min(1, dt * 6);

		pointer.lightX += ((pointer.active ? pointer.x / aspect : 0) - pointer.lightX) * Math.min(1, dt * 2);
		pointer.lightY += ((pointer.active ? pointer.y : 0) - pointer.lightY) * Math.min(1, dt * 2);

		const ease = Math.min(1, dt * 2);
		globals.dim += ((def.dim ?? 0.95) * place.dim - globals.dim) * ease;
		globals.k += ((def.k ?? 0.2) - globals.k) * ease;
		globals.bevel += ((def.bevel ?? 0.15) - globals.bevel) * ease;
		globals.wob += ((def.wob ?? 0.011) - globals.wob) * ease;
		globals.chrome += ((def.chrome ?? 0) - globals.chrome) * ease;
	}

	/** Posiciona o botão invisível e o balão de fala sobre o mascote. */
	function placeMascotUi() {
		if (!hit && !bubble) return;
		const show = eye.alpha > 0.5;
		const body = slots[0].v;
		const rect = canvas.getBoundingClientRect();
		const sx = ((body[0] / aspect + 1) / 2) * rect.width;
		const sy = ((1 - body[1]) / 2) * rect.height;
		const radius = (Math.max(body[2], body[3]) / 2) * rect.height;
		if (hit) {
			hit.dataset.visible = String(show);
			hit.style.transform = `translate(${sx - radius}px, ${sy - radius}px)`;
			hit.style.width = hit.style.height = `${radius * 2}px`;
		}
		if (bubble) {
			bubble.dataset.visible = String(show);
			// No celular o balão encosta na margem direita para não cobrir o texto.
			const bx = rect.width < 640 ? rect.width - 16 : clamp(sx - radius * 0.35, 180, rect.width - 16);
			bubble.style.transform = `translate(${bx}px, ${sy - radius * 1.02}px)`;
		}
	}

	function render() {
		for (let i = 0; i < SLOTS; i++) {
			const v = slots[i].v;
			dataA.set([v[0], v[1], v[2], v[3]], i * 4);
			dataB.set([v[4], v[5], v[6], slots[i].op], i * 4);
		}
		const body = slots[0].v;
		gl!.uniform2f(uniforms.res, width, height);
		gl!.uniform1f(uniforms.time, time);
		gl!.uniform1f(uniforms.dim, globals.dim);
		gl!.uniform1f(uniforms.k, globals.k);
		gl!.uniform1f(uniforms.bevel, globals.bevel);
		gl!.uniform1f(uniforms.wob, globals.wob);
		gl!.uniform1f(uniforms.chrome, globals.chrome);
		gl!.uniform2f(uniforms.light, pointer.lightX, pointer.lightY);
		gl!.uniform4fv(uniforms.a, dataA);
		gl!.uniform4fv(uniforms.b, dataB);
		gl!.uniform3f(uniforms.cur, cursor.x, cursor.y, cursor.r);
		gl!.uniform4f(uniforms.eye, body[0], body[1], Math.min(body[2], body[3]), eye.alpha);
		gl!.uniform4f(uniforms.eye2, eye.gx, eye.gy, eye.open, 0);
		gl!.drawArrays(gl!.TRIANGLES, 0, 3);
		placeMascotUi();
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
				skipFrame = true;
			}
		}
	}

	function loop(now: number) {
		if (!running) return;
		frame = requestAnimationFrame(loop);
		const delta = lastFrame ? now - lastFrame : 16.7;
		// Parado (sem rolagem nem mouse), 30 quadros por segundo bastam e poupam bateria.
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
	if (reducedMotion) {
		settle();
	} else if (!restored) {
		// Primeira visita: as peças brotam e sobem até a posição inicial.
		targets(0).forEach(({ v, op }, i) => {
			slots[i].v = [v[0], v[1] - 0.5, 0, 0, 0, v[5], v[6]];
			slots[i].op = op || 1;
		});
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

	if (reducedMotion) {
		// Sem animação, a forma ancorada só precisa ser redesenhada ao rolar.
		window.addEventListener(
			'scroll',
			() => {
				if (!currentPlacement().anchored) return;
				settle();
				render();
			},
			{ passive: true },
		);
	}

	canvas.addEventListener('webglcontextlost', (event) => {
		event.preventDefault();
		stop();
		canvas.classList.remove('is-live');
	});

	// Ferramenta de inspeção: window.__liquid.show('clock') no console.
	(window as unknown as { __liquid: unknown }).__liquid = {
		show: (value: string) => {
			formation = parseFormation(value);
			formationEl = undefined;
			lastInteraction = performance.now();
		},
	};
}
