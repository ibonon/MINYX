import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';

// Node.js Web API polyfill for GLTFExporter
if (typeof global.FileReader === 'undefined') {
  global.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buffer) => {
        this.result = buffer;
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this });
      }).catch((err) => {
        if (this.onerror) this.onerror(err);
      });
    }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((buffer) => {
        const base64 = Buffer.from(buffer).toString('base64');
        this.result = `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this });
      }).catch((err) => {
        if (this.onerror) this.onerror(err);
      });
    }
  };
}

console.log('Generating MINYX 3D Companion GLB model matching user reference...');

// Root scene
const scene = new THREE.Scene();
scene.name = 'MinyxCompanionScene';

const companionGroup = new THREE.Group();
companionGroup.name = 'MinyxCompanion';

// ============================================================
// 1. MATERIALS (Matching the luminous cyan bioluminescent spirit)
// ============================================================

// Primary Body Material: Luminous cyan spirit skin
const bodyMaterial = new THREE.MeshStandardMaterial({
  name: 'SpiritBodyMaterial',
  color: new THREE.Color(0x38bdf8),
  emissive: new THREE.Color(0x00c8ff),
  emissiveIntensity: 0.55,
  roughness: 0.22,
  metalness: 0.08,
});

// Glowing Chest Emblem Material: Radiant white-cyan teardrop
const emblemMaterial = new THREE.MeshStandardMaterial({
  name: 'SpiritEmblemMaterial',
  color: new THREE.Color(0xffffff),
  emissive: new THREE.Color(0x7dd3fc),
  emissiveIntensity: 1.2,
  roughness: 0.1,
  metalness: 0.05,
});

// Inner Ear / Accent Material
const innerEarMaterial = new THREE.MeshStandardMaterial({
  name: 'InnerEarMaterial',
  color: new THREE.Color(0x0284c7),
  emissive: new THREE.Color(0x0369a1),
  emissiveIntensity: 0.4,
  roughness: 0.35,
  metalness: 0.05,
});

// Eye Obsidian Glass Material
const eyeGlassMaterial = new THREE.MeshStandardMaterial({
  name: 'EyeGlassMaterial',
  color: new THREE.Color(0x020b18),
  emissive: new THREE.Color(0x010814),
  emissiveIntensity: 0.2,
  roughness: 0.04,
  metalness: 0.15,
});

// Eye Catchlight (White Reflection) Material
const catchlightMaterial = new THREE.MeshBasicMaterial({
  name: 'CatchlightMaterial',
  color: new THREE.Color(0xffffff),
});

// Eye Iris Luminous Crescent Material
const irisGlowMaterial = new THREE.MeshBasicMaterial({
  name: 'IrisGlowMaterial',
  color: new THREE.Color(0x00e5ff),
});

// Mouth & Eyebrows Dark Line Material
const darkLineMaterial = new THREE.MeshStandardMaterial({
  name: 'DarkLineMaterial',
  color: new THREE.Color(0x031628),
  roughness: 0.5,
  metalness: 0.1,
});

// ============================================================
// 2. GEOMETRY CREATION (Strictly following the user reference)
// ============================================================

// 2.1 HEAD: Large round baby head, soft and smooth
const headGeo = new THREE.SphereGeometry(1.22, 48, 48);
headGeo.scale(1.18, 1.04, 1.10);
const headMesh = new THREE.Mesh(headGeo, bodyMaterial);
headMesh.name = 'Head';
headMesh.position.set(0, 0.45, 0);
companionGroup.add(headMesh);

// 2.2 TOP CREST: Curled Teardrop / Flame Spirit Tuft on top of head
// Built with a smooth tapered CatmullRom spline tube + teardrop cap
const crestCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 1.35, 0.08),
  new THREE.Vector3(0.06, 1.65, 0.09),
  new THREE.Vector3(0.18, 1.95, 0.06),
  new THREE.Vector3(0.15, 2.20, 0.02),
  new THREE.Vector3(0.02, 2.38, -0.02),
]);
const crestGeo = new THREE.TubeGeometry(crestCurve, 32, 0.20, 16, false);
const crestMesh = new THREE.Mesh(crestGeo, bodyMaterial);
crestMesh.name = 'HeadCrest';
companionGroup.add(crestMesh);

// Crest Apex Tip (Gently tapering to a teardrop point)
const crestTipGeo = new THREE.SphereGeometry(0.18, 24, 24);
crestTipGeo.scale(0.85, 1.35, 0.85);
const crestTip = new THREE.Mesh(crestTipGeo, bodyMaterial);
crestTip.name = 'HeadCrestTip';
crestTip.position.set(0.02, 2.36, -0.02);
companionGroup.add(crestTip);

// 2.3 EARS: Cute elf / water-drop pointed ears pointing slightly outward and downward
const createEar = (isRight) => {
  const earGroup = new THREE.Group();
  earGroup.name = isRight ? 'RightEarGroup' : 'LeftEarGroup';

  // Outer ear teardrop/leaf geometry
  const earGeo = new THREE.ConeGeometry(0.46, 0.88, 16);
  earGeo.scale(1.0, 1.0, 0.42);
  const outerEar = new THREE.Mesh(earGeo, bodyMaterial);
  outerEar.name = isRight ? 'RightOuterEar' : 'LeftOuterEar';
  outerEar.rotation.y = Math.PI / 4;
  earGroup.add(outerEar);

  // Inner ear inset
  const innerGeo = new THREE.ConeGeometry(0.32, 0.68, 16);
  innerGeo.scale(1.0, 1.0, 0.32);
  const innerEar = new THREE.Mesh(innerGeo, innerEarMaterial);
  innerEar.name = isRight ? 'RightInnerEar' : 'LeftInnerEar';
  innerEar.position.set(0, -0.04, 0.07);
  earGroup.add(innerEar);

  const sign = isRight ? 1 : -1;
  earGroup.position.set(sign * 1.25, 0.42, -0.02);
  earGroup.rotation.z = sign * -1.35; // Pointing outward/downward
  earGroup.rotation.x = -0.15;
  earGroup.rotation.y = sign * 0.20;

  return earGroup;
};
companionGroup.add(createEar(false));
companionGroup.add(createEar(true));

// 2.4 EYES: Large glossy dark anime eyes with dual circular catchlights
const createEye = (isRight) => {
  const eyeGroup = new THREE.Group();
  eyeGroup.name = isRight ? 'RightEyeGroup' : 'LeftEyeGroup';

  // Eye base (Obsidian dark navy sphere)
  const eyeBaseGeo = new THREE.SphereGeometry(0.33, 32, 32);
  eyeBaseGeo.scale(1.0, 1.22, 0.42);
  const eyeBase = new THREE.Mesh(eyeBaseGeo, eyeGlassMaterial);
  eyeBase.name = isRight ? 'RightEyeBase' : 'LeftEyeBase';
  eyeGroup.add(eyeBase);

  // Lower Iris Luminous Crescent
  const irisGeo = new THREE.TorusGeometry(0.16, 0.04, 8, 24, Math.PI * 0.95);
  const iris = new THREE.Mesh(irisGeo, irisGlowMaterial);
  iris.name = isRight ? 'RightIris' : 'LeftIris';
  iris.rotation.z = Math.PI * 0.05;
  iris.position.set(0, -0.08, 0.11);
  eyeGroup.add(iris);

  // Primary Catchlight (Large round reflection at top-right, as in reference)
  const catch1Geo = new THREE.SphereGeometry(0.095, 16, 16);
  const catch1 = new THREE.Mesh(catch1Geo, catchlightMaterial);
  catch1.name = isRight ? 'RightCatchlight1' : 'LeftCatchlight1';
  catch1.position.set(0.08, 0.12, 0.13);
  eyeGroup.add(catch1);

  // Secondary Catchlight (Smaller reflection at bottom-left, as in reference)
  const catch2Geo = new THREE.SphereGeometry(0.048, 12, 12);
  const catch2 = new THREE.Mesh(catch2Geo, catchlightMaterial);
  catch2.name = isRight ? 'RightCatchlight2' : 'LeftCatchlight2';
  catch2.position.set(-0.08, -0.10, 0.13);
  eyeGroup.add(catch2);

  const sign = isRight ? 1 : -1;
  eyeGroup.position.set(sign * 0.54, 0.46, 1.08);
  eyeGroup.rotation.y = sign * 0.16;
  eyeGroup.rotation.z = sign * -0.04;

  return eyeGroup;
};
companionGroup.add(createEye(false));
companionGroup.add(createEye(true));

// 2.5 EYEBROWS & MOUTH
// Eyebrows
const createEyebrow = (isRight) => {
  const browCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.16, 0.0, 0.0),
    new THREE.Vector3(0.0, 0.04, 0.02),
    new THREE.Vector3(0.16, -0.02, 0.0),
  ]);
  const browGeo = new THREE.TubeGeometry(browCurve, 12, 0.016, 8, false);
  const brow = new THREE.Mesh(browGeo, darkLineMaterial);
  const sign = isRight ? 1 : -1;
  brow.position.set(sign * 0.54, 0.90, 1.02);
  brow.rotation.z = sign * 0.12;
  return brow;
};
companionGroup.add(createEyebrow(false));
companionGroup.add(createEyebrow(true));

// Charming Smiling Mouth (:3 curve from reference)
const mouthCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.14, 0.18, 1.14),
  new THREE.Vector3(-0.04, 0.12, 1.18),
  new THREE.Vector3(0.0, 0.13, 1.18),
  new THREE.Vector3(0.04, 0.12, 1.18),
  new THREE.Vector3(0.14, 0.18, 1.14),
]);
const mouthGeo = new THREE.TubeGeometry(mouthCurve, 16, 0.022, 8, false);
const mouth = new THREE.Mesh(mouthGeo, darkLineMaterial);
mouth.name = 'Mouth';
companionGroup.add(mouth);

// 2.6 TORSO & BELLY: Smooth pear-shaped chibi body
const bodyGeo = new THREE.SphereGeometry(0.88, 36, 36);
bodyGeo.scale(0.95, 1.18, 0.90);
const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
bodyMesh.name = 'Torso';
bodyMesh.position.set(0, -0.65, -0.02);
companionGroup.add(bodyMesh);

// 2.7 CHEST SYMBOL: Luminous Water-Drop Emblem (The signature symbol from the user's reference!)
// Modeled with an inverted cone + sphere for a clean parametric teardrop
const dropGroup = new THREE.Group();
dropGroup.name = 'WaterDropEmblemGroup';

const dropLowerGeo = new THREE.SphereGeometry(0.24, 24, 24);
dropLowerGeo.scale(1.0, 1.0, 0.35);
const dropLower = new THREE.Mesh(dropLowerGeo, emblemMaterial);
dropLower.position.set(0, -0.08, 0);
dropGroup.add(dropLower);

const dropUpperGeo = new THREE.ConeGeometry(0.23, 0.36, 24);
dropUpperGeo.scale(1.0, 1.0, 0.35);
const dropUpper = new THREE.Mesh(dropUpperGeo, emblemMaterial);
dropUpper.position.set(0, 0.10, 0);
dropGroup.add(dropUpper);

dropGroup.position.set(0, -0.52, 0.76);
dropGroup.rotation.x = -0.15;
companionGroup.add(dropGroup);

// 2.8 ARMS: Two stubby rounded arms resting downwards
const createArm = (isRight) => {
  const armGeo = new THREE.CapsuleGeometry(0.17, 0.46, 12, 16);
  const arm = new THREE.Mesh(armGeo, bodyMaterial);
  arm.name = isRight ? 'RightArm' : 'LeftArm';
  const sign = isRight ? 1 : -1;
  arm.position.set(sign * 0.74, -0.65, 0.08);
  arm.rotation.z = sign * -0.28;
  arm.rotation.x = 0.15;
  return arm;
};
companionGroup.add(createArm(false));
companionGroup.add(createArm(true));

// 2.9 LEGS & FEET: Cute rounded stubby chibi feet
const createLeg = (isRight) => {
  const legGeo = new THREE.CapsuleGeometry(0.20, 0.38, 12, 16);
  const leg = new THREE.Mesh(legGeo, bodyMaterial);
  leg.name = isRight ? 'RightLeg' : 'LeftLeg';
  const sign = isRight ? 1 : -1;
  leg.position.set(sign * 0.32, -1.35, 0.02);
  leg.rotation.z = sign * -0.05;
  return leg;
};
companionGroup.add(createLeg(false));
companionGroup.add(createLeg(true));

// 2.10 CONCENTRIC RINGS PLATFORM: Floor holographic rings from reference
const floorRingsGroup = new THREE.Group();
floorRingsGroup.name = 'FloorRingsGroup';
floorRingsGroup.position.set(0, -1.60, 0);

const ringMaterial = new THREE.MeshBasicMaterial({
  name: 'HolographicRingMaterial',
  color: new THREE.Color(0x00d4ff),
  side: THREE.DoubleSide,
});

[1.6, 1.25, 0.9, 0.6].forEach((radius, i) => {
  const ringGeo = new THREE.RingGeometry(radius, radius + 0.025, 64);
  const ringMesh = new THREE.Mesh(ringGeo, ringMaterial);
  ringMesh.rotation.x = Math.PI / 2;
  floorRingsGroup.add(ringMesh);
});

// Orbital node dots along outer ring
for (let i = 0; i < 6; i++) {
  const angle = (i / 6) * Math.PI * 2;
  const dotGeo = new THREE.SphereGeometry(0.045, 12, 12);
  const dotMesh = new THREE.Mesh(dotGeo, emblemMaterial);
  dotMesh.position.set(Math.cos(angle) * 1.6, 0, Math.sin(angle) * 1.6);
  floorRingsGroup.add(dotMesh);
}

companionGroup.add(floorRingsGroup);

scene.add(companionGroup);

// ============================================================
// 3. EXPORT TO BINARY GLB
// ============================================================
console.log('Exporting scene to binary GLB...');

const exporter = new GLTFExporter();
exporter.parse(
  scene,
  (gltf) => {
    const buffer = Buffer.from(gltf);
    const targetPath = path.resolve('apps/web/public/models/companion.glb');
    
    // Ensure parent directory exists
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, buffer);

    console.log(`GLB generated successfully at: ${targetPath}`);
    console.log(`File size: ${(buffer.length / 1024).toFixed(2)} KB`);
  },
  (error) => {
    console.error('Error exporting GLB:', error);
    process.exit(1);
  },
  { binary: true }
);
