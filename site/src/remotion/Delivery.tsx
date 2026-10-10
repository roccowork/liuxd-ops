import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const FPS = 30;
export const W = 1280;
export const H = 720;

/** 四幕：起始帧与时长 */
export const CHAPTERS = [
  { from: 0, dur: 100, label: '提交代码' },
  { from: 100, dur: 180, label: '自动构建' },
  { from: 280, dur: 140, label: '滚动发布' },
  { from: 420, dur: 180, label: '回滚演练' },
] as const;
export const DURATION = 600;

const C = {
  bg: '#0a1424',
  panel: '#0f1d33',
  panel2: '#132540',
  line: 'rgba(255,255,255,0.10)',
  text: '#e9edf3',
  text2: '#a9b4c4',
  text3: '#6f7d92',
  gold: '#d2b17a',
  ok: '#5fae8c',
  bad: '#d0644c',
  blue: '#7aa2dc',
};
const F = {
  serif: 'var(--serif, "Noto Serif SC", serif)',
  sans: 'var(--sans, "Microsoft YaHei", sans-serif)',
  mono: 'var(--mono, Consolas, monospace)',
};
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const fade = (f: number, start: number, dur = 14) => interpolate(f, [start, start + dur], [0, 1], { ...clamp, easing: ease });
const typed = (f: number, start: number, text: string, cps = 1.4) => text.slice(0, Math.max(0, Math.floor((f - start) * cps)));

/* ── 通用元素 ─────────────────────────────────────────── */

const Scene = ({ dur, children }: { dur: number; children: ReactNode }) => {
  const f = useCurrentFrame();
  const opacity = Math.min(fade(f, 0, 12), interpolate(f, [dur - 10, dur], [1, 0], clamp));
  const y = interpolate(f, [0, 16], [14, 0], { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ opacity, transform: `translateY(${y}px)`, padding: '104px 72px 64px' }}>{children}</AbsoluteFill>
  );
};

const Heading = ({ step, title }: { step: string; title: string }) => (
  <div style={{ marginBottom: 36 }}>
    <div style={{ font: `500 15px ${F.mono}`, letterSpacing: 4, color: C.gold }}>STEP {step}</div>
    <div style={{ font: `600 38px/1.3 ${F.serif}`, color: C.text, marginTop: 10 }}>{title}</div>
  </div>
);

const Panel = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 6, ...style }}>{children}</div>
);

