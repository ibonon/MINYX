'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type ElementType = 'Feu' | 'Eau' | 'Ténèbres' | 'Lumière' | 'Terre' | 'Vent' | 'Cosmos';

interface Mascot3DProps {
  element?: ElementType;
  interactive?: boolean;
  className?: string;
  onMascotClick?: () => void;
}

export default function Mascot3D({
  element = 'Eau',
  interactive = true,
  className = '',
  onMascotClick,
}: Mascot3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Palette according to element
  const elementColors: Record<ElementType, {
    primary: number;
    secondary: number;
    glow: number;
    innerEar: number;
    light: number;
    ringColor: number;
  }> = {
    Eau: {
      primary: 0x38bdf8,     // Bright glowing cyan
      secondary: 0x0284c7,   // Deep sea blue
      glow: 0x00f0ff,        // Neon cyan
      innerEar: 0x0369a1,
      light: 0x7dd3fc,
      ringColor: 0x00d2ff,
    },
    Feu: {
      primary: 0xf87171,     // Fire red-orange
      secondary: 0xdc2626,
      glow: 0xff3b30,
      innerEar: 0x991b1b,
      light: 0xfca5a5,
      ringColor: 0xff5533,
    },
    Ténèbres: {
      primary: 0xa78bfa,     // Shadow violet
      secondary: 0x6366f1,
      glow: 0x8b5cf6,
      innerEar: 0x4338ca,
      light: 0xc4b5fd,
      ringColor: 0x9333ea,
    },
    Lumière: {
      primary: 0xfde047,     // Radiant Gold
      secondary: 0xeab308,
      glow: 0xffea00,
      innerEar: 0xca8a04,
      light: 0xfef08a,
      ringColor: 0xfacc15,
    },
    Terre: {
      primary: 0x4ade80,     // Emerald nature
      secondary: 0x16a34a,
      glow: 0x22c55e,
      innerEar: 0x15803d,
      light: 0x86efac,
      ringColor: 0x10b981,
    },
    Vent: {
      primary: 0x2dd4bf,     // Wind turquoise
      secondary: 0x0d9488,
      glow: 0x14b8a6,
      innerEar: 0x0f766e,
      light: 0x5eead4,
      ringColor: 0x06b6d4,
    },
    Cosmos: {
      primary: 0xe879f9,     // Cosmic magenta
      secondary: 0x9333ea,
      glow: 0xd946ef,
      innerEar: 0x7e22ce,
      light: 0xf0abfc,
      ringColor: 0xa855f7,
    },
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 550;

    // --- 1. THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 7.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // --- 2. LIGHTING SETUP ---
    const colors = elementColors[element];

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(colors.light, 2.5);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(colors.glow, 3.0);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    const coreLight = new THREE.PointLight(colors.primary, 3.5, 12);
    coreLight.position.set(0, 0, 1.5);
    scene.add(coreLight);

    // --- 3. WARP-SPEED HYPERSPACE PARTICLES (Matching User's Reference) ---
    const starCount = 600;
    const starPositions = new Float32Array(starCount * 6);
    const starSpeeds: number[] = [];

    for (let i = 0; i < starCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.2 + Math.random() * 6.5;
      const z = (Math.random() - 0.5) * 20;
      const speed = 0.08 + Math.random() * 0.14;
      starSpeeds.push(speed);

      // Start point
      starPositions[i * 6 + 0] = Math.cos(angle) * radius;
      starPositions[i * 6 + 1] = Math.sin(angle) * radius;
      starPositions[i * 6 + 2] = z;

      // End point (streak tail)
      const tailLength = 0.6 + speed * 4.0;
      starPositions[i * 6 + 3] = Math.cos(angle) * (radius * 1.06);
      starPositions[i * 6 + 4] = Math.sin(angle) * (radius * 1.06);
      starPositions[i * 6 + 5] = z - tailLength;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.LineBasicMaterial({
      color: colors.glow,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const starLines = new THREE.LineSegments(starGeometry, starMaterial);
    scene.add(starLines);

    // --- 4. HOLOGRAPHIC CONCENTRIC ENERGY RINGS (Floor) ---
    const floorGroup = new THREE.Group();
    floorGroup.position.set(0, -1.95, 0);

    // Ring 1 (Outer Ring)
    const ring1Geo = new THREE.TorusGeometry(1.9, 0.02, 16, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: colors.ringColor,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2;
    floorGroup.add(ring1);

    // Ring 2 (Middle Ring)
    const ring2Geo = new THREE.TorusGeometry(1.35, 0.028, 16, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: colors.primary,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2;
    floorGroup.add(ring2);

    // Ring 3 (Inner Core Ring)
    const ring3Geo = new THREE.TorusGeometry(0.85, 0.035, 16, 48);
    const ring3Mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.x = Math.PI / 2;
    floorGroup.add(ring3);

    // Glowing ground disc
    const discGeo = new THREE.CircleGeometry(2.1, 48);
    const discMat = new THREE.MeshBasicMaterial({
      color: colors.secondary,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = Math.PI / 2;
    floorGroup.add(disc);

    scene.add(floorGroup);

    // --- 5. PROCEDURAL 3D CHIBI CAT SPIRIT MASCOT ---
    const mascotGroup = new THREE.Group();
    mascotGroup.position.set(0, 0, 0);

    // Base body material: Luminous spirit glow with clearcoat & transmission
    const spiritMaterial = new THREE.MeshPhysicalMaterial({
      color: colors.primary,
      emissive: colors.glow,
      emissiveIntensity: 0.45,
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      transmission: 0.25,
      ior: 1.45,
      transparent: true,
      opacity: 0.96,
    });

    const innerEarMaterial = new THREE.MeshStandardMaterial({
      color: colors.innerEar,
      emissive: colors.secondary,
      emissiveIntensity: 0.3,
      roughness: 0.4,
    });

    // 5.1 Head (Smooth stylized chibi cat skull)
    const headGeo = new THREE.SphereGeometry(1.15, 32, 32);
    headGeo.scale(1.18, 1.02, 1.05);
    const head = new THREE.Mesh(headGeo, spiritMaterial);
    head.position.set(0, 0.45, 0);
    mascotGroup.add(head);

    // 5.2 Triangular Cat Ears (Left & Right)
    const createEar = (isRight: boolean) => {
      const earGroup = new THREE.Group();
      
      // Outer Ear (Triangular cone)
      const earGeo = new THREE.ConeGeometry(0.48, 0.85, 4);
      earGeo.scale(1.0, 1.0, 0.45);
      const outerEar = new THREE.Mesh(earGeo, spiritMaterial);
      outerEar.rotation.y = Math.PI / 4;
      earGroup.add(outerEar);

      // Inner Ear (Darker contrast inset)
      const innerGeo = new THREE.ConeGeometry(0.32, 0.65, 4);
      innerGeo.scale(1.0, 1.0, 0.35);
      const innerEar = new THREE.Mesh(innerGeo, innerEarMaterial);
      innerEar.rotation.y = Math.PI / 4;
      innerEar.position.set(0, -0.05, 0.08);
      earGroup.add(innerEar);

      const sign = isRight ? 1 : -1;
      earGroup.position.set(sign * 0.78, 1.35, 0.05);
      earGroup.rotation.z = sign * -0.42;
      earGroup.rotation.x = -0.15;
      return earGroup;
    };

    const leftEar = createEar(false);
    const rightEar = createEar(true);
    mascotGroup.add(leftEar);
    mascotGroup.add(rightEar);

    // 5.3 Curled Spirit Flame Crest (On top of head)
    const flameCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.25, 0.1),
      new THREE.Vector3(0.08, 1.55, 0.12),
      new THREE.Vector3(0.18, 1.82, 0.08),
      new THREE.Vector3(0.05, 2.05, 0.02),
      new THREE.Vector3(-0.08, 2.18, 0.0),
    ]);
    const flameGeo = new THREE.TubeGeometry(flameCurve, 24, 0.16, 12, false);
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: colors.primary,
      emissiveIntensity: 0.9,
      roughness: 0.1,
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    mascotGroup.add(flame);

    // Flame apex bright spirit droplet
    const tipGeo = new THREE.SphereGeometry(0.14, 16, 16);
    tipGeo.scale(0.8, 1.2, 0.8);
    const tip = new THREE.Mesh(tipGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    tip.position.set(-0.08, 2.18, 0);
    mascotGroup.add(tip);

    // 5.4 Big Anime Eyes (Almond shaped glossy dark glass with reflections)
    const createEye = (isRight: boolean) => {
      const eyeGroup = new THREE.Group();

      // Eye base (Obsidian dark navy sphere)
      const eyeGeo = new THREE.SphereGeometry(0.28, 24, 24);
      eyeGeo.scale(1.0, 1.25, 0.45);
      const eyeMat = new THREE.MeshPhysicalMaterial({
        color: 0x010814,
        roughness: 0.05,
        clearcoat: 1.0,
      });
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eyeGroup.add(eye);

      // Lower Iris Glow (Cyan crescent)
      const irisGeo = new THREE.TorusGeometry(0.14, 0.035, 8, 16, Math.PI * 0.9);
      const irisMat = new THREE.MeshBasicMaterial({ color: colors.glow });
      const iris = new THREE.Mesh(irisGeo, irisMat);
      iris.rotation.z = Math.PI * 0.05;
      iris.position.set(0, -0.06, 0.09);
      eyeGroup.add(iris);

      // Primary Catchlight (Big upper-left white highlight)
      const catch1Geo = new THREE.SphereGeometry(0.08, 16, 16);
      const catchMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const catch1 = new THREE.Mesh(catch1Geo, catchMat);
      catch1.position.set(-0.07, 0.12, 0.11);
      eyeGroup.add(catch1);

      // Secondary Catchlight (Smaller lower-right highlight)
      const catch2Geo = new THREE.SphereGeometry(0.045, 12, 12);
      const catch2 = new THREE.Mesh(catch2Geo, catchMat);
      catch2.position.set(0.07, -0.09, 0.11);
      eyeGroup.add(catch2);

      const sign = isRight ? 1 : -1;
      eyeGroup.position.set(sign * 0.52, 0.46, 1.05);
      eyeGroup.rotation.y = sign * 0.18;
      eyeGroup.rotation.z = sign * -0.04;
      return eyeGroup;
    };

    const leftEye = createEye(false);
    const rightEye = createEye(true);
    mascotGroup.add(leftEye);
    mascotGroup.add(rightEye);

    // 5.5 Cute Smile (:3)
    const mouthCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.08, 0.22, 1.15),
      new THREE.Vector3(0, 0.18, 1.18),
      new THREE.Vector3(0.08, 0.22, 1.15),
    ]);
    const mouthGeo = new THREE.TubeGeometry(mouthCurve, 12, 0.018, 8, false);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x021324 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mascotGroup.add(mouth);

    // 5.6 Chibi Torso (Smooth rounded pear body)
    const bodyGeo = new THREE.SphereGeometry(0.85, 32, 32);
    bodyGeo.scale(0.92, 1.12, 0.88);
    const body = new THREE.Mesh(bodyGeo, spiritMaterial);
    body.position.set(0, -0.55, -0.05);
    mascotGroup.add(body);

    // 5.7 Glowing Chest/Belly Emblem (Luminous lighter patch)
    const emblemGeo = new THREE.SphereGeometry(0.38, 24, 24);
    emblemGeo.scale(0.8, 1.15, 0.25);
    const emblemMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: colors.glow,
      emissiveIntensity: 0.85,
      roughness: 0.2,
    });
    const emblem = new THREE.Mesh(emblemGeo, emblemMat);
    emblem.position.set(0, -0.48, 0.68);
    mascotGroup.add(emblem);

    // 5.8 Cute Arms / Stubby Paws
    const createArm = (isRight: boolean) => {
      const armGeo = new THREE.CapsuleGeometry(0.18, 0.42, 8, 16);
      const arm = new THREE.Mesh(armGeo, spiritMaterial);
      const sign = isRight ? 1 : -1;
      arm.position.set(sign * 0.74, -0.52, 0.18);
      arm.rotation.z = sign * -0.45;
      arm.rotation.x = 0.25;
      return arm;
    };
    mascotGroup.add(createArm(false));
    mascotGroup.add(createArm(true));

    // 5.9 Cute Rounded Feet
    const createFoot = (isRight: boolean) => {
      const footGeo = new THREE.SphereGeometry(0.24, 16, 16);
      footGeo.scale(1.0, 0.65, 1.25);
      const foot = new THREE.Mesh(footGeo, spiritMaterial);
      const sign = isRight ? 1 : -1;
      foot.position.set(sign * 0.38, -1.35, 0.15);
      return foot;
    };
    mascotGroup.add(createFoot(false));
    mascotGroup.add(createFoot(true));

    scene.add(mascotGroup);

    // --- 6. INTERACTION & ANIMATION LOOP ---
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let isSpinning = false;
    let spinProgress = 0;

    const handleMouseMove = (event: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const normX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = normX;
      mouseY = normY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleClick = () => {
      if (!isSpinning) {
        isSpinning = true;
        spinProgress = 0;
        if (onMascotClick) onMascotClick();
      }
    };

    container.addEventListener('click', handleClick);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // 1. Hyperspace stars moving forward
      const positions = starGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < starCount; i++) {
        let z = positions[i * 6 + 2] + starSpeeds[i] * 12 * delta;
        if (z > 6.0) {
          z = -14.0;
        }
        positions[i * 6 + 2] = z;
        positions[i * 6 + 5] = z - (0.6 + starSpeeds[i] * 4.0);
      }
      starGeometry.attributes.position.needsUpdate = true;

      // 2. Holographic floor rings rotation & pulse
      ring1.rotation.z += 0.35 * delta;
      ring2.rotation.z -= 0.5 * delta;
      ring3.rotation.z += 0.8 * delta;

      const ringPulse = 1.0 + Math.sin(elapsedTime * 2.5) * 0.04;
      ring1.scale.set(ringPulse, ringPulse, 1);

      // 3. Mascot idle breathing & floating
      const floatY = Math.sin(elapsedTime * 1.8) * 0.12;
      mascotGroup.position.y = floatY;

      // Flame subtle wave
      flame.rotation.z = Math.sin(elapsedTime * 3.2) * 0.08;
      tip.position.x = -0.08 + Math.sin(elapsedTime * 3.2) * 0.06;

      // 4. Mouse tracking (Head & body smoothly look at user)
      if (interactive && !isSpinning) {
        targetRotationY = mouseX * 0.35;
        targetRotationX = -mouseY * 0.22;
        mascotGroup.rotation.y += (targetRotationY - mascotGroup.rotation.y) * 0.08;
        mascotGroup.rotation.x += (targetRotationX - mascotGroup.rotation.x) * 0.08;
      }

      // 5. Click reaction: 360 spin + happy hop
      if (isSpinning) {
        spinProgress += delta * 6.5;
        mascotGroup.rotation.y += delta * 12.0;
        mascotGroup.position.y = floatY + Math.sin(spinProgress) * 0.45;

        if (spinProgress >= Math.PI * 2) {
          isSpinning = false;
          mascotGroup.rotation.y = targetRotationY;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', handleClick);

      renderer.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      ring1Geo.dispose();
      ring2Geo.dispose();
      ring3Geo.dispose();
      headGeo.dispose();
      spiritMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [element, interactive, onMascotClick]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full cursor-grab active:cursor-grabbing select-none ${className}`}
    />
  );
}
