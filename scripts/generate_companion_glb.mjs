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

console.log('Generating high-fidelity MINYX 3D Mascot matching minyx-hero.jpg reference...');

const scene = new THREE.Scene();
scene.name = 'MinyxCompanionScene';

const companionGroup = new THREE.Group();
companionGroup.name = 'MinyxCompanion';

// ============================================================
// 1. MATERIALS (Rich cyan bioluminescence matching minyx-hero.jpg)
// ============================================================

// Body: Vibrant cyan water spirit (rich color, subtle emissive so it doesn't wash out)
const bodyMaterial = new THREE.MeshStandardMaterial({
  name: 'SpiritBodyMaterial',
  color: new THREE.Color(0x0ea5e9), // rich sky-500 cyan
  emissive: new THREE.Color(0x0369a1), // deep blue inner glow
  emissiveIntensity: 0.28,
  roughness: 0.28,
  metalness: 0.08,
});

// Inner Ear: Deep sapphire cyan
const innerEarMaterial = new THREE.MeshStandardMaterial({
  name: 'InnerEarMaterial',
  color: new THREE.Color(0x0284c7),
  emissive: new THREE.Color(0x075985),
  emissiveIntensity: 0.25,
  roughness: 0.35,
  metalness: 0.05,
});

// Chest Emblem: Luminous aqua-white teardrop
const emblemMaterial = new THREE.MeshStandardMaterial({
  name: 'SpiritEmblemMaterial',
  color: new THREE.Color(0xbbf7d0),
  emissive: new THREE.Color(0x38bdf8),
  emissiveIntensity: 1.2,
  roughness: 0.12,
  metalness: 0.04,
});

// Eyes: Deep obsidian glass
const eyeGlassMaterial = new THREE.MeshStandardMaterial({
  name: 'EyeGlassMaterial',
  color: new THREE.Color(0x020817), // very dark navy/black
  roughness: 0.04,
  metalness: 0.15,
});

// Eye Catchlight: Sparkling crisp white reflection
const catchlightMaterial = new THREE.MeshBasicMaterial({
  name: 'CatchlightMaterial',
  color: new THREE.Color(0xffffff),
});

// Lower Iris Glow: Electric aqua crescent
const irisGlowMaterial = new THREE.MeshBasicMaterial({
  name: 'IrisGlowMaterial',
  color: new THREE.Color(0x00f0ff),
});

// Mouth & Eyebrows: Deep dark ink
const darkLineMaterial = new THREE.MeshBasicMaterial({
  name: 'DarkLineMaterial',
  color: new THREE.Color(0x03182b),
});

// ============================================================
// 2. ANATOMY & GEOMETRY (Exact matching to minyx-hero.jpg)
// ============================================================

// 2.1 HEAD: Round adorable chibi head
const headGeo = new THREE.SphereGeometry(1.18, 64, 64);
headGeo.scale(1.16, 1.02, 1.08); // Slightly wider cheeks
const headMesh = new THREE.Mesh(headGeo, bodyMaterial);
headMesh.name = 'Head';
headMesh.position.set(0, 0.42, 0);
companionGroup.add(headMesh);

// 2.2 TOP CREST: Gracefully curved flame tuft on top of head
const crestCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 1.35, 0.06),
  new THREE.Vector3(0.08, 1.65, 0.07),
  new THREE.Vector3(0.20, 1.95, 0.04),
  new THREE.Vector3(0.16, 2.22, 0.01),
  new THREE.Vector3(0.02, 2.42, -0.02),
]);
const crestGeo = new THREE.TubeGeometry(crestCurve, 32, 0.19, 16, false);
const crestMesh = new THREE.Mesh(crestGeo, bodyMaterial);
crestMesh.name = 'HeadCrest';
companionGroup.add(crestMesh);

// Crest Tip teardrop
const crestTipGeo = new THREE.SphereGeometry(0.17, 24, 24);
crestTipGeo.scale(0.85, 1.35, 0.85);
const crestTip = new THREE.Mesh(crestTipGeo, bodyMaterial);
crestTip.name = 'HeadCrestTip';
crestTip.position.set(0.02, 2.40, -0.02);
companionGroup.add(crestTip);