const Terminal = ({ title, children, style }: { title: string; children: ReactNode; style?: CSSProperties }) => (
  <Panel style={{ overflow: 'hidden', ...style }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderBottom: `1px solid ${C.line}` }}>
      {[0, 1, 2].map((i) => <span key={i} style={{ width: 10, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.14)' }} />)}
      <span style={{ marginLeft: 10, font: `14px ${F.mono}`, color: C.text3 }}>{title}</span>
    </div>
    <div style={{ padding: '18px 22px', font: `19px/1.9 ${F.mono}`, color: C.text2 }}>{children}</div>
  </Panel>
);

const Caret = () => {
  const f = useCurrentFrame();
  return <span style={{ display: 'inline-block', width: 10, height: 21, background: C.gold, verticalAlign: -3, opacity: Math.floor(f / 15) % 2 ? 0 : 1 }} />;
};

type PodState = 'pending' | 'ready' | 'notready' | 'terminating';
const Pod = ({ state, label, opacity = 1 }: { state: PodState; label: string; opacity?: number }) => {
  const color = { pending: C.text3, ready: C.ok, notready: C.bad, terminating: C.text3 }[state];
  const text = { pending: '创建中', ready: 'Ready', notready: '0/1 未就绪', terminating: '停止中' }[state];
  return (
    <div style={{
      width: 168, height: 78, borderRadius: 6, padding: '12px 16px', opacity,
      border: `1.5px ${state === 'pending' ? 'dashed' : 'solid'} ${state === 'ready' ? 'rgba(95,174,140,0.55)' : state === 'notready' ? C.bad : C.line}`,
      background: state === 'notready' ? 'rgba(208,100,76,0.10)' : state === 'ready' ? 'rgba(95,174,140,0.07)' : 'transparent',
    }}>
      <div style={{ font: `15px ${F.mono}`, color: C.text2 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, font: `500 16px ${F.sans}`, color }}>
        <span style={{ width: 9, height: 9, borderRadius: 5, background: color }} />{text}
      </div>
    </div>
  );
};

/* ── 第 1 幕：提交代码 ─────────────────────────────────── */

const SceneCommit = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const l1 = 'git commit -m "feat: 新增 /healthz 接口"';
  const l2 = 'git push origin main';
  const s2 = 14 + l1.length / 1.4 + 6;
  const done = s2 + l2.length / 1.4 + 4;
  const card = spring({ frame: f - done - 4, fps, config: { damping: 18 } });
  return (
    <Scene dur={100}>
      <Heading step="01" title="合并一个 PR，就是一次发布的开始" />
      <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
        <Terminal title="~/labapp" style={{ width: 720 }}>
          <div><span style={{ color: C.gold }}>$ </span>{typed(f, 14, l1)}{f < s2 && <Caret />}</div>
          <div style={{ opacity: f >= s2 ? 1 : 0 }}><span style={{ color: C.gold }}>$ </span>{typed(f, s2, l2)}{f >= s2 && f < done && <Caret />}</div>
          <div style={{ opacity: fade(f, done), color: C.ok }}>✓ PR #12 · go vet 通过 · go test 通过 · 已合并</div>
        </Terminal>
        <Panel style={{ width: 344, padding: '22px 24px', opacity: card, transform: `translateY(${(1 - card) * 24}px)` }}>
          <div style={{ font: `14px ${F.mono}`, color: C.text3, letterSpacing: 2 }}>COMMIT</div>
          <div style={{ font: `600 30px ${F.mono}`, color: C.gold, margin: '6px 0 12px' }}>a1b2c3d</div>
          <div style={{ font: `18px/1.6 ${F.sans}`, color: C.text }}>feat: 新增 /healthz 接口</div>
          <div style={{ font: `15px ${F.mono}`, color: C.text3, marginTop: 12 }}>main ← feature/healthz</div>
        </Panel>
      </div>
    </Scene>
  );
};

/* ── 第 2 幕：流水线 ──────────────────────────────────── */

const STAGES = [
  { name: 'PR 检查', tool: 'GitHub Actions', secs: 12, log: 'go vet ./... && go test ./...   ok  labapp 0.42s' },
  { name: '构建镜像', tool: 'Jenkins', secs: 38, log: 'docker build -t labapp:42-a1b2c3d .' },
  { name: '推送镜像', tool: 'Registry', secs: 6, log: 'push registry:5000/labapp:42-a1b2c3d   digest sha256:9f3c…' },
  { name: '更新部署仓库', tool: 'labapp-gitops', secs: 3, log: 'image tag → 42-a1b2c3d   git push labapp-gitops main' },
  { name: '自动同步', tool: 'Argo CD', secs: 21, log: 'labapp  Synced · Healthy' },
];
const stageStart = (i: number) => 18 + i * 30;
const RUN = 22;

const ScenePipeline = () => {
  const f = useCurrentFrame();
  const colW = 1136 / STAGES.length;
  const logs = STAGES.map((s, i) => ({ ...s, i, at: stageStart(i) + 4 })).filter((s) => f >= s.at).slice(-4);
  return (
    <Scene dur={180}>
      <Heading step="02" title="流水线自动完成测试、构建与发布" />
      <div style={{ position: 'relative', display: 'flex', height: 150 }}>
        {STAGES.map((s, i) => {
          const st = stageStart(i);
          const state = f < st ? 'wait' : f < st + RUN ? 'run' : 'done';
          const fill = i < STAGES.length - 1 ? interpolate(f, [st + RUN, stageStart(i + 1)], [0, 1], clamp) : 0;
          return (
            <div key={s.name} style={{ width: colW, position: 'relative' }}>
              {i < STAGES.length - 1 && (
                <div style={{ position: 'absolute', left: 52, right: 4, top: 22, height: 2, background: C.line }}>
                  <div style={{ width: `${fill * 100}%`, height: '100%', background: C.gold }} />
                </div>
              )}
              <div style={{
                width: 46, height: 46, borderRadius: 23, display: 'grid', placeItems: 'center',
                border: `2px solid ${state === 'wait' ? C.line : state === 'run' ? 'rgba(122,162,220,0.25)' : C.ok}`,
                borderTopColor: state === 'run' ? C.blue : undefined,
                background: state === 'done' ? C.ok : 'transparent',
                transform: state === 'run' ? `rotate(${f * 14}deg)` : undefined,
                color: C.bg, font: `700 22px ${F.sans}`,
              }}>{state === 'done' ? '✓' : ''}</div>
              <div style={{ font: `600 21px ${F.sans}`, color: state === 'wait' ? C.text3 : C.text, marginTop: 18 }}>{s.name}</div>
              <div style={{ font: `15px ${F.mono}`, color: C.text3, marginTop: 2 }}>{s.tool}</div>
              <div style={{ font: `15px ${F.mono}`, marginTop: 6, color: state === 'done' ? C.ok : state === 'run' ? C.blue : C.text3 }}>
                {state === 'done' ? `✓ ${s.secs}s` : state === 'run' ? '运行中…' : '等待'}
              </div>
            </div>
          );
        })}
      </div>
      <Terminal title="pipeline log" style={{ marginTop: 34, height: 200 }}>
        {logs.map((l) => (
          <div key={l.i} style={{ opacity: fade(f, l.at, 8), whiteSpace: 'nowrap' }}>
            <span style={{ color: C.gold }}>[{l.tool}]</span> {l.log}
          </div>
        ))}
      </Terminal>
    </Scene>
  );
};

/* ── 第 3 幕：滚动发布 ────────────────────────────────── */

const cycle = (k: number) => 16 + k * 34;

const SceneRollout = () => {
  const f = useCurrentFrame();
  const newState = (k: number): PodState | null => (f < cycle(k) ? null : f < cycle(k) + 14 ? 'pending' : 'ready');
  const oldState = (k: number): PodState | null => (f < cycle(k) + 18 ? 'ready' : f < cycle(k) + 28 ? 'terminating' : null);
  const available = [0, 1, 2].filter((k) => oldState(k) === 'ready').length + [0, 1, 2].filter((k) => newState(k) === 'ready').length;
  // 发布期间的每秒请求数：有起伏，但错误数始终为 0
  const pts = Array.from({ length: 60 }, (_, i) => {
    const v = 0.55 + Math.sin(i * 0.5) * 0.12 + Math.sin(i * 1.7) * 0.06;
    return `${(i / 59) * 420},${110 - v * 100}`;
  });
  const shown = Math.floor(interpolate(f, [8, 130], [2, 60], clamp));
  const row = (label: string, color: string, render: (k: number) => ReactNode) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ font: `15px ${F.mono}`, color, marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', gap: 14, height: 78 }}>{[0, 1, 2].map(render)}</div>
    </div>
  );
  return (
    <Scene dur={140}>
      <Heading step="03" title="滚动更新：先起新版本，再停旧版本" />
      <div style={{ display: 'flex', gap: 56 }}>
        <div style={{ width: 560 }}>
          {row('ReplicaSet · v41（旧版本）', C.text3, (k) => {
            const s = oldState(k);
            return s ? <Pod key={k} state={s} label={`labapp-v41-${k + 1}`} opacity={s === 'terminating' ? interpolate(f, [cycle(k) + 18, cycle(k) + 28], [1, 0.25], clamp) : 1} /> : <div key={k} style={{ width: 168 }} />;
          })}
          {row('ReplicaSet · v42（新版本 42-a1b2c3d）', C.gold, (k) => {
            const s = newState(k);
            return s ? <Pod key={k} state={s} label={`labapp-v42-${k + 1}`} opacity={fade(f, cycle(k), 8)} /> : <div key={k} style={{ width: 168 }} />;
          })}
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            {['maxSurge: 1', 'maxUnavailable: 0', 'readinessProbe: /healthz'].map((t) => (
              <span key={t} style={{ font: `14px ${F.mono}`, color: C.text2, border: `1px solid ${C.line}`, borderRadius: 4, padding: '5px 10px' }}>{t}</span>
            ))}
          </div>
        </div>
        <Panel style={{ flex: 1, padding: '24px 28px' }}>
          <div style={{ display: 'flex', gap: 48 }}>
            <div>
              <div style={{ font: `15px ${F.sans}`, color: C.text3 }}>就绪 Pod</div>
              <div style={{ font: `600 52px ${F.mono}`, color: C.text }}>{available}<span style={{ font: `16px ${F.sans}`, color: C.text3, marginLeft: 10 }}>期望 3</span></div>
            </div>
            <div>
              <div style={{ font: `15px ${F.sans}`, color: C.text3 }}>请求错误</div>
              <div style={{ font: `600 52px ${F.mono}`, color: C.ok }}>0</div>
            </div>
          </div>
          <svg width="420" height="120" viewBox="0 0 420 120" style={{ marginTop: 18, overflow: 'visible' }}>
            {[0, 40, 80].map((y) => <line key={y} x1="0" x2="420" y1={y + 30} y2={y + 30} stroke={C.line} />)}
            <polyline points={pts.slice(0, shown).join(' ')} fill="none" stroke={C.gold} strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
          <div style={{ font: `14px ${F.mono}`, color: C.text3, marginTop: 8 }}>Prometheus · 发布期间每秒请求数</div>
        </Panel>
      </div>
    </Scene>
  );
};

