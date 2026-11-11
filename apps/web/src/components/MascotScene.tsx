'use client';

/**
 * MascotScene — composant 3D ISOLÉ
 * ─────────────────────────────────
 * Responsabilité unique : afficher la mascotte GLB compressée Draco
 * dans une scène Three.js plein-écran, à 60 FPS.
 *
 * RÈGLES STRICTES :
 *  - Zéro logique métier (auth, chat, API) ici.
 *  - Zéro HTML UI ici.
 *  - Communique vers l'extérieur uniquement via props typées.
 *
 * Mode performance adaptatif :
 *  - Mobile (<768px) : DPR ≤ 1, particules réduites, pas d'ombres
 *  - Desktop        : DPR ≤ 2, full quality
 */

import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  useGLTF,
  useAnimations,
  OrbitControls,
  Environment,
  Stars,
  Ring,
} from '@react-three/drei';
import * as THREE from 'three';

// ─── Types exportés pour l'overlay UI ───────────────────────────
export type MascotMood = 'idle' | 'talking' | 'happy' | 'thinking';

export interface MascotSceneProps {
  mood?: MascotMood;
  /** Affiche/masque l'anneau de pédestal holographique */
  showPedestal?: boolean;
  /** Callback déclenché quand le canvas est prêt */
  onReady?: () => void;
  /** Callback déclenché quand le modèle 3D est complètement chargé */
  onModelLoaded?: () => void;
  /** Affiche un compteur FPS en surimpression (dev uniquement) */
  showStats?: boolean;
  /**
   * Callback FPS — appelé toutes les 60 frames avec le FPS mesuré.
   * Permet à l'overlay HTML de lire les FPS sans logique 3D dans l'UI.
   */
  onFpsUpdate?: (fps: number) => void;
  /**
   * Positionnement de la mascotte dans la scène :
   * - 'center'  : centré (default, test page, fullscreen)
   * - 'right'   : décalé à droite (hero page desktop)
   * - 'left'    : décalé à gauche
   */
  layout?: 'center' | 'right' | 'left';
}

// ─── Adapteur qualité réactif selon le device ───────────────────────────
function useQualityProfile() {
  const [profile, setProfile] = useState(() => {
    if (typeof window === 'undefined') return { isMobile: false, dpr: 2, particleCount: 650, shadows: true };
    const isMobile = window.innerWidth < 768;
    return {
      isMobile,
      dpr: Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 2),
      particleCount: isMobile ? 200 : 650,
      shadows: !isMobile,
    };
  });

  useEffect(() => {
    const update = () => {
      const isMobile = window.innerWidth < 768;
      setProfile({
        isMobile,
        dpr: Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 2),
        particleCount: isMobile ? 200 : 650,
        shadows: !isMobile,
      });
    };
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  return profile;
}

// ─── Mascotte GLB (Draco) ─────────────────────────────────────
function Mascot({ mood = 'idle', onLoaded }: { mood: MascotMood; onLoaded?: () => void }) {
  const group = useRef<THREE.Group>(null!);
  const gltf = useGLTF('/models/mascot-draco.glb', '/draco/') as unknown as {
    scene: THREE.Group;
    animations: THREE.AnimationClip[];
  };
  const { actions, names } = useAnimations(gltf.animations || [], group);

  useEffect(() => {
    if (gltf.scene) {
      onLoaded?.();
    }
  }, [gltf.scene, onLoaded]);

  // Appliquer le matériau céleste bleu holographique conforme aux références Awwwards
  const styledScene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(0x38bdf8),
          emissive: new THREE.Color(0x0369a1),
          emissiveIntensity: 0.55,
          roughness: 0.2,
          metalness: 0.1,
          clearcoat: 0.9,
          clearcoatRoughness: 0.1,
          transmission: 0.25,
          thickness: 0.6,
          ior: 1.4,
        });
      }
    });
    return cloned;
  }, [gltf.scene]);

  // Activer l'animation selon l'humeur
  useEffect(() => {
    if (!actions || names.length === 0) return;

    const moodMap: Record<MascotMood, string[]> = {
      idle:     ['idle', 'Idle', 'IDLE', 'rest', 'Rest'],
      talking:  ['talking', 'Talking', 'talk', 'Talk', 'speak', 'Speak'],
      happy:    ['happy', 'Happy', 'jump', 'Jump', 'bounce', 'Bounce'],
      thinking: ['thinking', 'Thinking', 'think', 'Think', 'ponder'],
    };

    const candidates = moodMap[mood];
    const animName = candidates.find((c) => names.includes(c)) ?? names[0];
    if (!animName) return;

    Object.values(actions).forEach((a) => a?.fadeOut(0.3));
    actions[animName]?.reset().fadeIn(0.3).play();

    return () => {
      actions[animName]?.fadeOut(0.3);
    };
  }, [mood, actions, names]);

  // Animation procédurale fluide (flottement + pulsation du souffle)
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    // Flottement orbital
    group.current.rotation.y = Math.sin(t * 0.4) * 0.15;
    // Lévitation verticale
    group.current.position.y = Math.sin(t * 1.2) * 0.06;
    // Réactivité selon le mood
    if (mood === 'talking') {
      group.current.position.y += Math.sin(t * 8.0) * 0.02;
    } else if (mood === 'happy') {
      group.current.position.y += Math.abs(Math.sin(t * 4.0)) * 0.12;
      group.current.rotation.z = Math.sin(t * 4.0) * 0.05;
    }
  });

  return (
    <group ref={group} dispose={null}>
      {/* Centrage parfait : le modèle fait 1.902 unités de haut (Y de 0 à 1.902).
          En le décalant de Y = -0.951, son centre géométrique est exactement à (0, 0, 0).
          Les pieds sont à Y = -0.951, la flamme du crâne culmine à Y = +0.951. */}
      <primitive object={styledScene} scale={1.0} position={[0, -0.951, 0]} />
    </group>
  );
}

