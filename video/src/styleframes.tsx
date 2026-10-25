import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { RoundedBox } from '@react-three/drei';
import { F, clamp, ease, fade } from './theme';
import { Glass, Glow, Gold, Label, Navy, P, Pearl, Pill, Shadows, StudioCanvas, Tile, projector, studioBg, vignette } from './studio';
import type { Cam } from './studio';

type V3 = [number, number, number];

const Title = ({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) => (
  <div style={{ position: 'absolute', left: 120, top: 110 }}>
    <div style={{ font: `600 18px ${F.mono}`, letterSpacing: 6, color: P.gold }}>{kicker}</div>
    <div style={{ font: `600 64px/1.25 ${F.serif}`, color: P.text, marginTop: 16, textShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>{title}</div>
    {sub && <div style={{ font: `24px ${F.sans}`, color: P.text2, marginTop: 14 }}>{sub}</div>}
  </div>
);

/** 两点间平铺在底板上的发光细条 */
const Strip = ({ a, b, color, on }: { a: V3; b: V3; color: string; on: number }) => {
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const len = Math.hypot(dx, dz);
  return (
    <mesh position={[(a[0] + b[0]) / 2, 0.012, (a[2] + b[2]) / 2]} rotation={[0, -Math.atan2(dz, dx), 0]} scale={[on, 1, 1]}>
      <boxGeometry args={[len, 0.02, 0.05]} />
      <Glow color={color} intensity={0.9} />
    </mesh>
  );
};

/* ── 样图 A：生产平台 ─────────────────────────────────── */

const CAM_A: Cam = { pos: [9.5, 8, 11.5], target: [0.3, 0.2, -0.4], fov: 30 };

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
  { name: 'GitHub', sub: '代码 + CI', pos: [-5.2, 1.3, 3.4] as V3 },
  { name: 'Cloudflare R2', sub: '异地备份', pos: [4.8, 1.9, -2.6] as V3 },
  { name: '企业微信', sub: '告警 · 周报', pos: [0.2, 2.6, -4.2] as V3 },
];

export const StylePlatform = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const proj = projector(CAM_A, width, height);
  const bob = (k: number) => Math.sin(f / 22 + k) * 0.08;
  return (
    <AbsoluteFill style={{ background: studioBg }}>
      <StudioCanvas cam={CAM_A}>
        <Tile pos={[0, -0.18, 0]} size={[10.5, 0.36, 8]} radius={0.18}>
          <Navy />
        </Tile>
        <Tile pos={[0, 0.42, 0]} size={[1.8, 0.84, 1.8]} radius={0.22}>
          <Gold />
        </Tile>
        <Pill pos={[0, 0.88, 0.62]} color={P.teal} len={0.6} />
        {APPS.map((a, i) => {
          const p = ring(i);
          return (
            <group key={a.name}>
              <Strip a={[0, 0, 0]} b={p} color={P.gold} on={1} />
              <Tile pos={[p[0], 0.22, p[2]]} size={[1.25, 0.44, 1.25]} radius={0.18}>
                <Pearl />
              </Tile>
              <Pill pos={[p[0], 0.47, p[2] + 0.38]} color={P.teal} />
              {/* 数据包沿连线流向中心 */}
              {[0, 1].map((k) => {
                const t = ((f / 60 + k / 2 + i * 0.13) % 1);
                return (
                  <mesh key={k} position={[p[0] * (1 - t), 0.06, p[2] * (1 - t)]}>
                    <sphereGeometry args={[0.06, 16, 16]} />
                    <Glow color={P.gold} intensity={3} />
                  </mesh>
                );
              })}
            </group>
          );
        })}
        {EXT.map((e, i) => (
          <group key={e.name} position={[e.pos[0], e.pos[1] + bob(i), e.pos[2]]}>
            <RoundedBox args={[1.7, 0.56, 0.56]} radius={0.26} smoothness={8} castShadow>
              <Pearl color={P.pearl} />
            </RoundedBox>
            <Pill pos={[0, 0, 0.29]} color={P.sky} len={0.7} />
          </group>
        ))}
        <Shadows />
      </StudioCanvas>
      <AbsoluteFill style={{ background: vignette, pointerEvents: 'none' }} />

      <Title kicker="02 · PRODUCTION" title="线上平台，长期运行" sub="ops.liuxd.dev · 香港 4 核 8G · 单节点 k3s" />

      {(() => {
        const c = proj([0, 1.1, 0]);
        return <Label x={c.x} y={c.y - 74} title="k3s" sub="控制面 + 节点" accent={P.gold} />;
      })()}
      {APPS.map((a, i) => {
        const p = ring(i);
        const s = proj([p[0], 0.5, p[2]]);
        return <Label key={a.name} x={s.x} y={s.y + 58} title={a.name} sub={a.sub} />;
      })}
      {EXT.map((e, i) => {
        const s = proj([e.pos[0], e.pos[1] + bob(i) + 0.3, e.pos[2]]);
        return <Label key={e.name} x={s.x} y={s.y - 62} title={e.name} sub={e.sub} accent={P.sky} />;
      })}

      <Glass style={{ position: 'absolute', right: 120, bottom: 150, width: 420, padding: '26px 30px' }}>
        {[
          ['对外端口', '只开 22 · 80 · 443'],
          ['部署方式', 'GitOps · prune + selfHeal'],
          ['手工改集群', '同一秒被改回（实测）'],
        ].map(([k, v], i) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderTop: i ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
            <span style={{ font: `18px ${F.sans}`, color: P.text3 }}>{k}</span>
            <span style={{ font: `500 18px ${F.sans}`, color: P.text }}>{v}</span>
          </div>
        ))}
      </Glass>
    </AbsoluteFill>
  );
};

