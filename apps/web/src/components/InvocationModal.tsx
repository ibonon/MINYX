'use client';

import React, { useState } from 'react';
import CompanionAvatar from './CompanionAvatar';
import { sounds } from '../lib/sound';

export type ElementType = 'Feu' | 'Eau' | 'Ténèbres' | 'Lumière' | 'Terre' | 'Vent' | 'Cosmos';

export interface InvocationResult {
  name: string;
  element: ElementType;
}

interface InvocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (companion: InvocationResult) => void;
}

export default function InvocationModal({ isOpen, onClose, onSuccess }: InvocationModalProps) {
  const [selectedElement, setSelectedElement] = useState<ElementType>('Eau');
  const [companionName, setCompanionName] = useState('');
  const [isSummoning, setIsSummoning] = useState(false);
  const [summonProgress, setSummonProgress] = useState(0);

  if (!isOpen) return null;

  const elementsData: Array<{
    id: ElementType;
    icon: string;
    label: string;
    desc: string;
    accent: string;
    border: string;
  }> = [
    { id: 'Eau', icon: '💧', label: 'Eau', desc: 'Profond, empathique et toujours à l\'écoute.', accent: 'from-sky-500 to-cyan-400', border: 'border-sky-400' },
    { id: 'Feu', icon: '🔥', label: 'Feu', desc: 'Passionné, direct et débordant d\'énergie.', accent: 'from-amber-500 to-red-500', border: 'border-red-500' },
    { id: 'Ténèbres', icon: '🌑', label: 'Ténèbres', desc: 'Philosophique, curieux des mystères cachés.', accent: 'from-indigo-600 to-purple-600', border: 'border-purple-500' },
    { id: 'Lumière', icon: '✨', label: 'Lumière', desc: 'Bienveillant, inspirant et guide sincère.', accent: 'from-yellow-400 to-amber-300', border: 'border-yellow-400' },
    { id: 'Terre', icon: '🌍', label: 'Terre', desc: 'Protecteur, patient et solide comme un roc.', accent: 'from-emerald-500 to-teal-400', border: 'border-emerald-400' },
    { id: 'Vent', icon: '🌬️', label: 'Vent', desc: 'Vif, agile, curieux de nouvelles idées.', accent: 'from-cyan-400 to-teal-300', border: 'border-cyan-300' },
    { id: 'Cosmos', icon: '🌌', label: 'Cosmos', desc: 'Transcendant, lié aux étoiles et à l\'infini.', accent: 'from-fuchsia-500 to-violet-500', border: 'border-fuchsia-400' },
  ];

  const handleStartSummoning = () => {
    if (!companionName.trim()) return;

    setIsSummoning(true);
    setSummonProgress(0);
    sounds.playInvocation();

    const interval = setInterval(() => {
      setSummonProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSummoning(false);
            onSuccess({
              name: companionName.trim(),
              element: selectedElement,
            });
          }, 400);
          return 100;
        }
        return prev + 4;
      });
    }, 110);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-cyan-500/40 bg-zinc-950/95 p-6 md:p-10 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-white">
        
        {/* Close button */}
        {!isSummoning && (
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="absolute top-5 right-5 w-10 h-10 rounded-full border border-zinc-700 hover:border-cyan-400 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}

        {/* Summoning Ritual Screen */}
        {isSummoning ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative w-72 h-72 flex items-center justify-center mb-8">
              {/* Outer rotating arcane glyph circle */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400 animate-spin-slow opacity-80" />
              {/* Counter-rotating inner ring */}
              <div className="absolute inset-4 rounded-full border border-sky-300 animate-spin-reverse opacity-60" />
              {/* Central Summoning Glow */}
              <div className="absolute inset-10 rounded-full bg-cyan-500/20 blur-xl animate-pulse" />

              {/* Emerging Companion Silhouette */}
              <div className="scale-75 transition-transform duration-1000 transform">
                <CompanionAvatar element={selectedElement} size="sm" showRipples={false} />
              </div>
            </div>

            <h3 className="text-3xl font-bold tracking-wider text-cyan-300 font-serif mb-3 animate-pulse">
              Rituel d'Invocation en cours...
            </h3>
            <p className="text-zinc-400 max-w-md text-sm mb-6">
              Les particules de l'élément <span className="text-cyan-400 font-semibold">{selectedElement}</span> s'assemblent pour donner vie à <span className="text-white font-semibold">{companionName}</span>.
            </p>

            {/* Ritual Progress bar */}
            <div className="w-72 h-3 bg-zinc-900 rounded-full border border-cyan-500/40 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-white transition-all duration-100 shadow-[0_0_12px_#38bdf8]"
                style={{ width: `${summonProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-cyan-400 mt-2">{summonProgress}%</span>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/40 bg-cyan-950/40 text-cyan-300 text-xs font-medium uppercase tracking-widest mb-3">
                ✦ Cercle d'Invocation MINYX ✦
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                Donne naissance à ton Compagnon
              </h2>
              <p className="text-zinc-400 text-sm md:text-base mt-2 max-w-lg mx-auto">
                Choisis son élément originel, nomme-le et réveille son esprit. Il grandira à tes côtés et se souviendra de tout.
              </p>
            </div>

            {/* Step 1: Choose Element */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">
                1. Choisis un des 7 Éléments
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {elementsData.map((el) => {
                  const isSelected = selectedElement === el.id;
                  return (
                    <button
                      key={el.id}
                      type="button"
                      onMouseEnter={() => sounds.playHover()}
                      onClick={() => {
                        sounds.playClick();
                        setSelectedElement(el.id);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? `bg-zinc-900/90 ${el.border} shadow-[0_0_18px_rgba(56,189,248,0.4)] scale-105`
                          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="text-2xl mb-2">{el.icon}</div>
                      <div>
                        <div className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                          {el.label}
                        </div>
                        <div className="text-[10px] text-zinc-400 line-clamp-2 mt-1">
                          {el.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Name & Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-8 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/80">
              <div className="flex flex-col justify-center items-center py-2">
                <CompanionAvatar element={selectedElement} size="md" />
                <span className="text-xs text-cyan-400/80 font-mono mt-2 tracking-wide">
                  Forme Originelle : Chibi {selectedElement}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">
                    2. Donne un nom à ton compagnon
                  </label>
                  <input
                    type="text"
                    value={companionName}
                    onChange={(e) => setCompanionName(e.target.value)}
                    placeholder="Ex: Kaïto, Nyx, Lumina, Zephyr..."
                    maxLength={24}
                    className="w-full px-4 py-3.5 rounded-xl bg-black border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all text-lg font-medium"
                  />
                </div>

                <div className="text-xs text-zinc-400 space-y-1.5 bg-black/40 p-4 rounded-xl border border-zinc-800/60">
                  <div className="text-zinc-300 font-semibold mb-1">Caractéristiques de base :</div>
                  <div className="flex justify-between">
                    <span>Niveau Initial :</span>
                    <span className="text-cyan-400 font-mono">Niv. 1 (0 / 200 XP)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Propriété Blockchain :</span>
                    <span className="text-cyan-400 font-mono">ERC-721 (Base L2)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mémoire :</span>
                    <span className="text-cyan-400 font-mono">MemoClaw Actif</span>
                  </div>
                </div>

                {/* Summon Action Button */}
                <button
                  type="button"
                  disabled={!companionName.trim()}
                  onMouseEnter={() => sounds.playHover()}
                  onClick={handleStartSummoning}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-500 text-black font-extrabold text-lg uppercase tracking-wider shadow-[0_0_25px_rgba(56,189,248,0.5)] hover:shadow-[0_0_35px_rgba(56,189,248,0.8)] disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  ✨ Invoquer {companionName || 'mon compagnon'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