// Préchargement Draco local
useGLTF.preload('/models/mascot-draco.glb', '/draco/');

// ─── Anneau de pédestal holographique ────────────────────────
function HoloPedestal() {
  const ref1 = useRef<THREE.Mesh>(null!);
  const ref2 = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref1.current) ref1.current.rotation.z = t * 0.6;
    if (ref2.current) ref2.current.rotation.z = -t * 0.4;
  });

  // Placé directement sous les pieds de la mascotte (Y = -0.951)
  return (
    <group position={[0, -0.951, 0]}>
      {/* Anneau extérieur */}
      <Ring ref={ref1} args={[0.9, 1.02, 64]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.7} side={THREE.DoubleSide} />
      </Ring>
      {/* Anneau intermédiaire */}
      <Ring args={[0.72, 0.76, 64]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.5} side={THREE.DoubleSide} />
      </Ring>
      {/* Anneau intérieur */}
      <Ring ref={ref2} args={[0.5, 0.55, 64]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
      </Ring>
      {/* Lumière de sol */}
      <pointLight color="#06b6d4" intensity={3} distance={4} position={[0, 0.1, 0]} />
    </group>
  );
}

// ─── Étoiles warp + nébuleuse ────────────────────────────────
function SpaceBackground({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      <Stars
        radius={80}
        depth={50}
        count={isMobile ? 1200 : 3000}
        factor={4}
        saturation={0.3}
        fade
        speed={1.2}
      />
      {/* Lumière ambiante froide */}
      <ambientLight color="#0d1b4b" intensity={0.8} />
      {/* Lumière principale */}
      <directionalLight color="#c7d2fe" intensity={1.4} position={[2, 4, 3]} />
      {/* Accent cyan */}
      <pointLight color="#06b6d4" intensity={3} distance={6} position={[-2, 1, 2]} />
      {/* Accent cyan électrique profond */}
      <pointLight color="#0284c7" intensity={2} distance={5} position={[3, -1, -2]} />
    </>
  );
}

// ─── Adaptateur caméra responsive cinématique ───────────────────────────
function ResponsiveCamera({ controlsRef, offsetX = 0 }: { controlsRef: React.RefObject<any>; offsetX?: number }) {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    // Récupérer les dimensions réelles (R3F size avec fallback window)
    const width = size.width > 0 ? size.width : (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const height = size.height > 0 ? size.height : (typeof window !== 'undefined' ? window.innerHeight : 800);
    const aspect = width / Math.max(height, 1);

    // FOV cinématique doux (34 degrés) pour éliminer toute déformation grand angle / tête démesurée
    const fovDeg = 34;
    camera.fov = fovDeg;
    const fovRad = (fovDeg * Math.PI) / 180;
    const halfFovTan = Math.tan(fovRad / 2);

    // Enveloppe cible : mascotte + piédestal holographique
    // Hauteur totale : 2.05 (pieds -0.951, tête +0.951)
    // Largeur piédestal : 2.10
    const targetHeight = 2.05;
    const targetWidth = 2.10;

    // Sur mobile portrait (aspect < 0.8), l'UI superpose du texte en haut et 3 boutons en bas.
    // On adapte le cadrage pour que la mascotte s'insère parfaitement dans la fenêtre médiane (38% hauteur).
    const isPortrait = aspect < 0.8;
    const heightFactor = isPortrait ? 2.45 : 1.90;
    const widthFactor = isPortrait ? 1.70 : 1.35;

    // Distance nécessaire pour que la mascotte occupe l'espace disponible
    const distForHeight = (targetHeight / 2) / halfFovTan * heightFactor;

    // Distance nécessaire pour que le piédestal et les oreilles rentrent avec marges à tout aspect ratio
    const distForWidth = (targetWidth / 2) / (halfFovTan * Math.max(aspect, 0.2)) * widthFactor;

    // Distance finale retenue
    const requiredDistance = Math.min(Math.max(distForHeight, distForWidth), 25);

    // Angle légèrement plongeant (+0.25 en Y) pour révéler la profondeur des anneaux holographiques
    const cameraY = isPortrait ? 0.35 : 0.25;
    const targetY = isPortrait ? -0.32 : -0.05;

    camera.position.set(0, cameraY, requiredDistance);
    camera.lookAt(offsetX, targetY, 0);
    camera.updateProjectionMatrix();

    // Synchronisation stricte de l'OrbitControls pour éviter tout saut de caméra
    if (controlsRef.current) {
      controlsRef.current.target.set(offsetX, targetY, 0);
      controlsRef.current.update();
    }
  }, [camera, size.width, size.height, controlsRef, offsetX]);

  return null;
}

