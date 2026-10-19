'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import CosmicBackground from '../components/CosmicBackground';
import InvocationModal, { InvocationResult } from '../components/InvocationModal';
import MemoClawModal from '../components/MemoClawModal';
import MetaDemoFlow from '../components/MetaDemoFlow';
import { sounds } from '../lib/sound';

const CompanionModelViewer = dynamic(() => import('../components/CompanionModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      <span className="mt-3 text-xs font-share-tech text-cyan-300 animate-pulse">
        Chargement du modèle 3D .GLB...
      </span>
    </div>
  ),
});

export default function HomePage() {
  const [currentView, setCurrentView] = useState<'landing' | 'demo'>('landing');

  // Modals
  const [isInvocationOpen, setIsInvocationOpen] = useState(false);
  const [isMemoClawOpen, setIsMemoClawOpen] = useState(false);

  // Audio Toggle
  const [isMuted, setIsMuted] = useState(false);

  const toggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    sounds.setMuted(nextState);
    if (!nextState) {
      sounds.playChime();
    }
  };

  const handleInvocationSuccess = (result: InvocationResult) => {
    setIsInvocationOpen(false);
    setCurrentView('demo');
  };

  // If in demo view, render full Meta Hackathon 3-minute flow
  if (currentView === 'demo') {
    return (
      <MetaDemoFlow
        onBackToHome={() => {
          sounds.playClick();
          setCurrentView('landing');
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#02050e] text-white overflow-hidden flex flex-col justify-between selection:bg-cyan-500 selection:text-black font-sans">
      
      {/* 1. Dynamic Warp-Speed Starfield & Cyber Runes Background */}
      <CosmicBackground />

      {/* 2. Top Header: Meta Hackathon Navigation */}
      <header className="relative z-30 flex items-center justify-between px-6 md:px-12 py-4 bg-[#02050e]/70 backdrop-blur-md border-b border-cyan-900/40">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-400/50 shadow-[0_0_12px_rgba(56,189,248,0.4)]">
            <span className="font-share-tech text-cyan-300 font-bold text-sm">M</span>
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-ping" />
          </div>
          <div className="flex flex-col">
            <span className="font-cinzel text-sm sm:text-base font-bold tracking-widest text-cyan-200">MINYX</span>
            <span className="font-share-tech text-[9px] text-cyan-400/80 tracking-wider">
              META GLOBAL AI HACKATHON 2026 • BUILD FOR YOUR WORLD
            </span>
          </div>
        </div>

        {/* Center: Models Stack Pills */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-cyan-300/80">
          <span className="px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            LLAMA 3.3 (REASONING &amp; TOOL CALLING)
          </span>
          <span className="px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 flex items-center gap-1.5 text-purple-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            MUSE IMAGE (LIVE VISUAL GEN)
          </span>
          <span className="px-2.5 py-1 rounded-full bg-sky-950/60 border border-sky-800/40 flex items-center gap-1.5 text-sky-300">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            SAM 3.1 (SEGMENTED AURA)
          </span>
        </div>

        {/* Right Utilities */}
        <div className="flex items-center gap-3">
          {/* Audio Mute/Unmute */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Activer le son' : 'Couper le son'}
            className="p-2 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-700/40 text-cyan-300 transition-all text-xs"
          >
            {isMuted ? (
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>

          {/* GitHub Repo */}
          <a
            href="https://github.com/ibonon/MINYX.git"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/40 text-cyan-300 text-xs transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      {/* 3. CINEMATIC HERO COMPOSITION (STRICT MATCH TO THE USER'S REFERENCE IMAGE) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
        
        {/* Top: Side-by-Side Logo & Muse Image Companion */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center justify-center my-auto">
          
          {/* Left: Circuit "Minyx" Typography */}
          <div className="md:col-span-6 flex flex-col items-center md:items-end justify-center select-none text-center md:text-right pr-0 md:pr-4">
            <div className="relative inline-block">
              {/* Starburst Lens Flare on 'M' */}
              <div 
                className="absolute -top-1 left-7 w-4 h-4 rounded-full bg-white blur-[1px] shadow-[0_0_20px_#38bdf8,0_0_40px_#38bdf8] pointer-events-none animate-pulse"
                style={{ zIndex: 10 }}
              />

              {/* Minyx Circuit Logo Typography */}
              <h1 
                className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-cyan-400"
                style={{
                  textShadow: '0 0 25px rgba(56, 189, 248, 0.7), 0 0 50px rgba(56, 189, 248, 0.4)',
                  filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.6))',
                }}
              >
                Minyx
              </h1>
            </div>
          </div>

          {/* Right: Real Interactive 3D Model (.GLB) matching reference */}
          <div className="md:col-span-6 flex items-center justify-center relative h-[320px] sm:h-[380px] md:h-[440px] w-full">
            <CompanionModelViewer
              modelUrl="/models/companion.glb"
              element="Eau"
              interactive={true}
            />
          </div>

        </div>

        {/* Center Taglines strictly matching the new Meta PRD */}
        <div className="text-center mt-4 mb-8 select-none max-w-3xl">
          <p className="text-xl sm:text-2xl md:text-3xl font-medium tracking-tight text-white/95 leading-snug">
            Ton compagnon IA qui se souvient de toi, te comprend, et fait les choses pour toi.
          </p>
          <p className="text-sm sm:text-base md:text-lg font-light tracking-wide text-cyan-300/80 mt-1">
            Alive. Unique. Yours.
          </p>
        </div>

        {/* The 3 Iconic Horizontal Pill Buttons Matching the Reference Image */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-3xl mb-8">
          
          {/* Button 1: "Invoquer mon compagnon" */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsInvocationOpen(true);
            }}
            onMouseEnter={() => sounds.playHover()}
            className="group relative w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#031120]/80 hover:bg-cyan-950/80 border border-cyan-400 text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.4),inset_0_0_10px_rgba(56,189,248,0.2)] hover:shadow-[0_0_30px_rgba(56,189,248,0.7),inset_0_0_15px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Invoquer mon compagnon</span>
            <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">✦</span>
          </button>

          {/* Button 2: "Ce que je sais de toi" (MemoClaw) */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsMemoClawOpen(true);
            }}
            onMouseEnter={() => sounds.playHover()}
            className="group relative w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#031120]/80 hover:bg-cyan-950/80 border border-cyan-400 text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.4),inset_0_0_10px_rgba(56,189,248,0.2)] hover:shadow-[0_0_30px_rgba(56,189,248,0.7),inset_0_0_15px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ce que je sais de toi</span>
          </button>

          {/* Button 3: "Démo Hackathon (3 min)" */}
          <button
            onClick={() => {
              sounds.playClick();
              setCurrentView('demo');
            }}
            onMouseEnter={() => sounds.playHover()}
            className="group relative w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#031120]/80 hover:bg-cyan-950/80 border border-cyan-400 text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.4),inset_0_0_10px_rgba(56,189,248,0.2)] hover:shadow-[0_0_30px_rgba(56,189,248,0.7),inset_0_0_15px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Démo Hackathon (3 min)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500 text-black font-bold font-mono">
              META
            </span>
          </button>

        </div>

      </main>

      {/* 4. Bottom-Right 4-Point Sparkle Star strictly matching reference */}
      <div 
        className="fixed bottom-6 right-6 md:bottom-8 md:right-10 pointer-events-none z-20"
        style={{ filter: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.9))' }}
      >
        <svg className="w-7 h-7 md:w-9 md:h-9 text-cyan-300 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
        </svg>
      </div>

      {/* 5. Minimal Footer */}
      <footer className="relative z-20 py-4 px-6 md:px-12 border-t border-cyan-950/40 text-[11px] text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div>
          © 2026 MINYX • Meta Global AI Developer Hackathon • Eric Warma — SAHELION Group
        </div>
        <div className="flex items-center gap-4 text-cyan-400/60 font-share-tech">
          <span>META LLAMA 3.3</span>
          <span>•</span>
          <span>MUSE IMAGE</span>
          <span>•</span>
          <span>SAM 3.1</span>
          <span>•</span>
          <a href="https://github.com/ibonon/MINYX.git" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300">
            GITHUB
          </a>
        </div>
      </footer>

      {/* Modals */}
      <InvocationModal
        isOpen={isInvocationOpen}
        onClose={() => setIsInvocationOpen(false)}
        onSuccess={handleInvocationSuccess}
      />

      <MemoClawModal
        isOpen={isMemoClawOpen}
        companionId="demo-user"
        companionName="Azure"
        onClose={() => setIsMemoClawOpen(false)}
      />

    </div>
  );
}
