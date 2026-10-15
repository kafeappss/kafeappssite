/**
 * Fundo de letras: uma grade de letras e números em fonte mono, quase
 * invisível, que acende em manchas que vagam devagar pela tela. De vez em
 * quando uma letra troca por outra, e uma parte das manchas ganha a cor da marca.
 *
 * Desenho em duas etapas, em WebGL: primeiro uma textura pequena, com um pixel
 * por letra (brilho, cor e qual letra), e depois a tela inteira, copiando cada
 * letra de uma tira de letras desenhada uma vez no início. Assim o fundo pesa
 * quase nada. Sem WebGL fica o fundo liso; com "reduzir movimento", parado.
 *
 * As letras ficam mais fortes no topo da página (o elemento marcado com
 * data-ascii-strong: o início da home, o topo das páginas internas) e mais
 * fracas no resto, com uma passagem suave na borda de baixo do topo.
 *
 * De tempos em tempos (MAP_EVERY), o mapa-múndi se forma letra a letra: nasce
 * em Jaraguá do Sul e se espalha pelo mundo como uma onda; cada letra que
 * chega embaralha (como num terminal), acende na cor da marca e assenta em
 * cinza, enquanto as manchas somem aos poucos. Fica formado alguns segundos e
 * se desfaz: as letras embaralham e caem em ordem aleatória, e as manchas
 * voltam. A máscara do mapa está em src/data/world-map.ts.
 */
import { WORLD_MAP } from '../data/world-map';


/** Tamanho de cada letra e da casa dela na grade, em pixels CSS. */
const FONT = 11;
const CELL_W = 7;
const CELL_H = 14;
/** Minúsculas primeiro: o sorteio favorece as letras do começo da lista. */
const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/** Força das letras no topo da página e no resto (1 = a força original). */
const STRONG = 1.6;
const WEAK = 0.7;
/** Altura da passagem entre as duas forças, em pixels CSS. */
const FADE = 160;
/** Mapa-múndi: a cada quantos segundos aparece, quanto tempo a onda leva
 *  para formar o mapa, quanto tempo ele fica formado e quanto leva para se
 *  desfazer. */
const MAP_EVERY = 32;
const MAP_FORM = 5.5;
const MAP_HOLD = 6;
const MAP_UNFORM = 3;
/** O primeiro mapa aparece este tanto de segundos depois de abrir a página. */
const MAP_FIRST = 5;
/** Tamanho do mapa: fração da altura da tela (deitada e em pé) e qual ponto
 *  do mapa (fração da largura) fica no meio da tela. Maior que a tela, ele
 *  passa das bordas. */
const MAP_HEIGHT = 0.86;
const MAP_FOCUS = 0.5;
const MAP_PORTRAIT_HEIGHT = 0.62;
const MAP_PORTRAIT_FOCUS = 0.36;
/** De onde a onda parte: Jaraguá do Sul (longitude, latitude). */
const MAP_ORIGIN = [-49.07, -26.48];
const ATLAS_SLOTS = 64;

const VERTEX = /* glsl */ `
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
`;