// ─── Compteur FPS réel mesuré via useFrame ────────────────────
function FpsMonitor({ onFpsUpdate }: { onFpsUpdate?: (fps: number) => void }) {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    frameCount.current += 1;
    const now = performance.now();
    const elapsed = now - lastTime.current;
    if (elapsed >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / elapsed);
      onFpsUpdate?.(fps);
      frameCount.current = 0;
      lastTime.current = now;
    }
  });

  return null;
}

// ─── Scène interne (dans le Canvas) ──────────────────────────
function SceneContent({
  mood,
  showPedestal,
  isMobile,
  layout,
  onModelLoaded,
  onFpsUpdate,
}: {
  mood: MascotMood;
  showPedestal: boolean;
  isMobile: boolean;
  layout: 'center' | 'right' | 'left';
  onModelLoaded?: () => void;
  onFpsUpdate?: (fps: number) => void;
}) {
  const controlsRef = useRef<any>(null);

  // Décalage horizontal selon le layout (en unités Three.js)
  // Sur mobile (<768px), centrage strict (0) pour éviter que la mascotte sorte du viewport
  // Sur desktop, décalage fluide pour aérer la composition
  const offsetX = isMobile ? 0 : layout === 'right' ? 1.6 : layout === 'left' ? -1.6 : 0;

  return (
    <>
      <ResponsiveCamera controlsRef={controlsRef} offsetX={offsetX} />
      <SpaceBackground isMobile={isMobile} />

      <Suspense fallback={null}>
        <group position={[offsetX, 0, 0]}>
          <Mascot mood={mood} onLoaded={onModelLoaded} />
          {showPedestal && <HoloPedestal />}
        </group>
      </Suspense>

      {/* Contrôles interactifs synchronisés */}
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={false}
        target={[offsetX, -0.05, 0]}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.7}
        rotateSpeed={0.4}
        dampingFactor={0.08}
        enableDamping
      />

      {/* Monitoring FPS réel (toujours actif, reporté via callback) */}
      <FpsMonitor onFpsUpdate={onFpsUpdate} />
    </>
  );
}

// ─── Export principal ─────────────────────────────────────────
export interface MascotSceneHandle {
  /** Pas d'API impérative exposée pour l'instant — prévu pour setMood */
}

const MascotScene = forwardRef<MascotSceneHandle, MascotSceneProps>(function MascotScene(
  { mood = 'idle', showPedestal = true, onReady, onModelLoaded, showStats = false, onFpsUpdate, layout = 'center' },
  ref
) {
  useImperativeHandle(ref, () => ({}));
  const quality = useQualityProfile();
  const [liveFps, setLiveFps] = useState<number | null>(null);

  const handleFps = useCallback(
    (fps: number) => {
      if (showStats) setLiveFps(fps);
      onFpsUpdate?.(fps);
    },
    [showStats, onFpsUpdate]
  );

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        shadows={quality.shadows}
        dpr={quality.dpr}
        camera={{ fov: 34, near: 0.1, far: 200, position: [0, 0.25, 5.8] }}
        gl={{
          antialias: !quality.isMobile,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        onCreated={() => onReady?.()}
        style={{ position: 'absolute', inset: 0 }}
      >
        <SceneContent
          mood={mood}
          showPedestal={showPedestal}
          isMobile={quality.isMobile}
          layout={layout}
          onModelLoaded={onModelLoaded}
          onFpsUpdate={handleFps}
        />
      </Canvas>

      {/* Overlay FPS (dev uniquement, activé par showStats prop) */}
      {showStats && liveFps !== null && (
        <div
          id="fps-counter"
          data-fps={liveFps}
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 100,
            pointerEvents: 'none',
            fontFamily: 'monospace',
            fontSize: 12,
            color: liveFps >= 55 ? '#4ade80' : liveFps >= 30 ? '#facc15' : '#f87171',
            background: 'rgba(0,0,0,0.65)',
            padding: '3px 8px',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.1)',
            lineHeight: 1.4,
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>FPS </span>
          <strong>{liveFps}</strong>
          <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>
            {quality.isMobile ? '📱 mobile' : '🖥 desktop'}
          </span>
        </div>
      )}
    </div>
  );
});

export default MascotScene;