/* ── 样图 B：GitOps 发布 ──────────────────────────────── */

const CAM_B: Cam = { pos: [1.5, 7.5, 12.5], target: [0.6, 0, -0.6], fov: 36 };
const GATES = ['git push', 'Actions', 'GHCR', '更新清单', 'Argo CD', '就绪探针', '上线'];
const gatePos = (i: number): V3 => [-5.4 + i * 1.95, 0, -Math.sin(i / 1.9) * 1.2 + 0.2];

export const StyleGitops = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const proj = projector(CAM_B, width, height);
  const t = interpolate(f, [0, 200], [0, 6], { ...clamp, easing: ease });
  const k = Math.floor(t);
  const a = gatePos(Math.min(k, 6));
  const b = gatePos(Math.min(k + 1, 6));
  const u = t - k;
  const orb: V3 = [a[0] + (b[0] - a[0]) * u, 0.95, a[2] + (b[2] - a[2]) * u];
  return (
    <AbsoluteFill style={{ background: studioBg }}>
      <StudioCanvas cam={CAM_B}>
        <Tile pos={[0.4, -0.18, -0.2]} size={[15.5, 0.36, 5.4]} radius={0.18}>
          <Navy />
        </Tile>
        {GATES.map((g, i) => {
          const p = gatePos(i);
          const passed = i <= t;
          const probe = i === 5;
          return (
            <group key={g}>
              {i < 6 && <Strip a={p} b={gatePos(i + 1)} color={passed ? P.gold : P.text3} on={1} />}
              <Tile pos={[p[0], 0.28, p[2]]} size={[1.15, 0.56, 1.15]} radius={0.2}>
                {probe ? <Gold /> : <Pearl />}
              </Tile>
              <Pill pos={[p[0], 0.58, p[2] + 0.36]} color={passed ? P.teal : P.text3} len={0.5} on={passed ? 1 : 0.6} />
            </group>
          );
        })}
        <mesh position={orb}>
          <sphereGeometry args={[0.22, 32, 32]} />
          <Glow color={P.gold} intensity={3.2} />
        </mesh>
        <Shadows />
      </StudioCanvas>
      <AbsoluteFill style={{ background: vignette, pointerEvents: 'none' }} />

      <Title kicker="03 · GITOPS" title="推送即上线，坏版本不接流量" />

      {GATES.map((g, i) => {
        const s = proj([gatePos(i)[0], 0.6, gatePos(i)[2] + 0.6]);
        return <Label key={g} x={s.x} y={s.y + 20} title={g} accent={i === 5 ? P.gold : P.text} opacity={fade(f, i * 8, 12)} />;
      })}

      <Glass style={{ position: 'absolute', left: 120, bottom: 140, padding: '26px 34px' }}>
        <div style={{ font: `18px ${F.sans}`, color: P.text3, letterSpacing: 2 }}>推送到上线（实测）</div>
        <div style={{ font: `600 96px/1.1 ${F.mono}`, color: P.text, marginTop: 6 }}>
          3<span style={{ fontSize: 44, color: P.text2 }}> 分 </span>40<span style={{ fontSize: 44, color: P.text2 }}> 秒</span>
        </div>
      </Glass>
      <Glass style={{ position: 'absolute', right: 120, bottom: 140, padding: '24px 30px', width: 430 }}>
        <div style={{ font: `600 22px ${F.sans}`, color: P.text }}>坏版本演练</div>
        <div style={{ font: `18px/1.7 ${F.sans}`, color: P.text2, marginTop: 8 }}>就绪探针失败的新版本不接流量，旧版本照常服务；git revert 约 1 分钟回滚。</div>
      </Glass>
    </AbsoluteFill>
  );
};
