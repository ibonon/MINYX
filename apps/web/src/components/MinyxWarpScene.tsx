'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface MinyxWarpSceneProps {
  modelUrl?: string;
  element?: string;
  interactive?: boolean;
  onLoaded?: () => void;
}

export default function MinyxWarpScene({
  modelUrl = '/models/mascot.glb',
  element = 'Eau',
  interactive = true,
  onLoaded,
}: MinyxWarpSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // ── 1. Scene & Camera Setup ──
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020612, 0.045);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 200);

    // Responsive Camera & Model layout updater
    let isMobile = width < 1024;
    const updateLayout = (w: number, h: number) => {
      isMobile = w < 1024;
      camera.aspect = w / h;
      camera.fov = isMobile ? 44 : 36;

      if (isMobile) {
        // Mobile: Companion is centered, elevated to leave room for bottom dock
        camera.position.set(0, 0.35, 5.2);
        if (modelRoot) {
          modelRoot.position.set(0, 0.15, 0);
        }
        if (pedestalGroup) {
          pedestalGroup.position.set(0, -1.35, 0);
        }
      } else {
        // Desktop: Matches reference image (Mascot framed on right side)
        camera.position.set(0, 0.15, 4.8);
        if (modelRoot) {
          modelRoot.position.set(1.45, -0.05, 0);
        }
        if (pedestalGroup) {
          pedestalGroup.position.set(1.45, -1.50, 0);
        }
      }
      camera.updateProjectionMatrix();
    };

    // ── 2. High-Performance WebGL Renderer (60 FPS Locked) ──
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
    renderer.toneMappingExposure = 1.30;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // ── 3. Color Palette ──
    let primaryHex = 0x38bdf8;   // Cyan
    let secondaryHex = 0x00f0ff; // Neon turquoise
    if (element === 'Feu') {
      primaryHex = 0xf97316;
      secondaryHex = 0xef4444;
    } else if (element === 'Ténèbres') {
      primaryHex = 0xa855f7;
      secondaryHex = 0x818cf8;
    }

    // ── 4. Cinematic Hyperspace Warp-Speed Particle Tunnel ──
    // 600 warp streaks flying towards camera along Z
    const warpCount = 650;
    const warpGeo = new THREE.BufferGeometry();
    const warpPositions = new Float32Array(warpCount * 6); // 2 vertices per streak line
    const warpSpeeds: number[] = [];

    const resetStreak = (i: number, randomZ = false) => {
      // Angle and radius distribution for radial burst
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.2 + Math.random() * 8.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = randomZ ? -50 + Math.random() * 60 : -60;
      const length = 0.8 + Math.random() * 2.2;

      warpPositions[i * 6] = x;
      warpPositions[i * 6 + 1] = y;
      warpPositions[i * 6 + 2] = z;

      warpPositions[i * 6 + 3] = x;
      warpPositions[i * 6 + 4] = y;
      warpPositions[i * 6 + 5] = z - length;

      warpSpeeds[i] = 18 + Math.random() * 32;
    };

    for (let i = 0; i < warpCount; i++) {
      resetStreak(i, true);
    }

    warpGeo.setAttribute('position', new THREE.BufferAttribute(warpPositions, 3));

    const warpMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });

    const warpLines = new THREE.LineSegments(warpGeo, warpMat);
    scene.add(warpLines);

    // Ambient floating star dust
    const dustCount = 350;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPos[i] = (Math.random() - 0.5) * 16;
      dustPos[i + 1] = (Math.random() - 0.5) * 12;
      dustPos[i + 2] = (Math.random() - 0.5) * 14;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.045,
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // ── 5. Lighting Setup ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(primaryHex, 3.4);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(secondaryHex, 5.2);
    rimLight.position.set(-3.5, 1.5, -3);
    scene.add(rimLight);

    const floorGlow = new THREE.PointLight(secondaryHex, 3.8, 8);
    floorGlow.position.set(0, -1.8, 0.5);
    scene.add(floorGlow);

    // ── 6. Holographic Pedestal (Concentric Rings & Orbit Nodes) ──
    const pedestalGroup = new THREE.Group();
    pedestalGroup.rotation.x = Math.PI / 2;

    const ringMat1 = new THREE.MeshBasicMaterial({ color: secondaryHex, transparent: true, opacity: 0.85 });
    const ringMat2 = new THREE.MeshBasicMaterial({ color: primaryHex, transparent: true, opacity: 0.60 });

    pedestalGroup.add(new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.016, 16, 64), ringMat1));
    pedestalGroup.add(new THREE.Mesh(new THREE.TorusGeometry(1.30, 0.014, 16, 64), ringMat2));
    pedestalGroup.add(new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.012, 16, 48), ringMat1));
    pedestalGroup.add(new THREE.Mesh(new THREE.TorusGeometry(0.60, 0.010, 16, 36), ringMat2));

    const dotGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const dotMat = new THREE.MeshBasicMaterial({ color: secondaryHex });
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(Math.cos(angle) * 1.65, Math.sin(angle) * 1.65, 0);
      pedestalGroup.add(dot);
    }
    scene.add(pedestalGroup);

    // ── 7. 3D Model Group & Loader ──
    const modelRoot = new THREE.Group();
    scene.add(modelRoot);

    let modelMeshGroup: THREE.Group | null = null;
    let mixer: THREE.AnimationMixer | null = null;

    const setupModel = (gltf: any) => {
      const meshGroup: THREE.Group = gltf.scene;
      modelMeshGroup = meshGroup;

      const box = new THREE.Box3().setFromObject(meshGroup);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const targetScale = 3.25 / (maxDim || 1);
      meshGroup.scale.set(targetScale, targetScale, targetScale);

      meshGroup.position.x = -center.x * targetScale;
      meshGroup.position.y = -center.y * targetScale - 0.04;
      meshGroup.position.z = -center.z * targetScale;

      meshGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (!mat.map) {
              mat.color = new THREE.Color(0x38bdf8);
              mat.emissive = new THREE.Color(0x0284c7);
              mat.emissiveIntensity = 0.45;
              mat.roughness = 0.22;
              mat.metalness = 0.06;
            } else {
              mat.roughness = Math.min(mat.roughness, 0.28);
            }
          }
        }
      });

      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(meshGroup);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
      }

      modelRoot.add(meshGroup);
      setIsLoaded(true);
      if (onLoaded) onLoaded();
    };

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => setupModel(gltf),
      undefined,
      () => {
        loader.load(
          '/models/companion.glb',
          (gltfFallback) => setupModel(gltfFallback),
          undefined,
          (err) => console.warn('Could not load 3D GLB model:', err)
        );
      }
    );

    // Run initial layout computation
    updateLayout(width, height);

    // ── 8. Inertial Touch & Mouse Orbit Control ──
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let currentRotY = 0;
    let currentRotX = 0;
    let mouseParallaxX = 0;
    let mouseParallaxY = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevX;
        const deltaY = e.clientY - prevY;
        targetRotY += deltaX * 0.012;
        targetRotX += deltaY * 0.006;
        targetRotX = Math.max(-0.35, Math.min(0.35, targetRotX));
        prevX = e.clientX;
        prevY = e.clientY;
      } else if (!isMobile) {
        const normX = (e.clientX / window.innerWidth) * 2 - 1;
        const normY = (e.clientY / window.innerHeight) * 2 - 1;
        mouseParallaxX = normX * 0.12;
        mouseParallaxY = normY * 0.08;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });

    // ── 9. Window Resize Handling ──
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      updateLayout(width, height);
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };

    window.addEventListener('resize', handleResize);

    // ── 10. 60 FPS Animation Render Loop ──
    let animationFrameId: number;
    const clock = new THREE.Clock();
    const positionsAttr = warpGeo.attributes.position as THREE.BufferAttribute;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.064);
      const elapsed = clock.getElapsedTime();

      // Animate warp speed lines toward camera
      const posArray = positionsAttr.array as Float32Array;
      for (let i = 0; i < warpCount; i++) {
        const speed = warpSpeeds[i] * delta;
        posArray[i * 6 + 2] += speed;
        posArray[i * 6 + 5] += speed;

        // Reset if line passed the camera
        if (posArray[i * 6 + 2] > 8) {
          resetStreak(i, false);
        }
      }
      positionsAttr.needsUpdate = true;

      // Rotate dust
      dust.rotation.y = elapsed * 0.02;

      // Rotate floor rings
      pedestalGroup.rotation.z += delta * 0.24;

      if (mixer) {
        mixer.update(delta);
      }

      if (modelMeshGroup) {
        // Inertial damping
        currentRotY += (targetRotY + mouseParallaxX - currentRotY) * 0.085;
        currentRotX += (targetRotX + mouseParallaxY - currentRotX) * 0.085;

        modelMeshGroup.rotation.y = currentRotY;
        modelMeshGroup.rotation.x = currentRotX;

        // Breathing levitation
        modelMeshGroup.position.y = -0.04 + Math.sin(elapsed * 2.2) * 0.055;
      }

      renderer.render(scene, camera);
    };

    animate();

    // ── 11. Cleanup ──
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      renderer.dispose();
      warpGeo.dispose();
      warpMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
      dotGeo.dispose();
      dotMat.dispose();

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl, element, interactive, onLoaded]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-auto z-0 overflow-hidden select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Loading state indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#02050e] z-10 transition-opacity duration-500">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full animate-ping" />
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="mt-4 font-mono text-[11px] tracking-widest uppercase text-cyan-300/80 animate-pulse">
            Portail Quantique en cours d&apos;ouverture...
          </span>
        </div>
      )}
    </div>
  );
}
