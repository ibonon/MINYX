'use client';

import React, { useState } from 'react';
import CompanionAvatar from './CompanionAvatar';
import { Button } from '@minyx/ui';
import { sounds } from '../lib/sound';

export type ElementType = 'Feu' | 'Eau' | 'Ténèbres';

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
    { id: 'Eau', icon: '💧', label: 'Eau', desc: 'Empathique et à l\'écoute.', accent: 'from-cyan-500 to-sky-500', border: 'border-cyan-500/50' },
    { id: 'Feu', icon: '🔥', label: 'Feu', desc: 'Passionné, direct et énergique.', accent: 'from-cyan-500 to-blue-500', border: 'border-cyan-500/50' },
    { id: 'Ténèbres', icon: '🌑', label: 'Ténèbres', desc: 'Philosophique, lucide et perspicace.', accent: 'from-sky-600 to-cyan-600', border: 'border-cyan-500/50' },
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
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 md:p-10 shadow-2xl text-white">
        
        {/* Close button */}
        {!isSummoning && (
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="absolute top-5 right-5 w-10 h-10 rounded-full border border-white/5 hover:border-cyan-500/50 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}

        {isSummoning ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative w-72 h-72 flex items-center justify-center mb-8">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/20 animate-spin-slow" />
              <div className="absolute inset-4 rounded-full border border-cyan-500/10 animate-spin-reverse" />
              <div className="absolute inset-10 rounded-full bg-cyan-500/5 blur-3xl animate-pulse" />

              <div className="scale-75 transition-transform duration-1000 transform">
                <CompanionAvatar element={selectedElement} size="sm" showRipples={false} />
              </div>
            </div>

            <h3 className="text-3xl font-bold tracking-tight text-white mb-3">
              Invocation...
            </h3>
            <p className="text-zinc-400 max-w-md text-sm mb-8">
              L&apos;esprit de <span className="text-cyan-400 font-semibold">{companionName}</span> s&apos;éveille.
            </p>

            <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-100 shadow-[0_0_12px_rgba(34,211,238,0.6)]"
                style={{ width: `${summonProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Header */}
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                Invoque ton compagnon
              </h2>
              <p className="text-zinc-400 text-sm md:text-base max-w-lg mx-auto">
                Choisis son élément et donne-lui un nom. Il grandira avec toi.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Step 1: Elements */}
              <div className="space-y-6">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  1. Choisis un élément
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {elementsData.map((el) => {
                    const isSelected = selectedElement === el.id;
                    return (
                      <button
                        key={el.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setSelectedElement(el.id);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all duration-300 flex items-center gap-4 ${
                          isSelected
                            ? `bg-white/10 border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.1)]`
                            : 'bg-white/5 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="text-3xl">{el.icon}</div>
                        <div>
                          <div className={`font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                            {el.label}
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5">
                            {el.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Name & Preview */}
              <div className="space-y-8">
                <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/5">
                  <CompanionAvatar element={selectedElement} size="lg" />
                  <span className="text-[10px] font-mono text-zinc-500 mt-6 uppercase tracking-widest">
                    Forme Originelle : {selectedElement}
                  </span>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 ml-1">
                      2. Donne-lui un nom
                    </label>
                    <input
                      type="text"
                      value={companionName}
                      onChange={(e) => setCompanionName(e.target.value)}
                      placeholder="Ex: Kaïto, Nyx..."
                      maxLength={24}
                      className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/5 text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-500/50 transition-all text-lg font-medium"
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    disabled={!companionName.trim()}
                    onClick={handleStartSummoning}
                    className="w-full"
                  >
                    ✨ Invoquer {companionName || 'ton compagnon'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