/* ── 第 4 幕：坏版本与回滚 ────────────────────────────── */

const SceneRollback = () => {
  const f = useCurrentFrame();
  const l1 = 'git revert HEAD --no-edit';
  const l2 = 'git push';
  const s1 = 52, s2 = s1 + l1.length / 1.4 + 6, synced = 112;
  const badState: PodState | null = f < 16 ? null : f < 30 ? 'pending' : f < synced ? 'notready' : 'terminating';
  const badOpacity = f < synced ? fade(f, 16, 8) * (badState === 'notready' ? 0.75 + 0.25 * Math.sin(f / 4) : 1) : interpolate(f, [synced, synced + 14], [1, 0], clamp);
  const end = fade(f, 134, 18);
  return (
    <Scene dur={180}>
      <Heading step="04" title="坏版本演练：就绪探针拦住，git revert 回滚" />
      <div style={{ display: 'flex', gap: 48 }}>
        <div style={{ width: 560 }}>
          <div style={{ font: `15px ${F.mono}`, color: C.gold, marginBottom: 10 }}>v42 · 线上版本</div>
          <div style={{ display: 'flex', gap: 14 }}>{[1, 2, 3].map((k) => <Pod key={k} state="ready" label={`labapp-v42-${k}`} />)}</div>
          <div style={{ font: `15px ${F.mono}`, color: C.bad, margin: '22px 0 10px', opacity: fade(f, 16, 8) }}>v43 · 监听端口写错（单元测试发现不了）</div>
          <div style={{ height: 78 }}>{badState && <Pod state={badState} label="labapp-v43-1" opacity={badOpacity} />}</div>
          <div style={{ marginTop: 20, font: `17px ${F.sans}`, minHeight: 28 }}>
            {f >= 30 && f < synced + 8 && <span style={{ color: C.text2, opacity: fade(f, 30) }}>readiness probe failed → 发布暂停，旧 Pod 不会被删除，服务照常</span>}
            {f >= synced + 8 && <span style={{ color: C.ok, opacity: fade(f, synced + 8) }}>✓ v43 已撤销，线上仍是 42-a1b2c3d，全程无中断</span>}
          </div>
        </div>
        <Terminal title="~/labapp-gitops" style={{ flex: 1, alignSelf: 'flex-start' }}>
          <div style={{ opacity: f >= s1 ? 1 : 0 }}><span style={{ color: C.gold }}>$ </span>{typed(f, s1, l1)}{f >= s1 && f < s2 && <Caret />}</div>
          <div style={{ opacity: f >= s2 ? 1 : 0 }}><span style={{ color: C.gold }}>$ </span>{typed(f, s2, l2)}</div>
          <div style={{ opacity: fade(f, 96, 8), color: C.blue }}>Argo CD · OutOfSync → Syncing</div>
          <div style={{ opacity: fade(f, synced, 8), color: C.ok }}>Argo CD · Synced · Healthy ✓</div>
        </Terminal>
      </div>
      <div style={{
        position: 'absolute', left: 72, right: 72, bottom: 58, opacity: end, transform: `translateY(${(1 - end) * 10}px)`,
        display: 'flex', justifyContent: 'center', gap: 56, font: `600 30px ${F.serif}`, color: C.gold,
        borderTop: `1px solid ${C.line}`, paddingTop: 24,
      }}>
        <span>可追溯</span><span style={{ color: C.text3 }}>·</span><span>不中断</span><span style={{ color: C.text3 }}>·</span><span>可回滚</span>
      </div>
    </Scene>
  );
};

