import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { RoundedBox } from '@react-three/drei';
import { F, clamp, count, ease, fade, typed } from './theme';
import { Glass, Glow, Gold, Label, Navy, P, Pearl, Pill, Shadows, StudioCanvas, Tile, projector, studioBg, vignette } from './studio';
import type { Cam } from './studio';

/* 90 秒视频介绍：圆角 3D 商务风，1920×1080，八段。数字都来自实测记录（见 README）。 */

export const FPS = 30;
export const W = 1920;
export const H = 1080;

type V3 = [number, number, number];

/** 八段：起始帧、时长、章节名、字幕（按段内帧数切换） */
const S = [
  { from: 0, dur: 180, label: '开场', subs: [[0, '11 年企业 IT 运维，现在专注运维自动化']] },
  { from: 180, dur: 360, label: '生产平台', subs: [[0, '一套长期运行的线上平台：香港云服务器上的单节点 k3s'], [180, '应用和基础组件都由 Argo CD 从 Git 同步，服务器上不手工放清单']] },
  { from: 540, dur: 450, label: 'GitOps 发布', subs: [[0, '推送代码后自动测试、构建、更新镜像版本，约 3～4 分钟上线（实测）'], [250, '坏版本过不了就绪探针，旧版本照常服务；git revert 约 1 分钟回滚（实测）']] },
  { from: 990, dur: 360, label: '监控告警', subs: [[0, '把站点缩容到 0 做验收：第 106 秒企业微信收到告警（实测）'], [220, '恢复后自动发恢复通知；每周一 09:00 自动出运维周报']] },
  { from: 1350, dur: 300, label: '数据安全', subs: [[0, '每天用 restic 把数据加密备份到另一家云，超过 26 小时没成功就告警'], [150, 'HTTPS 证书全自动续期，剩 21 天还没续上就告警']] },
  { from: 1650, dur: 300, label: '工程化', subs: [[0, 'Renovate 每周给 8 个仓库自动提依赖升级 PR，CI 通过才合并'], [150, 'Ansible 重复执行 changed=0，Terraform 检测配置漂移']] },
  { from: 1950, dur: 360, label: '实验环境', subs: [[0, '实验环境：自己搭建的虚拟机集群，16 个实验从 Linux 初始化做到 GitOps'], [190, '每个实验都有验证清单、失败演练、回滚步骤和踩坑记录']] },
  { from: 2310, dur: 390, label: '案例与联系', subs: [[0, '整理了 143 个企业自动化案例，标明哪些在实际运行、哪些是方案设计'], [200, '作品集与简历 cv.liuxd.dev · 线上平台 ops.liuxd.dev']] },
] as const;
export const DURATION = 2700;

/* ── 通用 ─────────────────────────────────────────────── */

/** 相机在两个机位之间缓慢移动 */
const camAt = (f: number, a: Cam, b: Cam, dur: number): Cam => {
  const t = interpolate(f, [0, dur], [0, 1], { ...clamp, easing: ease });
  const lerp = (x: V3, y: V3) => x.map((v, i) => v + (y[i] - v) * t) as V3;
  return { pos: lerp(a.pos, b.pos), target: lerp(a.target, b.target), fov: a.fov + (b.fov - a.fov) * t };
};

/** 弹出动画：0→1 带一点回弹 */
const pop = (f: number, at: number, dur = 16) =>
  interpolate(f, [at, at + dur * 0.7, at + dur], [0, 1.06, 1], clamp);

const Scene = ({ dur, children }: { dur: number; children: ReactNode }) => {
  const f = useCurrentFrame();
  const opacity = Math.min(fade(f, 0, 18), interpolate(f, [dur - 16, dur], [1, 0], clamp));
  return <AbsoluteFill style={{ opacity, background: studioBg }}>{children}<AbsoluteFill style={{ background: vignette, zIndex: 1 }} /></AbsoluteFill>;
};

const Overlay = ({ children }: { children: ReactNode }) => <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 2 }}>{children}</AbsoluteFill>;