/** Um pixel por letra: r = brilho, g = cor da marca, b = qual letra. */
const CELLS_SHADER = /* glsl */ `
${COMMON}
uniform float uTime;
uniform float uScroll; // rolagem da página, em linhas da grade
uniform float uAspect; // largura / altura da casa
uniform sampler2D uMap;  // máscara do mapa-múndi (1 = terra)
uniform vec4 uMapRect;   // onde o mapa fica na grade: coluna, linha, largura e altura (em casas)
uniform vec2 uMapStage;  // x: a onda formando o mapa (0 a 1); y: o mapa se desfazendo (0 a 1)
uniform vec4 uMapOrigin; // de onde a onda parte (u, v no mapa), largura/altura do mapa e o alcance da onda

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

void main() {
	// Linha 0 é a de cima da tela (a tela inteira lê esta textura do mesmo jeito).
	vec2 cell = floor(gl_FragCoord.xy);
	float t = uTime;

	// Manchas: um ruído que se deforma e escorre devagar (e sobe ao rolar a página).
	vec2 q = vec2(cell.x * uAspect, cell.y + uScroll * 0.35) * 0.055;
	vec2 warp = vec2(
		fbm(q * 0.7 + vec2(t * 0.045, -t * 0.03)),
		fbm(q * 0.7 + vec2(5.2 - t * 0.035, 1.3 + t * 0.04))
	);
	float f = fbm(q + warp * 1.7 + vec2(t * 0.012, t * 0.025));
	float mask = smoothstep(0.44, 0.66, f);

	// Cada letra troca por outra de tempos em tempos (a cada 2 a 7 segundos).
	float slot = floor(t * (0.14 + 0.36 * hash(cell + 3.7)) + hash(cell + 8.1) * 10.0);
	vec2 seed = cell + slot * vec2(1.37, 0.71);
	float glyph = floor(pow(hash(seed), 1.35) * ${GLYPHS.length.toFixed(1)});

	// Borda esfarelada: perto da borda da mancha, sobram só algumas letras.
	float keep = step(hash(cell + 21.3) * 0.55, mask);
	float level = 0.35 + 0.65 * hash(seed + 4.2);
	// Uma ou outra letra bem mais acesa, como nas telas de terminal.
	level *= 1.0 + step(0.985, hash(seed + 9.9));
	float bright = mask * keep * level * 0.5;

	// A cor da marca acende numa parte das manchas e passeia devagar.
	float glow = smoothstep(0.56, 0.74, fbm(q * 0.55 + vec2(-t * 0.05, t * 0.02) + 9.0));

	// Mapa-múndi, formado letra a letra.
	if (uMapStage.x > 0.0) {
		vec2 uv = (cell + 0.5 - uMapRect.xy) / uMapRect.zw;
		float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
		float land = texture2D(uMap, clamp(uv, 0.0, 1.0)).r * inside;
		// Costa esfarelada: perto da borda, algumas casas entram e outras não.
		float isLand = step(0.5, land + (hash(cell + 2.9) - 0.5) * 0.5);
		// Cada casa de terra chega numa hora: a onda parte de Jaraguá do Sul
		// (mais perto, mais cedo), com um pouco de sorteio.
		float reach = length((uv - uMapOrigin.xy) * vec2(uMapOrigin.z, 1.0)) / uMapOrigin.w;
		float arrive = clamp(reach, 0.0, 1.0) * 0.8 + hash(cell + 5.1) * 0.18;
		// Ao se desfazer, cada letra sai numa hora sorteada.
		float leave = 0.04 + hash(cell + 7.7) * 0.92;
		float since = uMapStage.x - arrive;
		float until = leave - uMapStage.y;
		float on = isLand * step(0.0, since) * step(0.0, until);
		// Recém-chegada (frente da onda) ou prestes a sair: embaralha e acende.
		float wave = on * (1.0 - smoothstep(0.0, 0.08, since));
		float going = on * (1.0 - smoothstep(0.0, 0.07, until)) * step(0.001, uMapStage.y);
		float mapLevel = (0.45 + 0.55 * hash(seed + 4.2)) * step(0.16, hash(cell + 13.7));
		float mapBright = on * mapLevel * 0.5 * (1.0 + wave * 1.6 + going * 0.8);
		// As manchas saem aos poucos enquanto o mapa se forma e voltam quando ele se desfaz.
		float away = step(hash(cell + 3.3) * 0.85, uMapStage.x) * (1.0 - step(0.1 + hash(cell + 6.1) * 0.88, uMapStage.y));
		bright = max(bright * (1.0 - away), mapBright);
		if (wave + going > 0.0) glyph = floor(hash(cell + floor(t * 24.0) * 0.37) * ${GLYPHS.length.toFixed(1)});
		// Frente da onda na cor da marca; o mapa formado fica em cinza.
		glow = max(glow * (1.0 - on), max(wave, going * 0.6));
	}

	gl_FragColor = vec4(bright, glow, glyph / 255.0, 1.0);
}
`;

