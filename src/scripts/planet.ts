/**
 * Planeta do topo da home: uma esfera escura com luz realista, em WebGL.
 *
 * A superfície (relevo, manchas e nuvens) é calculada uma vez numa textura, o
 * mapa do planeta. A cada quadro só se desenha a esfera girando devagar, com a
 * luz acompanhando o cursor de leve. Sem WebGL, fica a imagem estática que está
 * no fundo do elemento; com "reduzir movimento", o planeta fica parado.
 */

const VERTEX = /* glsl */ `
attribute vec2 aPos;
void main() {
	gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const NOISE = /* glsl */ `
float h31(vec3 p) {
	p = fract(p * 0.3183099 + 0.1);
	p *= 17.0;
	return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float n3(vec3 x) {
	vec3 i = floor(x);
	vec3 f = fract(x);
	f = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
		mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y),
		f.z
	);
}

float fbm(vec3 p) {
	float v = 0.0;
	float a = 0.5;
	for (int i = 0; i < 6; i++) {
		v += a * n3(p);
		p = p * 2.03 + vec3(1.7, 9.2, 3.1);
		a *= 0.5;
	}
	return v;
}
`;

/** Mapa do planeta (longitude x latitude): relevo, detalhe, crateras e nuvens. */
const MAP_SHADER = /* glsl */ `
precision highp float;
uniform vec2 uRes;
${NOISE}
void main() {
	vec2 uv = gl_FragCoord.xy / uRes;
	float lon = uv.x * 6.2831853;
	float lat = (uv.y - 0.5) * 3.1415926;
	vec3 d = vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));
	float h = fbm(d * 2.6);
	float m = fbm(d * 7.0 + vec3(h * 2.0));
	float crater = smoothstep(0.55, 0.7, n3(d * 14.0));
	float cloud = smoothstep(0.52, 0.86, fbm(d * 3.4 + vec3(5.2, 1.3, 2.8)));
	gl_FragColor = vec4(h, m, crater, cloud);
}
`;

const PLANET_SHADER = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform sampler2D uMap;
uniform float uTime;
uniform vec2 uLight;

vec2 mapUv(vec3 n, float angle) {
	vec3 q = vec3(n.x * cos(angle) - n.z * sin(angle), n.y, n.x * sin(angle) + n.z * cos(angle));
	return vec2(atan(q.z, q.x) / 6.2831853 + 0.5, asin(clamp(q.y, -1.0, 1.0)) / 3.1415926 + 0.5);
}

void main() {
	vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / (0.5 * min(uRes.x, uRes.y));
	float r = 0.78;
	float d = length(uv);
	// Luz de trás, em cima à direita: só uma lua crescente fica acesa.
	vec3 L = normalize(vec3(0.85 + uLight.x * 0.22, 0.5 + uLight.y * 0.18, -0.18));
	vec3 col = vec3(0.0);
	float alpha = 0.0;

	// Atmosfera: um halo fino do lado iluminado.
	float side = max(dot(uv / max(d, 1e-4), normalize(L.xy)), 0.0);
	float halo = exp(-max(d - r, 0.0) * 22.0) * pow(side, 2.5) * step(r, d);
	col += vec3(0.62, 0.72, 0.95) * halo * 0.55;
	alpha = max(alpha, halo * 0.55);

	if (d < r) {
		vec3 n = vec3(uv, sqrt(r * r - d * d)) / r;
		vec4 ground = texture2D(uMap, mapUv(n, 0.6 + uTime * 0.012));
		// As nuvens andam um pouco mais rápido que o chão.
		float cloud = texture2D(uMap, mapUv(n, 1.4 + uTime * 0.02)).a;
		vec3 albedo = mix(vec3(0.16, 0.165, 0.17), vec3(0.42, 0.43, 0.45), smoothstep(0.35, 0.75, ground.r));
		albedo *= 0.82 + 0.3 * ground.g;
		albedo -= ground.b * 0.02;
		albedo = mix(albedo, vec3(0.62, 0.64, 0.68), cloud * 0.35);
		float lambert = max(dot(n, L), 0.0);
		float terminator = smoothstep(-0.05, 0.35, dot(n, L));
		vec3 lit = albedo * lambert * 1.35 * terminator;
		float fresnel = pow(1.0 - n.z, 4.0);
		lit += vec3(0.55, 0.65, 0.9) * fresnel * pow(max(dot(n, L) + 0.25, 0.0), 1.5) * 0.6;
		float edge = smoothstep(r, r - 0.004, d);
		col = mix(col, lit, edge);
		alpha = max(alpha, edge);
	}
	gl_FragColor = vec4(col, alpha);
}
`;