const Title = ({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) => {
  const f = useCurrentFrame();
  const y = interpolate(f, [0, 24], [24, 0], { ...clamp, easing: ease });
  return (
    <div style={{ position: 'absolute', left: 120, top: 120, transform: `translateY(${y}px)`, opacity: fade(f, 2, 18) }}>
      <div style={{ font: `600 18px ${F.mono}`, letterSpacing: 6, color: P.gold }}>{kicker}</div>
      <div style={{ font: `600 62px/1.25 ${F.serif}`, color: P.text, marginTop: 16, textShadow: '0 8px 30px rgba(0,0,0,0.45)' }}>{title}</div>
      {sub && <div style={{ font: `24px ${F.sans}`, color: P.text2, marginTop: 14 }}>{sub}</div>}
    </div>
  );
};

const Stat = ({ label, value, unit, style, at = 0, color = P.text }: { label: string; value: ReactNode; unit?: string; style?: CSSProperties; at?: number; color?: string }) => {
  const f = useCurrentFrame();
  return (
    <Glass style={{ position: 'absolute', padding: '24px 32px', opacity: fade(f, at, 16), transform: `translateY(${(1 - fade(f, at, 20)) * 20}px)`, ...style }}>
      <div style={{ font: `18px ${F.sans}`, color: P.text3, letterSpacing: 2 }}>{label}</div>
      <div style={{ font: `600 84px/1.1 ${F.mono}`, color, marginTop: 6 }}>
        {value}
        {unit && <span style={{ fontSize: 34, color: P.text2, marginLeft: 8 }}>{unit}</span>}
      </div>
    </Glass>
  );
};

const Note = ({ title, body, style, at = 0, accent = P.text }: { title: string; body: ReactNode; style?: CSSProperties; at?: number; accent?: string }) => {
  const f = useCurrentFrame();
  return (
    <Glass style={{ position: 'absolute', padding: '22px 28px', opacity: fade(f, at, 16), transform: `translateX(${(1 - fade(f, at, 20)) * 30}px)`, ...style }}>
      <div style={{ font: `600 22px ${F.sans}`, color: accent }}>{title}</div>
      <div style={{ font: `18px/1.7 ${F.sans}`, color: P.text2, marginTop: 8 }}>{body}</div>
    </Glass>
  );
};

/** 两点间平铺在台面上的发光细条 */
const Strip = ({ a, b, color, y = 0.012, w = 0.05 }: { a: V3; b: V3; color: string; y?: number; w?: number }) => {
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  return (
    <mesh position={[(a[0] + b[0]) / 2, y, (a[2] + b[2]) / 2]} rotation={[0, -Math.atan2(dz, dx), 0]}>
      <boxGeometry args={[Math.hypot(dx, dz), 0.02, w]} />
      <Glow color={color} intensity={0.9} />
    </mesh>
  );
};

const Orb = ({ pos, color = P.gold, r = 0.2 }: { pos: V3; color?: string; r?: number }) => (
  <mesh position={pos}>
    <sphereGeometry args={[r, 32, 32]} />
    <Glow color={color} intensity={3} />
  </mesh>
);

const Plate = ({ size, pos = [0, -0.18, 0] }: { size: [number, number]; pos?: V3 }) => (
  <Tile pos={pos} size={[size[0], 0.36, size[1]]} radius={0.18}>
    <Navy />
  </Tile>
);

/* ── 1 开场 ───────────────────────────────────────────── */

const Intro = () => {
  const f = useCurrentFrame();
  const cam = camAt(f, { pos: [0, 2.4, 13], target: [0, -0.9, 0], fov: 30 }, { pos: [0, 2.8, 11], target: [0, -0.7, 0], fov: 30 }, 180);
  const name = '刘晓东';
  return (
    <Scene dur={180}>
      <StudioCanvas cam={cam}>
        <group rotation={[0, f * 0.012, 0]}>
          <Tile pos={[0, 0.9, 0]} size={[1.5, 1.5, 1.5]} radius={0.32} scale={pop(f, 4, 26)}>
            <Gold />
          </Tile>
          {[0, 1, 2, 3].map((k) => {
            const t = (k / 4) * Math.PI * 2 + f * 0.02;
            return (
              <Tile key={k} pos={[Math.cos(t) * 2.6, 0.5 + Math.sin(t * 2) * 0.15, Math.sin(t) * 2.6]} size={[0.62, 0.62, 0.62]} radius={0.16} scale={pop(f, 14 + k * 5)}>
                <Pearl />
              </Tile>
            );
          })}
        </group>
        <Shadows />
      </StudioCanvas>
      <Overlay>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 230, textAlign: 'center' }}>
          <div style={{ font: `600 92px ${F.serif}`, letterSpacing: 26, color: P.text, textShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            {name.split('').map((ch, k) => {
              const o = fade(f, 30 + k * 7, 20);
              return <span key={k} style={{ opacity: o, display: 'inline-block', transform: `translateY(${(1 - o) * 24}px)` }}>{ch}</span>;
            })}
          </div>
          <div style={{ marginTop: 8, font: `18px ${F.mono}`, letterSpacing: 14, color: P.text3, opacity: fade(f, 60) }}>LIU XIAODONG</div>
          <div style={{ margin: '30px auto 0', width: interpolate(f, [70, 110], [0, 520], { ...clamp, easing: ease }), height: 1, background: `linear-gradient(90deg, transparent, ${P.gold}, transparent)` }} />
          <div style={{ marginTop: 26, font: `500 32px ${F.serif}`, letterSpacing: 8, color: P.gold, opacity: fade(f, 90) }}>运维工程师 · 自动化方向</div>
        </div>
      </Overlay>
    </Scene>
  );
};

/* ── 2 生产平台 ───────────────────────────────────────── */

const APPS = [
  { name: 'Traefik', sub: '入口 · HTTPS' },
  { name: 'Argo CD', sub: 'GitOps' },
  { name: 'cert-manager', sub: '证书' },
  { name: 'Prometheus', sub: '告警' },
  { name: 'Grafana', sub: '看板' },
  { name: 'ops-desk', sub: '2 副本' },
];
const ring = (i: number, r = 3): V3 => {
  const t = (i / APPS.length) * Math.PI * 2 + Math.PI / 6;
  return [Math.cos(t) * r, 0, Math.sin(t) * r];
};
const EXT = [
  { name: 'GitHub', sub: '代码 + CI', pos: [-4.6, 1.2, 3.0] as V3, at: 200 },
  { name: 'Cloudflare R2', sub: '异地备份', pos: [4.8, 1.9, -2.6] as V3, at: 215 },
  { name: '企业微信', sub: '告警 · 周报', pos: [0.8, 1.5, -3.8] as V3, at: 230 },
];

const Platform = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cam = camAt(f, { pos: [11, 9.5, 12.5], target: [0.3, 0, -0.4], fov: 30 }, { pos: [8.5, 7.6, 11.5], target: [0.3, 0.2, -0.4], fov: 30 }, 360);
  const proj = projector(cam, width, height);
  const bob = (k: number) => Math.sin(f / 22 + k) * 0.08;
  const appAt = (i: number) => 40 + i * 14;
  return (
    <Scene dur={360}>
      <StudioCanvas cam={cam}>
        <Plate size={[10.5, 8]} />
        <Tile pos={[0, 0.42, 0]} size={[1.8, 0.84, 1.8]} radius={0.22} scale={pop(f, 14, 22)}>
          <Gold />
        </Tile>
        <Pill pos={[0, 0.88, 0.62]} color={P.teal} len={0.6} on={fade(f, 30)} />
        {APPS.map((a, i) => {
          const p = ring(i);
          const on = fade(f, appAt(i), 14);
          return (
            <group key={a.name}>
              {on > 0.5 && <Strip a={[0, 0, 0]} b={p} color={P.gold} />}
              <Tile pos={[p[0], 0.22, p[2]]} size={[1.25, 0.44, 1.25]} radius={0.18} scale={pop(f, appAt(i))}>
                <Pearl />
              </Tile>
              <Pill pos={[p[0], 0.47, p[2] + 0.38]} color={P.teal} on={on} />
              {f > appAt(i) + 20 &&
                [0, 1].map((k) => {
                  const t = (f / 60 + k / 2 + i * 0.13) % 1;
                  return <Orb key={k} pos={[p[0] * (1 - t), 0.06, p[2] * (1 - t)]} r={0.06} />;
                })}
            </group>
          );
        })}
        {EXT.map((e, i) => (
          <group key={e.name} position={[e.pos[0], e.pos[1] + bob(i), e.pos[2]]} scale={pop(f, e.at, 20)}>
            <RoundedBox args={[1.7, 0.56, 0.56]} radius={0.26} smoothness={8} castShadow>
              <Pearl />
            </RoundedBox>
            <Pill pos={[0, 0, 0.29]} color={P.sky} len={0.7} />
          </group>
        ))}
        <Shadows />
      </StudioCanvas>
      <Overlay>
        <Title kicker="02 · PRODUCTION" title="线上平台，长期运行" sub="ops.liuxd.dev · 香港 4 核 8G · 单节点 k3s" />
        {(() => {
          const c = proj([0, 1.1, 0]);
          return <Label x={c.x} y={c.y - 74} title="k3s" sub="控制面 + 节点" accent={P.gold} opacity={fade(f, 24)} />;
        })()}
        {APPS.map((a, i) => {
          const s = proj([ring(i)[0], 0.5, ring(i)[2]]);
          return <Label key={a.name} x={s.x} y={s.y + 58} title={a.name} sub={a.sub} opacity={fade(f, appAt(i) + 8)} />;
        })}
        {EXT.map((e, i) => {
          const s = proj([e.pos[0], e.pos[1] + bob(i) + 0.3, e.pos[2]]);
          return <Label key={e.name} x={s.x} y={s.y - 62} title={e.name} sub={e.sub} accent={P.sky} opacity={fade(f, e.at + 10)} />;
        })}
        <Glass style={{ position: 'absolute', right: 120, bottom: 170, width: 440, padding: '24px 30px', opacity: fade(f, 180, 18) }}>
          {[
            ['对外端口', '只开 22 · 80 · 443'],
            ['部署方式', 'GitOps · prune + selfHeal'],
            ['手工改集群', '同一秒被改回（实测）'],
          ].map(([k, v], i) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderTop: i ? '1px solid rgba(255,255,255,0.1)' : 'none', opacity: fade(f, 188 + i * 10) }}>
              <span style={{ font: `18px ${F.sans}`, color: P.text3 }}>{k}</span>
              <span style={{ font: `500 18px ${F.sans}`, color: P.text }}>{v}</span>
            </div>
          ))}
        </Glass>
      </Overlay>
    </Scene>
  );
};

