/**
 * Metal líquido — um único corpo de líquido em WebGL que acompanha a navegação
 * e muda de forma para ilustrar o que está escrito.
 *
 * - data-liquid="clock" (ou "cup bottom": forma + posicionamento) numa seção:
 *   quando ela chega ao centro da tela, o líquido escorre até virar essa forma.
 * - data-liquid-anchor num elemento dentro da seção: o espaço onde a forma mora.
 *   Ela rola junto com o conteúdo e nunca fica por cima do texto.
 * - data-liquid-hover="phone" num cartão: ao passar o mouse, o líquido vira a
 *   forma do cartão (no celular, vale o cartão que estiver no meio da tela).
 * - data-horizon numa seção: desenha o horizonte (a borda de um planeta) no fim dela.
 *
 * No início da home o líquido ganha olhos: é o mascote, com expressões e reações.
 * Sem WebGL, ou com "reduzir movimento" ativo no sistema, o site continua
 * funcionando com um fundo estático (e as formas aparecem sem animação).
 */

import { shapes, type Placement, type Prim, type ShapeDef } from './shapes';

const SLOTS = 14;
const STORAGE_KEY = 'kafe:liquid:v3';

const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPos;
void main() {
	gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const COMMON = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

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

float dot2(vec2 v) {
	return dot(v, v);
}
`;

/**
 * Fumaça e luz do fundo, desenhadas em baixa resolução (são suaves) numa
 * textura que o desenho principal usa. Assim a tela toda pode ser desenhada
 * na resolução real do aparelho sem pesar.
 */
const SMOKE_SHADER = /* glsl */ `
${COMMON}
uniform vec2 uRes;
uniform float uTime;
uniform float uScroll;

void main() {
	vec2 uv = gl_FragCoord.xy / uRes;
	float aspect = uRes.x / uRes.y;
	vec2 p = (uv * 2.0 - 1.0) * vec2(aspect, 1.0);
	vec2 q = p * 1.15 - vec2(0.0, uScroll * 0.25) + vec2(0.0, -uTime * 0.04);
	float warp = fbm(q * 0.8 + vec2(uTime * 0.02, -uTime * 0.015));
	float m = fbm(q + vec2(warp, warp * 0.6) * 1.5);
	float region = smoothstep(0.25, 0.75, noise(p * 0.45 - vec2(0.0, uScroll * 0.12) + uTime * 0.012));
	float smoke = smoothstep(0.38, 0.95, m) * (0.35 + 0.65 * region);
	vec2 lamp = vec2(sin(uTime * 0.07) * 1.1, cos(uTime * 0.05 + uScroll * 0.35) * 0.7);
	float lampGlow = exp(-dot2((p - lamp) * vec2(0.55, 0.8)) * 1.6);
	gl_FragColor = vec4(smoke, lampGlow, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
${COMMON}
#define SLOTS ${SLOTS}

uniform vec2 uRes;
uniform float uTime;
uniform float uDim;
uniform float uK;
uniform float uWob;
uniform float uCss;     // unidades do WebGL por pixel CSS
uniform vec2 uLight;
uniform vec4 uA[SLOTS];
uniform vec4 uB[SLOTS];
uniform vec3 uCur;
uniform vec4 uEye;     // x, y, raio do corpo, visibilidade
uniform vec4 uEye2;    // olhar x, olhar y, abertura esquerda, abertura direita
uniform vec4 uExpr;    // feliz, surpreso, bravo, apaixonado
uniform vec4 uExpr2;   // tonto, giro, brilho "de gota", -
uniform vec4 uGrid;    // espaçamento, raio do ponto, deslocamento da rolagem, rolagem
uniform vec3 uPtr;     // cursor x, y, ativo
uniform vec4 uHorizon; // centro x, centro y, raio, intensidade
uniform vec4 uBox;     // caixa que contém o líquido (min x, min y, max x, max y)
uniform vec3 uTint;    // cor do líquido
uniform vec3 uInk;     // cor dos olhos
uniform sampler2D uSmoke;

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

float sdSeg(vec2 p, vec2 a, vec2 b) {
	vec2 pa = p - a;
	vec2 ba = b - a;
	float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
	return length(pa - ba * h);
}

float sdArc(vec2 p, vec2 sc, float ra, float rb) {
	p.x = abs(p.x);
	return ((sc.y * p.x > sc.x * p.y) ? length(p - sc * ra) : abs(length(p) - ra)) - rb;
}

float sdHeart(vec2 p) {
	p.x = abs(p.x);
	if (p.y + p.x > 1.0) return sqrt(dot2(p - vec2(0.25, 0.75))) - 0.35355;
	return sqrt(min(dot2(p - vec2(0.0, 1.0)), dot2(p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
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

// Distância até a caixa do líquido (para pular o cálculo longe dele).
float boxDistance(vec2 p) {
	vec2 c = (uBox.xy + uBox.zw) * 0.5;
	vec2 h = (uBox.zw - uBox.xy) * 0.5;
	vec2 q = abs(p - c) - h;
	return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

// Combina as peças em ordem: união suave ou buraco suave.
float field(vec2 p) {
	p += uWob * vec2(sin(p.y * 7.0 + uTime * 0.9), cos(p.x * 6.0 - uTime * 0.7));
	float d = 8.0;
	for (int i = 0; i < SLOTS; i++) {
		vec4 a = uA[i];
		if (max(a.z, a.w) < 0.002) continue;
		vec4 b = uB[i];
		// Peças longe deste ponto não mudam o resultado: pula.
		float bound = length(p - a.xy) - length(a.zw) - b.z;
		if (b.w > 0.0) {
			if (bound > d + uK) continue;
			d = smin(d, prim(p, a, b), uK);
		} else {
			if (bound > uK * 0.6 - d) continue;
			d = smax(d, -prim(p, a, b), uK * 0.6);
		}
	}
	if (uCur.z > 0.002) d = smin(d, length(p - uCur.xy) - uCur.z, 0.18);
	return d;
}

/*
 * Um olho do mascote, em unidades do raio do corpo. A forma base é o recorte
 * inclinado das letras do logo; as expressões se misturam a ela:
 * feliz (arco), surpreso (círculo), bravo (> <), apaixonado (coração), tonto (X girando).
 */
float eyeShape(vec2 e, float side, float open) {
	vec2 b = e;
	b.x -= b.y * 0.3;
	float dBase = sdRBox(b, vec2(0.085, 0.2 * open), 0.02);
	float dHappy = sdArc(e - vec2(0.0, -0.08), vec2(0.913, 0.408), 0.14, 0.042);
	float dSurprise = length(e - vec2(0.0, 0.02)) - 0.165 * max(open, 0.25);
	vec2 c = vec2(e.x * -side, e.y);
	float dAngry = min(sdSeg(c, vec2(-0.08, 0.12), vec2(0.07, 0.0)), sdSeg(c, vec2(0.07, 0.0), vec2(-0.08, -0.12))) - 0.04;
	float dLove = sdHeart((e - vec2(0.0, -0.16)) / 0.32) * 0.32;
	float a = uExpr2.y * side;
	vec2 r = mat2(cos(a), -sin(a), sin(a), cos(a)) * e;
	float dDizzy = min(sdSeg(r, vec2(-0.11, -0.11), vec2(0.11, 0.11)), sdSeg(r, vec2(-0.11, 0.11), vec2(0.11, -0.11))) - 0.036;
	float wBase = max(0.0, 1.0 - uExpr.x - uExpr.y - uExpr.z - uExpr.w - uExpr2.x);
	float sum = max(wBase + uExpr.x + uExpr.y + uExpr.z + uExpr.w + uExpr2.x, 0.001);
	return (wBase * dBase + uExpr.x * dHappy + uExpr.y * dSurprise + uExpr.z * dAngry + uExpr.w * dLove + uExpr2.x * dDizzy) / sum;
}

float eyes(vec2 p) {
	float s = uEye.z;
	vec2 q = (p - uEye.xy) / s - uEye2.xy * 0.22;
	float left = eyeShape(q - vec2(-0.34, 0.1), -1.0, max(uEye2.z, 0.06));
	float right = eyeShape(q - vec2(0.34, 0.1), 1.0, max(uEye2.w, 0.06));
	return min(left, right) * s;
}

// Fundo: fumaça que flui, grade de pontos que reage ao cursor e o horizonte do início.
vec3 background(vec2 p, vec2 uv, float aura, float px) {
	vec2 sm = texture2D(uSmoke, uv).rg;
	float smoke = sm.r;
	float lampGlow = sm.g;
	vec3 col = vec3(0.95) * smoke * (0.075 + 0.04 * aura) + vec3(0.05) * lampGlow;

	vec2 g = vec2(p.x, p.y - uGrid.z);
	vec2 cell = floor(g / uGrid.x);
	vec2 local = (fract(g / uGrid.x) - 0.5) * uGrid.x;
	float dotMask = 1.0 - smoothstep(uGrid.y - px, uGrid.y + px, length(local));
	float seed = hash(cell);
	float twinkle = 0.5 + 0.5 * sin(uTime * (0.6 + seed * 1.4) + seed * 6.283);
	float nearCursor = exp(-dot2(p - uPtr.xy) * 7.0) * uPtr.z;
	float sweep = smoothstep(0.75, 1.0, sin((p.x * 0.55 + p.y) * 1.6 - uTime * 0.5 - uGrid.w * 0.6));
	float glow = 0.055 + 0.025 * twinkle + 0.34 * nearCursor + 0.22 * aura + 0.06 * sweep + 0.08 * smoke + 0.08 * lampGlow;
	vec2 edge = uv - 0.5;
	col += mix(vec3(1.0), uTint, aura) * glow * dotMask * (1.0 - dot(edge, edge) * 1.4);

	if (uHorizon.w > 0.001) {
		vec2 hp = p - uHorizon.xy;
		float len = max(length(hp), 0.0001);
		float hd = len - uHorizon.z;
		float lit = pow(clamp(dot(hp / len, normalize(vec2(-0.3, 1.0))) * 0.5 + 0.5, 0.0, 1.0), 8.0);
		float outside = smoothstep(-px, px, hd);
		float rim = exp(-abs(hd) * 150.0);
		float atmosphere = exp(-max(hd, 0.0) * 5.0) * outside;
		float inner = exp(min(hd, 0.0) * 14.0) * (1.0 - outside);
		float shimmer = 0.85 + 0.15 * sin(atan(hp.y, hp.x) * 40.0 + uTime * 0.6);
		col *= mix(1.0, outside, uHorizon.w);
		col += vec3(rim * 0.95 * shimmer + atmosphere * 0.22 + inner * 0.09) * lit * uHorizon.w;
	}
	return col;
}

void main() {
	vec2 uv = gl_FragCoord.xy / uRes;
	float aspect = uRes.x / uRes.y;
	vec2 p = (uv * 2.0 - 1.0) * vec2(aspect, 1.0);
	float px = 2.0 / uRes.y;

	// Longe do líquido, nem calcula a forma.
	float near = boxDistance(p);
	float d = near < 0.45 ? field(p) : 8.0;
	float aura = exp(-max(d, 0.0) * 6.0) * (1.0 - smoothstep(0.25, 0.45, near));
	vec3 col = background(p, uv, aura, px);
	float opacity = 0.2 + 0.8 * uDim * uDim;
	// Brilho suave em volta (2D, como uma luz que vaza da forma).
	col += uTint * aura * 0.09 * opacity;

	if (d < px * 2.0) {
		// 2D bem acabado: cor chapada, um degradê de cima para baixo e uma
		// borda de luz do lado de cima (e sombra leve embaixo). Sem volume 3D.
		float edgeW = uCss * 5.0;
		float boxH = max(uBox.w - uBox.y, 0.001);
		float top = clamp((p.y - uBox.y) / boxH, 0.0, 1.0);
		vec3 fill = uTint * (0.84 + 0.16 * top);
		float reach = uExpr2.z > 0.01 ? 4.0 : 1.5;
		if (d > -edgeW * reach) {
			float e = px;
			vec2 grad = vec2(field(p + vec2(e, 0.0)) - d, field(p + vec2(0.0, e)) - d);
			vec2 n = grad / max(length(grad), 1e-5);
			float facing = dot(n, normalize(vec2(-0.45 + uLight.x * 0.3, 0.9)));
			float band = 1.0 - smoothstep(0.0, edgeW, -d);
			fill += vec3(0.16) * max(facing, 0.0) * band;
			fill *= 1.0 - 0.16 * max(-facing, 0.0) * band;
			// Gotas e mascote ganham o reflexo curvo de desenho animado, rente à borda de cima.
			if (uExpr2.z > 0.01) {
				float inside = -d;
				float shine = smoothstep(edgeW * 1.2, edgeW * 1.8, inside) * (1.0 - smoothstep(edgeW * 2.4, edgeW * 3.4, inside));
				fill = mix(fill, vec3(1.0), shine * smoothstep(0.6, 0.95, facing) * 0.6 * uExpr2.z);
			}
		}
		float alpha = (1.0 - smoothstep(-px, px, d)) * opacity;
		col = mix(col, fill, alpha);
	}

	if (uEye.w > 0.01 && length(p - uEye.xy) < uEye.z * 1.4) {
		float ed = eyes(p);
		col = mix(col, uInk, (1.0 - smoothstep(-px, px, ed)) * uEye.w);
	}

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

type Place = { cx: number; cy: number; s: number; sx: number; view: boolean; dim: number; anchored: boolean };

type Expression = { happy: number; surprise: number; angry: number; love: number; dizzy: number };

/** Reações do mascote (disparadas por src/scripts/mascot.ts ou pelo próprio líquido). */
const REACTIONS: Record<string, number> = {
	happy: 1.3,
	surprise: 1.0,
	wink: 0.9,
	love: 1.9,
	dizzy: 2.6,
	angry: 1.5,
	giggle: 1.5,
	wake: 0.9,
	boing: 1.0,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const random = (seed: number) => {
	const x = Math.sin(seed * 91.17 + 7.31) * 43758.5453;
	return x - Math.floor(x);
};
const smooth = (a: number, b: number, x: number) => {
	const t = clamp((x - a) / (b - a), 0, 1);
	return t * t * (3 - 2 * t);
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

function createProgram(gl: WebGLRenderingContext, fragmentSource: string) {
	const vertex = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
	const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
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

/** Lê uma cor do CSS (ex.: --liquid: #ffffff) e devolve RGB de 0 a 1. */
function cssColor(name: string, fallback: [number, number, number]): [number, number, number] {
	const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	const match = raw.match(/^#?([0-9a-f]{6})$/i);
	if (!match) return fallback;
	const n = parseInt(match[1], 16);
	return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function parseFormation(value: string | undefined): Formation {
	const [name = 'page', place] = (value ?? 'page').trim().split(/\s+/);
	const def: ShapeDef = (shapes as Record<string, ShapeDef>)[name] ?? shapes.page;
	const resolved = name in shapes ? name : 'page';
	return { name: resolved, def, place: (place as Placement) ?? def.place ?? 'stage' };
}

/** Onde a forma fica quando a seção não reserva um espaço para ela (em unidades do WebGL). */
function placementOf(place: Placement, aspect: number, isMascot: boolean): Place {
	const R = Math.min(aspect, 1);
	const portrait = aspect < 0.9;
	const at = (cx: number, cy: number, s: number, dim = 1): Place => ({ cx, cy, s, sx: 0, view: false, dim, anchored: false });
	// No celular o texto ocupa a largura toda: as formas ficam menores, num canto
	// e mais discretas, para nunca competir com o conteúdo.
	switch (place) {
		case 'view':
			return { cx: 0, cy: 0, s: R, sx: aspect, view: true, dim: 1, anchored: false };
		case 'bottom':
			return portrait ? at(0, -0.74, 0.36 * R, 0.8) : at(0, -0.68, 0.27);
		case 'center':
			return at(0, 0, portrait ? 0.62 * R : 0.38);
		default:
			if (portrait) return isMascot ? at(0.5 * aspect, -0.76, 0.3 * R) : at(0.64 * aspect, 0.6, 0.3 * R, 0.5);
			if (aspect < 1.25) return at(0.6 * aspect, 0, 0.3);
			return at(0.52 * aspect, 0, isMascot ? 0.36 : 0.4);
	}
}

export function initLiquid(canvas: HTMLCanvasElement) {
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	const gl = canvas.getContext('webgl', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		premultipliedAlpha: false,
		preserveDrawingBuffer: false,
	});
	if (!gl) return;

	const program = createProgram(gl, FRAGMENT_SHADER);
	const smokeProgram = createProgram(gl, SMOKE_SHADER);
	if (!program || !smokeProgram) return;

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	const drawWith = (target: WebGLProgram) => {
		gl.useProgram(target);
		const aPos = gl.getAttribLocation(target, 'aPos');
		gl.enableVertexAttribArray(aPos);
		gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
	};

	// Textura (em baixa resolução) onde a fumaça do fundo é desenhada.
	const smokeTexture = gl.createTexture();
	const smokeBuffer = gl.createFramebuffer();
	let smokeW = 1;
	let smokeH = 1;
	function sizeSmoke(w: number, h: number) {
		smokeW = Math.max(1, Math.round(w / 4));
		smokeH = Math.max(1, Math.round(h / 4));
		gl!.bindTexture(gl!.TEXTURE_2D, smokeTexture);
		gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, smokeW, smokeH, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null);
		gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
		gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
		gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
		gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
		gl!.bindFramebuffer(gl!.FRAMEBUFFER, smokeBuffer);
		gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, smokeTexture, 0);
		gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
	}
	const smokeUniforms = {
		res: gl.getUniformLocation(smokeProgram, 'uRes'),
		time: gl.getUniformLocation(smokeProgram, 'uTime'),
		scroll: gl.getUniformLocation(smokeProgram, 'uScroll'),
	};

	const u = (name: string) => gl.getUniformLocation(program, name);
	const uniforms = {
		res: u('uRes'),
		time: u('uTime'),
		dim: u('uDim'),
		k: u('uK'),
		wob: u('uWob'),
		css: u('uCss'),
		box: u('uBox'),
		tint: u('uTint'),
		ink: u('uInk'),
		smoke: u('uSmoke'),
		light: u('uLight'),
		a: u('uA[0]'),
		b: u('uB[0]'),
		cur: u('uCur'),
		eye: u('uEye'),
		eye2: u('uEye2'),
		expr: u('uExpr'),
		expr2: u('uExpr2'),
		grid: u('uGrid'),
		ptr: u('uPtr'),
		horizon: u('uHorizon'),
	};
	const dataA = new Float32Array(SLOTS * 4);
	const dataB = new Float32Array(SLOTS * 4);

	// ---------------------------------------------------------------- estado
	let width = 1;
	let height = 1;
	let cssW = 1;
	let cssH = 1;
	let aspect = 1;
	// Resolução real do aparelho (até 2x): as bordas ficam nítidas como o texto.
	let quality = 1;
	let tint = cssColor('--liquid', [1, 1, 1]);
	let ink = cssColor('--liquid-ink', [0.02, 0.02, 0.02]);
	let time = 0;
	let running = false;
	let frame = 0;
	let lastFrame = 0;
	let skipFrame = false;
	let lastInteraction = performance.now();

	const globals = { dim: 1, k: 0.2, wob: 0.011, shine: 1, settle: 0 };
	const eye = { alpha: 0, gx: 0, gy: 0, openL: 1, openR: 1, nextBlink: 2, blinkUntil: 0, spin: 0 };
	const expr: Expression = { happy: 0, surprise: 0, angry: 0, love: 0, dizzy: 0 };
	const mascot = {
		reaction: '',
		start: -10,
		until: -10,
		boost: 0,
		pressed: false,
		dragging: false,
		downX: 0,
		downY: 0,
		tickle: 0,
		tickleReadyAt: 0,
		sleeping: false,
		lastInput: performance.now(),
		lookEl: null as HTMLElement | null,
		lookLove: false,
	};

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
	const pointer = { x: 0, y: 0, active: false, lastMove: 0, lightX: 0, lightY: 0, speed: 0, glow: 0 };

	// ------------------------------------------------------------ formações
	// Com mouse, os cartões (data-liquid-hover) mudam a forma ao passar o mouse.
	// Em telas de toque, eles entram na fila normal: vale o que estiver no meio da tela.
	const hoverMode = finePointer && !reducedMotion;
	const targetEls = Array.from(document.querySelectorAll<HTMLElement>('[data-liquid], [data-liquid-hover]')).filter(
		(el) => el.hasAttribute('data-liquid') || !hoverMode,
	);
	const formationOf = (el: HTMLElement | undefined) => el?.dataset.liquid ?? el?.dataset.liquidHover;
	let observed: HTMLElement | undefined = targetEls[0];
	let hovered: HTMLElement | null = null;
	let formationEl: HTMLElement | undefined = observed;
	let formation = parseFormation(formationOf(observed));
	let lastPlace: Place = placementOf('stage', 1.6, false);

	let activeEl: HTMLElement | undefined;
	function refreshFormation() {
		const el = hovered ?? observed;
		if (!el) return;
		// Marca o elemento em foco (ex.: o cartão esconde o ícone enquanto o líquido está nele).
		if (activeEl !== el) {
			activeEl?.removeAttribute('data-liquid-active');
			el.setAttribute('data-liquid-active', '');
			activeEl = el;
		}
		formationEl = el;
		formation = parseFormation(formationOf(el));
		lastInteraction = performance.now();
		if (reducedMotion) {
			settle();
			render();
		}
	}

	const ownAnchors = new WeakMap<HTMLElement, HTMLElement[]>();
	function anchorsOf(el: HTMLElement) {
		let list = ownAnchors.get(el);
		if (!list) {
			list = Array.from(el.querySelectorAll<HTMLElement>('[data-liquid-anchor]')).filter(
				(anchor) => anchor.closest('[data-liquid], [data-liquid-hover]') === el,
			);
			ownAnchors.set(el, list);
		}
		return list;
	}

	/**
	 * O espaço reservado para a forma: o primeiro [data-liquid-anchor] visível da
	 * seção. Cartões sem espaço próprio visível usam o da seção em que estão.
	 */
	function anchorPlacement(): Place | null {
		if (!formationEl || formation.place === 'view') return null;
		let node: HTMLElement | null = formationEl;
		while (node) {
			for (const anchor of anchorsOf(node)) {
				const r = anchor.getBoundingClientRect();
				if (r.width > 0 && r.height > 0) {
					const scale = Number(anchor.dataset.liquidAnchor) || 1;
					return {
						cx: (((r.left + r.width / 2) / cssW) * 2 - 1) * aspect,
						cy: 1 - ((r.top + r.height / 2) / cssH) * 2,
						s: (Math.min(r.height, r.width * 0.8) / cssH) * 0.95 * scale,
						sx: 0,
						view: false,
						dim: 1,
						anchored: true,
					};
				}
			}
			if (!node.hasAttribute('data-liquid-hover')) break;
			node = node.parentElement?.closest<HTMLElement>('[data-liquid], [data-liquid-hover]') ?? null;
		}
		return null;
	}

	function currentPlacement(): Place {
		return anchorPlacement() ?? placementOf(formation.place, aspect, Boolean(formation.def.eyes));
	}

	/** Formas pequenas pedem fusão e chanfro proporcionais, senão viram uma bolha. */
	function detailScale(place: Place) {
		return place.view ? 1 : clamp(place.s / 0.4, 0.22, 1.6);
	}

	const hit = document.querySelector<HTMLElement>('[data-mascot-hit]');
	const bubble = document.querySelector<HTMLElement>('[data-mascot-bubble]');
	const horizonEl = document.querySelector<HTMLElement>('[data-horizon]');

	const emit = (kind: string) => window.dispatchEvent(new CustomEvent('kafe:mascot-event', { detail: kind }));

	/** Alvos de cada peça para a formação atual, já em coordenadas da tela. */
	function targets(t: number, place = currentPlacement()) {
		const def = formation.def;
		const prims: Prim[] = def.prims.map((prim) => [...prim] as Prim);
		def.anim?.(def.eyes ? t + mascot.boost : t, prims);
		const drift = (def.drift ?? 1) * (place.view ? 1 : place.s * 2.2);
		// Formas nítidas flutuam inteiras (as peças não se desalinham).
		const rigid = (def.chrome ?? 0) > 0.5;
		const lead = slots[0];
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
			const src = rigid ? lead : slot;
			const dx = src.ampX * drift * Math.sin(t * src.freqX + src.phase);
			const dy = src.ampY * drift * Math.cos(t * src.freqY + src.phase * 1.3);
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

	/**
	 * Enquanto a forma se transforma, as peças se fundem como líquido; quando ela
	 * assenta, as junções ficam firmes e a superfície para de ondular.
	 */
	function applyGlobals(place: Place, ease: number) {
		const def = formation.def;
		const detail = detailScale(place);
		const crisp = (def.chrome ?? 0) > 0.5;
		const loose = 1 - globals.settle;
		const goal = {
			dim: (def.dim ?? 0.95) * place.dim,
			k: (def.k ?? 0.2) * detail * (crisp ? 1 + 2.2 * loose : 1),
			wob: (def.wob ?? 0.011) * detail * (crisp ? loose : 1),
			shine: crisp ? 0 : 1,
		};
		for (const key of Object.keys(goal) as (keyof typeof goal)[]) {
			globals[key] += (goal[key] - globals[key]) * ease;
		}
	}

	/** 0 = peças em movimento (transformando), 1 = forma assentada. */
	function measureSettle(dt: number) {
		let motion = 0;
		let count = 0;
		for (const slot of slots) {
			if (Math.max(slot.v[2], slot.v[3]) < 0.004) continue;
			motion += Math.abs(slot.vel[0]) + Math.abs(slot.vel[1]) + Math.abs(slot.vel[2]) + Math.abs(slot.vel[3]);
			count++;
		}
		motion /= Math.max(count, 1) * Math.max(lastPlace.s, 0.12);
		const goal = 1 - smooth(0.12, 0.6, motion);
		globals.settle += (goal - globals.settle) * Math.min(1, dt * (goal > globals.settle ? 2.5 : 8));
	}

	function settle() {
		const place = currentPlacement();
		lastPlace = place;
		const out = targets(time, place);
		out.forEach(({ v, op }, i) => {
			slots[i].v = [...v];
			slots[i].vel = [0, 0, 0, 0, 0, 0, 0];
			slots[i].op = op || slots[i].op;
		});
		globals.settle = 1;
		applyGlobals(place, 1);
		eye.alpha = formation.def.eyes ? 1 : 0;
	}

	function resize() {
		const rect = canvas.getBoundingClientRect();
		cssW = Math.max(rect.width, 1);
		cssH = Math.max(rect.height, 1);
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const nextWidth = Math.max(1, Math.round(cssW * dpr * quality));
		const nextHeight = Math.max(1, Math.round(cssH * dpr * quality));
		aspect = cssW / cssH;
		if (nextWidth === width && nextHeight === height) return;
		width = canvas.width = nextWidth;
		height = canvas.height = nextHeight;
		sizeSmoke(width, height);
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

	const visible = new Set<HTMLElement>();
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				const element = entry.target as HTMLElement;
				if (entry.isIntersecting) visible.add(element);
				else visible.delete(element);
			}
			const current = targetEls.filter((el) => visible.has(el)).at(-1);
			if (!current || current === observed) return;
			observed = current;
			if (!hovered) refreshFormation();
		},
		{ rootMargin: '-45% 0px -45% 0px' },
	);
	targetEls.forEach((el) => observer.observe(el));

	if (hoverMode) {
		document.querySelectorAll<HTMLElement>('[data-liquid-hover]').forEach((el) => {
			const enter = () => {
				hovered = el;
				refreshFormation();
			};
			const leave = () => {
				if (hovered !== el) return;
				hovered = null;
				refreshFormation();
			};
			el.addEventListener('pointerenter', enter);
			el.addEventListener('pointerleave', leave);
			el.addEventListener('focusin', enter);
			el.addEventListener('focusout', leave);
		});
	}

	// --------------------------------------------------------- interação
	let lastScroll = window.scrollY;
	const toWorld = (clientX: number, clientY: number) => ({
		x: ((clientX / cssW) * 2 - 1) * aspect,
		y: -((clientY / cssH) * 2 - 1),
	});
	const markInput = () => {
		mascot.lastInput = performance.now();
	};

	if (!reducedMotion) {
		window.addEventListener(
			'pointermove',
			(event) => {
				const now = performance.now();
				const world = toWorld(event.clientX, event.clientY);
				const dt = Math.max((now - pointer.lastMove) / 1000, 0.008);
				const speed = Math.hypot(world.x - pointer.x, world.y - pointer.y) / dt;
				pointer.speed = pointer.active ? Math.min(speed, 12) : 0;
				pointer.x = world.x;
				pointer.y = world.y;
				pointer.active = finePointer || event.pointerType === 'mouse';
				pointer.lastMove = now;
				lastInteraction = now;
				markInput();
			},
			{ passive: true },
		);
		document.documentElement.addEventListener('pointerleave', () => {
			pointer.active = false;
		});
		window.addEventListener('scroll', markInput, { passive: true });
		window.addEventListener('keydown', markInput);
		window.addEventListener('pointerdown', markInput, { passive: true });
	}

	// ----------------------------------------------------------- mascote
	function burst(strength: number) {
		const body = slots[0];
		for (let i = 1; i < 6; i++) {
			const s = slots[i];
			const dx = s.v[0] - body.v[0];
			const dy = s.v[1] - body.v[1];
			const len = Math.hypot(dx, dy) || 1;
			s.vel[0] += (dx / len) * strength;
			s.vel[1] += (dy / len) * strength;
		}
	}

	/** Dispara uma reação: expressão + movimento do corpo. */
	function react(type: string) {
		if (!(type in REACTIONS)) return;
		lastInteraction = performance.now();
		mascot.reaction = type;
		mascot.start = time;
		mascot.until = time + REACTIONS[type];
		const body = slots[0];
		// Impulsos proporcionais ao tamanho do corpo: ~20% de deformação, nunca uma "salsicha".
		const R = Math.max(lastPlace.s * 0.82, 0.05);
		switch (type) {
			case 'happy':
				body.vel[1] += 1.9 * R;
				body.vel[2] += 1.0 * R;
				body.vel[3] -= 1.0 * R;
				burst(2.4 * R);
				break;
			case 'surprise':
			case 'wake':
			case 'boing':
				body.vel[3] += 1.2 * R;
				body.vel[2] -= 0.7 * R;
				body.vel[1] += 0.8 * R;
				burst(3.4 * R);
				break;
			case 'wink':
				body.vel[1] += 1.0 * R;
				body.vel[0] += 0.6 * R;
				break;
			case 'love':
				body.vel[2] += 0.7 * R;
				body.vel[3] += 0.7 * R;
				break;
			case 'dizzy':
				burst(4.5 * R);
				break;
			case 'angry':
				body.vel[2] += 1.0 * R;
				body.vel[3] -= 0.8 * R;
				break;
			case 'giggle':
				burst(1.8 * R);
				break;
		}
		if (reducedMotion) render();
	}

	window.addEventListener('kafe:mascot-react', (event) => react(String((event as CustomEvent).detail)));

	// Arrastar o mascote (com mouse): ele estica como goma e volta com um "boing".
	if (hit && !reducedMotion) {
		hit.addEventListener('pointerdown', (event) => {
			if (event.pointerType === 'touch' || event.button !== 0) return;
			mascot.pressed = true;
			mascot.downX = event.clientX;
			mascot.downY = event.clientY;
			hit.setPointerCapture(event.pointerId);
		});
		hit.addEventListener('pointermove', (event) => {
			if (!mascot.pressed || mascot.dragging) return;
			if (Math.hypot(event.clientX - mascot.downX, event.clientY - mascot.downY) > 8) {
				mascot.dragging = true;
				hit.dataset.dragging = 'true';
			}
		});
		const release = () => {
			if (!mascot.pressed) return;
			mascot.pressed = false;
			if (!mascot.dragging) return;
			mascot.dragging = false;
			delete hit.dataset.dragging;
			hit.dataset.dragEnd = String(performance.now());
			react('boing');
			emit('dragged');
		};
		hit.addEventListener('pointerup', release);
		hit.addEventListener('pointercancel', release);
	}

	// Botões que chamam a atenção do mascote: ele olha (e, no principal, se apaixona).
	document.querySelectorAll<HTMLElement>('[data-mascot-look]').forEach((el) => {
		const enter = () => {
			mascot.lookEl = el;
			mascot.lookLove = el.dataset.mascotLook === 'love';
			markInput();
			if (mascot.lookLove && eye.alpha > 0.5) emit('cta');
		};
		const leave = () => {
			if (mascot.lookEl !== el) return;
			mascot.lookEl = null;
			mascot.lookLove = false;
		};
		el.addEventListener('pointerenter', enter);
		el.addEventListener('pointerleave', leave);
		el.addEventListener('focusin', enter);
		el.addEventListener('focusout', leave);
	});

	function stepMascot(dt: number, out: { v: number[]; op: number }[], now: number) {
		const def = formation.def;
		const visibleMascot = Boolean(def.eyes);
		const body = slots[0].v;
		const target = out[0].v;
		const R0 = target[2] || 0.1;
		const active = time < mascot.until ? mascot.reaction : '';
		const age = time - mascot.start;
		const pd = pointer.active ? Math.hypot(pointer.x - body[0], pointer.y - body[1]) : 99;
		const near = visibleMascot && pd < R0 * 1.7;

		if (visibleMascot) {
			if (active === 'dizzy') {
				target[0] += Math.sin(time * 9) * 0.1 * R0;
				target[1] += Math.cos(time * 6.5) * 0.05 * R0;
			}
			if (active === 'angry') target[0] += Math.sin(time * 44) * 0.06 * R0 * Math.max(0, 1 - age / 1.3);
			if (active === 'love') {
				const beat = Math.pow(Math.abs(Math.sin(time * 5.5)), 10) * 0.08;
				target[2] *= 1 + beat;
				target[3] *= 1 + beat;
				target[4] *= 1 + beat;
			}
			if (active === 'giggle') {
				const shake = Math.sin(time * 18);
				target[1] += Math.abs(shake) * 0.07 * R0;
				target[2] *= 1 + shake * 0.05;
				target[3] *= 1 - shake * 0.05;
			}
			if (mascot.sleeping) {
				target[2] *= 1.04;
				target[3] *= 0.95 + Math.sin(time * 1.2) * 0.015;
			}
			if (mascot.dragging) {
				const dx = pointer.x - target[0];
				const dy = pointer.y - target[1];
				const len = Math.hypot(dx, dy) || 1e-6;
				const reach = Math.min(len, R0 * 1.8);
				const stretch = reach / (R0 * 1.8);
				target[0] += (dx / len) * reach * 0.5;
				target[1] += (dy / len) * reach * 0.5;
				target[2] = R0 * (1 + 0.6 * stretch);
				target[3] = R0 * (1 - 0.24 * stretch);
				target[4] = Math.min(target[2], target[3]);
				target[5] = Math.atan2(dy, dx);
				for (let i = 1; i < 6; i++) {
					out[i].v[0] += (pointer.x - out[i].v[0]) * 0.25;
					out[i].v[1] += (pointer.y - out[i].v[1]) * 0.25;
				}
			}

			// Cócegas: passar o mouse rápido por cima.
			if (near && !mascot.dragging) mascot.tickle += pointer.speed * dt;
			mascot.tickle *= Math.exp(-dt * 1.4);
			if (mascot.tickle > R0 * 9 && time > mascot.tickleReadyAt && !active) {
				mascot.tickle = 0;
				mascot.tickleReadyAt = time + 6;
				react('giggle');
				emit('tickle');
			}

			// Soneca depois de um tempo sem ninguém mexer na página.
			const screenY = ((1 - body[1]) / 2) * cssH;
			const onScreen = screenY > -50 && screenY < cssH + 50;
			const idleFor = (now - mascot.lastInput) / 1000;
			if (!mascot.sleeping && onScreen && idleFor > 16 && eye.alpha > 0.5) {
				mascot.sleeping = true;
				emit('sleep');
			}
		}
		if (mascot.sleeping && ((now - mascot.lastInput) / 1000 < 0.4 || !visibleMascot)) {
			mascot.sleeping = false;
			if (visibleMascot) {
				react('wake');
				emit('wake');
			}
		}

		mascot.boost += dt * (active === 'dizzy' ? 3.2 : active === 'giggle' || active === 'happy' ? 1.2 : 0);

		// Expressão desejada.
		const goal: Expression = { happy: 0, surprise: 0, angry: 0, love: 0, dizzy: 0 };
		let openL = 1;
		let openR = 1;
		if (active === 'happy' || active === 'giggle') goal.happy = 1;
		else if (active === 'surprise' || active === 'wake' || active === 'boing') goal.surprise = 1;
		else if (active === 'love') goal.love = 1;
		else if (active === 'dizzy') goal.dizzy = 1;
		else if (active === 'angry') goal.angry = 1;
		else if (active === 'wink') openR = 0.06;
		else if (mascot.dragging) goal.angry = 1;
		else if (mascot.lookLove) goal.love = 1;
		else if (mascot.sleeping) openL = openR = 0.07;
		else if (near) goal.surprise = 0.45;

		if (time > eye.nextBlink) {
			eye.blinkUntil = time + 0.14;
			eye.nextBlink = time + 2 + random(time) * 3.5;
		}
		if (time < eye.blinkUntil && !goal.love && !goal.dizzy && !goal.angry) {
			openL = Math.min(openL, 0.06);
			openR = Math.min(openR, 0.06);
		}
		const e1 = Math.min(1, dt * 10);
		for (const key of Object.keys(goal) as (keyof Expression)[]) expr[key] += (goal[key] - expr[key]) * e1;
		const e2 = Math.min(1, dt * 18);
		eye.openL += (openL - eye.openL) * e2;
		eye.openR += (openR - eye.openR) * e2;
		eye.spin += dt * 7 * expr.dizzy;

		// Para onde os olhos olham.
		let gx = Math.sin(time * 0.5) * 0.4;
		let gy = Math.sin(time * 0.37) * 0.2;
		let look: { x: number; y: number } | null = null;
		if (mascot.lookEl) {
			const r = mascot.lookEl.getBoundingClientRect();
			look = toWorld(r.left + r.width / 2, r.top + r.height / 2);
		} else if (pointer.active) look = { x: pointer.x, y: pointer.y };
		if (mascot.sleeping) {
			gx = 0;
			gy = -0.5;
		} else if (look) {
			const dx = look.x - body[0];
			const dy = look.y - body[1];
			const len = Math.hypot(dx, dy) || 1;
			const reach = Math.min(1, len / 0.6);
			gx = (dx / len) * reach;
			gy = (dy / len) * reach;
		}
		eye.gx += (gx - eye.gx) * Math.min(1, dt * 6);
		eye.gy += (gy - eye.gy) * Math.min(1, dt * 6);
		eye.alpha += ((visibleMascot ? 1 : 0) - eye.alpha) * Math.min(1, dt * 4);
	}

	// ------------------------------------------------------------- física
	function step(dt: number) {
		time += dt;
		const now = performance.now();
		if (pointer.active && now - pointer.lastMove > 4000) pointer.active = false;
		pointer.speed *= Math.exp(-dt * 8);

		const scrollY = window.scrollY;
		const scrollDelta = clamp(scrollY - lastScroll, -160, 160);
		if (scrollDelta !== 0) lastInteraction = now;
		lastScroll = scrollY;
		const def = formation.def;
		const place = currentPlacement();
		lastPlace = place;
		// Formas ancoradas já acompanham a rolagem; o empurrão extra seria em dobro.
		const impulse = place.anchored ? 0 : (scrollDelta / cssH) * 2 * 2.4 * (def.inertia ?? 1);

		const out = targets(time, place);
		stepMascot(dt, out, now);
		const stiffness = mascot.dragging ? 14 : 6.5;
		const damping = mascot.dragging ? 6 : 3.7;

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
			if (def.magnet && pointer.active && i > 0 && !mascot.dragging) {
				const dx = pointer.x - tx;
				const dy = pointer.y - ty;
				const distance = Math.hypot(dx, dy);
				if (distance < 0.6) {
					const pull = (1 - distance / 0.6) * 0.09;
					tx += dx * pull;
					ty += dy * pull;
				}
			}
			if (def.eyes && i === 0 && pointer.active && !mascot.dragging) {
				tx += clamp(pointer.x - tx, -0.6, 0.6) * 0.05;
				ty += clamp(pointer.y - ty, -0.6, 0.6) * 0.05;
			}

			slot.vel[1] += impulse * slot.drag;
			const goal = [tx, ty, tv[2], tv[3], tv[4], tv[5], tv[6]];
			// Rotação pelo caminho mais curto.
			goal[5] = slot.v[5] + ((((goal[5] - slot.v[5] + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
			const k = i === 0 ? stiffness : 6.5;
			const c = i === 0 ? damping : 3.7;
			for (let j = 0; j < 7; j++) {
				slot.vel[j] += ((goal[j] - slot.v[j]) * k - slot.vel[j] * c) * dt;
				slot.vel[j] = clamp(slot.vel[j], -5, 5);
				slot.v[j] += slot.vel[j] * dt;
			}
			for (const j of [2, 3, 4, 6]) slot.v[j] = Math.max(0, slot.v[j]);
		}

		// Gota do cursor (só nas formações "orgânicas").
		const cursorTarget = pointer.active && def.magnet && !mascot.dragging ? 0.055 * Math.min(aspect, 1) : 0;
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
		pointer.glow += ((pointer.active ? 1 : 0) - pointer.glow) * Math.min(1, dt * 3);

		measureSettle(dt);
		applyGlobals(place, Math.min(1, dt * 2));
	}

	/** Posiciona o botão invisível e o balão de fala sobre o mascote. */
	function placeMascotUi() {
		if (!hit && !bubble) return;
		const show = eye.alpha > 0.5;
		const body = slots[0].v;
		const sx = ((body[0] / aspect + 1) / 2) * cssW;
		const sy = ((1 - body[1]) / 2) * cssH;
		const radius = (Math.max(body[2], body[3]) / 2) * cssH;
		if (hit) {
			hit.dataset.visible = String(show);
			hit.style.transform = `translate(${sx - radius}px, ${sy - radius}px)`;
			hit.style.width = hit.style.height = `${radius * 2}px`;
		}
		if (bubble) {
			bubble.dataset.visible = String(show);
			// No celular o balão encosta na margem direita para não cobrir o texto.
			const bx = cssW < 640 ? cssW - 16 : clamp(sx - radius * 0.35, 180, cssW - 16);
			bubble.style.transform = `translate(${bx}px, ${sy - radius * 1.02}px)`;
		}
	}

	function horizon(): [number, number, number, number] {
		if (!horizonEl) return [0, 0, 1, 0];
		const r = horizonEl.getBoundingClientRect();
		const portrait = aspect < 0.9;
		const bottom = 1 - (r.bottom / cssH) * 2;
		const radius = portrait ? 1.7 : Math.max(2.4, aspect * 1.6);
		// data-horizon="0.1": quanto a borda do planeta sobe acima do fim da seção.
		const custom = horizonEl.dataset.horizon;
		const lift = custom ? Number(custom) : portrait ? 0.36 : 0.26;
		const top = bottom + lift;
		return [portrait ? 0 : aspect * 0.2, top - radius, radius, smooth(0.08, 0.85, r.bottom / cssH)];
	}

	/** Caixa que contém todas as peças (com folga), para o shader pular o resto da tela. */
	function liquidBox(): [number, number, number, number] {
		let minX = 9;
		let minY = 9;
		let maxX = -9;
		let maxY = -9;
		for (const slot of slots) {
			const v = slot.v;
			if (Math.max(v[2], v[3]) < 0.002) continue;
			const r = Math.hypot(v[2], v[3]) + v[6];
			minX = Math.min(minX, v[0] - r);
			maxX = Math.max(maxX, v[0] + r);
			minY = Math.min(minY, v[1] - r);
			maxY = Math.max(maxY, v[1] + r);
		}
		if (cursor.r > 0.002) {
			minX = Math.min(minX, cursor.x - cursor.r - 0.2);
			maxX = Math.max(maxX, cursor.x + cursor.r + 0.2);
			minY = Math.min(minY, cursor.y - cursor.r - 0.2);
			maxY = Math.max(maxY, cursor.y + cursor.r + 0.2);
		}
		if (minX > maxX) return [0, 0, 0, 0];
		const pad = globals.k + 0.02;
		return [minX - pad, minY - pad, maxX + pad, maxY + pad];
	}

	function render() {
		for (let i = 0; i < SLOTS; i++) {
			const v = slots[i].v;
			dataA.set([v[0], v[1], v[2], v[3]], i * 4);
			dataB.set([v[4], v[5], v[6], slots[i].op], i * 4);
		}
		const body = slots[0].v;
		const scrollWorld = (window.scrollY / cssH) * 2;
		const spacing = (30 / cssH) * 2;

		// 1) Fumaça do fundo, em baixa resolução.
		gl!.bindFramebuffer(gl!.FRAMEBUFFER, smokeBuffer);
		gl!.viewport(0, 0, smokeW, smokeH);
		drawWith(smokeProgram!);
		gl!.uniform2f(smokeUniforms.res, smokeW, smokeH);
		gl!.uniform1f(smokeUniforms.time, time);
		gl!.uniform1f(smokeUniforms.scroll, scrollWorld);
		gl!.drawArrays(gl!.TRIANGLES, 0, 3);

		// 2) Tudo o mais, na resolução da tela.
		gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
		gl!.viewport(0, 0, width, height);
		drawWith(program!);
		gl!.activeTexture(gl!.TEXTURE0);
		gl!.bindTexture(gl!.TEXTURE_2D, smokeTexture);
		gl!.uniform1i(uniforms.smoke, 0);
		gl!.uniform2f(uniforms.res, width, height);
		gl!.uniform1f(uniforms.time, time);
		gl!.uniform1f(uniforms.dim, globals.dim);
		gl!.uniform1f(uniforms.k, globals.k);
		gl!.uniform1f(uniforms.wob, globals.wob);
		gl!.uniform1f(uniforms.css, 2 / cssH);
		gl!.uniform4f(uniforms.box, ...liquidBox());
		gl!.uniform3f(uniforms.tint, ...tint);
		gl!.uniform3f(uniforms.ink, ...ink);
		gl!.uniform2f(uniforms.light, pointer.lightX, pointer.lightY);
		gl!.uniform4fv(uniforms.a, dataA);
		gl!.uniform4fv(uniforms.b, dataB);
		gl!.uniform3f(uniforms.cur, cursor.x, cursor.y, cursor.r);
		gl!.uniform4f(uniforms.eye, body[0], body[1], Math.max(Math.min(body[2], body[3]), 0.001), eye.alpha);
		gl!.uniform4f(uniforms.eye2, eye.gx, eye.gy, eye.openL, eye.openR);
		gl!.uniform4f(uniforms.expr, expr.happy, expr.surprise, expr.angry, expr.love);
		gl!.uniform4f(uniforms.expr2, expr.dizzy, eye.spin, globals.shine, 0);
		gl!.uniform4f(uniforms.grid, spacing, (1.15 / cssH) * 2, (scrollWorld * 0.35) % spacing, scrollWorld);
		gl!.uniform3f(uniforms.ptr, pointer.x, pointer.y, pointer.glow);
		gl!.uniform4f(uniforms.horizon, ...horizon());
		gl!.drawArrays(gl!.TRIANGLES, 0, 3);
		placeMascotUi();
	}

	// --------------------------------------------- qualidade adaptativa
	const frameTimes: number[] = [];
	function adapt(delta: number) {
		frameTimes.push(delta);
		if (frameTimes.length < 40) return;
		const sorted = [...frameTimes].sort((a, b) => a - b);
		const median = sorted[Math.floor(sorted.length / 2)];
		frameTimes.length = 0;
		// Aparelho sofrendo: reduz a resolução aos poucos (e, no limite, o ritmo).
		if (median > 22) {
			if (quality > 0.51) {
				quality = Math.max(0.5, quality * 0.85);
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

	refreshFormation();
	render();
	canvas.classList.add('is-live');
	document.documentElement.classList.add('liquid-live');
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
		// Sem animação, a forma ancorada e o horizonte só precisam ser redesenhados ao rolar.
		window.addEventListener(
			'scroll',
			() => {
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
		document.documentElement.classList.remove('liquid-live');
	});

	// Ferramenta de inspeção: window.__liquid.show('clock') ou .react('love') no console.
	(window as unknown as { __liquid: unknown }).__liquid = {
		show: (value: string) => {
			formation = parseFormation(value);
			formationEl = undefined;
			lastInteraction = performance.now();
		},
		react,
		/** Pausa e retoma a animação (testes e capturas de tela). */
		pause: stop,
		resume: start,
		/** Adianta a simulação (útil em testes e capturas de tela). */
		advance: (seconds: number) => {
			for (let i = 0; i < Math.round(seconds * 60); i++) step(1 / 60);
			render();
		},
		state: () => ({ name: formation.name, place: lastPlace, el: formationEl?.id || formationEl?.className, quality }),
		/** Testa outra cor para o líquido, ex.: __liquid.tint('#3b6ef0'). */
		tint: (hex: string, inkHex?: string) => {
			const parse = (value: string) => {
				const n = parseInt(value.replace('#', ''), 16);
				return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as [number, number, number];
			};
			tint = parse(hex);
			if (inkHex) ink = parse(inkHex);
			render();
		},
	};
}
