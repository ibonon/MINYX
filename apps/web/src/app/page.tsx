'use client';

import React, { useState, useEffect } from 'react';
import CosmicBackground from '../components/CosmicBackground';
import CompanionAvatar from '../components/CompanionAvatar';
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
    <div className="relative min-h-screen w-full bg-[#030712] text-white overflow-x-hidden selection:bg-cyan-500 selection:text-black font-sans">
      {/* Dynamic starfield & cyber particles canvas */}
      <CosmicBackground />

      {/* Atmospheric radial glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-sky-500/15 rounded-full blur-[150px] pointer-events-none" />

      {/* TOP NAVBAR */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-sm border-b border-cyan-950/40">
        <div className="flex items-center gap-3">
          {/* Circuit Brand Icon */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 shadow-[0_0_12px_rgba(56,189,248,0.3)]">
            <span className="font-share-tech text-cyan-400 font-bold text-sm">M</span>
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-ping" />
          </div>
          <div className="flex flex-col">
            <span className="font-cinzel text-sm font-bold tracking-widest text-cyan-200">MINYX</span>
            <span className="font-share-tech text-[10px] text-cyan-500/70 tracking-wider">v5.0 • AGENTIC LAYER</span>
          </div>
        </div>

        {/* Right Nav Utilities */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Base L2 Network Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-[11px] font-share-tech text-cyan-300/80">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>BASE L2</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Activer le son' : 'Couper le son'}
            className="p-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/40 text-cyan-400 transition-all text-xs flex items-center gap-1.5"
          >
            {isMuted ? (
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/40 text-cyan-300 text-xs transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>GitHub</span>
          </a>

          {/* User state or login */}
          {user ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-900/50 border border-cyan-400/50 text-cyan-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="font-medium truncate max-w-[120px]">{user.name}</span>
            </div>
          ) : (
            <button
              onClick={() => {
                sounds.playClick();
                setIsAuthOpen(true);
              }}
              className="text-xs font-semibold px-4 py-1.5 rounded-full border border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/60 transition-all hover:border-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]"
            >
              Connexion
            </button>
          )}
        </div>
      </header>

      {/* MAIN HERO SECTION — STRICT REPLICA OF THE SCREENSHOT */}
      <main className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-6 md:px-16 lg:px-24 py-12">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: HERO TYPOGRAPHY & 3 PILL BUTTONS */}
          <div className="lg:col-span-6 flex flex-col items-start justify-center space-y-8 z-10">
            
            {/* STYLIZED MINYX LOGO MATCHING SCREENSHOT */}
            <div className="relative group">
              {/* Circuit Lens Flare Dot over the 'M' vertex */}
              <div 
                className="absolute -top-1 left-7 w-4 h-4 rounded-full bg-white blur-[1px] shadow-[0_0_20px_#38bdf8,0_0_40px_#38bdf8] pointer-events-none animate-pulse"
                style={{ zIndex: 10 }}
              />
              <div 
                className="absolute -top-3 left-5 w-8 h-8 rounded-full bg-cyan-300/30 blur-md pointer-events-none"
                style={{ zIndex: 9 }}
              />

              {/* Minyx Circuit Logo SVG / Typography */}
              <div className="flex items-baseline select-none">
                <h1 
                  className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400"
                  style={{
                    textShadow: '0 0 25px rgba(56, 189, 248, 0.65), 0 0 50px rgba(56, 189, 248, 0.35)',
                    filter: 'drop-shadow(0 0 15px rgba(34, 211, 238, 0.6))',
                  }}
                >
                  Minyx
                </h1>
              </div>

              {/* Subtle circuit line beneath */}
              <div className="w-48 h-[2px] bg-gradient-to-r from-cyan-400/80 via-sky-500/40 to-transparent mt-1" />
            </div>

            {/* TAGLINES MATCHING SCREENSHOT */}
            <div className="space-y-2">
              <p className="text-xl sm:text-2xl md:text-3xl font-medium tracking-tight text-white/95 leading-snug">
                Your evolving AI companion.
              </p>
              <p className="text-sm sm:text-base md:text-lg font-light tracking-wide text-cyan-300/70">
                Alive. Unique. Yours.
              </p>
            </div>

            {/* 3 GLOWING PILL BUTTONS MATCHING SCREENSHOT */}
            <div className="w-full sm:w-auto flex flex-col space-y-4 pt-2">
              
              {/* BUTTON 1: "Créer ton compagnon" — Solid Cyan Luminous Pill */}
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsInvocationOpen(true);
                }}
                className="group relative w-full sm:w-72 md:w-80 py-4 px-8 rounded-full bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#02131e] font-extrabold text-base md:text-lg tracking-wide transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] text-center shadow-[0_0_25px_rgba(56,189,248,0.7),0_0_50px_rgba(56,189,248,0.35)] cursor-pointer"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>Créer ton compagnon</span>
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
                {/* Continuous shimmer shine */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] transform -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000" />
                </div>
              </button>

              {/* BUTTON 2: "Connexion" — Dark Glass Pill with Bright Cyan Outline */}
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsAuthOpen(true);
                }}
                className="group relative w-full sm:w-72 md:w-80 py-3.5 px-8 rounded-full bg-[#040e1b]/80 hover:bg-[#07192f]/90 border border-cyan-400/80 hover:border-cyan-300 text-white font-semibold text-base tracking-wide transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-center shadow-[0_0_15px_rgba(56,189,248,0.25)] hover:shadow-[0_0_25px_rgba(56,189,248,0.45)] cursor-pointer"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>Connexion</span>
                </span>
              </button>

              {/* BUTTON 3: "Découvrir la démo" — Dark Pill with Subtle Glow */}
              <button
                onClick={handleLaunchDemo}
                className="group relative w-full sm:w-72 md:w-80 py-3.5 px-8 rounded-full bg-[#030914]/70 hover:bg-[#061426]/90 border border-cyan-800/60 hover:border-cyan-500/70 text-gray-200 hover:text-white font-medium text-base tracking-wide transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-center shadow-lg hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] cursor-pointer"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>Découvrir la démo</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black transition-colors font-mono">
                    Live RPG
                  </span>
                </span>
              </button>
            </div>

            {/* Quick feature pill highlights */}
            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-cyan-400/70 font-share-tech">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                NFT ERC-721 Base L2
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Mémoire MemoClaw
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                7 Éléments Mythiques
              </span>
            </div>

          </div>

          {/* RIGHT COLUMN: FLOATING ADORABLE CHIBI WITH CONCENTRIC PERSPECTIVE RIPPLES */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative min-h-[460px] md:min-h-[550px]">
            
            {/* Background Halo */}
            <div 
              className="absolute w-[380px] h-[380px] md:w-[480px] md:h-[480px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(14, 165, 233, 0.1) 45%, transparent 70%)',
                filter: 'blur(35px)',
              }}
            />

            {/* Floating Chibi Avatar */}
            <div className="relative z-10 transition-transform duration-500 hover:scale-105 cursor-pointer"
              onClick={() => {
                sounds.playChime();
                setIsInvocationOpen(true);
              }}
            >
              <CompanionAvatar
                element="Eau"
                size="xl"
                showRipples={true}
              />
            </div>

            {/* Bottom floating helper tip */}
            <div className="mt-2 text-center select-none pointer-events-none">
              <span className="text-[11px] font-share-tech uppercase tracking-widest text-cyan-400/50">
                Azure • Forme Chibi • Élément Eau
              </span>
            </div>

          </div>

        </div>
      </main>

      {/* BOTTOM RIGHT CORNER: 4-POINT SPARKLE STAR ICON MATCHING SCREENSHOT */}
      <div 
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 pointer-events-none z-20 flex items-center justify-center"
        style={{
          filter: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.85))'
        }}
      >
        <svg 
          className="w-7 h-7 md:w-9 md:h-9 text-cyan-300 animate-pulse" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          {/* 4-pointed diamond star */}
          <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
        </svg>
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 py-6 px-6 md:px-12 border-t border-cyan-950/40 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 MINYX • SAHELION Group • Ouagadougou, Burkina Faso</p>
          <div className="flex items-center gap-6 text-cyan-400/60">
            <span className="hover:text-cyan-300 cursor-pointer" onClick={() => setIsInvocationOpen(true)}>Rituel d'invocation</span>
            <span className="hover:text-cyan-300 cursor-pointer" onClick={handleLaunchDemo}>Démo Live</span>
            <a href="https://github.com/ibonon/MINYX.git" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300">
              GitHub Repo
            </a>
          </div>
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
