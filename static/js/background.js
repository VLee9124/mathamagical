// Moving background: one folded ribbon down a neutral dark field. The sheet has an
// orange face on each side of a crease; where the crease opens, a blue underside shows.
// Outer edges fall off softly, the crease is crisp, and film grain breaks up every
// gradient. A single fragment shader, drawn at screen resolution so the grain stays fine.
// Falls back to the static CSS glows on <body> when WebGL is unavailable.
(function () {
  'use strict';
  const canvas = document.getElementById('bg');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) { canvas.remove(); return; }

  const VERT = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';
  const FRAG = `
    precision highp float;
    uniform vec2 u_res;
    uniform float u_t;

    float hash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }

    void main() {
      float asp = u_res.x / u_res.y;
      vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;   // y in -0.5..0.5, x scaled by aspect
      float s = min(1.0, asp / 1.25);                        // narrower ribbon on portrait screens
      float y = uv.y, x = uv.x / s;
      float t = u_t * 0.06;

      // Two grains, fixed to the screen: one roughens the edges, one speckles the color.
      float g1 = hash(gl_FragCoord.xy) - 0.5;
      float g2 = hash(gl_FragCoord.xy + 71.7) - 0.5;

      // The sheet: an S-shaped centre line and a width that breathes a little.
      float c = 0.105 * sin(y * 3.7 + 0.4 + t) + 0.010 * sin(y * 7.5 + 1.0 - 1.4 * t);   // one slow S down the screen
      float w = 0.43 + 0.050 * sin(y * 2.4 + 2.0 + 0.8 * t);
      float u = (x - c) / w + g1 * 0.07;                    // -1 at the left edge, +1 at the right

      // The crease wanders across the sheet; the underside shows only along part of it.
      float f = -0.16 + 0.15 * sin(y * 2.9 + 2.2 - 0.9 * t);
      float open = smoothstep(-0.45, 0.35, sin(y * 2.2 + 1.2 + 0.6 * t));

      float edgeL = smoothstep(-1.0, -0.50, u);              // soft outer edges
      float edgeR = 1.0 - smoothstep(0.52, 1.0, u);
      float side  = smoothstep(f - 0.010, f + 0.010, u);     // crisp crease: 0 left face, 1 right
      float shadeL = 1.0 - 0.94 * smoothstep(f - 0.46, f - 0.03, u);   // left face rolls into shadow
      float shadeR = mix(0.22, 1.0, smoothstep(f + 0.10, f + 0.66, u)); // right face rises out of it
      float under = side * (1.0 - smoothstep(f + 0.06, f + 0.62, u)) * open * edgeR;

      vec3 night  = vec3(0.063, 0.063, 0.063);
      vec3 orange = vec3(0.898, 0.451, 0.012);
      vec3 peach  = vec3(0.953, 0.631, 0.239);
      vec3 blue   = vec3(0.016, 0.584, 0.839);
      vec3 cyan   = vec3(0.149, 0.851, 0.878);

      float face = mix(shadeL, shadeR, side) * edgeL * edgeR;
      vec3 warm = mix(orange, peach, pow(face, 4.0) * 0.22); // a touch lighter only on the crests
      vec3 cool = mix(blue, cyan, under * under * 0.25);

      vec3 col = night;
      col += warm * face * (1.0 - 0.80 * under) * 0.90;
      col += cool * under * 0.74;

      float lit = max(face, under);
      col += g2 * (0.036 + 0.095 * lit);                     // grain, stronger where there is color
      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (!vs || !fs) { canvas.remove(); return; }
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'u_res'), uT = gl.getUniformLocation(prog, 'u_t');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  function resize() {
    // Screen resolution (up to 2x, long side capped) so the grain is one pixel fine.
    const k = Math.min(Math.min(2, devicePixelRatio || 1), 2400 / Math.max(innerWidth, innerHeight));
    const w = Math.max(2, Math.round(innerWidth * k)), h = Math.max(2, Math.round(innerHeight * k));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
  }
  function draw(seconds) {
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uT, seconds);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // The clock only advances while frames are drawn, so the ribbon resumes where it paused.
  let clock = 12, last = 0, raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < 33) return;                 // ~30 fps is enough for motion this slow
    clock += Math.min(0.1, (now - last) / 1000); last = now;
    draw(clock);
  }
  function start() { if (!raf && !reduce.matches && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  resize(); draw(clock); start();               // first frame is drawn immediately, not on the first tick
  addEventListener('resize', () => { resize(); draw(clock); });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reduce.addEventListener('change', () => (reduce.matches ? stop() : start()));
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); canvas.style.display = 'none'; });
})();
