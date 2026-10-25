import type { ReactNode } from 'react';
import * as THREE from 'three';
import { ThreeCanvas } from '@remotion/three';
import { ContactShadows, Environment, Lightformer, RoundedBox } from '@react-three/drei';
import { useVideoConfig } from 'remotion';
import { useThree } from '@react-three/fiber';
import { F } from './theme';

/* 圆角 3D 商务风：深藏青影棚 + 珍珠白主体 + 香槟金重点 */

export const P = {
  bgTop: '#1b2a4a',
  bgBottom: '#070d1a',
  navy: '#1c2a49',
  navyDeep: '#111c33',
  pearl: '#eef1f6',
  pearlShade: '#c9d1de',
  gold: '#d6b47c',
  goldDeep: '#a9824a',
  teal: '#43c3a6',
  coral: '#ec6a55',
  sky: '#8fb4ea',
  ink: '#0d1628',
  text: '#f4f6fa',
  text2: '#b8c3d4',
  text3: '#7c89a0',
};

/** 暗角（代替后期特效，放在 3D 画面上层） */
export const vignette = 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)';

/** 影棚背景：顶部打光的深藏青渐变 */
export const studioBg = `radial-gradient(1400px 800px at 50% -20%, ${P.bgTop}, transparent 70%), radial-gradient(900px 600px at 50% 120%, rgba(214,180,124,0.10), transparent 70%), ${P.bgBottom}`;

export type Cam = { pos: [number, number, number]; target: [number, number, number]; fov: number };

const makeCamera = (cam: Cam, aspect: number) => {
  const c = new THREE.PerspectiveCamera(cam.fov, aspect, 0.1, 200);
  c.position.set(...cam.pos);
  c.lookAt(new THREE.Vector3(...cam.target));
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  return c;
};

/** 世界坐标 → 画面坐标（HTML 标签和 3D 物体对齐用） */
export const projector = (cam: Cam, w: number, h: number) => {
  const c = makeCamera(cam, w / h);
  return (p: [number, number, number]) => {
    const v = new THREE.Vector3(...p).project(c);
    return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h };
  };
};


export const StudioCanvas = ({ cam, children }: { cam: Cam; children: ReactNode }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: cam.fov, position: cam.pos, near: 0.1, far: 200 }}
    >
      <LookAt cam={cam} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 10, 6]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}>
        <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 0.1, 40]} />
      </directionalLight>
      <pointLight position={[-6, 4, -4]} intensity={30} color={P.gold} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 6, 2]} scale={[12, 4, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.2} position={[-6, 2, 4]} scale={[4, 6, 1]} rotation-y={Math.PI / 3} color={P.gold} />
        <Lightformer form="rect" intensity={0.9} position={[6, 2, 3]} scale={[4, 6, 1]} rotation-y={-Math.PI / 3} color={P.sky} />
      </Environment>
      {children}
    </ThreeCanvas>
  );
};

/** 每帧对准目标点（ThreeCanvas 的相机默认看原点） */
const LookAt = ({ cam }: { cam: Cam }) => {
  const camera = useThree((st) => st.camera);
  camera.position.set(...cam.pos);
  camera.lookAt(new THREE.Vector3(...cam.target));
  camera.updateMatrixWorld();
  return null;
};

/* ── 材质与物体 ───────────────────────────────────────── */

export const Pearl = ({ color = P.pearl }: { color?: string }) => (
  <meshPhysicalMaterial color={color} roughness={0.32} metalness={0.05} clearcoat={1} clearcoatRoughness={0.18} />
);
export const Gold = () => <meshPhysicalMaterial color={P.gold} roughness={0.22} metalness={0.75} clearcoat={0.6} clearcoatRoughness={0.2} />;
export const Navy = () => <meshPhysicalMaterial color={P.navy} roughness={0.45} metalness={0.2} clearcoat={0.8} clearcoatRoughness={0.3} />;
export const Glow = ({ color, intensity = 2.2 }: { color: string; intensity?: number }) => (
  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} toneMapped={false} />
);

type V3 = [number, number, number];

export const Tile = ({ pos, size, radius = 0.12, children, scale = 1 }: { pos: V3; size: V3; radius?: number; children: ReactNode; scale?: number }) => (
  <RoundedBox args={size} radius={Math.max(0.01, Math.min(radius, Math.min(...size) / 2 - 0.005))} smoothness={6} position={pos} scale={scale} castShadow receiveShadow>
    {children}
  </RoundedBox>
);

/** 胶囊状态灯 */
export const Pill = ({ pos, color, len = 0.36, on = 1 }: { pos: V3; color: string; len?: number; on?: number }) => (
  <mesh position={pos} rotation={[0, 0, Math.PI / 2]} scale={on}>
    <capsuleGeometry args={[0.055, len, 8, 16]} />
    <Glow color={color} intensity={1.6 * on + 0.2} />
  </mesh>
);

export const Shadows = () => <ContactShadows position={[0, -0.001, 0]} opacity={0.55} scale={22} blur={2.6} far={6} resolution={1024} color="#000000" />;

/* ── HTML 叠加：圆角磨砂玻璃卡片 ─────────────────────── */

export const Glass = ({ children, style }: { children: ReactNode; style?: React.CSSProperties }) => (
  <div
    style={{
      background: 'linear-gradient(160deg, rgba(255,255,255,0.13), rgba(255,255,255,0.04))',
      border: '1px solid rgba(255,255,255,0.16)',
      borderRadius: 22,
      boxShadow: '0 30px 60px -24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.18)',
      backdropFilter: 'blur(14px)',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Label = ({ x, y, title, sub, accent = P.text, opacity = 1 }: { x: number; y: number; title: string; sub?: string; accent?: string; opacity?: number }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, 0)', opacity, whiteSpace: 'nowrap' }}>
    <Glass style={{ padding: '8px 16px', borderRadius: 999, display: 'flex', alignItems: 'baseline', gap: 8, background: 'rgba(13,22,40,0.78)', border: '1px solid rgba(255,255,255,0.14)' }}>
      <span style={{ font: `600 15px ${F.sans}`, color: accent }}>{title}</span>
      {sub && <span style={{ font: `12px ${F.sans}`, color: P.text2 }}>{sub}</span>}
    </Glass>
  </div>
);
