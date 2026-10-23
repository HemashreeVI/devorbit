import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles, Line, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { orbitState } from '../lib/motion';

const BRANCH = ['#3fb950', '#58a6ff', '#bc8cff', '#d29922'];

/** A ring of "commits" — small moons strung on an orbit, like a branch circling the planet. */
function CommitRing({ radius, tilt, color, count, speed, size = 0.09 }) {
  const group = useRef();
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return pts;
  }, [radius]);
  const moons = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return [Math.cos(a) * radius, 0, Math.sin(a) * radius];
      }),
    [count, radius]
  );
  useFrame((_, dt) => {
    group.current.rotation.y += dt * speed * (1 + orbitState.warp * 4);
  });
  return (
    <group rotation={tilt}>
      <group ref={group}>
        <Line points={points} color={color} lineWidth={1} transparent opacity={0.35} />
        {moons.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[i === 0 ? size * 1.8 : size, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={i === 0 ? 2.4 : 1.2} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Planet() {
  const root = useRef();
  const shell = useRef();
  const core = useRef();
  useFrame((state, dt) => {
    const r = root.current;
    const k = 1 - Math.pow(0.001, dt); // frame-rate independent smoothing
    r.position.x += (orbitState.x + orbitState.mouseX * 0.25 - r.position.x) * k;
    r.position.y += (orbitState.y - orbitState.mouseY * 0.2 - r.position.y) * k;
    r.position.z += (orbitState.z - r.position.z) * k;
    const s = r.scale.x + (orbitState.scale - r.scale.x) * k;
    r.scale.setScalar(s);
    r.rotation.y += dt * 0.15 + (orbitState.spin - r.rotation.y) * 0.02;
    r.rotation.x = orbitState.mouseY * 0.15;
    shell.current.rotation.y -= dt * 0.12;
    shell.current.rotation.z += dt * 0.05;
    core.current.distort = 0.32 + Math.sin(state.clock.elapsedTime * 0.7) * 0.06 + orbitState.warp * 0.3;
  });
  return (
    <group ref={root}>
      <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
        <mesh>
          <sphereGeometry args={[1, 96, 96]} />
          <MeshDistortMaterial ref={core} color="#1d6b45" emissive="#0e3b26" emissiveIntensity={0.6} roughness={0.32} metalness={0.35} distort={0.32} speed={1.6} />
        </mesh>
        <mesh ref={shell} scale={1.32}>
          <icosahedronGeometry args={[1, 2]} />
          <meshBasicMaterial color="#58a6ff" wireframe transparent opacity={0.16} />
        </mesh>
        <mesh scale={1.55}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshBasicMaterial color="#3fb950" transparent opacity={0.05} side={THREE.BackSide} />
        </mesh>
      </Float>
      <CommitRing radius={2.1} tilt={[0.35, 0, 0.18]} color={BRANCH[0]} count={9} speed={0.22} />
      <CommitRing radius={2.75} tilt={[-0.5, 0.4, -0.25]} color={BRANCH[1]} count={6} speed={-0.16} />
      <CommitRing radius={3.4} tilt={[1.1, -0.2, 0.4]} color={BRANCH[2]} count={5} speed={0.11} size={0.075} />
      <CommitRing radius={4.0} tilt={[0.15, 0.9, -0.6]} color={BRANCH[3]} count={4} speed={-0.08} size={0.07} />
      <Sparkles count={70} scale={9} size={2.2} speed={0.35} color="#e6edf3" opacity={0.6} />
    </group>
  );
}

/** Deep star field that drifts and streaks a little when you scroll fast. */
function StarField() {
  const ref = useRef();
  useFrame((_, dt) => {
    ref.current.rotation.y += dt * (0.01 + orbitState.warp * 0.25);
    ref.current.rotation.x = orbitState.mouseY * 0.03;
  });
  return (
    <group ref={ref}>
      <Stars radius={80} depth={60} count={4000} factor={4} saturation={0.4} fade speed={0.8} />
    </group>
  );
}

export default function OrbitScene({ className = '' }) {
  return (
    <div className={`orbit-canvas ${className}`} aria-hidden="true">
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 8.5], fov: 42 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.35} />
        <pointLight position={[5, 4, 6]} intensity={60} color="#58a6ff" />
        <pointLight position={[-6, -3, 2]} intensity={40} color="#bc8cff" />
        <pointLight position={[0, 0, 4]} intensity={18} color="#3fb950" />
        <StarField />
        <Planet />
      </Canvas>
    </div>
  );
}
