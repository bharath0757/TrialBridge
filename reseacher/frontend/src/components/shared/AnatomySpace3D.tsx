import React, { Suspense, useState, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import {
  Sparkles,
  RefreshCw,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Bone,
  HeartPulse,
  Activity,
  BrainCircuit,
  Play,
  Pause,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AnatomicalSystem = 'skeletal' | 'vascular' | 'visceral' | 'nervous';

interface SystemConfig {
  id: AnatomicalSystem;
  label: string;
  icon: React.ElementType;
  modelPath: string;
  targetScale: number;
}

const SYSTEM_CONFIGS: Record<AnatomicalSystem, SystemConfig> = {
  skeletal: {
    id: 'skeletal',
    label: 'Skeletal',
    icon: Bone,
    modelPath: '/skeleton.glb',
    targetScale: 3.2,
  },
  vascular: {
    id: 'vascular',
    label: 'Vascular',
    icon: HeartPulse,
    modelPath: '/vascular_system.glb',
    targetScale: 3.0,
  },
  visceral: {
    id: 'visceral',
    label: 'Visceral',
    icon: Activity,
    modelPath: '/visceral_system.glb',
    targetScale: 3.2,
  },
  nervous: {
    id: 'nervous',
    label: 'Nervous',
    icon: BrainCircuit,
    modelPath: '/nervous_system.glb',
    targetScale: 3.2,
  },
};

// Detect kidney/renal structures to highlight in RED for Type-2 Diabetes
const isKidneyMesh = (name: string): boolean => {
  const n = name.toLowerCase();
  return (
    n.includes('kidney') ||
    n.includes('renal') ||
    n.includes('nephr') ||
    n.includes('suprarenal')
  );
};

// Detect target zones (pancreas, colon, intestines) for C4H11N5 Metformin
const isTargetMesh = (name: string): boolean => {
  const n = name.toLowerCase();
  return (
    n.includes('pancrea') ||
    n.includes('colon') ||
    n.includes('duodenum') ||
    n.includes('jejunum')
  );
};

interface ModelSceneProps {
  system: AnatomicalSystem;
  autoRotate: boolean;
  isSimulated: boolean;
  compoundId: string;
  targetOrgans?: string[];
  affectedZones?: {
    name: string;
    system: AnatomicalSystem;
    score: number;
    color: 'red' | 'green' | 'blue';
    role: string;
  }[];
}

function NormalizedModel({
  system,
  autoRotate,
  isSimulated,
  compoundId,
  targetOrgans,
  affectedZones,
}: ModelSceneProps) {
  const config = SYSTEM_CONFIGS[system];
  const { scene } = useGLTF(config.modelPath);
  const groupRef = useRef<THREE.Group>(null);

  const isAmlodipine = compoundId.toLowerCase().includes('c20') || compoundId.toLowerCase().includes('amlo');

  // Clone scene and apply material styling based on simulation state
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    // Compute bounding box for automatic scale & center normalization
    const box = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = config.targetScale / maxDim;

    // Center at (0, 0, 0)
    clone.position.x = -center.x * scale;
    clone.position.y = -center.y * scale;
    clone.position.z = -center.z * scale;
    clone.scale.setScalar(scale);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (!isSimulated) {
          // PLAIN / BASELINE STATE: Natural unhighlighted anatomical shading
          if (system === 'visceral') {
            mesh.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#826d60'),
              roughness: 0.55,
              metalness: 0.05,
              transparent: true,
              opacity: 0.9,
            });
          } else if (system === 'skeletal') {
            mesh.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#eae5d9'),
              roughness: 0.5,
              metalness: 0.05,
            });
          } else if (system === 'vascular') {
            const isVein = mesh.name.toLowerCase().includes('vein') || mesh.name.toLowerCase().includes('vena');
            mesh.material = new THREE.MeshStandardMaterial({
              color: isVein ? new THREE.Color('#3b82f6') : new THREE.Color('#dc2626'),
              roughness: 0.5,
              metalness: 0.1,
            });
          } else if (system === 'nervous') {
            mesh.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#67e8f9'),
              roughness: 0.5,
              metalness: 0.1,
            });
          }
        } else {
          // SIMULATED ACTIVE STATE: Dynamic Organ Highlighting
          const meshNameLower = mesh.name.toLowerCase();

          // 1. Check if mesh matches primary target organs
          let isPrimary = false;
          if (targetOrgans && targetOrgans.length > 0) {
            isPrimary = targetOrgans.some((kw) => meshNameLower.includes(kw.toLowerCase()));
          } else if (isAmlodipine) {
            isPrimary =
              system === 'vascular' ||
              (system === 'visceral' && isKidneyMesh(mesh.name)) ||
              (system === 'nervous' && (meshNameLower.includes('brain') || meshNameLower.includes('midbrain') || meshNameLower.includes('ventricle')));
          } else {
            // Default C4H11N5 Metformin
            isPrimary = system === 'visceral' && isKidneyMesh(mesh.name);
          }

          // 2. Check if mesh matches secondary target zones
          const matchedZone = affectedZones?.find((z) => {
            if (z.system !== system) return false;
            const keywords = z.name
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, '')
              .split(/\s+/)
              .filter((w) => w.length > 3 && !['affected', 'target', 'renal', 'damage', 'elimination'].includes(w));
            return keywords.some((kw) => meshNameLower.includes(kw));
          });

          if (isPrimary) {
            // AFFECTED ORGANS: Illuminated in glowing RED
            mesh.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#ef4444'),
              emissive: new THREE.Color('#dc2626'),
              emissiveIntensity: 0.95,
              roughness: 0.25,
              metalness: 0.15,
            });
            mesh.renderOrder = 10;
          } else if (matchedZone && matchedZone.color !== 'red') {
            // Secondary target zones in emerald GREEN or cyan BLUE
            const colorHex = matchedZone.color === 'blue' ? '#06b6d4' : '#10b981';
            const emissiveHex = matchedZone.color === 'blue' ? '#0891b2' : '#059669';
            mesh.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(colorHex),
              emissive: new THREE.Color(emissiveHex),
              emissiveIntensity: 0.7,
              roughness: 0.3,
              metalness: 0.1,
            });
          } else if (isTargetMesh(mesh.name) && (!targetOrgans || targetOrgans.length === 0)) {
            // Fallback for Metformin pancreas / colon
            mesh.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#10b981'),
              emissive: new THREE.Color('#059669'),
              emissiveIntensity: 0.65,
              roughness: 0.3,
              metalness: 0.1,
            });
          } else {
            // Neutral / subtle background anatomy
            if (system === 'visceral') {
              mesh.material = new THREE.MeshStandardMaterial({
                color: new THREE.Color('#786257'),
                roughness: 0.5,
                metalness: 0.05,
                transparent: true,
                opacity: 0.75,
              });
            } else if (system === 'skeletal') {
              mesh.material = new THREE.MeshStandardMaterial({
                color: new THREE.Color('#eae5d9'),
                roughness: 0.45,
                metalness: 0.05,
                transparent: true,
                opacity: 0.8,
              });
            } else if (system === 'vascular') {
              const isVein = mesh.name.toLowerCase().includes('vein') || mesh.name.toLowerCase().includes('vena');
              mesh.material = new THREE.MeshStandardMaterial({
                color: isVein ? new THREE.Color('#2563eb') : new THREE.Color('#ef4444'),
                roughness: 0.45,
                metalness: 0.15,
                transparent: true,
                opacity: 0.7,
              });
            } else if (system === 'nervous') {
              mesh.material = new THREE.MeshStandardMaterial({
                color: new THREE.Color('#06b6d4'),
                roughness: 0.45,
                metalness: 0.1,
                transparent: true,
                opacity: 0.7,
              });
            }
          }
        }
      }
    });

    return clone;
  }, [scene, system, config.targetScale, isSimulated, isAmlodipine, targetOrgans, affectedZones]);

  // Cleanly dispose Three.js materials to prevent GPU memory leaks and WebGL context loss
  React.useEffect(() => {
    return () => {
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });
    };
  }, [clonedScene]);

  // Smooth continuous rotation around Y axis
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Coordinate Axis Gizmo
function AxisGizmo() {
  const { camera } = useThree();
  const gizmoRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (gizmoRef.current) {
      gizmoRef.current.position.set(1.65, -1.2, -3.5);
      gizmoRef.current.quaternion.copy(camera.quaternion).invert();
    }
  });

  return (
    <group ref={gizmoRef} scale={0.35}>
      {/* X - Red */}
      <line>
        <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)])} />
        <lineBasicMaterial attach="material" color="#ef4444" linewidth={2} />
      </line>
      <mesh position={[1.1, 0, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Y - Green */}
      <line>
        <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0)])} />
        <lineBasicMaterial attach="material" color="#22c55e" linewidth={2} />
      </line>
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>

      {/* Z - Blue */}
      <line>
        <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1)])} />
        <lineBasicMaterial attach="material" color="#3b82f6" linewidth={2} />
      </line>
      <mesh position={[0, 0, 1.1]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
    </group>
  );
}

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/85 backdrop-blur-md px-5 py-4 border border-white/10 text-white shadow-2xl">
        <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
        <p className="text-xs font-semibold tracking-wide">Rendering 3D System...</p>
        <p className="text-[10px] text-zinc-400">Normalizing geometry & tissues</p>
      </div>
    </Html>
  );
}