/* ── 3 GitOps 发布 ────────────────────────────────────── */

const GATES = ['git push', 'Actions', 'GHCR', '更新清单', 'Argo CD', '就绪探针', '上线'];
const gatePos = (i: number): V3 => [-5.4 + i * 1.95, 0, -Math.sin(i / 1.9) * 1.2 + 0.2];
const along = (t: number): V3 => {
  const k = Math.min(Math.floor(t), 5);
  const a = gatePos(k);
  const b = gatePos(k + 1);
  const u = Math.min(1, t - k);
  return [a[0] + (b[0] - a[0]) * u, 0.95, a[2] + (b[2] - a[2]) * u];
};

const Gitops = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cam = camAt(f, { pos: [-1, 8, 13.5], target: [0.4, 0, -0.6], fov: 36 }, { pos: [2.5, 7, 12], target: [0.8, 0, -0.6], fov: 36 }, 450);
  const proj = projector(cam, width, height);
  // 第一次发布：0→6；坏版本：250 帧起，停在第 5 关（就绪探针）；回滚：340 帧起
  const good = interpolate(f, [30, 230], [0, 6], { ...clamp, easing: ease });
  const bad = interpolate(f, [250, 300], [0, 5], { ...clamp, easing: ease });
  const blocked = f >= 298 && f < 330;
  const secs = Math.round(interpolate(f, [30, 230], [0, 220], clamp));
  return (
    <Scene dur={450}>
      <StudioCanvas cam={cam}>
        <Plate size={[15.5, 5.4]} pos={[0.4, -0.18, -0.2]} />
        {GATES.map((g, i) => {
          const p = gatePos(i);
          const passed = f < 250 ? i <= good : f >= 330 ? true : i <= bad;
          const probe = i === 5;
          return (
            <group key={g}>
              {i < 6 && <Strip a={p} b={gatePos(i + 1)} color={passed ? P.gold : P.text3} />}
              <Tile pos={[p[0], 0.28, p[2]]} size={[1.15, 0.56, 1.15]} radius={0.2} scale={pop(f, 4 + i * 4)}>
                {probe ? <Gold /> : <Pearl />}
              </Tile>
              <Pill pos={[p[0], 0.58, p[2] + 0.36]} color={probe && blocked ? P.coral : passed ? P.teal : P.text3} len={0.5} on={passed || (probe && blocked) ? 1 : 0.6} />
            </group>
          );
        })}
        {f < 250 && <Orb pos={along(good)} />}
        {f >= 250 && f < 330 && <Orb pos={along(bad)} color={P.coral} />}
        {/* 旧版本的 Pod 一直在线 */}
        {[0, 1].map((k) => (
          <group key={k}>
            <Tile pos={[7.3, 0.18 + k * 0.42, -1.2]} size={[0.9, 0.34, 0.9]} radius={0.14} scale={pop(f, 230 + k * 6)}>
              <Pearl />
            </Tile>
            <Pill pos={[7.3, 0.36 + k * 0.42, -0.73]} color={P.teal} len={0.3} on={fade(f, 236 + k * 6)} />
          </group>
        ))}
        <Shadows />
      </StudioCanvas>
      <Overlay>
        <Title kicker="03 · GITOPS" title="推送即上线，坏版本不接流量" />
        {GATES.map((g, i) => {
          const s = proj([gatePos(i)[0], 0.6, gatePos(i)[2] + 0.6]);
          return <Label key={g} x={s.x} y={s.y + 20} title={g} accent={i === 5 ? P.gold : P.text} opacity={fade(f, 10 + i * 6)} />;
        })}
        {(() => {
          const s = proj([7.3, 1.1, -1.2]);
          return <Label x={s.x} y={s.y - 64} title="旧版本 2 副本" sub="照常服务" accent={P.teal} opacity={fade(f, 244)} />;
        })()}
        <Stat label="推送到上线（实测）" value={<>{Math.floor(secs / 60)}<span style={{ fontSize: 34, color: P.text2 }}> 分 </span>{String(secs % 60).padStart(2, '0')}</>} unit="秒" style={{ left: 120, bottom: 160 }} at={20} color={f >= 230 ? P.teal : P.text} />
        <Note
          title={f < 330 ? '坏版本演练' : '已回滚'}
          accent={f < 330 ? P.coral : P.teal}
          at={250}
          style={{ right: 120, bottom: 160, width: 480 }}
          body={f < 330 ? '新版本过不了就绪探针，不接流量；maxUnavailable = 0，旧版本照常服务。' : <>$ git revert HEAD &amp;&amp; git push<br />约 1 分钟恢复（实测），全程有 Git 记录可审计。</>}
        />
      </Overlay>
    </Scene>
  );
};

