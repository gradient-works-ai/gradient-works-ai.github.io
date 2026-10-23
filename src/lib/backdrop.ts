import { lowPower, whenIdle } from './perf';

// Full-screen WebGL backdrop: domain-warped noise rendered as slow iridescent light over near-black.
// Rendered at reduced resolution and ~30fps; hue drifts with scroll, the field leans toward the pointer.
// If WebGL is unavailable the CSS fallback gradient on <canvas id="bg"> stays visible.

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_scroll;
uniform vec2 u_mouse;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time * 0.035;
  p += (u_mouse - 0.5) * vec2(0.12, -0.08);

  vec2 q = vec2(fbm(p * 1.3 + t), fbm(p * 1.3 - t + 5.2));
  vec2 w = vec2(fbm(p * 1.5 + 2.0 * q + vec2(1.7, 9.2) + t * 1.3), fbm(p * 1.5 + 2.0 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p * 1.1 + 2.4 * w);

  vec3 c1 = vec3(0.957, 0.773, 0.561);  // peach
  vec3 c2 = vec3(0.910, 0.639, 0.788);  // rose
  vec3 c3 = vec3(0.624, 0.714, 1.000);  // periwinkle
  vec3 c4 = vec3(0.557, 0.902, 0.820);  // mint
  // cool base (periwinkle -> rose), mint where the warp stretches, a little peach on strong folds
  vec3 col = mix(c3, c2, smoothstep(0.35, 0.8, f + 0.18 * sin(u_scroll * 6.2832)));
  col = mix(col, c4, smoothstep(0.6, 1.1, length(w) - 0.25 + u_scroll * 0.5) * 0.7);
  col = mix(col, c1, smoothstep(0.65, 1.0, q.x) * 0.45);

  // silk: thin bright bands riding the warped field, plus a soft body glow
  float bands = 0.5 + 0.5 * sin(f * 11.0 + w.x * 6.0 - u_time * 0.12);
  float silk = pow(bands, 9.0) * smoothstep(0.3, 0.72, f);
  float body = smoothstep(0.42, 0.9, f) * 0.35 + pow(clamp(length(q) * 0.8, 0.0, 1.0), 2.6) * 0.18;
  float glow = silk * 1.1 + body;

  float fall = mix(0.35, 1.0, smoothstep(-0.1, 1.0, uv.y));      // brighter toward the top
  float vig = smoothstep(1.3, 0.25, length(p * vec2(0.85, 1.15)));
  vec3 o = vec3(0.022, 0.022, 0.032) + col * glow * 0.5 * fall;
  o *= mix(0.5, 1.0, vig);
  o += (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) / 255.0;    // dither against banding
  gl_FragColor = vec4(o, 1.0);
}`;

const VERT = 'attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }';

export function initBackdrop(reduce: boolean) {
  const cv = document.getElementById('bg') as HTMLCanvasElement | null;
  const gl = cv?.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!cv || !gl) return;

  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;   // keep the CSS fallback
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);   // one oversized triangle
  const a = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res'), uTime = gl.getUniformLocation(prog, 'u_time');
  const uScroll = gl.getUniformLocation(prog, 'u_scroll'), uMouse = gl.getUniformLocation(prog, 'u_mouse');

  const SCALE = lowPower ? 0.3 : 0.5;   // render at half resolution; the field is soft, so upscaling is invisible
  const resize = () => {
    cv.width = Math.max(1, Math.round(innerWidth * SCALE));
    cv.height = Math.max(1, Math.round(innerHeight * SCALE));
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(uRes, cv.width, cv.height);
  };
  resize();
  addEventListener('resize', resize);

  let mx = 0.5, my = 0.5, sx = 0.5, sy = 0.5, scroll = 0, sScroll = 0;
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; }, { passive: true });
  const readScroll = () => { scroll = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight); };
  addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  const draw = (time: number) => {
    sx += (mx - sx) * 0.04; sy += (my - sy) * 0.04; sScroll += (scroll - sScroll) * 0.06;
    gl.uniform1f(uTime, time);
    gl.uniform1f(uScroll, sScroll);
    gl.uniform2f(uMouse, sx, sy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  draw(((performance.timeOrigin + performance.now()) / 1000) % 3600);   // first frame immediately
  if (reduce) return;
  let last = 0;
  const loop = (now: number) => {
    if (now - last > (lowPower ? 66 : 33)) { last = now; draw(((performance.timeOrigin + now) / 1000) % 3600); }
    requestAnimationFrame(loop);
  };
  whenIdle(() => requestAnimationFrame(loop));
}