export interface AnatomySpace3DProps {
  currentSystem?: AnatomicalSystem;
  onSystemChange?: (sys: AnatomicalSystem) => void;
  drugFormula?: string;
  condition?: string;
  compoundId?: string;
  isSimulated?: boolean;
  className?: string;
  targetOrgans?: string[];
  affectedZones?: {
    name: string;
    system: AnatomicalSystem;
    score: number;
    color: 'red' | 'green' | 'blue';
    role: string;
  }[];
}

export function AnatomySpace3D({
  currentSystem = 'visceral',
  onSystemChange,
  drugFormula = 'C₄H₁₁N₅',
  condition = 'Type-2 Diabetes',
  compoundId = 'c4h11n5',
  isSimulated = false,
  className,
  targetOrgans,
  affectedZones,
}: AnatomySpace3DProps) {
  const [activeSystem, setActiveSystem] = useState<AnatomicalSystem>(currentSystem);
  const [autoRotate, setAutoRotate] = useState(true);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Sync internal system if parent requests change
  React.useEffect(() => {
    setActiveSystem(currentSystem);
  }, [currentSystem]);

  const handleSystemSelect = (sys: AnatomicalSystem) => {
    setActiveSystem(sys);
    onSystemChange?.(sys);
  };

  const handleZoomIn = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyIn(1.25);
      controlsRef.current.update();
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyOut(1.25);
      controlsRef.current.update();
    }
  };

  const handlePan = (dx: number, dy: number) => {
    if (controlsRef.current) {
      const target = controlsRef.current.target;
      target.x += dx * 0.2;
      target.y += dy * 0.2;
      controlsRef.current.update();
    }
  };

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.object.position.set(0, 0, 4.2);
      controlsRef.current.update();
    }
  };

  const isAmlodipine = compoundId.toLowerCase().includes('c20') || compoundId.toLowerCase().includes('amlo');

  return (
    <div
      className={cn(
        'relative w-full h-[600px] rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-xl flex flex-col select-none',
        className
      )}
    >
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 inset-x-0 z-20 flex flex-col items-center gap-2 pointer-events-none px-4">
        {/* Anatomical System Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-900/90 backdrop-blur-md border border-zinc-700/60 shadow-xl pointer-events-auto">
          {(Object.values(SYSTEM_CONFIGS) as SystemConfig[]).map((cfg) => {
            const Icon = cfg.icon;
            const isActive = activeSystem === cfg.id;
            return (
              <button
                key={cfg.id}
                onClick={() => handleSystemSelect(cfg.id)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cfg.label}</span>
              </button>
            );
          })}

          {/* Pause / Resume Rotation */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Pause continuous rotation' : 'Resume continuous rotation'}
            className={cn(
              'flex items-center justify-center h-7 w-7 rounded-full transition-all ml-1',
              autoRotate ? 'bg-zinc-800 text-blue-400 hover:bg-zinc-700' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Legend Row: Changes between Plain and Simulated state */}
        <div className="flex items-center gap-3 px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-zinc-800 text-[11px] font-medium pointer-events-auto">
          {!isSimulated ? (
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-zinc-500" />
              Baseline Anatomical View (Plain) — Click &quot;Simulate Organ Impact&quot; to highlight
            </span>
          ) : (
            <>
              <span className="flex items-center gap-1.5 text-red-400 font-bold">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]" />
                AFFECTED (Illuminated in RED)
              </span>
              {affectedZones && affectedZones.some((z) => z.color === 'green' || z.color === 'blue') && (
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  TARGET ZONES
                </span>
              )}
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="h-2 w-2 rounded-full bg-zinc-500" />
                NEUTRAL TISSUE
              </span>
            </>
          )}
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        gl={{
          antialias: true,
          powerPreference: 'default',
          preserveDrawingBuffer: true,
        }}
        onCreated={({ gl }) => {
          const canvasEl = gl.domElement;
          const handleContextLost = (e: Event) => {
            e.preventDefault();
            console.debug('WebGL context lost, preventing browser crash.');
          };
          canvasEl.addEventListener('webglcontextlost', handleContextLost);
        }}
        className="h-full w-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 15, 10]} intensity={2.0} />
        <directionalLight position={[-10, -10, -10]} intensity={0.8} color="#94a3b8" />
        <directionalLight position={[0, -10, 10]} intensity={1.0} color="#f8fafc" />
        <pointLight position={[0, 4, 2]} intensity={1.5} color="#ffffff" />

        <Suspense fallback={<Loader />}>
          <NormalizedModel
            key={`${activeSystem}-${isSimulated}-${compoundId}-${targetOrgans?.join('_') || ''}`}
            system={activeSystem}
            autoRotate={autoRotate}
            isSimulated={isSimulated}
            compoundId={compoundId}
            targetOrgans={targetOrgans}
            affectedZones={affectedZones}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          minDistance={1.5}
          maxDistance={8.0}
          rotateSpeed={0.8}
        />

        <AxisGizmo />
      </Canvas>

      {/* Left In-Viewport Controls (Zoom Pill + Pan D-Pad) */}
      <div className="absolute left-5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
        {/* Zoom In / Zoom Out Pill */}
        <div className="flex flex-col items-center bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-zinc-700/60 p-1 shadow-xl">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="flex items-center justify-center h-8 w-8 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="w-4 h-px bg-zinc-700 my-0.5" />
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="flex items-center justify-center h-8 w-8 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* 4-Way D-Pad Pan Controller */}
        <div className="relative w-20 h-20 rounded-full bg-zinc-900/90 backdrop-blur-md border border-zinc-700/60 shadow-xl p-1 flex items-center justify-center">
          <button
            onClick={() => handlePan(0, 1)}
            title="Pan Up"
            className="absolute top-1 text-zinc-400 hover:text-white p-1"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => handlePan(0, -1)}
            title="Pan Down"
            className="absolute bottom-1 text-zinc-400 hover:text-white p-1"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            onClick={() => handlePan(-1, 0)}
            title="Pan Left"
            className="absolute left-1 text-zinc-400 hover:text-white p-1"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => handlePan(1, 0)}
            title="Pan Right"
            className="absolute right-1 text-zinc-400 hover:text-white p-1"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Pause Rotation' : 'Resume Rotation'}
            className="h-6 w-6 rounded-full bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 flex items-center justify-center text-[10px]"
          >
            {autoRotate ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5 ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Bottom Center Reset Pill: TOTAL ZOOM / FIT */}
      <div className="absolute bottom-5 inset-x-0 z-20 flex justify-center pointer-events-none">
        <button
          onClick={handleResetCamera}
          className="pointer-events-auto flex items-center gap-2 px-5 py-2 rounded-full bg-zinc-900/90 backdrop-blur-md border border-zinc-700/70 text-zinc-200 hover:text-white hover:bg-zinc-800 text-xs font-semibold tracking-wider uppercase transition-all shadow-xl"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Total Zoom / Fit</span>
        </button>
      </div>

      {/* Bottom Left Status Tag */}
      <div className="absolute bottom-5 left-5 z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-zinc-800 text-[11px] text-zinc-300">
          <span className="font-mono text-blue-400 font-semibold">{drugFormula}</span>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-300">{condition}</span>
          <span className="text-zinc-500">|</span>
          <span className={cn('font-bold', isSimulated ? 'text-red-400' : 'text-zinc-400')}>
            {isSimulated ? 'Affected Organs Highlighted' : 'Plain Baseline Model'}
          </span>
        </div>
      </div>

      {/* Bottom Right 3D Axis Legend Tag */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none flex items-center gap-1.5 text-[10px] font-mono">
        <span className="px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60 font-bold">X</span>
        <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold">Y</span>
        <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60 font-bold">Z</span>
      </div>
    </div>
  );
}

// Preload models
useGLTF.preload('/skeleton.glb');
useGLTF.preload('/vascular_system.glb');
useGLTF.preload('/visceral_system.glb');
useGLTF.preload('/nervous_system.glb');
