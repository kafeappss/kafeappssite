/**
 * Degradê fluido do topo da home, na linha do topo clássico da Stripe: quatro
 * cores que se misturam em manchas e andam devagar, claras do lado do texto e
 * vivas do outro, com uma luz suave que segue o cursor. As cores vêm de
 * --grad-1 a --grad-4 (src/styles/global.css).
 *
 * Para quando sai da tela ou a aba fica em segundo plano. Sem WebGL, fica o
 * degradê em CSS que está no fundo do elemento; com "reduzir movimento", fica
 * parado.
 */

const VERTEX = /* glsl */ `
attribute vec2 aPos;
void main() {
	gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer; // cursor (0 a 1), com atraso
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform vec3 uC4;

// Ruído simplex 3D (Ashima Arts / Stefan Gustavson, licença MIT).
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
	const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
	const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
	vec3 i = floor(v + dot(v, C.yyy));
	vec3 x0 = v - i + dot(i, C.xxx);
	vec3 g = step(x0.yzx, x0.xyz);
	vec3 l = 1.0 - g;
	vec3 i1 = min(g.xyz, l.zxy);
	vec3 i2 = max(g.xyz, l.zxy);
	vec3 x1 = x0 - i1 + C.xxx;
	vec3 x2 = x0 - i2 + C.yyy;
	vec3 x3 = x0 - D.yyy;
	i = mod289(i);
	vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
	float n_ = 0.142857142857;
	vec3 ns = n_ * D.wyz - D.xzx;
	vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
	vec4 x_ = floor(j * ns.z);
	vec4 y_ = floor(j - 7.0 * x_);
	vec4 x = x_ * ns.x + ns.yyyy;
	vec4 y = y_ * ns.x + ns.yyyy;
	vec4 h = 1.0 - abs(x) - abs(y);
	vec4 b0 = vec4(x.xy, y.xy);
	vec4 b1 = vec4(x.zw, y.zw);
	vec4 s0 = floor(b0) * 2.0 + 1.0;
	vec4 s1 = floor(b1) * 2.0 + 1.0;
	vec4 sh = -step(h, vec4(0.0));
	vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
	vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
	vec3 p0 = vec3(a0.xy, h.x);
	vec3 p1 = vec3(a0.zw, h.y);
	vec3 p2 = vec3(a1.xy, h.z);
	vec3 p3 = vec3(a1.zw, h.w);
	vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
	p0 *= norm.x;
	p1 *= norm.y;
	p2 *= norm.z;
	p3 *= norm.w;
	vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
	m = m * m;
	return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
	vec2 uv = gl_FragCoord.xy / uRes;
	float aspect = uRes.x / uRes.y;
	vec2 p = uv * vec2(aspect, 1.0);
	float t = uTime * 0.05;

	// Manchas de cor que se misturam e andam devagar (o degradê da Stripe).
	vec2 q = p + 0.4 * vec2(snoise(vec3(p * 0.55, t)), snoise(vec3(p * 0.55 + 7.3, t)));
	float n1 = snoise(vec3(q * 0.8, t * 1.1));
	float n2 = snoise(vec3(q * 1.1 + 3.1, t * 0.9));
	float n3 = snoise(vec3(q * 0.9 + 11.7, t * 1.3));
	vec3 vivid = uC1;
	vivid = mix(vivid, uC2, smoothstep(-0.45, 0.55, n1));
	vivid = mix(vivid, uC3, smoothstep(-0.1, 0.75, n2) * 0.85);
	vivid = mix(vivid, uC4, smoothstep(0.15, 0.9, n3) * 0.8);

	// Do lado do texto as cores ficam claras (leitura); do outro, vivas.
	// Na tela larga o texto fica à esquerda; em pé (celular), em cima.
	float strength = aspect > 1.0
		? smoothstep(0.32, 1.0, uv.x + 0.12 * n2)
		: smoothstep(0.8, 1.2, 1.0 - uv.y + 0.08 * n2);
	// Uma luz suave segue o cursor.
	float glow = exp(-dot((uv - uPointer) * vec2(aspect, 1.0), (uv - uPointer) * vec2(aspect, 1.0)) * 6.0);
	strength = clamp(strength + glow * 0.22, 0.0, 1.0);
	vec3 pastel = mix(vec3(1.0), vivid, 0.16);
	vec3 col = mix(pastel, vivid, strength);
	// Grão bem leve contra faixas no degradê.
	col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 160.0;
	gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.warn('[degradê]', gl.getShaderInfoLog(shader));
		return null;
	}
	return shader;
}

function hexColor(value: string, fallback: [number, number, number]): [number, number, number] {
	const hex = value.trim().replace('#', '');
	if (!/^[0-9a-f]{6}$/i.test(hex)) return fallback;
	return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}

export function initGradient(root: HTMLElement) {
	const canvas = root.querySelector('canvas');
	if (!canvas) return;
	const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false });
	if (!gl) return;
	const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
	const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
	if (!vertex || !fragment) return;
	const program = gl.createProgram();
	if (!program) return;
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.bindAttribLocation(program, 0, 'aPos');
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
	gl.useProgram(program);

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

	const uRes = gl.getUniformLocation(program, 'uRes');
	const uTime = gl.getUniformLocation(program, 'uTime');
	const uPointer = gl.getUniformLocation(program, 'uPointer');
	const pointer = { x: 0.78, y: 0.55, tx: 0.78, ty: 0.55 };

	/** Lê as cores do CSS (chamado de novo quando o "brinquedo" de cor muda a paleta). */
	function readColors() {
		const styles = getComputedStyle(root);
		const colors: [string, [number, number, number]][] = [
			['--grad-1', [0.37, 0.42, 0.82]],
			['--grad-2', [0.65, 0.55, 0.98]],
			['--grad-3', [0.96, 0.65, 0.49]],
			['--grad-4', [0.49, 0.83, 0.99]],
		];
		colors.forEach(([name, fallback], index) => {
			gl!.uniform3fv(gl!.getUniformLocation(program!, `uC${index + 1}`), hexColor(styles.getPropertyValue(name), fallback));
		});
	}
	readColors();

	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	// Começa num ponto "bonito" do ruído, e não no zero.
	let time = 40;
	let last = 0;
	let frame = 0;
	let visible = true;

	function resize() {
		// O degradê é suave: meia resolução basta (e economiza bateria).
		const scale = 0.5;
		const width = Math.max(1, Math.round(canvas!.clientWidth * scale));
		const height = Math.max(1, Math.round(canvas!.clientHeight * scale));
		if (canvas!.width !== width || canvas!.height !== height) {
			canvas!.width = width;
			canvas!.height = height;
		}
	}

	function draw() {
		gl!.viewport(0, 0, canvas!.width, canvas!.height);
		gl!.uniform2f(uRes, canvas!.width, canvas!.height);
		gl!.uniform1f(uTime, time);
		gl!.uniform2f(uPointer, pointer.x, pointer.y);
		gl!.drawArrays(gl!.TRIANGLES, 0, 3);
	}

	function loop(now: number) {
		frame = requestAnimationFrame(loop);
		const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
		last = now;
		time += dt;
		pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 1.5);
		pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 1.5);
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
	root.classList.add('is-live');

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
			const rect = canvas.getBoundingClientRect();
			pointer.tx = (event.clientX - rect.left) / Math.max(1, rect.width);
			pointer.ty = 1 - (event.clientY - rect.top) / Math.max(1, rect.height);
		},
		{ passive: true },
	);
	document.addEventListener('kafe:palette', () => {
		readColors();
		draw();
	});
	canvas.addEventListener('webglcontextlost', (event) => {
		event.preventDefault();
		stop();
		root.classList.remove('is-live');
	});
	start();

	// Para testar no console: __degrade.advance(5) adianta 5 segundos.
	(window as unknown as { __degrade: unknown }).__degrade = {
		advance: (seconds: number) => {
			time += seconds;
			draw();
		},
	};
}