/** Tela inteira: cada pixel copia a letra da sua casa, na cor e brilho dela. */
const SCREEN_SHADER = /* glsl */ `
${COMMON}
uniform vec2 uRes;      // tamanho da tela, em pixels do aparelho
uniform vec2 uCell;     // tamanho da casa, em pixels do aparelho
uniform vec2 uGrid;     // colunas e linhas
uniform sampler2D uCells;
uniform sampler2D uAtlas;
uniform vec3 uBg;
uniform vec3 uInk;
uniform vec3 uGlow;
uniform vec4 uZone;     // fim do topo (y), meia altura da passagem, força no topo, força no resto

void main() {
	vec2 fc = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
	vec2 cell = floor(fc / uCell);
	vec2 local = (fc - cell * uCell) / uCell;
	vec4 c = texture2D(uCells, (cell + 0.5) / uGrid);
	float index = floor(c.b * 255.0 + 0.5);
	float ink = texture2D(uAtlas, vec2((index + local.x) / ${ATLAS_SLOTS.toFixed(1)}, local.y)).a;
	// Cinza bem apagado; na cor da marca, a letra acende mais.
	vec3 color = mix(uInk * 0.2, uGlow * 0.6, c.g);
	// Mais forte no topo da página, mais fraco no resto.
	float power = mix(uZone.w, uZone.z, 1.0 - smoothstep(uZone.x - uZone.y, uZone.x + uZone.y, fc.y));
	gl_FragColor = vec4(uBg + color * ink * c.r * power, 1.0);
}
`;

function createProgram(gl: WebGLRenderingContext, fragmentSource: string) {
	const compile = (type: number, source: string) => {
		const shader = gl.createShader(type);
		if (!shader) return null;
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.warn('[ascii]', gl.getShaderInfoLog(shader));
			return null;
		}
		return shader;
	};
	const vertex = compile(gl.VERTEX_SHADER, VERTEX);
	const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
	const program = gl.createProgram();
	if (!vertex || !fragment || !program) return null;
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.bindAttribLocation(program, 0, 'aPos');
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.warn('[ascii]', gl.getProgramInfoLog(program));
		return null;
	}
	return program;
}