/* ── 4 监控告警 ───────────────────────────────────────── */

const BARS = 24;
const DOWN = [12, 18]; // 下跌区间（柱子序号）

const Alerting = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cam = camAt(f, { pos: [-1, 6.5, 13.5], target: [2.6, 0.8, 0], fov: 32 }, { pos: [0.5, 5.8, 12.5], target: [2.6, 0.8, 0], fov: 32 }, 360);
  const proj = projector(cam, width, height);
  const reveal = interpolate(f, [10, 170], [0, BARS], clamp);
  const downFrame = 10 + (DOWN[0] / BARS) * 160;
  const secs = Math.round(interpolate(f, [downFrame, downFrame + 80], [0, 106], clamp));
  const alertAt = downFrame + 82;
  const resolvedAt = 10 + (DOWN[1] / BARS) * 160 + 40;
  const x = (i: number) => -5.2 + i * 0.45;
  return (
    <Scene dur={360}>
      <StudioCanvas cam={cam}>
        <Plate size={[12.5, 3.2]} pos={[0, -0.18, 0]} />
        {Array.from({ length: BARS }, (_, i) => {
          const isDown = i >= DOWN[0] && i < DOWN[1];
          const h = isDown ? 0.12 : 1.2 + 0.7 * Math.sin(i / 2.6) + 0.35 * Math.sin(i * 1.7);
          const g = interpolate(reveal, [i, i + 1], [0, 1], clamp);
          return (
            <group key={i}>
              <Tile pos={[x(i), (h * g) / 2 + 0.02, 0]} size={[0.32, Math.max(0.03, h * g), 0.32]} radius={0.12}>
                {isDown ? <meshPhysicalMaterial color={P.coral} roughness={0.3} clearcoat={1} /> : <Pearl />}
              </Tile>
            </group>
          );
        })}
        {f > alertAt &&
          [0, 1, 2].map((k) => {
            const t = ((f - alertAt) / 40 + k / 3) % 1;
            return (
              <mesh key={k} position={[x(15), 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.3 + t * 2.4}>
                <ringGeometry args={[0.9, 1, 64]} />
                <meshBasicMaterial color={P.coral} transparent opacity={(1 - t) * 0.7} toneMapped={false} />
              </mesh>
            );
          })}
        <Shadows />
      </StudioCanvas>
      <Overlay>
        <Title kicker="04 · OBSERVABILITY" title="故障 106 秒推到企业微信" sub="ops-desk 每秒请求数（示意） · 告警规则 for: 1m" />
        {(() => {
          const s = proj([x(15), 0.3, 1.6]);
          return <Label x={s.x} y={s.y} title="站点不可用" sub={`${secs} 秒`} accent={P.coral} opacity={f > downFrame && f < resolvedAt + 30 ? 1 : 0} />;
        })()}
        <Stat label="故障到收到告警（实测）" value={secs} unit="秒" style={{ left: 120, bottom: 160 }} at={downFrame - 10} color={f >= alertAt ? P.coral : P.text} />
        <Note title="告警 · OpsDeskNoReplicas" accent={P.coral} at={alertAt} style={{ right: 120, top: 330, width: 430 }} body="ops-desk 没有可用副本，持续 1 分钟" />
        <Note title="已恢复 · OpsDeskNoReplicas" accent={P.teal} at={resolvedAt} style={{ right: 120, top: 480, width: 430 }} body="副本已就绪，站点恢复访问" />
        <Note title="每周运维周报 · 周一 09:00" accent={P.gold} at={250} style={{ right: 120, top: 630, width: 430 }} body="访问量 · 告警 · 备份 · 证书剩余天数" />
      </Overlay>
    </Scene>
  );
};

