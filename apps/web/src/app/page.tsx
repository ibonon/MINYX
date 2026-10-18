'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import InvocationModal, { InvocationResult } from '../components/InvocationModal';
import AuthModal from '../components/AuthModal';
import CompanionDashboard, { DashboardCompanion } from '../components/CompanionDashboard';
import { sounds } from '../lib/sound';

export default function HomePage() {
  // Navigation / View State
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');

  // Modals
  const [isInvocationOpen, setIsInvocationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // User State
  const [user, setUser] = useState<{ name: string; address?: string; email?: string } | null>(null);

  // Active Companion
  const [companion, setCompanion] = useState<DashboardCompanion | null>(null);

  // Audio mute state
  const [isMuted, setIsMuted] = useState(false);

  // Toggle sound
  const toggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    sounds.setMuted(nextState);
    if (!nextState) {
      sounds.playChime();
    }
  };

  // Handle successful invocation ritual
  const handleInvocationSuccess = (result: InvocationResult) => {
    const newCompanion: DashboardCompanion = {
      name: result.name,
      element: result.element,
      level: 1,
      xp: 0,
      xpMax: 100,
      stats: {
        INT: result.element === 'Feu' ? 14 : result.element === 'Ténèbres' ? 22 : 16,
        EMO: result.element === 'Eau' ? 24 : result.element === 'Lumière' ? 20 : 18,
        AGI: result.element === 'Vent' ? 22 : result.element === 'Feu' ? 20 : 15,
        BOND: 10,
      },
      form: 'Chibi',
      isMinted: false,
    };

    setCompanion(newCompanion);
    setIsInvocationOpen(false);
    setCurrentView('dashboard');
  };

  // Launch demo dashboard
  const handleLaunchDemo = () => {
    sounds.playClick();
    if (!companion) {
      setCompanion({
        name: 'Azure',
        element: 'Eau',
        level: 1,
        xp: 45,
        xpMax: 150,
        stats: {
          INT: 18,
          EMO: 24,
          AGI: 16,
          BOND: 25,
        },
        form: 'Chibi',
        isMinted: false,
      });
    }
    setCurrentView('dashboard');
  };

  // If in dashboard view, render full RPG dashboard
  if (currentView === 'dashboard') {
    return (
      <CompanionDashboard
        initialCompanion={companion || undefined}
        onBackToHome={() => {
          sounds.playClick();
          setCurrentView('landing');
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#02050e] text-white overflow-hidden flex flex-col justify-between selection:bg-cyan-500 selection:text-black font-sans">
      
      {/* DISCREET TOP NAVIGATION BAR */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-8 py-3 bg-[#02050e]/60 backdrop-blur-md border-b border-cyan-900/30">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-950/70 border border-cyan-400/50 shadow-[0_0_10px_rgba(56,189,248,0.4)]">
            <span className="font-share-tech text-cyan-300 font-bold text-xs">M</span>
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-ping" />
          </div>
          <span className="font-cinzel text-xs sm:text-sm font-bold tracking-widest text-cyan-200">MINYX v5.0</span>
          <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 border border-cyan-800/40 text-cyan-400">
            BASE L2 • AGENTIC LAYER
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Mute/Unmute */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Activer le son' : 'Couper le son'}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-700/40 text-cyan-300 text-xs transition-all"
          >
            {isMuted ? (
              <>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
                <span className="text-[11px] text-gray-400">Muet</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span className="text-[11px] text-cyan-300">Audio ON</span>
              </>
            )}
          </button>

          {/* User state badge */}
          {user && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-900/40 border border-cyan-400/40 text-cyan-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="font-medium truncate max-w-[120px]">{user.name}</span>
            </div>
          )}

          {/* GitHub Link */}
          <a
            href="https://github.com/ibonon/MINYX.git"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-700/40 text-cyan-300 text-xs transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      {/* CENTER STAGE — EXACT DESIGN SYSTEM FROM SCREENSHOT */}
      <main className="relative flex-1 flex items-center justify-center p-2 sm:p-4 md:p-6 w-full max-w-6xl mx-auto">
        
        {/* Visual Frame strictly respecting the 1024x682 design canvas */}
        <div 
          className="relative w-full aspect-[1024/682] max-h-[85vh] rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(34,211,238,0.25)] border border-cyan-900/40 select-none"
        >
          {/* The Exact Artwork Image */}
          <Image
            src="/minyx-hero.jpg"
            alt="Minyx - Your evolving AI companion"
            fill
            priority
            className="object-cover pointer-events-none"
          />

          {/* INTERACTIVE HOTSPOT: MASCOT */}
          <div
            onClick={() => {
              sounds.playCompanionVoice('Eau');
            }}
            title="Azure — Compagnon IA Élément Eau"
            className="absolute z-20 cursor-pointer rounded-full transition-all duration-300 hover:ring-2 hover:ring-cyan-300/40 hover:bg-cyan-400/10"
            style={{
              left: '68%',
              top: '28%',
              width: '18%',
              height: '42%',
            }}
          />

          {/* INTERACTIVE BUTTON 1: "Créer ton compagnon" */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsInvocationOpen(true);
            }}
            onMouseEnter={() => sounds.playHover()}
            title="Créer ton compagnon — Rituel d'invocation"
            className="group absolute z-20 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-300 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              left: '16.5%',
              width: '21.4%',
              top: '78.4%',
              height: '8.8%',
            }}
          >
            {/* Interactive hover glowing border & aura */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/0 group-hover:border-cyan-300 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.8),inset_0_0_15px_rgba(56,189,248,0.4)] group-hover:bg-cyan-400/15 transition-all duration-300" />
            
            {/* Shimmer flare on hover */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent skew-x-[-20deg] transform -translate-x-full group-hover:translate-x-[250%] transition-transform duration-700" />
            </div>
          </button>

          {/* INTERACTIVE BUTTON 2: "Connexion" */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsAuthOpen(true);
            }}
            onMouseEnter={() => sounds.playHover()}
            title="Connexion — Portefeuille Web3 Base L2 & Email"
            className="group absolute z-20 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-300 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              left: '39.6%',
              width: '20.8%',
              top: '78.4%',
              height: '8.8%',
            }}
          >
            {/* Interactive hover glowing border & aura */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/0 group-hover:border-cyan-300 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.8),inset_0_0_15px_rgba(56,189,248,0.4)] group-hover:bg-cyan-400/15 transition-all duration-300" />
            
            {/* Shimmer flare on hover */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent skew-x-[-20deg] transform -translate-x-full group-hover:translate-x-[250%] transition-transform duration-700" />
            </div>
          </button>

          {/* INTERACTIVE BUTTON 3: "Découvrir la démo" */}
          <button
            onClick={handleLaunchDemo}
            onMouseEnter={() => sounds.playHover()}
            title="Découvrir la démo — Tester le RPG et l'IA en direct"
            className="group absolute z-20 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-300 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              left: '62.8%',
              width: '20.5%',
              top: '78.4%',
              height: '8.8%',
            }}
          >
            {/* Interactive hover glowing border & aura */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/0 group-hover:border-cyan-300 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.8),inset_0_0_15px_rgba(56,189,248,0.4)] group-hover:bg-cyan-400/15 transition-all duration-300" />
            
            {/* Shimmer flare on hover */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent skew-x-[-20deg] transform -translate-x-full group-hover:translate-x-[250%] transition-transform duration-700" />
            </div>
          </button>

          {/* BOTTOM-RIGHT 4-POINT SPARKLE STAR (Animated Flare) */}
          <div 
            className="absolute z-10 pointer-events-none animate-pulse"
            style={{
              right: '4.5%',
              bottom: '5.5%',
              filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.9))',
            }}
          >
            <div className="w-6 h-6 md:w-8 md:h-8" />
          </div>

        </div>
      </main>

      {/* DISCREET BOTTOM FOOTER */}
      <footer className="relative z-20 py-3 px-6 text-center text-[11px] text-gray-500 bg-[#02050e]/80 border-t border-cyan-950/40 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-6xl mx-auto w-full">
        <p>© 2026 MINYX • SAHELION Group • Ouagadougou, Burkina Faso</p>
        <div className="flex items-center gap-4 text-cyan-400/60 font-share-tech">
          <span>NFT ERC-721 BASE L2</span>
          <span>•</span>
          <span>MEMOCLAW COGNITIVE MEMORY</span>
          <span>•</span>
          <span>7 ÉLÉMENTS MYTHIQUES</span>
        </div>
      </footer>

      {/* INVOCATION MODAL */}
      <InvocationModal
        isOpen={isInvocationOpen}
        onClose={() => setIsInvocationOpen(false)}
        onSuccess={handleInvocationSuccess}
      />

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
        }}
      />
    </div>
  );
}
