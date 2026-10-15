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
 * Com o mouse por cima, as letras perto do cursor acendem de leve, com um
 * rastro curto que se apaga sozinho (só com mouse; no celular não há cursor).
 */

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
/** Mouse: raio da luz (em linhas da grade), quanto as letras acendem, força
 *  com o cursor parado e quanto tempo o rastro leva para apagar (segundos). */
const TOUCH_RADIUS = 7;
const TOUCH_BOOST = 1.0;
const TOUCH_REST = 0.55;
const TRAIL_LIFE = 0.8;
/** Pontos no rastro (o primeiro é o próprio cursor). */
const TRAIL = 8;
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
uniform vec3 uTrail[${TRAIL}]; // cursor e rastro: coluna, linha e força (0 = apagado)
uniform float uTouchRadius;  // raio da luz do cursor, em linhas

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

	// Mouse: perto do cursor (e do rastro dele), as letras acendem de leve, e
	// algumas aparecem bem fracas onde não há mancha.
	float touch = 0.0;
	for (int i = 0; i < ${TRAIL}; i++) {
		vec3 p = uTrail[i];
		if (p.z <= 0.0) continue;
		float d = length((cell + 0.5 - p.xy) * vec2(uAspect, 1.0));
		touch = max(touch, p.z * (1.0 - smoothstep(uTouchRadius * 0.2, uTouchRadius, d)));
	}
	if (touch > 0.0) {
		bright = bright * (1.0 + touch * ${TOUCH_BOOST.toFixed(2)}) + touch * 0.13 * level * step(0.55, hash(cell + 17.1));
		glow = max(glow, touch * 0.3);
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
		trail: gl.getUniformLocation(cellsProgram, 'uTrail'),
		touchRadius: gl.getUniformLocation(cellsProgram, 'uTouchRadius'),
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

	let dpr = 0;
	let cellW = CELL_W;
	let cellH = CELL_H;
	let cols = 1;
	let rows = 1;
	let time = 0;
	let frame = 0;
	let last = 0;
	let scrolled = false;

	// Mouse: a posição do cursor e o rastro (pontos em pixels CSS, com a hora).
	const fineMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
	const cursor = { x: 0, y: 0, inside: false };
	const trail: { x: number; y: number; at: number }[] = [];
	const trailData = new Float32Array(TRAIL * 3);

	function updateTrail() {
		const now = performance.now() / 1000;
		while (trail.length && now - trail[0].at > TRAIL_LIFE) trail.shift();
		trailData.fill(0);
		if (!cursor.inside) return;
		trailData.set([(cursor.x * dpr) / cellW, (cursor.y * dpr) / cellH, TOUCH_REST], 0);
		trail.slice(-(TRAIL - 1)).forEach((point, i) => {
			const life = 1 - (now - point.at) / TRAIL_LIFE;
			trailData.set([(point.x * dpr) / cellW, (point.y * dpr) / cellH, Math.max(0, life) * 0.9], (i + 1) * 3);
		});
	}

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
		updateTrail();
		gl!.uniform3fv(cellsUniforms.trail, trailData);
		gl!.uniform1f(cellsUniforms.touchRadius, TOUCH_RADIUS);
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
		// (mas, rolando a página ou mexendo o mouse, desenha a cada quadro).
		if (last && dt < 1 / 32 && !scrolled) return;
		last = now;
		time += Math.min(dt, 0.1);
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
	if (fineMouse && !reducedMotion) {
		window.addEventListener(
			'pointermove',
			(event) => {
				if (event.pointerType !== 'mouse') return;
				cursor.x = event.clientX;
				cursor.y = event.clientY;
				cursor.inside = true;
				const now = performance.now() / 1000;
				const lastPoint = trail[trail.length - 1];
				if (!lastPoint || Math.hypot(cursor.x - lastPoint.x, cursor.y - lastPoint.y) > 12 || now - lastPoint.at > 0.05) {
					trail.push({ x: cursor.x, y: cursor.y, at: now });
					if (trail.length > TRAIL * 2) trail.shift();
				}
				scrolled = true;
			},
			{ passive: true },
		);
		document.documentElement.addEventListener('pointerleave', () => (cursor.inside = false));
	}
	window.addEventListener(
		'scroll',
		() => {
			scrolled = true;
			// Parado ("reduzir movimento"): redesenha só para a borda do topo acompanhar.
			if (!frame) draw();
		},
		{ passive: true },
	);
	canvas.addEventListener('webglcontextlost', (event) => {
		event.preventDefault();
		stop();
		canvas.classList.remove('is-live');
	});
}
