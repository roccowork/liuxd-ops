import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineLoop,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from 'three';

/** 首屏背景：一张缓慢旋转的"基础设施星图"，金色数据包沿连线在节点间流动。 */
export function initConstellation(canvas: HTMLCanvasElement) {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return; // 不支持 WebGL：保留纯色背景即可
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(dpr);

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0, 7.2);
  const group = new Group();
  group.rotation.set(0.38, 0, 0.12);
  scene.add(group);

  // 固定种子的随机数，保证每次打开图案一致
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  // ── 节点：斐波那契球面 ────────────────────────────────
  const N = 220, R = 2.2;
  const nodes: Vector3[] = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - ((i + 0.5) / N) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = i * Math.PI * (3 - Math.sqrt(5));
    const j = R * (1 + (rand() - 0.5) * 0.1);
    nodes.push(new Vector3(Math.cos(th) * r * j, y * j, Math.sin(th) * r * j));
  }

  // ── 连线：每个节点连最近的 3 个 ──────────────────────
  const adj: number[][] = nodes.map(() => []);
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  nodes.forEach((p, i) => {
    nodes
      .map((q, k) => [k, p.distanceToSquared(q)] as const)
      .filter(([k]) => k !== i)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .forEach(([k]) => {
        const key = i < k ? `${i}-${k}` : `${k}-${i}`;
        if (seen.has(key)) return;
        seen.add(key);
        edges.push([i, k]);
        adj[i].push(k);
        adj[k].push(i);
      });
  });

  const fadeVert = /* glsl */ `
    attribute float size;
    attribute float alpha;
    attribute vec3 color;
    uniform float uPx;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mv;
      float depth = -mv.z;
      vAlpha = alpha * (0.22 + 0.78 * smoothstep(9.6, 5.0, depth));
      gl_PointSize = size * uPx * (7.0 / depth);
      vColor = color;
    }`;
  const dotFrag = /* glsl */ `
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.32, d) + 0.35 * smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(vColor, a * vAlpha);
    }`;
  const pointMat = () =>
    new ShaderMaterial({
      uniforms: { uPx: { value: dpr } },
      vertexShader: fadeVert,
      fragmentShader: dotFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

  const silver = new Color('#9fb3cf');
  const gold = new Color('#d2b17a');
  const pale = new Color('#f3dfb4');

  // 节点
  {
    const g = new BufferGeometry();
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), alpha = new Float32Array(N);
    nodes.forEach((p, i) => {
      const hub = i % 17 === 0;
      p.toArray(pos, i * 3);
      (hub ? gold : silver).toArray(col, i * 3);
      size[i] = hub ? 12 : 5 + rand() * 3;
      alpha[i] = hub ? 1 : 0.85;
    });
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('color', new BufferAttribute(col, 3));
    g.setAttribute('size', new BufferAttribute(size, 1));
    g.setAttribute('alpha', new BufferAttribute(alpha, 1));
    group.add(new Points(g, pointMat()));
  }

  // 连线（远处更淡）
  {
    const g = new BufferGeometry();
    const pos = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], i) => {
      nodes[a].toArray(pos, i * 6);
      nodes[b].toArray(pos, i * 6 + 3);
    });
    g.setAttribute('position', new BufferAttribute(pos, 3));
    const m = new ShaderMaterial({
      uniforms: { uColor: { value: new Color('#8fb0dc') } },
      vertexShader: /* glsl */ `
        varying float vFade;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          vFade = smoothstep(9.6, 5.0, -mv.z);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vFade;
        void main() { gl_FragColor = vec4(uColor, 0.10 + 0.42 * vFade); }`,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    group.add(new LineSegments(g, m));
  }

  // 两条环绕轨道 + 轨道上的卫星
  const orbits: { tilt: [number, number]; r: number; speed: number; phase: number }[] = [
    { tilt: [1.15, 0.2], r: 2.75, speed: 0.22, phase: 0 },
    { tilt: [1.45, -0.55], r: 3.0, speed: -0.15, phase: 2.1 },
  ];
  const orbitGroups = orbits.map((o) => {
    const og = new Group();
    og.rotation.set(o.tilt[0], o.tilt[1], 0);
    const g = new BufferGeometry();
    const seg = 160, pos = new Float32Array(seg * 3);
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      pos.set([Math.cos(a) * o.r, Math.sin(a) * o.r, 0], i * 3);
    }
    g.setAttribute('position', new BufferAttribute(pos, 3));
    og.add(new LineLoop(g, new LineBasicMaterial({ color: gold, transparent: true, opacity: 0.22, depthWrite: false })));
    group.add(og);
    return og;
  });

  // ── 数据包：沿连线游走，带两段拖尾 ──────────────────
  const P = 16, TRAIL = 3, SAT = orbits.length;
  const packets = Array.from({ length: P }, () => {
    const a = Math.floor(rand() * N);
    return { prev: -1, a, b: adj[a][Math.floor(rand() * adj[a].length)], t: rand(), speed: 0.55 + rand() * 0.5 };
  });
  const pg = new BufferGeometry();
  const total = P * TRAIL + SAT;
  const ppos = new Float32Array(total * 3), pcol = new Float32Array(total * 3), psize = new Float32Array(total), palpha = new Float32Array(total);
  for (let i = 0; i < P; i++) {
    for (let k = 0; k < TRAIL; k++) {
      const idx = i * TRAIL + k;
      pale.toArray(pcol, idx * 3);
      psize[idx] = [10, 7, 5][k];
      palpha[idx] = [1, 0.45, 0.2][k];
    }
  }
  for (let s = 0; s < SAT; s++) {
    const idx = P * TRAIL + s;
    gold.toArray(pcol, idx * 3);
    psize[idx] = 10;
    palpha[idx] = 0.9;
  }
  pg.setAttribute('position', new BufferAttribute(ppos, 3));
  pg.setAttribute('color', new BufferAttribute(pcol, 3));
  pg.setAttribute('size', new BufferAttribute(psize, 1));
  pg.setAttribute('alpha', new BufferAttribute(palpha, 1));
  group.add(new Points(pg, pointMat()));

  const tmp = new Vector3();
  const satWorld = new Vector3();
  function updatePackets(dt: number, time: number) {
    packets.forEach((p, i) => {
      const len = nodes[p.a].distanceTo(nodes[p.b]);
      p.t += (dt * p.speed) / Math.max(len, 0.3);
      if (p.t >= 1) {
        // 到达下一个节点：继续往前走，不立刻折返
        const options = adj[p.b].filter((k) => k !== p.a);
        const next = options.length ? options[Math.floor(rand() * options.length)] : p.a;
        p.prev = p.a; p.a = p.b; p.b = next; p.t = 0;
      }
      for (let k = 0; k < TRAIL; k++) {
        const tt = Math.max(0, p.t - k * 0.07);
        tmp.lerpVectors(nodes[p.a], nodes[p.b], tt).toArray(ppos, (i * TRAIL + k) * 3);
      }
    });
    orbits.forEach((o, s) => {
      const a = time * o.speed + o.phase;
      satWorld.set(Math.cos(a) * o.r, Math.sin(a) * o.r, 0).applyEuler(orbitGroups[s].rotation);
      satWorld.toArray(ppos, (P * TRAIL + s) * 3);
    });
    (pg.attributes.position as BufferAttribute).needsUpdate = true;
  }

  // ── 尺寸自适应 ───────────────────────────────────────
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // 窄屏时拉远相机，保证整个星图都在画面里
    camera.position.z = Math.max(7.2, 3.6 / (Math.tan((19 * Math.PI) / 180) * camera.aspect));
    camera.updateProjectionMatrix();
    if (reduce || !running) renderer.render(scene, camera);
  }

  // ── 鼠标视差 ─────────────────────────────────────────
  const pointer = { x: 0, y: 0 }, eased = { x: 0, y: 0 };
  if (!reduce) {
    window.addEventListener('pointermove', (e) => {
      pointer.x = (e.clientX / innerWidth) * 2 - 1;
      pointer.y = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
  }

  let running = false, raf = 0, last = 0, time = 0;
  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now; time += dt;
    eased.x += (pointer.x - eased.x) * 0.04;
    eased.y += (pointer.y - eased.y) * 0.04;
    group.rotation.y += dt * 0.06;
    group.rotation.x = 0.38 + eased.y * 0.1;
    group.position.x = eased.x * 0.12;
    updatePackets(dt, time);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running || reduce) return;
    running = true; last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  new ResizeObserver(resize).observe(canvas);
  resize();
  updatePackets(0, 0);
  renderer.render(scene, camera);
  canvas.classList.add('ready');

  if (reduce) return;
  let visible = true;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    visible && !document.hidden ? start() : stop();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden || !visible ? stop() : start()));
}