// 2.3 EARS: Cute pointed cat/elf ears
const createEar = (isRight) => {
  const earGroup = new THREE.Group();
  earGroup.name = isRight ? 'RightEarGroup' : 'LeftEarGroup';

  // Outer ear
  const earGeo = new THREE.ConeGeometry(0.44, 0.88, 24);
  earGeo.scale(1.0, 1.0, 0.40);
  const outerEar = new THREE.Mesh(earGeo, bodyMaterial);
  outerEar.rotation.y = Math.PI / 4;
  earGroup.add(outerEar);

  // Inner ear
  const innerGeo = new THREE.ConeGeometry(0.30, 0.68, 24);
  innerGeo.scale(1.0, 1.0, 0.30);
  const innerEar = new THREE.Mesh(innerGeo, innerEarMaterial);
  innerEar.position.set(0, -0.03, 0.08);
  earGroup.add(innerEar);

  const sign = isRight ? 1 : -1;
  earGroup.position.set(sign * 1.24, 0.46, -0.02);
  earGroup.rotation.z = sign * -1.32;
  earGroup.rotation.x = -0.12;
  earGroup.rotation.y = sign * 0.22;

  return earGroup;
};
companionGroup.add(createEar(false));
companionGroup.add(createEar(true));

// 2.4 EYES: Large anime eyes proudly positioned on head front surface
// Head radius in Z at eye level is ~1.18. We place eyes at Z=1.16-1.28 so they are prominently visible.
const createEye = (isRight) => {
  const eyeGroup = new THREE.Group();
  eyeGroup.name = isRight ? 'RightEyeGroup' : 'LeftEyeGroup';

  // Dark obsidian eye base
  const eyeBaseGeo = new THREE.SphereGeometry(0.35, 32, 32);
  eyeBaseGeo.scale(1.0, 1.25, 0.45);
  const eyeBase = new THREE.Mesh(eyeBaseGeo, eyeGlassMaterial);
  eyeGroup.add(eyeBase);

  // Lower Iris Crescent (electric cyan)
  const irisGeo = new THREE.TorusGeometry(0.18, 0.045, 12, 32, Math.PI * 0.95);
  const iris = new THREE.Mesh(irisGeo, irisGlowMaterial);
  iris.rotation.z = Math.PI * 0.04;
  iris.position.set(0, -0.10, 0.15);
  eyeGroup.add(iris);

  // Primary Catchlight (Large round reflection at top-right)
  const catch1Geo = new THREE.SphereGeometry(0.10, 16, 16);
  const catch1 = new THREE.Mesh(catch1Geo, catchlightMaterial);
  catch1.position.set(0.085, 0.13, 0.17);
  eyeGroup.add(catch1);

  // Secondary Catchlight (Smaller reflection at bottom-left)
  const catch2Geo = new THREE.SphereGeometry(0.052, 12, 12);
  const catch2 = new THREE.Mesh(catch2Geo, catchlightMaterial);
  catch2.position.set(-0.085, -0.11, 0.17);
  eyeGroup.add(catch2);

  const sign = isRight ? 1 : -1;
  // Positioned directly on head surface
  eyeGroup.position.set(sign * 0.52, 0.44, 1.18);
  eyeGroup.rotation.y = sign * 0.20;
  eyeGroup.rotation.x = -0.04;

  return eyeGroup;
};
companionGroup.add(createEye(false));
companionGroup.add(createEye(true));

// 2.5 EYEBROWS & MOUTH
const createEyebrow = (isRight) => {
  const browCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.16, 0.0, 0.0),
    new THREE.Vector3(0.0, 0.04, 0.02),
    new THREE.Vector3(0.16, -0.02, 0.0),
  ]);
  const browGeo = new THREE.TubeGeometry(browCurve, 12, 0.022, 8, false);
  const brow = new THREE.Mesh(browGeo, darkLineMaterial);
  const sign = isRight ? 1 : -1;
  brow.position.set(sign * 0.52, 0.88, 1.08);
  brow.rotation.z = sign * 0.12;
  return brow;
};
companionGroup.add(createEyebrow(false));
companionGroup.add(createEyebrow(true));

