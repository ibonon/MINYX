'use client';

/**
 * MascotValidation — page /mascot-test
 * Scène minimale pour valider que le GLB Draco s'affiche
 * et reste parfaitement cadré à TOUTES les largeurs d'écran.
 *
 * Accès : http://localhost:3000/mascot-test
 */

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import type { MascotMood } from '../../components/MascotScene';

const MascotScene = dynamic(() => import('../../components/MascotScene'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-[#02050e] flex items-center justify-center">
      <p className="text-cyan-400 font-mono text-sm animate-pulse">Chargement Draco GLB…</p>
    </div>
  ),
});

const MOODS: MascotMood[] = ['idle', 'talking', 'happy', 'thinking'];

export default function MascotTestPage() {
  const [mood, setMood] = useState<MascotMood>('idle');
  const [ready, setReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [forcedSize, setForcedSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const w = params.get('w');
      const h = params.get('h');
      if (w && h) {
        setForcedSize({ width: parseInt(w, 10), height: parseInt(h, 10) });
      }
    }
  }, []);

  useEffect(() => {
    const update = () => {
      setDimensions({
        width: forcedSize ? forcedSize.width : window.innerWidth,
        height: forcedSize ? forcedSize.height : window.innerHeight,
      });
    };
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, [forcedSize]);

  const aspect = dimensions.height > 0 ? (dimensions.width / dimensions.height).toFixed(2) : '-';

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      <div
        className="relative bg-[#02050e] overflow-hidden select-none border border-cyan-500/20 shadow-2xl"
        style={{
          width: forcedSize ? `${forcedSize.width}px` : '100vw',
          height: forcedSize ? `${forcedSize.height}px` : '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
        }}
      >
        {/* Canvas 3D — couche z-0 (totalement isolé) */}
        <div className="absolute inset-0 z-0">
          <MascotScene
            mood={mood}
            showPedestal
            onModelLoaded={() => {
              setReady(true);
              if (typeof document !== 'undefined') {
                const el = document.createElement('div');
                el.id = 'mascot-model-rendered';
                document.body.appendChild(el);
              }
            }}
          />
        </div>

        {/* Overlay UI minimaliste — couche z-10 (pointer-events-none global) */}
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
          {/* Top Header : Statut & Mesures Viewport réelles */}
          <header className="flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono
              ${ready
                ? 'border-cyan-400/40 bg-cyan-950/40 text-cyan-300'
                : 'border-yellow-400/40 bg-yellow-950/40 text-yellow-300'
              }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${ready ? 'bg-cyan-400 animate-pulse' : 'bg-yellow-400 animate-spin'}`} />
              <span>{ready ? '✓ Draco GLB chargé (374 KB)' : 'Chargement…'}</span>
            </div>

            <div className="text-center">
              <h1 className="text-white font-bold text-sm sm:text-base tracking-widest uppercase opacity-90">
                Mascot 3D — Test Responsive
              </h1>
            </div>

            {/* Mesures en direct du Viewport réel */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-black/40 text-xs font-mono text-cyan-300/80">
              <span>Canvas :</span>
              <strong className="text-white">{dimensions.width}px × {dimensions.height}px</strong>
              <span className="text-white/40">({aspect})</span>
            </div>
          </header>

          {/* Bottom Bar : Contrôles mood */}
          <footer className="flex justify-center items-center gap-2 sm:gap-3 pointer-events-auto pb-2">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-mono uppercase tracking-wider border transition-all
                  ${mood === m
                    ? 'bg-cyan-400/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'
                  }`}
              >
                {m}
              </button>
            ))}
          </footer>
        </div>
      </div>
    </div>
  );
}