/* ── 5 数据安全 ───────────────────────────────────────── */

const SRC = ['云盘', '访问统计', 'Uptime Kuma'];

const Safety = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cam = camAt(f, { pos: [0, 6.5, 12.5], target: [0, 0.6, 0], fov: 32 }, { pos: [1.5, 6, 11.5], target: [0, 0.6, 0], fov: 32 }, 300);
  const proj = projector(cam, width, height);
  const src = (i: number): V3 => [-4.6, 0, -1.6 + i * 1.6];
  const vault: V3 = [0, 0, 0];
  const cloud: V3 = [4.6, 1.6, -0.4];
  const days = f < 190 ? Math.round(interpolate(f, [150, 190], [90, 30], clamp)) : f < 212 ? 30 : 90;
  return (
    <Scene dur={300}>
      <StudioCanvas cam={cam}>
        <Plate size={[12, 6]} />
        {SRC.map((n, i) => (
          <group key={n}>
            <Tile pos={[src(i)[0], 0.22, src(i)[2]]} size={[1.2, 0.44, 1.0]} radius={0.18} scale={pop(f, 8 + i * 6)}>
              <Pearl />
            </Tile>
            <Strip a={src(i)} b={vault} color={P.gold} />
          </group>
        ))}
        <Tile pos={[0, 0.55, 0]} size={[1.6, 1.1, 1.6]} radius={0.28} scale={pop(f, 30, 22)}>
          <Gold />
        </Tile>
        <Pill pos={[0, 0.7, 0.81]} color={P.teal} len={0.5} on={fade(f, 50)} />
        <group position={[cloud[0], cloud[1] + Math.sin(f / 20) * 0.08, cloud[2]]} scale={pop(f, 50, 22)}>
          <RoundedBox args={[2.2, 0.9, 1.1]} radius={0.44} smoothness={8} castShadow>
            <Pearl color="#e4ecf8" />
          </RoundedBox>
          <Pill pos={[0, 0, 0.56]} color={P.sky} len={0.9} />
        </group>
        {/* 数据粒子：应用 → restic → R2 */}
        {f > 60 &&
          Array.from({ length: 9 }, (_, k) => {
            const t = (f / 50 + k / 9) % 1;
            const i = k % 3;
            const p: V3 = t < 0.5
              ? [src(i)[0] + (vault[0] - src(i)[0]) * t * 2, 0.15, src(i)[2] + (vault[2] - src(i)[2]) * t * 2]
              : [vault[0] + (cloud[0] - vault[0]) * (t - 0.5) * 2, 0.6 + (cloud[1] - 0.6) * (t - 0.5) * 2, vault[2] + (cloud[2] - vault[2]) * (t - 0.5) * 2];
            return <Orb key={k} pos={p} r={0.07} color={t < 0.5 ? P.pearl : P.gold} />;
          })}
        <Shadows />
      </StudioCanvas>
      <Overlay>
        <Title kicker="05 · DATA SAFETY" title="每天异地加密备份" />
        {SRC.map((n, i) => {
          const s = proj([src(i)[0], 0.45, src(i)[2] + 0.5]);
          return <Label key={n} x={s.x} y={s.y + 18} title={n} opacity={fade(f, 14 + i * 6)} />;
        })}
        {(() => {
          const s = proj([0, 1.2, 0]);
          return <Label x={s.x} y={s.y - 70} title="restic" sub="AES-256 加密 · 去重" accent={P.gold} opacity={fade(f, 40)} />;
        })()}
        {(() => {
          const s = proj([cloud[0], cloud[1] + 0.6, cloud[2]]);
          return <Label x={s.x} y={s.y - 60} title="Cloudflare R2" sub="另一家云" accent={P.sky} opacity={fade(f, 60)} />;
        })()}
        <Note title="备份失败就告警" accent={P.gold} at={80} style={{ left: 120, bottom: 160, width: 470 }} body="每天 1 次；任务失败立即告警，超过 26 小时没成功也告警。" />
        <Glass style={{ position: 'absolute', right: 120, bottom: 160, padding: '24px 30px', display: 'flex', gap: 26, alignItems: 'center', opacity: fade(f, 140, 18) }}>
          <svg width={150} height={150} viewBox="0 0 150 150">
            <circle cx={75} cy={75} r={62} stroke="rgba(255,255,255,0.12)" strokeWidth={9} fill="none" />
            <circle cx={75} cy={75} r={62} stroke={days <= 30 ? P.gold : P.teal} strokeWidth={9} fill="none" strokeDasharray={`${(days / 90) * 389.6} 389.6`} transform="rotate(-90 75 75)" strokeLinecap="round" />
            <text x={75} y={82} textAnchor="middle" fill={P.text} style={{ font: `600 40px ${F.mono}` }}>{days}</text>
            <text x={75} y={106} textAnchor="middle" fill={P.text3} style={{ font: `13px ${F.sans}` }}>天后到期</text>
          </svg>
          <div>
            <div style={{ font: `600 22px ${F.sans}`, color: P.text }}>HTTPS 证书 · cert-manager</div>
            <div style={{ font: `18px/1.8 ${F.sans}`, color: P.text2, marginTop: 6 }}>剩 30 天自动续期<br />剩 21 天还没续上 → 告警</div>
            <div style={{ font: `600 18px ${F.sans}`, color: P.teal, marginTop: 6, opacity: fade(f, 214) }}>已续期 · 零手工操作</div>
          </div>
        </Glass>
      </Overlay>
    </Scene>
  );
};

