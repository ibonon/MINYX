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

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 5.0);

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

    // --- 2. Lighting Setup (Cyan Bioluminescent Glow & Rim Lighting) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x7dd3fc, 3.2);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 4.5);
    rimLight.position.set(-3.5, 1.5, -3);
    scene.add(rimLight);

    const chestEmblemLight = new THREE.PointLight(0x38bdf8, 4.0, 6);
    chestEmblemLight.position.set(0, -0.2, 1.2);
    scene.add(chestEmblemLight);

    // Floor glow light
    const floorLight = new THREE.PointLight(0x00d4ff, 3.5, 7);
    floorLight.position.set(0, -1.8, 0.5);
    scene.add(floorLight);

    // --- 3. GLTF / GLB Loader ---
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
        const targetScale = 3.2 / (maxDim || 1);
        modelGroup.scale.set(targetScale, targetScale, targetScale);

        // Center vertically & horizontally
        modelGroup.position.x = -center.x * targetScale;
        modelGroup.position.y = -center.y * targetScale - 0.05;
        modelGroup.position.z = -center.z * targetScale;

        // Traverse & tune materials for holographic bioluminescent brilliance
        modelGroup.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = Math.min(mat.roughness, 0.25);
              if (mesh.name.includes('Emblem') || mesh.name.includes('Drop')) {
                mat.emissive = new THREE.Color(0x38bdf8);
                mat.emissiveIntensity = 1.6;
              } else if (mesh.name.includes('Catchlight')) {
                mat.emissive = new THREE.Color(0xffffff);
                mat.emissiveIntensity = 1.0;
              }
            }
          }
        });

        // Embedded animations if present
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
        setIsLoading(false);
        setLoadError(true);
      }
    );

    // --- 4. Interactive Mouse Parallax & Breathing Animation Loop ---
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

      // Animation mixer update
      if (mixer) {
        mixer.update(delta);
      }

      // Smooth floating breathing & mouse tracking
      if (modelGroup) {
        const floatY = Math.sin(elapsedTime * 2.0) * 0.05;
        modelGroup.position.y += floatY * delta * 1.5;

        if (interactive) {
          targetRotationY = mouseX * 0.45;
          targetRotationX = -mouseY * 0.25;
          modelGroup.rotation.y += (targetRotationY - modelGroup.rotation.y) * 0.07;
          modelGroup.rotation.x += (targetRotationX - modelGroup.rotation.x) * 0.07;
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
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl, element, interactive, onModelLoaded]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mountRef} className="w-full h-full select-none cursor-grab active:cursor-grabbing" />

      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="mt-3 text-xs font-share-tech text-cyan-300 animate-pulse">
            Chargement du modèle 3D .GLB...
          </span>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-x-4 bottom-4 z-20 pointer-events-auto p-3.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-xs text-cyan-200">
          Impossible de charger le fichier .glb. Vérifie qu'il est présent dans public/models/companion.glb.
        </div>
      )}
    </div>
  );
}