/* ── 合成 ─────────────────────────────────────────────── */

const Chrome = () => {
  const f = useCurrentFrame();
  const current = CHAPTERS.findIndex((c) => f >= c.from && f < c.from + c.dur);
  return (
    <>
      <div style={{ position: 'absolute', left: 72, right: 72, top: 34, display: 'flex', alignItems: 'center' }}>
        <span style={{ font: `15px ${F.mono}`, color: C.text3, letterSpacing: 1 }}>labapp · delivery pipeline</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 28 }}>
          {CHAPTERS.map((c, i) => (
            <span key={c.label} style={{ font: `15px ${F.sans}`, color: i === current ? C.gold : i < current ? C.text2 : C.text3 }}>
              <span style={{ fontFamily: F.mono, marginRight: 8 }}>0{i + 1}</span>{c.label}
            </span>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ width: `${(f / DURATION) * 100}%`, height: '100%', background: C.gold }} />
      </div>
    </>
  );
};

export const Delivery = () => (
  <AbsoluteFill style={{ background: `radial-gradient(900px 500px at 85% 0%, #16294a 0%, ${C.bg} 60%)`, fontFamily: F.sans, color: C.text }}>
    <Sequence from={CHAPTERS[0].from} durationInFrames={CHAPTERS[0].dur}><SceneCommit /></Sequence>
    <Sequence from={CHAPTERS[1].from} durationInFrames={CHAPTERS[1].dur}><ScenePipeline /></Sequence>
    <Sequence from={CHAPTERS[2].from} durationInFrames={CHAPTERS[2].dur}><SceneRollout /></Sequence>
    <Sequence from={CHAPTERS[3].from} durationInFrames={CHAPTERS[3].dur}><SceneRollback /></Sequence>
    <Chrome />
  </AbsoluteFill>
);