/** Lê uma cor do CSS (ex.: --ascii-glow: #7170ff) e devolve RGB de 0 a 1. */
function cssColor(name: string, fallback: [number, number, number]): [number, number, number] {
	const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	const match = raw.match(/^#?([0-9a-f]{6})$/i);
	if (!match) return fallback;
	const n = parseInt(match[1], 16);
	return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function texture(gl: WebGLRenderingContext) {
	const tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	return tex;
}

export function initAscii(canvas: HTMLCanvasElement) {
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const gl = canvas.getContext('webgl', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		premultipliedAlpha: false,
		preserveDrawingBuffer: false,
	});
	if (!gl) return;

	const cellsProgram = createProgram(gl, CELLS_SHADER);
	const screenProgram = createProgram(gl, SCREEN_SHADER);
	if (!cellsProgram || !screenProgram) return;

	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

	const cellsUniforms = {
		time: gl.getUniformLocation(cellsProgram, 'uTime'),
		scroll: gl.getUniformLocation(cellsProgram, 'uScroll'),
		aspect: gl.getUniformLocation(cellsProgram, 'uAspect'),
		map: gl.getUniformLocation(cellsProgram, 'uMap'),
		mapRect: gl.getUniformLocation(cellsProgram, 'uMapRect'),
		mapStage: gl.getUniformLocation(cellsProgram, 'uMapStage'),
		mapOrigin: gl.getUniformLocation(cellsProgram, 'uMapOrigin'),
	};
	const u = (name: string) => gl.getUniformLocation(screenProgram, name);
	const screenUniforms = {
		res: u('uRes'),
		cell: u('uCell'),
		grid: u('uGrid'),
		cells: u('uCells'),
		atlas: u('uAtlas'),
		bg: u('uBg'),
		ink: u('uInk'),
		glow: u('uGlow'),
		zone: u('uZone'),
	};
	const strongZone = document.querySelector<HTMLElement>('[data-ascii-strong]');

	const bg = cssColor('--bg', [0.03, 0.035, 0.04]);
	const ink = cssColor('--ascii-ink', [1, 1, 1]);
	const glow = cssColor('--ascii-glow', [0.44, 0.44, 1]);
	const font = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || 'monospace';

	const cellsTexture = texture(gl);
	const cellsBuffer = gl.createFramebuffer();
	const atlasTexture = texture(gl);

	// Máscara do mapa: um byte por casa (0 ou 255), lida com filtro linear para
	// a borda sair suave.
	const mapTexture = texture(gl);
	{
		const bits = Uint8Array.from(atob(WORLD_MAP.bits), (char) => char.charCodeAt(0));
		const pixels = new Uint8Array(WORLD_MAP.width * WORLD_MAP.height);
		for (let i = 0; i < pixels.length; i++) pixels[i] = (bits[i >> 3] >> (i & 7)) & 1 ? 255 : 0;
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, WORLD_MAP.width, WORLD_MAP.height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, pixels);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	}
	// Começa de modo que o primeiro mapa se forme MAP_FIRST segundos depois.
	const MAP_START = MAP_EVERY - MAP_FORM - MAP_HOLD - MAP_UNFORM;
	let mapClock = MAP_START - MAP_FIRST;

	/** [onda formando o mapa, mapa se desfazendo], de 0 a 1; [0, 0] = sem mapa. */
	function mapStage(): [number, number] {
		if (reducedMotion) return [0, 0];
		const t = (mapClock % MAP_EVERY) - MAP_START;
		if (t < 0) return [0, 0];
		// A onda sai devagar de Jaraguá, acelera pelo mundo e desacelera no fim.
		const form = Math.min(1, t / MAP_FORM);
		const unform = Math.min(1, Math.max(0, (t - MAP_FORM - MAP_HOLD) / MAP_UNFORM));
		return [Math.max(0.0001, form * form * (3 - 2 * form)), unform >= 1 ? 0.9999 : unform];
	}

	// De onde a onda parte, no mapa, e o alcance dela (até o canto mais longe).
	const originU = (MAP_ORIGIN[0] + 180) / 360;
	const originV = (80 - MAP_ORIGIN[1]) / 136;
	const reach = Math.max(
		...[
			[0, 0],
			[1, 0],
			[0, 1],
			[1, 1],
		].map(([u, v]) => Math.hypot((u - originU) * WORLD_MAP.aspect, v - originV)),
	);

	let dpr = 0;
	let cellW = CELL_W;
	let cellH = CELL_H;
	let cols = 1;
	let rows = 1;
	let time = 0;
	let frame = 0;
	let last = 0;
	let scrolled = false;

	/** Desenha todas as letras numa tira, uma por casa, no tamanho real da tela. */
	function drawAtlas() {
		const atlas = document.createElement('canvas');
		atlas.width = cellW * ATLAS_SLOTS;
		atlas.height = cellH;
		const ctx = atlas.getContext('2d');
		if (!ctx) return;
		let size = FONT * dpr;
		ctx.font = `${size}px ${font}`;
		// Fonte mais larga que a casa (algumas mono são): diminui até caber.
		const widest = ctx.measureText('W').width;
		if (widest > cellW) {
			size *= cellW / widest;
			ctx.font = `${size}px ${font}`;
		}
		ctx.fillStyle = '#fff';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		[...GLYPHS].forEach((char, i) => ctx.fillText(char, i * cellW + cellW / 2, cellH / 2 + dpr * 0.5));
		gl!.bindTexture(gl!.TEXTURE_2D, atlasTexture);
		gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, atlas);
	}

	function resize() {
		const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
		const width = Math.max(1, Math.round(canvas.clientWidth * nextDpr));
		const height = Math.max(1, Math.round(canvas.clientHeight * nextDpr));
		if (nextDpr !== dpr) {
			dpr = nextDpr;
			// Casas com um número inteiro de pixels: as letras ficam nítidas.
			cellW = Math.max(1, Math.round(CELL_W * dpr));
			cellH = Math.max(1, Math.round(CELL_H * dpr));
			drawAtlas();
		}
		canvas.width = width;
		canvas.height = height;
		cols = Math.ceil(width / cellW);
		rows = Math.ceil(height / cellH);
		gl!.bindTexture(gl!.TEXTURE_2D, cellsTexture);
		gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, cols, rows, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null);
		gl!.bindFramebuffer(gl!.FRAMEBUFFER, cellsBuffer);
		gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, cellsTexture, 0);
		gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
	}

	function draw() {
		// 1) Uma casa por pixel: brilho, cor e letra.
		gl!.bindFramebuffer(gl!.FRAMEBUFFER, cellsBuffer);
		gl!.viewport(0, 0, cols, rows);
		gl!.useProgram(cellsProgram);
		gl!.uniform1f(cellsUniforms.time, time);
		gl!.uniform1f(cellsUniforms.scroll, reducedMotion ? 0 : window.scrollY / CELL_H);
		gl!.uniform1f(cellsUniforms.aspect, cellW / cellH);
		// O mapa ocupa MAP_HEIGHT da altura da tela (em pé, MAP_PORTRAIT_HEIGHT) e
		// passa das bordas quando é mais largo que ela.
		const portrait = canvas.height > canvas.width;
		const mapH = canvas.height * (portrait ? MAP_PORTRAIT_HEIGHT : MAP_HEIGHT);
		const mapW = mapH * WORLD_MAP.aspect;
		const mapX = canvas.width / 2 - mapW * (portrait ? MAP_PORTRAIT_FOCUS : MAP_FOCUS);
		gl!.uniform4f(cellsUniforms.mapRect, mapX / cellW, (canvas.height - mapH) / 2 / cellH, mapW / cellW, mapH / cellH);
		gl!.uniform2f(cellsUniforms.mapStage, ...mapStage());
		gl!.uniform4f(cellsUniforms.mapOrigin, originU, originV, WORLD_MAP.aspect, reach);
		gl!.activeTexture(gl!.TEXTURE2);
		gl!.bindTexture(gl!.TEXTURE_2D, mapTexture);
		gl!.uniform1i(cellsUniforms.map, 2);
		gl!.drawArrays(gl!.TRIANGLES, 0, 3);

		// 2) A tela inteira, copiando as letras da tira.
		gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
		gl!.viewport(0, 0, canvas.width, canvas.height);
		gl!.useProgram(screenProgram);
		gl!.activeTexture(gl!.TEXTURE0);
		gl!.bindTexture(gl!.TEXTURE_2D, cellsTexture);
		gl!.activeTexture(gl!.TEXTURE1);
		gl!.bindTexture(gl!.TEXTURE_2D, atlasTexture);
		gl!.uniform1i(screenUniforms.cells, 0);
		gl!.uniform1i(screenUniforms.atlas, 1);
		gl!.uniform2f(screenUniforms.res, canvas.width, canvas.height);
		gl!.uniform2f(screenUniforms.cell, cellW, cellH);
		gl!.uniform2f(screenUniforms.grid, cols, rows);
		gl!.uniform3f(screenUniforms.bg, ...bg);
		gl!.uniform3f(screenUniforms.ink, ...ink);
		gl!.uniform3f(screenUniforms.glow, ...glow);
		// Onde termina o topo da página na tela (se ele já saiu, tudo fica fraco).
		const zoneEnd = strongZone ? strongZone.getBoundingClientRect().bottom * dpr : -1e5;
		gl!.uniform4f(screenUniforms.zone, zoneEnd, FADE * dpr * 0.5, STRONG, WEAK);
		gl!.drawArrays(gl!.TRIANGLES, 0, 3);
		scrolled = false;
	}

	function loop(now: number) {
		frame = requestAnimationFrame(loop);
		const dt = last ? (now - last) / 1000 : 0;
		// O movimento é lento: 30 quadros por segundo bastam e poupam bateria
		// (mas, rolando a página, a borda do topo acompanha a cada quadro).
		if (last && dt < 1 / 32 && !scrolled) return;
		last = now;
		time += Math.min(dt, 0.1);
		mapClock += Math.min(dt, 0.1);
		draw();
	}

	function start() {
		if (frame || reducedMotion || document.hidden) return;
		last = 0;
		frame = requestAnimationFrame(loop);
	}

	function stop() {
		cancelAnimationFrame(frame);
		frame = 0;
	}

	resize();
	// Começa no meio do caminho, com as manchas já espalhadas pela tela.
	time = 40 + Math.random() * 200;
	draw();
	canvas.classList.add('is-live');
	start();

	new ResizeObserver(() => {
		resize();
		draw();
	}).observe(canvas);
	document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
	window.addEventListener(
		'scroll',
		() => {
			scrolled = true;
			// Parado ("reduzir movimento"): redesenha só para a borda do topo acompanhar.
			if (!frame) draw();
		},
		{ passive: true },
	);
	// Para testar no console: __ascii.map() forma o mapa agora.
	(window as unknown as { __ascii: unknown }).__ascii = {
		map: () => (mapClock = Math.floor(mapClock / MAP_EVERY) * MAP_EVERY + MAP_START),
	};
	canvas.addEventListener('webglcontextlost', (event) => {
		event.preventDefault();
		stop();
		canvas.classList.remove('is-live');
	});
}
