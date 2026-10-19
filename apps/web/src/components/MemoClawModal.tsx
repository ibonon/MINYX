'use client';

import React from 'react';
import { memoClaw, MemoItem } from '@minyx/api';
import { sounds } from '../lib/sound';

interface MemoClawModalProps {
  isOpen: boolean;
  companionId: string;
  companionName: string;
  onClose: () => void;
}

export default function MemoClawModal({
  isOpen,
  companionId,
  companionName,
  onClose,
}: MemoClawModalProps) {
  if (!isOpen) return null;

  const allMemories = memoClaw.getAll(companionId);

  const namespaces: Array<{ id: 'core' | 'events' | 'preferences' | 'moods'; label: string; icon: string; desc: string }> = [
    { id: 'events', label: 'Événements & Échéances', icon: '📅', desc: 'Examens, dates clés et rendez-vous mentionnés' },
    { id: 'preferences', label: 'Préférences & Passions', icon: '❤️', desc: 'Ce que tu aimes, tes habitudes et tes goûts' },
    { id: 'moods', label: 'Historique Émotionnel', icon: '✨', desc: 'Stress, joie, fatigue ou enthousiasme détectés' },
    { id: 'core', label: 'Fondements Relationnels', icon: '🧠', desc: 'Données d\'identité et niveau de complicité BOND' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-[#08182b]/95 via-[#040e1b]/95 to-[#01050d]/95 p-6 md:p-8 shadow-2xl shadow-cyan-950/80">
        
        {/* Glow corners */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-cyan-400 hover:text-white p-2 rounded-full hover:bg-cyan-950 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-[11px] font-share-tech text-cyan-300 mb-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            MEMOCLAW COGNITIVE MEMORY (SQLITE ENGINE)
          </div>
          <h2 className="text-2xl font-bold font-cinzel text-white">
            Ce que {companionName} sait de toi
          </h2>
          <p className="text-xs text-cyan-300/70 mt-1">
            Chaque fait que tu partages est analysé et stocké de manière persistante par MemoClaw, puis réinjecté dynamiquement dans le prompt Meta Llama.
          </p>
        </div>

        {/* Namespaces Lists */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin">
          {namespaces.map((ns) => {
            const items = allMemories.filter((m) => m.namespace === ns.id);

            return (
              <div key={ns.id} className="p-4 rounded-2xl bg-black/40 border border-cyan-900/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ns.icon}</span>
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-share-tech">
                      {ns.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-400">
                    {items.length} souvenir{items.length > 1 ? 's' : ''}
                  </span>
                </div>

                <p className="text-[11px] text-gray-400 mb-3">{ns.desc}</p>

                {items.length === 0 ? (
                  <div className="text-xs text-gray-500 italic py-2 pl-2 border-l border-cyan-950">
                    Aucun fait enregistré dans ce namespace pour le moment. Parle avec ton compagnon pour qu'il le retienne !
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-100 flex items-start justify-between gap-3"
                      >
                        <div className="flex-1">
                          <span className="text-cyan-400 mr-2">✦</span>
                          <span>{item.content}</span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-500/70 whitespace-nowrap">
                          Poids : {Math.round(item.importance * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-cyan-950 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-mono">
            Total : {allMemories.length} souvenirs persistants actifs
          </span>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-full bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400 transition-all shadow-md shadow-cyan-500/20"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
