'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface CompanionModelViewerProps {
  modelUrl?: string;
  element?: string;
  interactive?: boolean;
  className?: string;
  onModelLoaded?: () => void;
}

export default function CompanionModelViewer({
  modelUrl = '/models/companion.glb',
  element = 'Eau',
  interactive = true,
  className = '',
  onModelLoaded,
}: CompanionModelViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 550;

    // --- 1. Scene, Camera, Renderer ---
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 5.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // --- 2. Lighting Setup (Cinematic Cyan & Rim Light) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x7dd3fc, 3.0);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 4.0);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    const floorLight = new THREE.PointLight(0x38bdf8, 3.5, 8);
    floorLight.position.set(0, -1.8, 1);
    scene.add(floorLight);

    // --- 3. Concentric Energy Rings on the Floor (Exact match to concept art) ---
    const floorGroup = new THREE.Group();
    floorGroup.position.set(0, -1.85, 0);

    const ring1Geo = new THREE.TorusGeometry(1.85, 0.02, 16, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2;
    floorGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(1.3, 0.025, 16, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2;
    floorGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(0.8, 0.035, 16, 48);
    const ring3Mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.x = Math.PI / 2;
    floorGroup.add(ring3);

    scene.add(floorGroup);

    // --- 4. GLTF / GLB Loader ---
    let mixer: THREE.AnimationMixer | null = null;
    let modelGroup: THREE.Group | null = null;

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        setIsLoading(false);
        setLoadError(false);

        modelGroup = gltf.scene;

        // Auto-scale & center bounding box
        const box = new THREE.Box3().setFromObject(modelGroup);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.6 / (maxDim || 1);
        modelGroup.scale.set(scale, scale, scale);

        // Center on floor platform
        modelGroup.position.x = -center.x * scale;
        modelGroup.position.y = -box.min.y * scale - 1.8;
        modelGroup.position.z = -center.z * scale;

        // Traverse & tune materials for holographic glow
        modelGroup.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = Math.min(mat.roughness, 0.3);
              if (!mat.emissive || mat.emissive.getHex() === 0) {
                mat.emissive = new THREE.Color(0x004466);
                mat.emissiveIntensity = 0.4;
              }
            }
          }
        });

        // Animations support
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(modelGroup);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
        }

        scene.add(modelGroup);
        if (onModelLoaded) onModelLoaded();
      },
      undefined,
      (error) => {
        // Model file not yet present in public/models/
        setIsLoading(false);
        setLoadError(true);
      }
    );

    // --- 5. Mouse Parallax & Animation Loop ---
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationY = 0;
    let targetRotationX = 0;

    const handleMouseMove = (event: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const normX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = normX;
      mouseY = normY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Ring rotations & pulsing
      ring1.rotation.z += 0.3 * delta;
      ring2.rotation.z -= 0.45 * delta;
      ring3.rotation.z += 0.7 * delta;

      const ringPulse = 1.0 + Math.sin(elapsedTime * 2.5) * 0.035;
      ring1.scale.set(ringPulse, ringPulse, 1);

      // Animation mixer update
      if (mixer) {
        mixer.update(delta);
      }

      // Model idle hovering & mouse parallax
      if (modelGroup) {
        const floatY = Math.sin(elapsedTime * 1.8) * 0.08;
        modelGroup.position.y += floatY * delta * 2.0;

        if (interactive) {
          targetRotationY = mouseX * 0.4;
          targetRotationX = -mouseY * 0.2;
          modelGroup.rotation.y += (targetRotationY - modelGroup.rotation.y) * 0.08;
          modelGroup.rotation.x += (targetRotationX - modelGroup.rotation.x) * 0.08;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      renderer.dispose();
      ring1Geo.dispose();
      ring2Geo.dispose();
      ring3Geo.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl, element, interactive, onModelLoaded]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mountRef} className="w-full h-full select-none" />

      {/* Model Loader Status Notification / Drop-in Guide */}
      {loadError && (
        <div className="absolute inset-x-4 bottom-4 z-20 pointer-events-auto flex items-center justify-between p-3 rounded-2xl bg-[#040e1b]/90 border border-cyan-500/40 backdrop-blur-md shadow-xl text-left">
          <div className="flex items-center gap-3">
            <span className="text-xl">📁</span>
            <div>
              <div className="text-xs font-bold text-cyan-300 font-share-tech">
                PRÊT POUR TON FICHIER 3D .GLB
              </div>
              <div className="text-[11px] text-gray-400">
                Dépose ton modèle 3D dans <span className="font-mono text-white">apps/web/public/models/companion.glb</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
            GLTF / GLB READY
          </span>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
