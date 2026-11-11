'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface MinyxImmersionSceneProps {
  modelUrl?: string;
  element?: string;
  onLoaded?: () => void;
  interactive?: boolean;
}

export default function MinyxImmersionScene({
  modelUrl = '/models/mascot.glb',
  element = 'Eau',
  onLoaded,
  interactive = true,
}: MinyxImmersionSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // ── 1. Scene, Camera, High-Performance WebGL Renderer ──
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020612, 0.08);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    
    // Adaptive camera placement based on screen aspect ratio
    const updateCameraForViewport = (w: number, h: number) => {
      const isMobile = w < 768;
      const isTablet = w >= 768 && w < 1024;
      const aspect = w / h;

      camera.aspect = aspect;
      camera.fov = isMobile ? 42 : isTablet ? 38 : 35;

      if (isMobile) {
        // Frame higher and slightly back to fit above bottom dock
        camera.position.set(0, 0.25, 5.6);
      } else if (isTablet) {
        camera.position.set(0, 0.20, 5.2);
      } else {
        // Desktop: slight offset for asymmetric editorial look
        camera.position.set(0.25, 0.18, 4.9);
      }
      camera.updateProjectionMatrix();
    };

    updateCameraForViewport(width, height);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // ── 2. Element-Specific Bioluminescent Color Palette ──
    let primaryColor = new THREE.Color(0x38bdf8);   // Cyan water
    let secondaryColor = new THREE.Color(0x00f0ff); // Electric cyan
    let ambientHex = 0x0c213d;

    if (element === 'Feu') {
      primaryColor = new THREE.Color(0xf97316);
      secondaryColor = new THREE.Color(0xef4444);
      ambientHex = 0x2e0c0c;
    } else if (element === 'Ténèbres') {
      primaryColor = new THREE.Color(0xa855f7);
      secondaryColor = new THREE.Color(0x818cf8);
      ambientHex = 0x1f0c2e;
    }

    // ── 3. Atmospheric Lighting Rig ──
    const ambientLight = new THREE.AmbientLight(ambientHex, 2.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x020612, 1.2);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(primaryColor, 3.4);
    keyLight.position.set(3.5, 4.0, 3.5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(secondaryColor, 4.8);
    rimLight.position.set(-4.0, 2.0, -3.5);
    scene.add(rimLight);

    const floorGlow = new THREE.PointLight(secondaryColor, 3.6, 7.5);
    floorGlow.position.set(0, -1.8, 0.6);
    scene.add(floorGlow);

    const emblemGlow = new THREE.PointLight(primaryColor, 2.5, 4.0);
    emblemGlow.position.set(0, -0.1, 1.0);
    scene.add(emblemGlow);

    // ── 4. Holographic Concentric Rings Pedestal ──
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, -1.52, 0);
    pedestalGroup.rotation.x = Math.PI / 2;

    const ringMat1 = new THREE.MeshBasicMaterial({
      color: secondaryColor,
      transparent: true,
      opacity: 0.85,
    });
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.55,
    });

    const r1 = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.015, 16, 80), ringMat1);
    const r2 = new THREE.Mesh(new THREE.TorusGeometry(1.30, 0.012, 16, 64), ringMat2);
    const r3 = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.010, 16, 48), ringMat1);
    const r4 = new THREE.Mesh(new THREE.TorusGeometry(0.60, 0.008, 16, 36), ringMat2);

    pedestalGroup.add(r1, r2, r3, r4);

    // Orbital satellite markers
    const dotGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const dotMat = new THREE.MeshBasicMaterial({ color: secondaryColor });
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(Math.cos(angle) * 1.65, Math.sin(angle) * 1.65, 0);
      pedestalGroup.add(dot);
    }
    scene.add(pedestalGroup);

    // ── 5. GPU Celestial Stardust Particle Cloud (60 FPS) ──
    const particleCount = 450;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const opacities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      opacities[i] = Math.random();
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      color: primaryColor,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── 6. Load Genuine 3D Sculpt (companion.glb / mascot.glb) ──
    let modelGroup: THREE.Group | null = null;
    let mixer: THREE.AnimationMixer | null = null;

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        modelGroup = gltf.scene;

        // Auto-scale & exact center calculation
        const box = new THREE.Box3().setFromObject(modelGroup);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 3.25 / (maxDim || 1);
        modelGroup.scale.set(targetScale, targetScale, targetScale);

        modelGroup.position.x = -center.x * targetScale;
        modelGroup.position.y = -center.y * targetScale - 0.04;
        modelGroup.position.z = -center.z * targetScale;

        // Tune materials for luminous water-spirit essence
        modelGroup.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (!mat.map) {
                mat.color = primaryColor;
                mat.emissive = primaryColor;
                mat.emissiveIntensity = 0.45;
                mat.roughness = 0.22;
                mat.metalness = 0.08;
              } else {
                mat.roughness = Math.min(mat.roughness, 0.28);
              }
            }
          }
        });

        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(modelGroup);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
        }

        scene.add(modelGroup);
        setIsReady(true);
        if (onLoaded) onLoaded();
      },
      undefined,
      (err) => {
        console.warn('Primary 3D model load error, attempting fallback URL...', err);
        loader.load(
          '/models/companion.glb',
          (gltfFallback) => {
            modelGroup = gltfFallback.scene;
            const box = new THREE.Box3().setFromObject(modelGroup);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetScale = 3.25 / (maxDim || 1);
            modelGroup.scale.set(targetScale, targetScale, targetScale);
            modelGroup.position.x = -center.x * targetScale;
            modelGroup.position.y = -center.y * targetScale - 0.04;
            modelGroup.position.z = -center.z * targetScale;
            scene.add(modelGroup);
            setIsReady(true);
            if (onLoaded) onLoaded();
          },
          undefined,
          () => {
            setHasError(true);
          }
        );
      }
    );

    // ── 7. Touch & Mouse Unified Inertial Orbit Navigation ──
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let currentRotY = 0;
    let currentRotX = 0;
    let mouseParallaxX = 0;
    let mouseParallaxY = 0;

    const onPointerDown = (e: PointerEvent) => {
      // Allow interaction only on primary button / single touch
      if (!interactive) return;
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevPointerX;
        const deltaY = e.clientY - prevPointerY;
        targetRotY += deltaX * 0.012;
        targetRotX += deltaY * 0.006;
        // Clamp vertical pitch so mascot doesn't flip upside down
        targetRotX = Math.max(-0.35, Math.min(0.35, targetRotX));
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
      } else {
        // Subtle ambient parallax when hovering on desktop
        const normX = (e.clientX / window.innerWidth) * 2 - 1;
        const normY = (e.clientY / window.innerHeight) * 2 - 1;
        mouseParallaxX = normX * 0.15;
        mouseParallaxY = normY * 0.10;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });

    // ── 8. Responsive Window Resize ──
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      updateCameraForViewport(w, h);
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };

    window.addEventListener('resize', handleResize);

    // ── 9. Ultra-Smooth 60 FPS Animation Render Loop ──
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);

      const delta = Math.min(clock.getDelta(), 0.1); // clamp delta
      const elapsed = clock.getElapsedTime();

      // Slow rotation of holographic pedestal
      pedestalGroup.rotation.z += delta * 0.22;

      // Subtle celestial particles drift
      particles.rotation.y = elapsed * 0.04;
      particles.rotation.x = Math.sin(elapsed * 0.02) * 0.05;

      if (mixer) {
        mixer.update(delta);
      }

      if (modelGroup) {
        // Spring damping lerp
        currentRotY += (targetRotY + mouseParallaxX - currentRotY) * 0.09;
        currentRotX += (targetRotX + mouseParallaxY - currentRotX) * 0.09;

        modelGroup.rotation.y = currentRotY;
        modelGroup.rotation.x = currentRotX;

        // Gentle breathing float
        modelGroup.position.y = -0.04 + Math.sin(elapsed * 2.2) * 0.06;
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    // ── 10. Clean Memory & Resource Disposal ──
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      renderer.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
      dotGeo.dispose();
      dotMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl, element, interactive, onLoaded]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-auto z-0 overflow-hidden select-none touch-none"
      style={{ touchAction: 'none' }}
    >
      {/* Loading Ambient Shimmer */}
      {!isReady && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#02050e] z-10 transition-opacity duration-700">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full animate-ping" />
            <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-cyan-300 text-xs font-bold">M</span>
          </div>
          <p className="mt-4 font-mono text-[11px] tracking-widest uppercase text-cyan-300/80 animate-pulse">
            Invocation du Sanctuaire 3D...
          </p>
        </div>
      )}

      {/* Touch Interaction Hint (Pill) */}
      {isReady && (
        <div className="absolute bottom-28 md:bottom-12 left-1/2 -translate-x-1/2 pointer-events-none z-10 opacity-70 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-400/30 backdrop-blur-md shadow-[0_0_15px_rgba(56,189,248,0.25)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-wide text-cyan-200">
              Fais glisser pour pivoter à 360°
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
