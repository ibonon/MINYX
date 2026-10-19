import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

interface Companion3DViewProps {
  element?: string;
  onInteract?: () => void;
}

export default function Companion3DView({ element = 'Eau', onInteract }: Companion3DViewProps) {
  const [loading, setLoading] = useState(true);

  // High-performance Three.js WebGL canvas embedded for React Native
  const threeHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body, html { width: 100%; height: 100%; overflow: hidden; background: #030712; touch-action: none; }
          #canvas-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
      </head>
      <body>
        <div id="canvas-container"></div>
        <script>
          const container = document.getElementById('canvas-container');
          const width = window.innerWidth;
          const height = window.innerHeight;

          const scene = new THREE.Scene();
          const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
          camera.position.set(0, 0.3, 4.8);

          const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
          renderer.setSize(width, height);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.35;
          container.appendChild(renderer.domElement);

          // Lights
          scene.add(new THREE.AmbientLight(0xffffff, 1.4));
          const keyLight = new THREE.DirectionalLight(0x7dd3fc, 3.2);
          keyLight.position.set(3, 4, 4);
          scene.add(keyLight);

          const rimLight = new THREE.DirectionalLight(0x00f0ff, 4.5);
          rimLight.position.set(-3.5, 1.5, -3);
          scene.add(rimLight);

          const floorLight = new THREE.PointLight(0x00d4ff, 3.5, 7);
          floorLight.position.set(0, -1.8, 0.5);
          scene.add(floorLight);

          // Holographic Pedestal
          const floorGroup = new THREE.Group();
          floorGroup.position.set(0, -1.45, 0);
          floorGroup.rotation.x = Math.PI / 2;

          const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });
          const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });

          floorGroup.add(new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.018, 16, 64), ringMat1));
          floorGroup.add(new THREE.Mesh(new THREE.TorusGeometry(1.30, 0.015, 16, 64), ringMat2));
          floorGroup.add(new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.012, 16, 48), ringMat1));
          floorGroup.add(new THREE.Mesh(new THREE.TorusGeometry(0.60, 0.010, 16, 36), ringMat2));

          const dotMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const dot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), dotMat);
            dot.position.set(Math.cos(angle) * 1.65, Math.sin(angle) * 1.65, 0);
            floorGroup.add(dot);
          }
          scene.add(floorGroup);

          // Companion Model Group
          let modelGroup = new THREE.Group();
          scene.add(modelGroup);

          // Load GLB model from local app server or generate procedural high-poly fallback
          const loader = new THREE.GLTFLoader();
          const modelUrl = 'http://10.0.2.2:3000/models/companion.glb'; // Android emulator localhost or public web

          const buildSculpt = () => {
            const bodyMat = new THREE.MeshStandardMaterial({
              color: 0x38bdf8,
              emissive: 0x0284c7,
              emissiveIntensity: 0.55,
              roughness: 0.22,
              metalness: 0.08,
            });

            // Head
            const head = new THREE.Mesh(new THREE.SphereGeometry(1.15, 48, 48), bodyMat);
            head.scale.set(1.18, 1.05, 1.10);
            head.position.y = 0.45;
            modelGroup.add(head);

            // Crest
            const crestCurve = new THREE.CatmullRomCurve3([
              new THREE.Vector3(0, 1.35, 0.08),
              new THREE.Vector3(0.06, 1.65, 0.09),
              new THREE.Vector3(0.18, 1.95, 0.06),
              new THREE.Vector3(0.15, 2.20, 0.02),
              new THREE.Vector3(0.02, 2.38, -0.02)
            ]);
            const crest = new THREE.Mesh(new THREE.TubeGeometry(crestCurve, 32, 0.20, 16, false), bodyMat);
            modelGroup.add(crest);

            // Torso
            const torso = new THREE.Mesh(new THREE.SphereGeometry(0.85, 36, 36), bodyMat);
            torso.scale.set(1.0, 1.25, 0.90);
            torso.position.y = -0.55;
            modelGroup.add(torso);

            // Glowing Emblem
            const emblemMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const emblem = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 24), emblemMat);
            emblem.scale.set(0.8, 1.2, 0.4);
            emblem.position.set(0, -0.42, 0.82);
            modelGroup.add(emblem);

            // Eyes
            const eyeMat = new THREE.MeshStandardMaterial({ color: 0x030d1a, roughness: 0.05 });
            const catchMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            [-0.52, 0.52].forEach(x => {
              const eye = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 32), eyeMat);
              eye.scale.set(1.0, 1.2, 0.4);
              eye.position.set(x, 0.45, 1.05);
              modelGroup.add(eye);

              const catch1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), catchMat);
              catch1.position.set(x + 0.08, 0.56, 1.18);
              modelGroup.add(catch1);
            });
          };

          loader.load(
            modelUrl,
            (gltf) => {
              scene.remove(modelGroup);
              modelGroup = gltf.scene;
              const box = new THREE.Box3().setFromObject(modelGroup);
              const size = box.getSize(new THREE.Vector3());
              const center = box.getCenter(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z);
              const scale = 3.1 / (maxDim || 1);
              modelGroup.scale.set(scale, scale, scale);
              modelGroup.position.set(-center.x * scale, -center.y * scale - 0.05, -center.z * scale);
              modelGroup.traverse((c) => {
                if (c.isMesh && c.material) {
                  if (!c.material.map) {
                    c.material.color = new THREE.Color(0x38bdf8);
                    c.material.emissive = new THREE.Color(0x0284c7);
                    c.material.emissiveIntensity = 0.50;
                  }
                }
              });
              scene.add(modelGroup);
            },
            undefined,
            () => {
              buildSculpt();
            }
          );

          // Touch Drag Rotation
          let isDragging = false;
          let prevX = 0;
          let manualY = 0;
          window.addEventListener('touchstart', (e) => {
            isDragging = true;
            prevX = e.touches[0].clientX;
          });
          window.addEventListener('touchend', () => { isDragging = false; });
          window.addEventListener('touchmove', (e) => {
            if (isDragging) {
              const deltaX = e.touches[0].clientX - prevX;
              manualY += deltaX * 0.015;
              prevX = e.touches[0].clientX;
            }
          });

          // Animation
          const clock = new THREE.Clock();
          function animate() {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const elapsed = clock.getElapsedTime();

            floorGroup.rotation.z += delta * 0.25;
            if (modelGroup) {
              modelGroup.position.y += Math.sin(elapsed * 2.0) * delta * 0.08;
              modelGroup.rotation.y += (manualY - modelGroup.rotation.y) * 0.1;
            }
            renderer.render(scene, camera);
          }
          animate();
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: threeHtml }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoadEnd={() => setLoading(false)}
        scrollEnabled={false}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>Invocation du modèle 3D...</Text>
        </View>
      )}

      {/* Floating Touch Indicator */}
      <TouchableOpacity activeOpacity={0.8} onPress={onInteract} style={styles.touchPill}>
        <View style={styles.pulseDot} />
        <Text style={styles.touchText}>Glisser pour pivoter à 360°</Text>
      </TouchableOpacity>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 380,
    backgroundColor: '#030712',
    position: 'relative',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#030712',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#7dd3fc',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  touchPill: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 47, 73, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
    marginRight: 8,
  },
  touchText: {
    color: '#bae6fd',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