function shader(gl: WebGLRenderingContext, type: number, source: string) {
	const s = gl.createShader(type);
	if (!s) return null;
	gl.shaderSource(s, source);
	gl.compileShader(s);
	if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
		console.warn('[planeta]', gl.getShaderInfoLog(s));
		return null;
	}
	return s;
}

function program(gl: WebGLRenderingContext, fragment: string) {
	const v = shader(gl, gl.VERTEX_SHADER, VERTEX);
	const f = shader(gl, gl.FRAGMENT_SHADER, fragment);
	if (!v || !f) return null;
	const p = gl.createProgram();
	if (!p) return null;
	gl.attachShader(p, v);
	gl.attachShader(p, f);
	gl.bindAttribLocation(p, 0, 'aPos');
	gl.linkProgram(p);
	return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}

export function initPlanet(canvas: HTMLCanvasElement) {
	const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
	if (!gl) return;
	const mapProgram = program(gl, MAP_SHADER);
	const planetProgram = program(gl, PLANET_SHADER);
	if (!mapProgram || !planetProgram) return;

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

	// Mapa do planeta, calculado uma vez (1024 x 512, repete na longitude).
	const MAP_W = 1024;
	const MAP_H = 512;
	const map = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, map);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, MAP_W, MAP_H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	const fbo = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, map, 0);
	gl.viewport(0, 0, MAP_W, MAP_H);
	gl.useProgram(mapProgram);
	gl.uniform2f(gl.getUniformLocation(mapProgram, 'uRes'), MAP_W, MAP_H);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	gl.useProgram(planetProgram);
	const uRes = gl.getUniformLocation(planetProgram, 'uRes');
	const uTime = gl.getUniformLocation(planetProgram, 'uTime');
	const uLight = gl.getUniformLocation(planetProgram, 'uLight');
	gl.uniform1i(gl.getUniformLocation(planetProgram, 'uMap'), 0);
	gl.clearColor(0, 0, 0, 0);

	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const coarse = window.matchMedia('(pointer: coarse)').matches;
	const light = { x: 0, y: 0, tx: 0, ty: 0 };
	let time = 0;
	let last = 0;
	let visible = true;
	let frame = 0;

	function resize() {
		const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.5);
		const size = Math.min(Math.round(canvas.clientWidth * dpr), 1600);
		if (size > 0 && (canvas.width !== size || canvas.height !== size)) {
			canvas.width = size;
			canvas.height = size;
		}
	}

	function draw() {
		gl!.viewport(0, 0, canvas.width, canvas.height);
		gl!.clear(gl!.COLOR_BUFFER_BIT);
		gl!.uniform2f(uRes, canvas.width, canvas.height);
		gl!.uniform1f(uTime, time);
		gl!.uniform2f(uLight, light.x, light.y);
		gl!.drawArrays(gl!.TRIANGLES, 0, 3);
	}

	function loop(now: number) {
		frame = requestAnimationFrame(loop);
		const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
		// No celular, 30 quadros por segundo bastam para um giro tão lento.
		if (coarse && dt < 1 / 32) return;
		last = now;
		time += dt;
		light.x += (light.tx - light.x) * Math.min(1, dt * 2.5);
		light.y += (light.ty - light.y) * Math.min(1, dt * 2.5);
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
	canvas.parentElement?.classList.add('is-live');

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
			light.tx = (event.clientX / window.innerWidth) * 2 - 1;
			light.ty = 1 - (event.clientY / window.innerHeight) * 2;
		},
		{ passive: true },
	);
	canvas.addEventListener('webglcontextlost', (event) => {
		event.preventDefault();
		stop();
		canvas.parentElement?.classList.remove('is-live');
	});
	start();
}