/* ── 6 工程化 ─────────────────────────────────────────── */

const REPOS = ['ops-desk', 'liuxd-ops', 'it-site', 'ops-lab', 'ops-compass', 'labapp', 'labapp-gitops', 'pve-lab'];
const repoPos = (i: number): V3 => [-3.3 + (i % 4) * 2.2, 0, -1.1 + Math.floor(i / 4) * 2.2];

const Engineering = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cam = camAt(f, { pos: [-3, 11, 13.5], target: [2.2, -0.8, 0.6], fov: 32 }, { pos: [-1.8, 10.5, 13], target: [2.2, -0.8, 0.6], fov: 32 }, 300);
  const proj = projector(cam, width, height);
  const passAt = (i: number) => 40 + i * 8;
  return (
    <Scene dur={300}>
      <StudioCanvas cam={cam}>
        <Plate size={[9.6, 5.2]} pos={[0, -0.18, 0]} />
        {REPOS.map((r, i) => {
          const p = repoPos(i);
          const ok = f >= passAt(i);
          return (
            <group key={r}>
              <Tile pos={[p[0], 0.22, p[2]]} size={[1.7, 0.44, 1.3]} radius={0.2} scale={pop(f, 8 + i * 4)}>
                <Pearl />
              </Tile>
              <Pill pos={[p[0], 0.47, p[2] + 0.45]} color={ok ? P.teal : P.gold} len={0.6} />
            </group>
          );
        })}
        <Shadows />
      </StudioCanvas>
      <Overlay>
        <Title kicker="06 · ENGINEERING" title="依赖自动升级，配置可重复" sub="Renovate · 每周给 8 个仓库自动提 PR，CI 通过才合并" />
        {REPOS.map((r, i) => {
          const s = proj([repoPos(i)[0], 0.45, repoPos(i)[2] + 0.7]);
          return <Label key={r} x={s.x} y={s.y + 12} title={r} sub={f >= passAt(i) ? 'CI 通过' : '检查中'} accent={P.text} opacity={fade(f, 12 + i * 4)} />;
        })}
        <Glass style={{ position: 'absolute', right: 120, top: 330, width: 620, padding: '22px 28px', opacity: fade(f, 120, 16) }}>
          <div style={{ font: `16px ${F.mono}`, color: P.text3 }}>ansible-playbook site.yml · 第二次运行</div>
          <div style={{ font: `22px/1.8 ${F.mono}`, color: P.text2, marginTop: 10, whiteSpace: 'pre' }}>
            {typed(f, 130, 'PLAY RECAP\n')}
            {f > 150 && <span>node3 : changed=<b style={{ color: P.teal }}>0</b>  failed=0</span>}
          </div>
        </Glass>
        <Glass style={{ position: 'absolute', right: 120, top: 560, width: 620, padding: '22px 28px', opacity: fade(f, 180, 16) }}>
          <div style={{ font: `16px ${F.mono}`, color: P.text3 }}>terraform plan</div>
          <div style={{ font: `22px/1.8 ${F.mono}`, color: P.teal, marginTop: 10 }}>{f > 195 ? 'No changes.' : ''}</div>
          <div style={{ font: `18px ${F.sans}`, color: P.text2, opacity: fade(f, 210) }}>手动删掉的容器会在 plan 里被发现（漂移检测）</div>
        </Glass>
      </Overlay>
    </Scene>
  );
};