// Charming Cat Smile (:3 curve)
const mouthCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.16, 0.05, 0.0),
  new THREE.Vector3(-0.06, -0.03, 0.02),
  new THREE.Vector3(0.0, -0.01, 0.02),
  new THREE.Vector3(0.06, -0.03, 0.02),
  new THREE.Vector3(0.16, 0.05, 0.0),
]);
const mouthGeo = new THREE.TubeGeometry(mouthCurve, 20, 0.026, 8, false);
const mouth = new THREE.Mesh(mouthGeo, darkLineMaterial);
mouth.name = 'Mouth';
mouth.position.set(0, 0.12, 1.26);
companionGroup.add(mouth);

// 2.6 TORSO & BELLY
const bodyGeo = new THREE.SphereGeometry(0.86, 40, 40);
bodyGeo.scale(0.96, 1.18, 0.90);
const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
bodyMesh.name = 'Torso';
bodyMesh.position.set(0, -0.66, -0.02);
companionGroup.add(bodyMesh);

// 2.7 CHEST WATER-DROP EMBLEM
const dropGroup = new THREE.Group();
dropGroup.name = 'WaterDropEmblemGroup';

const dropLowerGeo = new THREE.SphereGeometry(0.24, 24, 24);
dropLowerGeo.scale(1.0, 1.0, 0.40);
const dropLower = new THREE.Mesh(dropLowerGeo, emblemMaterial);
dropLower.position.set(0, -0.08, 0);
dropGroup.add(dropLower);

const dropUpperGeo = new THREE.ConeGeometry(0.23, 0.38, 24);
dropUpperGeo.scale(1.0, 1.0, 0.40);
const dropUpper = new THREE.Mesh(dropUpperGeo, emblemMaterial);
dropUpper.position.set(0, 0.11, 0);
dropGroup.add(dropUpper);

dropGroup.position.set(0, -0.52, 0.78);
dropGroup.rotation.x = -0.15;
companionGroup.add(dropGroup);

// 2.8 ARMS
const createArm = (isRight) => {
  const armGeo = new THREE.CapsuleGeometry(0.16, 0.46, 12, 16);
  const arm = new THREE.Mesh(armGeo, bodyMaterial);
  arm.name = isRight ? 'RightArm' : 'LeftArm';
  const sign = isRight ? 1 : -1;
  arm.position.set(sign * 0.72, -0.66, 0.08);
  arm.rotation.z = sign * -0.28;
  arm.rotation.x = 0.14;
  return arm;
};
companionGroup.add(createArm(false));
companionGroup.add(createArm(true));

// 2.9 LEGS & FEET
const createLeg = (isRight) => {
  const legGeo = new THREE.CapsuleGeometry(0.19, 0.38, 12, 16);
  const leg = new THREE.Mesh(legGeo, bodyMaterial);
  leg.name = isRight ? 'RightLeg' : 'LeftLeg';
  const sign = isRight ? 1 : -1;
  leg.position.set(sign * 0.32, -1.34, 0.02);
  leg.rotation.z = sign * -0.04;
  return leg;
};
companionGroup.add(createLeg(false));
companionGroup.add(createLeg(true));

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
    
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, buffer);

    // Also copy directly to mobile assets
    const mobilePath = path.resolve('apps/mobile/assets/models/companion.glb');
    fs.mkdirSync(path.dirname(mobilePath), { recursive: true });
    fs.writeFileSync(mobilePath, buffer);

    console.log(`GLB generated successfully at: ${targetPath}`);
    console.log(`GLB copied to mobile assets: ${mobilePath}`);
    console.log(`File size: ${(buffer.length / 1024).toFixed(2)} KB`);
  },
  (error) => {
    console.error('Error exporting GLB:', error);
    process.exit(1);
  },
  { binary: true }
);
