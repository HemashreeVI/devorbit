import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html, Stars } from '@react-three/drei';
import { layout, headCommit } from './gitEngine';

const PALETTE = ['#3fb950', '#58a6ff', '#bc8cff', '#d29922'];
const GX = 1.7, GY = 1.5, GZ = 1.1;

function Commit({ node, isHead, labels, onPick, center }) {
  const ref = useRef();
  const color = PALETTE[node.lane % 4];
  const target = node.dead ? 0.55 : isHead ? 1.35 : 1;
  useFrame((state, dt) => {
    const m = ref.current;
    const s = m.scale.x + (target - m.scale.x) * Math.min(1, dt * 6);
    m.scale.setScalar(s);
    if (isHead) m.rotation.y += dt * 1.2;
  });
  const p = [node.x * GX - center, -node.y * GY, -node.y * GZ];
  return (
    <group position={p}>
      <mesh ref={ref} scale={0.001} onClick={(e) => { e.stopPropagation(); onPick?.(node.id); }} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
        {node.parents.length > 1 ? <octahedronGeometry args={[0.36, 0]} /> : <sphereGeometry args={[0.3, 32, 32]} />}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={node.dead ? 0.1 : isHead ? 2.2 : 0.9} transparent opacity={node.dead ? 0.25 : 1} toneMapped={false} />
      </mesh>
      <Html center position={[0, -0.62, 0]} className="g3-id" pointerEvents="none">{node.id}</Html>
      {labels?.length > 0 && (
        <Html center position={[0, 0.75, 0]} pointerEvents="none">
          <div className="g3-labels">
            {labels.map((l) => (
              <span key={l.name} className={`g3-label ${l.kind}`} style={l.kind === 'branch' ? { background: PALETTE[l.lane % 4] } : undefined}>{l.cur ? '● ' : ''}{l.name}</span>
            ))}
          </div>
        </Html>
      )}
    </group>
  );
}

export default function Graph3D({ repo, onPick }) {
  const { nodes, edges, maxX } = useMemo(() => layout(repo), [repo]);
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const center = (maxX * GX) / 2;
  const head = headCommit(repo);
  const labels = useMemo(() => {
    const map = {};
    Object.entries(repo.branches).forEach(([b, id]) => (map[id] ||= []).push({ kind: 'branch', name: b, lane: repo.lanes[b] ?? 0, cur: b === repo.HEAD }));
    Object.entries(repo.tags).forEach(([t, id]) => (map[id] ||= []).push({ kind: 'tag', name: t }));
    return map;
  }, [repo]);
  const P = (n) => [n.x * GX - center, -n.y * GY, -n.y * GZ];

  return (
    <div className="graph3d" data-lenis-prevent>
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 1.5, Math.max(7, maxX * 1.2 + 4)], fov: 45 }}>
        <color attach="background" args={['#06090d']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[4, 6, 6]} intensity={80} />
        <Stars radius={60} depth={30} count={1500} factor={3} fade speed={0.6} />
        {edges.map((e) => {
          const a = byId[e.from], b = byId[e.to];
          const pa = P(a), pb = P(b);
          const mid = [(pa[0] + pb[0]) / 2, pb[1], pb[2]];
          const pts = a.y === b.y ? [pa, pb] : [pa, [pa[0] + GX * 0.4, pa[1], pa[2]], mid, pb];
          return <Line key={`${e.from}-${e.to}`} points={pts} color={PALETTE[b.lane % 4]} lineWidth={2.5} transparent opacity={e.dead ? 0.15 : 0.85} />;
        })}
        {nodes.map((n) => (
          <Commit key={n.id} node={n} isHead={n.id === head} labels={labels[n.id]} onPick={onPick} center={center} />
        ))}
        <OrbitControls enableDamping makeDefault autoRotate autoRotateSpeed={0.35} maxDistance={40} minDistance={3} />
      </Canvas>
      <p className="g3-hint mono">drag to orbit · scroll to zoom · click a commit to grab its id</p>
    </div>
  );
}