/* ── 7 实验环境 ───────────────────────────────────────── */

const LABS = ['环境搭建', '系统初始化', 'Nginx', 'MySQL 主从', 'Shell 巡检', 'Ansible', 'Ansible Role', 'Docker', 'Compose', 'Prometheus', 'Keepalived', 'Python', 'Terraform', 'kubeadm', 'Helm 监控', 'Jenkins + Argo CD'];
const labPos = (i: number): V3 => [-3.45 + (i % 4) * 2.3, 0, -3.3 + Math.floor(i / 4) * 2.2];

const Labs = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cam = camAt(f, { pos: [6.5, 17, 14.5], target: [-2.6, -1.4, 0], fov: 34 }, { pos: [5.5, 16, 13.5], target: [-2.6, -1.4, 0], fov: 34 }, 360);
  const proj = projector(cam, width, height);
  const at = (i: number) => 12 + i * 7;
  return (
    <Scene dur={360}>
      <StudioCanvas cam={cam}>
        <Plate size={[10, 9.6]} pos={[0, -0.18, -0.2]} />
        {LABS.map((l, i) => {
          const p = labPos(i);
          const h = 0.3 + fade(f, at(i), 16) * 0.3;
          return (
            <group key={l}>
              <Tile pos={[p[0], h / 2, p[2]]} size={[1.8, h, 1.6]} radius={0.2} scale={pop(f, at(i) - 6)}>
                {i === 15 || i === 13 ? <Gold /> : <Pearl />}
              </Tile>
              <Pill pos={[p[0], h + 0.02, p[2] + 0.5]} color={P.teal} len={0.5} on={fade(f, at(i) + 8)} />
            </group>
          );
        })}
        <Shadows />
      </StudioCanvas>
      <Overlay>
        <Title kicker="07 · LAB · 实验环境" title="16 个实验，全部跑通" sub="自己搭建的虚拟机集群" />
        {LABS.map((l, i) => {
          const s = proj([labPos(i)[0], 0.6, labPos(i)[2] + 0.8]);
          return <Label key={l} x={s.x} y={s.y + 4} title={`${String(i).padStart(2, '0')} ${l}`} opacity={fade(f, at(i) + 6)} />;
        })}
        <div style={{ position: 'absolute', left: 120, top: 360, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            ['kubeadm v1.34', '1 主 2 从集群'],
            ['MySQL GTID', '主从 + 时间点恢复'],
            ['Keepalived', 'VIP 秒级漂移'],
            ['镜像瘦身', '约 300MB → 15MB'],
            ['过程记录', '210 张截图'],
          ].map(([a, b], i) => (
            <Glass key={a} style={{ width: 330, padding: '14px 22px', opacity: fade(f, 140 + i * 14), transform: `translateX(${(1 - fade(f, 140 + i * 14, 18)) * -24}px)` }}>
              <div style={{ font: `600 20px ${F.sans}`, color: P.text }}>{a}</div>
              <div style={{ font: `16px ${F.sans}`, color: P.text2, marginTop: 4 }}>{b}</div>
            </Glass>
          ))}
        </div>
      </Overlay>
    </Scene>
  );
};

/* ── 8 案例与结尾 ─────────────────────────────────────── */

const COLS = 13;
const ROWS = 11;
const AI_SET = new Set(
  Array.from({ length: 138 }, (_, i) => i + 5)
    .map((i) => [i, random(`ai${i}`)] as const)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 32)
    .map(([i]) => i),
);

