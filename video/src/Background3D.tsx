import { useMemo } from 'react';
import * as THREE from 'three';
import { ThreeCanvas } from '@remotion/three';
import { interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { clamp, ease } from './theme';

/* 全片共用的 3D 背景：星空粒子；第二段叠加生产集群的拓扑 */

export const CAMERA = { fov: 45, z: 9 };

/** 拓扑出现的帧区间（和 Showreel 里第二段一致） */
export const TOPO = { from: 180, to: 540 };

export type TopoNode = { name: string; sub: string; pos: [number, number, number]; at: number; ring: 0 | 1 | 2 };

/** at：第几帧（相对第二段开头）点亮 */
export const NODES: TopoNode[] = [
  { name: 'k3s', sub: '4 核 8G · 香港', pos: [0, 0, 0], at: 20, ring: 0 },
  { name: 'Traefik', sub: '入口 · HTTPS', pos: [2.7, 0, 0], at: 60, ring: 1 },
  { name: 'Argo CD', sub: 'GitOps 同步', pos: [1.35, 0, 2.34], at: 78, ring: 1 },
  { name: 'cert-manager', sub: '证书自动续期', pos: [-1.35, 0, 2.34], at: 96, ring: 1 },
  { name: 'Prometheus', sub: '指标 + 告警', pos: [-2.7, 0, 0], at: 114, ring: 1 },
  { name: 'Grafana', sub: '看板', pos: [-1.35, 0, -2.34], at: 132, ring: 1 },
  { name: 'ops-desk', sub: '本站 · 2 副本', pos: [1.35, 0, -2.34], at: 150, ring: 1 },
  { name: 'GitHub', sub: '代码 + CI', pos: [3.9, -1.0, 1.8], at: 190, ring: 2 },
  { name: 'Cloudflare R2', sub: '异地备份', pos: [-3.8, 1.5, 2.0], at: 210, ring: 2 },
  { name: '企业微信', sub: '告警 + 周报', pos: [0.4, 1.9, -3.9], at: 230, ring: 2 },
];

/** 拓扑整体的旋转（标签投影也用它，保证 3D 和文字对齐） */
export const topoRotation = (local: number) => ({
  x: 0.42,
  y: interpolate(local, [0, 360], [-0.5, 0.9], clamp),
});

const camera = new THREE.PerspectiveCamera(CAMERA.fov, 16 / 9, 0.1, 100);
camera.position.set(0, 0, CAMERA.z);
camera.updateMatrixWorld();

/** 把拓扑节点投影成画面坐标 */
export const project = (pos: [number, number, number], local: number, w: number, h: number) => {
  const r = topoRotation(local);
  const v = new THREE.Vector3(...pos).applyEuler(new THREE.Euler(r.x, r.y, 0, 'XYZ'));
  v.project(camera);
  return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, depth: v.z };
};

const Stars = () => {
  const f = useCurrentFrame();
  const geo = useMemo(() => {
    const n = 1600;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 14 + random(`r${i}`) * 22;
      const t = random(`t${i}`) * Math.PI * 2;
      const p = Math.acos(2 * random(`p${i}`) - 1);
      arr[i * 3] = r * Math.sin(p) * Math.cos(t);
      arr[i * 3 + 1] = r * Math.sin(p) * Math.sin(t) * 0.6;
      arr[i * 3 + 2] = r * Math.cos(p) - 12;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  return (
    <points geometry={geo} rotation={[0.1, f * 0.0009, 0]}>
      <pointsMaterial color="#b9c7dc" size={0.045} sizeAttenuation transparent opacity={0.8} />
    </points>
  );
};

const Topology = () => {
  const f = useCurrentFrame();
  const local = f - TOPO.from;
  if (local < 0 || local > TOPO.to - TOPO.from) return null;
  const show = Math.min(
    interpolate(local, [0, 20], [0, 1], { ...clamp, easing: ease }),
    interpolate(local, [340, 360], [1, 0], clamp),
  );
  const r = topoRotation(local);
  const lit = (n: TopoNode) => interpolate(local, [n.at, n.at + 14], [0, 1], clamp);
  return (
    <group rotation={[r.x, r.y, 0]}>
      {/* 环形轨道 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.68, 2.72, 96]} />
        <meshBasicMaterial color="#d2b17a" transparent opacity={0.25 * show} side={THREE.DoubleSide} />
      </mesh>
      {NODES.map((n, i) => {
        const k = lit(n) * show;
        const size = n.ring === 0 ? 0.42 : n.ring === 1 ? 0.2 : 0.16;
        const color = n.ring === 0 ? '#d2b17a' : n.ring === 1 ? '#4fc3a1' : '#7aa2dc';
        const pulse = 1 + 0.08 * Math.sin((local - n.at) / 6) * k;
        return (
          <group key={i} position={n.pos}>
            <mesh scale={size * pulse * (0.4 + 0.6 * k)}>
              <icosahedronGeometry args={[1, 2]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9 * k} transparent opacity={0.15 + 0.85 * k} wireframe={n.ring === 0} />
            </mesh>
            {i > 0 && (
              <line>
                <bufferGeometry>
                  <bufferAttribute attach="attributes-position" args={[new Float32Array([0, 0, 0, -n.pos[0], -n.pos[1], -n.pos[2]]), 3]} />
                </bufferGeometry>
                <lineBasicMaterial color={color} transparent opacity={0.45 * k} />
              </line>
            )}
          </group>
        );
      })}
    </group>
  );
};

export const Background3D = () => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: CAMERA.fov, position: [0, 0, CAMERA.z], near: 0.1, far: 100 }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[4, 6, 8]} intensity={60} />
      <Stars />
      <Topology />
    </ThreeCanvas>
  );
};
