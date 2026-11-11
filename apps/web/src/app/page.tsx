'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { CompanionView } from '@minyx/api/client';
import InvocationModal, { InvocationResult } from '../components/InvocationModal';
import AuthModal from '../components/AuthModal';
import MemoClawModal from '../components/MemoClawModal';
import MetaDemoFlow from '../components/MetaDemoFlow';
import CompanionDashboard from '../components/CompanionDashboard';
import { sounds } from '../lib/sound';
import { auth, companions } from '../lib/client-api';
import type { SessionUser } from '../lib/client-api';

// Fullscreen high-performance 60 FPS 3D Mascot Scene (Strictly Isolated)
const MascotScene = dynamic(() => import('../components/MascotScene'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-0">
      <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      <span className="mt-4 font-mono text-xs text-cyan-400/70 tracking-widest uppercase animate-pulse">
        Initialisation du Sanctuaire 3D...
      </span>
    </div>
  ),
});

export default function HomePage() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'demo'>('landing');

  // Real server session & companions
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [companion, setCompanion] = useState<CompanionView | null>(null);

  // Modals
  const [isInvocationOpen, setIsInvocationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMemoClawOpen, setIsMemoClawOpen] = useState(false);
  const [openInvocationAfterAuth, setOpenInvocationAfterAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Audio state
  const [isMuted, setIsMuted] = useState(false);

  const loadCompanions = useCallback(async () => {
    try {
      const result = await companions.list();
      setCompanion(result.companions[0] ?? null);
      return result.companions[0] ?? null;
    } catch {
      setCompanion(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const err = params.get('authError');
          if (err === 'google_not_configured') {
            setAuthError('Google OAuth en cours de configuration dans la console cloud. Utilise la connexion Email/MDP pour le moment.');
          } else if (err) {
            setAuthError('Une erreur est survenue lors de l’authentification.');
          }
        }
        const result = await auth.me();
        if (!cancelled) setUser(result.user);
        if (result.user && !cancelled) await loadCompanions();
      } catch {
        // 401 unauthenticated
      } finally {
        if (!cancelled) setIsSessionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCompanions]);

  const toggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    sounds.setMuted(nextState);
    if (!nextState) {
      sounds.playChime();
    }
  };

  const handleLogout = async () => {
    sounds.playClick();
    try {
      await auth.logout();
    } catch {
      // Session invalidated on server
    }
    setUser(null);
    setCompanion(null);
    setCurrentView('landing');
  };

  const handleAuthSuccess = async (authUser: { name: string; email?: string }) => {
    sounds.playLevelUp();
    setIsAuthOpen(false);
    setAuthError(null);

    try {
      const me = await auth.me();
      setUser(me.user);
    } catch {
      setUser({ id: '', name: authUser.name, email: authUser.email ?? '', locale: 'fr' });
    }

    const existing = await loadCompanions();
    if (existing) {
      setCurrentView('dashboard');
    } else if (openInvocationAfterAuth) {
      setOpenInvocationAfterAuth(false);
      setIsInvocationOpen(true);
    } else {
      setIsInvocationOpen(true);
    }
  };

  const handleInvocationSuccess = async (result: InvocationResult) => {
    if (!user) {
      setOpenInvocationAfterAuth(true);
      setIsInvocationOpen(false);
      setIsAuthOpen(true);
      return;
    }

    try {
      const created = await companions.create(result.name, result.element);
      setCompanion(created.companion);
      sounds.playInvocation();
      setIsInvocationOpen(false);
      setCurrentView('dashboard');
    } catch (error) {
      const code = (error as { code?: string }).code ?? '';
      setAuthError(
        code === 'invalid_element'
          ? 'Cet élément n’est pas encore disponible. Choisis-en un autre.'
          : 'Création impossible pour le moment. Réessaie.'
      );
    }
  };

  const openDashboardOrAuth = () => {
    if (user && companion) {
      setCurrentView('dashboard');
    } else if (user) {
      setIsInvocationOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  // Full views
  if (currentView === 'dashboard' && companion) {
    return (
      <CompanionDashboard
        companion={companion}
        onBackToHome={() => {
          sounds.playClick();
          void loadCompanions();
          setCurrentView('landing');
        }}
      />
    );
  }

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
    <div className="relative w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">

      {/* ── LAYER 1 : HIGH-PERFORMANCE 3D WEBGL MASCOT SCENE (FULLSCREEN, 60 FPS) ── */}
      <div className="absolute inset-0 z-0">
        <MascotScene
          mood="idle"
          showPedestal={true}
          layout="right"
        />
      </div>

      {/* ── LAYER 2 : HTML/CSS UI OVERLAY (STRICTLY SEPARATED FROM 3D CANVAS) ── */}
      <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between overflow-x-hidden overflow-y-auto sm:overflow-hidden">

        {/* 1. Glassmorphism Top Header */}
        <header className="w-full flex items-center justify-between px-4 sm:px-8 md:px-12 py-3.5 sm:py-4 bg-slate-950/60 backdrop-blur-xl border-b border-cyan-500/20 z-20 pointer-events-auto transition-all duration-300">
          {/* Brand Mark */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 border border-cyan-500/30">
              <span className="font-mono text-cyan-300 font-bold text-sm">M</span>
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-widest text-white text-base">
                MINYX
              </span>
              <span className="hidden sm:inline font-mono text-[9px] text-zinc-400 tracking-wider">
                COMPAGNON IA AVEC MÉMOIRE RÉELLE
              </span>
            </div>
          </div>

          {/* Center Navigation Pills (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
            <button
              onClick={() => {
                sounds.playClick();
                openDashboardOrAuth();
              }}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/8 border border-cyan-500/20 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] text-zinc-200 transition-all duration-300 flex items-center gap-2"
            >
              <span>Sanctuaire &amp; Dashboard</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setCurrentView('demo');
              }}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/8 border border-cyan-500/20 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] text-zinc-200 transition-all duration-300 flex items-center gap-2"
            >
              <span>Découvrir la démo</span>
            </button>
          </div>

          {/* Right Controls (Audio, Profile, Auth) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Activer le son' : 'Couper le son'}
              aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
              className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-cyan-500/20 hover:border-cyan-400/50 text-cyan-400 transition-all duration-300"
            >
              {isMuted ? (
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-xs text-zinc-200 font-medium px-3 py-1.5 rounded-xl border border-cyan-500/20 bg-white/5">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-all duration-300 text-xs"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsAuthOpen(true);
                }}
                className="px-4 py-2 rounded-xl border border-cyan-500/20 bg-white/5 hover:bg-white/8 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] text-white text-xs font-semibold tracking-wide transition-all duration-300"
              >
                Connexion
              </button>
            )}
          </div>
        </header>

        {/* 2. Hero Spatial Overlay (Ref Image 2: Left Content, Right 3D Mascot) */}
        <main className="flex-1 flex flex-col justify-between px-4 sm:px-8 md:px-12 py-4 sm:py-6 max-w-7xl mx-auto w-full">

          {authError && (
            <div role="alert" className="mx-auto mb-2 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs pointer-events-auto">
              {authError}
            </div>
          )}

          {/* Left-aligned Typography (Ref Image 2) */}
          <div className="mt-2 sm:mt-12 md:mt-20 w-full flex flex-col items-center lg:items-start text-center lg:text-left select-none max-w-2xl">
            {/* Clean, Modern Title (PRD §8.3: bold sans, subtle drop-shadow, no circuit texture) */}
            <div className="relative inline-block mb-2">
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(34,211,238,0.35)]">
                Minyx
              </h1>
              {/* Subtle holographic cyan accent line */}
              <div className="absolute -bottom-2 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
            </div>

            {/* Taglines */}
            <div className="mt-4 sm:mt-6">
              <p className="text-lg sm:text-2xl md:text-3xl font-medium tracking-tight text-white drop-shadow-sm">
                Your evolving AI companion.
              </p>
              <p className="text-sm sm:text-lg md:text-xl font-normal tracking-wide text-cyan-400 mt-1">
                Alive. Unique. Yours.
              </p>
            </div>
          </div>

          {/* 3. The 3 Glowing Neon Pill Buttons (PRD §8.4: glassmorphic, fine border, glow only on hover) */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 my-6 sm:my-8 pointer-events-auto z-20">

            {/* Button 1: Créer ton compagnon / Retrouver companion */}
            <button
              disabled={isSessionLoading}
              onClick={() => {
                sounds.playClick();
                if (user && companion) {
                  setCurrentView('dashboard');
                } else if (user) {
                  setIsInvocationOpen(true);
                } else {
                  setOpenInvocationAfterAuth(false);
                  setIsInvocationOpen(true);
                }
              }}
              className="w-full sm:w-auto px-7 sm:px-9 py-3.5 rounded-full border border-cyan-400/40 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-400/80 hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] text-white font-medium text-sm sm:text-base tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              <span>{companion ? `Retrouver ${companion.name}` : 'Créer ton compagnon'}</span>
              <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform duration-300">✦</span>
            </button>

            {/* Button 2: Connexion / Mon sanctuaire */}
            {user ? (
              <button
                onClick={() => {
                  sounds.playClick();
                  setCurrentView('dashboard');
                }}
                disabled={!companion}
                className="w-full sm:w-auto px-7 sm:px-9 py-3.5 rounded-full border border-cyan-500/20 bg-white/5 hover:bg-white/8 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] text-white font-medium text-sm sm:text-base tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                Mon sanctuaire
              </button>
            ) : (
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsAuthOpen(true);
                }}
                className="w-full sm:w-auto px-7 sm:px-9 py-3.5 rounded-full border border-cyan-500/20 bg-white/5 hover:bg-white/8 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] text-white font-medium text-sm sm:text-base tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                Connexion
              </button>
            )}

            {/* Button 3: Découvrir la démo */}
            <button
              onClick={() => {
                sounds.playClick();
                setCurrentView('demo');
              }}
              className="w-full sm:w-auto px-7 sm:px-9 py-3.5 rounded-full border border-cyan-500/20 bg-white/5 hover:bg-white/8 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] text-white font-medium text-sm sm:text-base tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Découvrir la démo
            </button>

          </div>

        </main>

        {/* 4. The 4-Point Sparkle Star (Reference Images 1 & 2) */}
        <div
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-8 md:bottom-8 md:right-10 pointer-events-none z-20"
          style={{ filter: 'drop-shadow(0 0 10px rgba(56,189,248, 0.7))' }}
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-300/80 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
          </svg>
        </div>

        {/* 5. Minimalist Clean Footer (PRD §8: text-zinc-400, no tech jargon) */}
        <footer className="w-full py-3.5 px-6 sm:px-12 border-t border-cyan-500/10 bg-slate-950/50 backdrop-blur-md text-[11px] text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto pointer-events-auto">
          <div>
            © 2026 MINYX • Compagnon IA avec mémoire persistante
          </div>
          <div className="flex items-center gap-4 text-cyan-400/70 font-mono text-[10px]">
            <span>60 FPS WEBGL</span>
            <span>•</span>
            <span>MÉMOIRE RÉELLE</span>
            <span>•</span>
            <a
              href="https://github.com/ibonon/MINYX.git"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-200 transition-colors duration-300"
            >
              GITHUB
            </a>
          </div>
        </footer>

      </div>

      {/* ── LAYER 3 : MODALS & SYSTEM SHEETS ── */}
      <InvocationModal
        isOpen={isInvocationOpen}
        onClose={() => setIsInvocationOpen(false)}
        onSuccess={handleInvocationSuccess}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setOpenInvocationAfterAuth(false);
        }}
        onSuccess={handleAuthSuccess}
      />

      {companion && (
        <MemoClawModal
          isOpen={isMemoClawOpen}
          companionId={companion.id}
          companionName={companion.name}
          onClose={() => setIsMemoClawOpen(false)}
        />
      )}

    </div>
  );
}