const Outro = () => {
  const f = useCurrentFrame();
  const cam = camAt(f, { pos: [0, 14.5, 11], target: [-2.4, -1.4, -0.4], fov: 34 }, { pos: [0, 16, 9], target: [-2.4, -1.4, -0.6], fov: 34 }, 390);
  const part1 = interpolate(f, [175, 200], [1, 0], clamp);
  const part2 = fade(f, 200, 24);
  return (
    <Scene dur={390}>
      <AbsoluteFill style={{ opacity: Math.max(part1, 0.18) }}>
        <StudioCanvas cam={cam}>
          <Plate size={[COLS * 0.62 + 0.8, ROWS * 0.62 + 0.8]} pos={[0, -0.18, -0.2]} />
          {Array.from({ length: 143 }, (_, i) => {
            const x = -((COLS - 1) * 0.62) / 2 + (i % COLS) * 0.62;
            const z = -0.2 - ((ROWS - 1) * 0.62) / 2 + Math.floor(i / COLS) * 0.62;
            const prod = i < 5;
            const ai = AI_SET.has(i) && f > 90;
            const h = prod ? 0.5 : ai ? 0.36 : 0.18;
            return (
              <Tile key={i} pos={[x, h / 2, z]} size={[0.5, h, 0.5]} radius={0.1} scale={pop(f, 6 + i * 0.5, 12)}>
                {prod ? <meshPhysicalMaterial color={P.teal} roughness={0.3} clearcoat={1} emissive={P.teal} emissiveIntensity={0.3} /> : ai ? <Gold /> : <Pearl color={P.pearlShade} />}
              </Tile>
            );
          })}
          <Shadows />
        </StudioCanvas>
      </AbsoluteFill>
      <Overlay>
        <div style={{ opacity: part1 }}>
          <Title kicker="08 · CASES" title="143 个企业自动化案例" sub="运维、开发、测试、安全、数据，以及 12 个职能部门" />
          <div style={{ position: 'absolute', left: 120, bottom: 170, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              [P.teal, '5 个在生产环境运行', 20],
              [P.gold, '32 个 AI 是核心：告警根因分析、AI Agent 排查…', 100],
              [P.pearlShade, '其余如实标注：实验、演示或方案设计', 120],
            ].map(([c, t, at]) => (
              <Glass key={t as string} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, opacity: fade(f, at as number) }}>
                <span style={{ width: 16, height: 16, borderRadius: 5, background: c as string }} />
                <span style={{ font: `20px ${F.sans}`, color: P.text }}>{t}</span>
              </Glass>
            ))}
          </div>
        </div>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: part2 }}>
          <Glass style={{ padding: '56px 80px', textAlign: 'center', background: 'linear-gradient(160deg, rgba(27,42,74,0.86), rgba(11,19,36,0.9))' }}>
            <div style={{ display: 'flex', gap: 72, justifyContent: 'center' }}>
              {[[11, '年企业 IT 运维'], [16, '个实验全部跑通'], [143, '个自动化案例'], [1, '套生产平台长期运行']].map(([n, l], i) => (
                <div key={i}>
                  <div style={{ font: `600 80px ${F.mono}`, color: P.gold }}>{count(f, 212 + i * 8, 40, n as number)}</div>
                  <div style={{ font: `20px ${F.sans}`, color: P.text2, marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ margin: '44px auto 0', width: 520, height: 1, background: `linear-gradient(90deg, transparent, ${P.gold}, transparent)` }} />
            <div style={{ marginTop: 34, font: `600 52px ${F.serif}`, letterSpacing: 16, color: P.text }}>刘晓东</div>
            <div style={{ marginTop: 18, display: 'flex', gap: 34, justifyContent: 'center', font: `28px ${F.mono}`, color: P.text }}>
              <span>cv.liuxd.dev</span>
              <span style={{ color: P.text3 }}>·</span>
              <span>ops.liuxd.dev</span>
            </div>
          </Glass>
        </AbsoluteFill>
      </Overlay>
    </Scene>
  );
};

/* ── 顶部章节条 + 底部字幕 ─────────────────────────────── */

const Chrome = () => {
  const f = useCurrentFrame();
  const i = Math.max(0, S.findIndex((s) => f >= s.from && f < s.from + s.dur));
  const s = S[i];
  const local = f - s.from;
  const cur = [...s.subs].reverse().find(([at]) => local >= at) ?? s.subs[0];
  const subOpacity = Math.min(fade(local, cur[0] + 8, 14), interpolate(local, [s.dur - 14, s.dur], [1, 0], clamp));
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: 44, left: 120, right: 120, display: 'flex', gap: 8 }}>
        {S.map((c, k) => {
          const p = interpolate(f, [c.from, c.from + c.dur], [0, 1], clamp);
          return (
            <div key={k} style={{ flex: c.dur }}>
              <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }}>
                <div style={{ height: 3, borderRadius: 2, width: `${p * 100}%`, background: k === i ? P.gold : 'rgba(214,180,124,0.5)' }} />
              </div>
              <div style={{ marginTop: 10, font: `14px ${F.mono}`, letterSpacing: 1, color: k === i ? P.gold : P.text3 }}>
                {String(k + 1).padStart(2, '0')} {c.label}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', bottom: 56, left: 0, right: 0, textAlign: 'center', opacity: subOpacity }}>
        <span style={{ display: 'inline-block', padding: '12px 30px', background: 'rgba(7,13,26,0.72)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 999, font: `500 30px/1.5 ${F.sans}`, color: P.text }}>{cur[1]}</span>
      </div>
    </AbsoluteFill>
  );
};

/* ── 合成 ─────────────────────────────────────────────── */

const SCENES = [Intro, Platform, Gitops, Alerting, Safety, Engineering, Labs, Outro];

export const Reel = () => {
  const f = useCurrentFrame();
  const vol = interpolate(f, [0, 30, DURATION - 60, DURATION], [0, 0.85, 0.85, 0], clamp);
  return (
    <AbsoluteFill style={{ background: P.bgBottom, fontFamily: F.sans }}>
      {S.map((s, i) => {
        const Comp = SCENES[i];
        return (
          <Sequence key={i} from={s.from} durationInFrames={s.dur}>
            <Comp />
          </Sequence>
        );
      })}
      <Chrome />
      <Audio src={staticFile('music.mp3')} volume={vol} />
    </AbsoluteFill>
  );
};

S.forEach((s, i) => {
  const next = S[i + 1];
  if (next && s.from + s.dur !== next.from) throw new Error(`章节 ${i + 1} 和 ${i + 2} 没有首尾相接`);
});
if (S[S.length - 1].from + S[S.length - 1].dur !== DURATION) throw new Error('总时长不对');
