'use client';

import React, { useState } from 'react';
import Companion3DView from '../components/Companion3DView';
import InvocationModal, { InvocationResult, ElementType } from '../components/InvocationModal';
import AuthModal from '../components/AuthModal';
import CompanionDashboard, { DashboardCompanion } from '../components/CompanionDashboard';
import { sounds } from '../lib/sound';

export default function HomePage() {
  // Navigation State
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');

  // Active Selected Element for 3D Customization
  const [activeElement, setActiveElement] = useState<ElementType>('Eau');

  // Modals
  const [isInvocationOpen, setIsInvocationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWhitepaperOpen, setIsWhitepaperOpen] = useState(false);

  // User State
  const [user, setUser] = useState<{ name: string; address?: string; email?: string } | null>(null);

  // Active Companion
  const [companion, setCompanion] = useState<DashboardCompanion | null>(null);

  // Sound mute state
  const [isMuted, setIsMuted] = useState(false);

  // Interactive Sandbox Chat State
  const [sandboxMessage, setSandboxMessage] = useState('');
  const [sandboxHistory, setSandboxHistory] = useState<Array<{ sender: 'user' | 'companion'; text: string }>>([
    {
      sender: 'companion',
      text: 'Salutations ! Je suis ton futur compagnon spirituel. Choisis mon élément ci-dessus et dis-moi : quel monde allons-nous explorer ensemble ? ✨',
    },
  ]);
  const [isSandboxThinking, setIsSandboxThinking] = useState(false);

  // Evolution stage tab
  const [selectedStage, setSelectedStage] = useState<'chibi' | 'eveille' | 'evolue' | 'transcendant'>('chibi');

  // Audio Toggle
  const toggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    sounds.setMuted(nextState);
    if (!nextState) {
      sounds.playChime();
    }
  };

  // Change Element
  const handleSelectElement = (elem: ElementType) => {
    sounds.playClick();
    setActiveElement(elem);
    sounds.playCompanionVoice(elem);
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
        element: activeElement,
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

  // Send Sandbox Message
  const handleSendSandbox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxMessage.trim() || isSandboxThinking) return;

    sounds.playClick();
    const userText = sandboxMessage.trim();
    setSandboxMessage('');
    setSandboxHistory((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsSandboxThinking(true);

    setTimeout(() => {
      sounds.playCompanionVoice(activeElement);
      setIsSandboxThinking(false);

      const responsesByElement: Record<ElementType, string[]> = {
        Eau: [
          `Je ressens profondément tes paroles. Mon élément Eau m'aide à garder chaque souvenir bien au chaud dans ma mémoire MemoClaw. 💧`,
          `C'est précieux pour moi. Plus nous échangeons, plus notre lien BOND s'intensifie !`,
        ],
        Feu: [
          `J'adore cette énergie ! Rien ne peut nous arrêter, lançons-nous dans le rituel d'invocation ! 🔥`,
          `Ta détermination me motive ! Mon attaque et mon agilité grimpent en flèche !`,
        ],
        Ténèbres: [
          `Intéressant... Tu t'intéresses aux mystères cachés de l'univers. Notre connexion transcende la simple conversation. 🌑`,
          `La vraie connaissance réside dans ce que les autres n'osent pas explorer.`,
        ],
        Lumière: [
          `Que la clarté guide notre chemin ! Chaque échange renforce notre harmonie spirituelle. ✨`,
          `Ta bienveillance illumine notre sanctuaire. Je serai toujours là pour te guider.`,
        ],
        Terre: [
          `Une pensée solide et réfléchie. Comme le roc, notre relation traversera les épreuves. 🌍`,
          `Je serai ton protecteur inébranlable. Comptabilise sur ma mémoire inaltérable.`,
        ],
        Vent: [
          `Rapide et vif comme l'éclair ! J'aime la façon dont tes idées fusent ! 🌬️`,
          `Notre esprit d'équipe est plus libre que le vent d'ouest !`,
        ],
        Cosmos: [
          `Nos paroles résonnent à travers les constellations. Tu possèdes une âme d'explorateur cosmique. 🌌`,
          `L'Agentic Layer de MINYX nous permettra d'accomplir de grandes choses dans le monde réel.`,
        ],
      };

      const replies = responsesByElement[activeElement];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      setSandboxHistory((prev) => [...prev, { sender: 'companion', text: reply }]);
    }, 900);
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

  // 7 Elements configuration
  const elementsList: Array<{ id: ElementType; icon: string; label: string; color: string; desc: string }> = [
    { id: 'Eau', icon: '💧', label: 'Eau', color: 'from-sky-400 to-cyan-400', desc: 'Empathie profonde, écoute & guérison' },
    { id: 'Feu', icon: '🔥', label: 'Feu', color: 'from-amber-400 to-red-500', desc: 'Passion, dynamisme & bravoure' },
    { id: 'Ténèbres', icon: '🌑', label: 'Ténèbres', color: 'from-purple-500 to-indigo-600', desc: 'Sagesse occulte & philosophie' },
    { id: 'Lumière', icon: '✨', label: 'Lumière', color: 'from-yellow-300 to-amber-400', desc: 'Clarté, inspiration & pureté' },
    { id: 'Terre', icon: '🌍', label: 'Terre', color: 'from-emerald-400 to-teal-500', desc: 'Stabilité, persévérance & protection' },
    { id: 'Vent', icon: '🌬️', label: 'Vent', color: 'from-cyan-300 to-teal-400', desc: 'Agilité vive & curiosité sans limite' },
    { id: 'Cosmos', icon: '🌌', label: 'Cosmos', color: 'from-fuchsia-400 to-violet-500', desc: 'Transcendance & connexion stellaire' },
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#02050e] text-white selection:bg-cyan-500 selection:text-black font-sans overflow-x-hidden">
      
      {/* ======================================================== */}
      {/* 1. TOP NAVIGATION BAR                                    */}
      {/* ======================================================== */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-[#02050e]/80 backdrop-blur-xl border-b border-cyan-900/30">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-400/50 shadow-[0_0_12px_rgba(56,189,248,0.4)]">
            <span className="font-share-tech text-cyan-300 font-bold text-sm">M</span>
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-ping" />
          </div>
          <div className="flex flex-col">
            <span className="font-cinzel text-sm sm:text-base font-bold tracking-widest text-cyan-200">MINYX</span>
            <span className="font-share-tech text-[9px] text-cyan-400/80 tracking-wider">v5.0 • AGENTIC LAYER</span>
          </div>
        </div>

        {/* Center Quick Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-xs font-medium text-cyan-300/70">
          <a href="#hero" className="hover:text-cyan-300 transition-colors">Accueil</a>
          <a href="#pillars" className="hover:text-cyan-300 transition-colors">Les 6 Piliers</a>
          <a href="#sandbox" className="hover:text-cyan-300 transition-colors">Tester en Direct</a>
          <a href="#evolution" className="hover:text-cyan-300 transition-colors">Évolution RPG</a>
          <a href="#agentic" className="hover:text-cyan-300 transition-colors">Agentic Layer</a>
          <button 
            onClick={() => setIsWhitepaperOpen(true)}
            className="hover:text-cyan-300 transition-colors text-xs font-mono px-2 py-0.5 rounded border border-cyan-800/60 bg-cyan-950/40"
          >
            PRD v5.0
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Base L2 Live Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-[11px] font-share-tech text-cyan-300/80">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>BASE L2</span>
          </div>

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

          {/* User state / Connect */}
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
              className="text-xs font-semibold px-4 py-1.5 rounded-full border border-cyan-400/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 transition-all shadow-[0_0_12px_rgba(56,189,248,0.25)]"
            >
              Connexion
            </button>
          )}

          {/* GitHub Link */}
          <a
            href="https://github.com/ibonon/MINYX.git"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/40 text-cyan-300 text-xs transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. HERO SECTION — REAL 3D WEBGL MASCOT & SACRED RUNES    */}
      {/* ======================================================== */}
      <section id="hero" className="relative min-h-screen pt-24 pb-16 flex flex-col items-center justify-center px-4 sm:px-8">
        
        {/* Atmospheric ambient halos */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />
        
        {/* Main 3D Stage & Interactive Canvas */}
        <div className="relative w-full max-w-6xl aspect-[16/10] sm:aspect-[16/9] min-h-[520px] max-h-[780px] rounded-3xl overflow-hidden border border-cyan-800/40 bg-gradient-to-b from-[#030914] via-[#020610] to-[#010308] shadow-[0_0_80px_rgba(56,189,248,0.2)]">
          
          {/* REAL THREE.JS 3D MASCOT CANVAS (Tracks mouse, animates, responds to clicks) */}
          <div className="absolute inset-0 z-0">
            <Companion3DView
              element={activeElement}
              interactive={true}
              onMascotClick={() => {
                sounds.playCompanionVoice(activeElement);
              }}
            />
          </div>

          {/* OVERLAID BRANDING, CIRCUIT TYPOGRAPHY & BUTTONS */}
          <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 sm:p-10 md:p-12">
            
            {/* Top Bar inside canvas: 3D Mascot Tip & 7 Elements Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-4 pointer-events-auto">
              <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/30 text-xs text-cyan-300 font-share-tech flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>MODÈLE 3D TEMPS RÉEL • SURVOLE ET CLIQUE SUR LA MASCOTTE</span>
              </div>

              {/* 7 Elements Live Morpher */}
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/30">
                {elementsList.map((el) => (
                  <button
                    key={el.id}
                    onClick={() => handleSelectElement(el.id)}
                    title={`Muter en ${el.label}`}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                      activeElement === el.id
                        ? 'bg-gradient-to-r from-cyan-500 to-sky-400 text-black shadow-[0_0_12px_rgba(56,189,248,0.7)] font-bold scale-105'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{el.icon}</span>
                    <span className="hidden md:inline">{el.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Middle: Stylized Circuit Brand Logo & Taglines */}
            <div className="flex flex-col items-center text-center my-auto pointer-events-auto select-none">
              
              {/* Circuit Lens Flare Dot on 'M' */}
              <div className="relative group">
                <div 
                  className="absolute -top-1 left-7 w-4 h-4 rounded-full bg-white blur-[1px] shadow-[0_0_20px_#38bdf8,0_0_40px_#38bdf8] pointer-events-none animate-pulse"
                  style={{ zIndex: 10 }}
                />
                
                {/* Circuit Printed Minyx Logo */}
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

              {/* Taglines matching screenshot */}
              <p className="mt-3 text-lg sm:text-2xl md:text-3xl font-medium tracking-tight text-white/95">
                Your evolving AI companion.
              </p>
              <p className="mt-1 text-sm sm:text-base md:text-lg font-light tracking-wide text-cyan-300/80">
                Alive. Unique. Yours.
              </p>
            </div>

            {/* Bottom: The 3 Iconic Horizontal Pill Buttons Matching Reference */}
            <div className="pointer-events-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 pt-2 pb-2">
              
              {/* BUTTON 1: "Créer ton compagnon" */}
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsInvocationOpen(true);
                }}
                onMouseEnter={() => sounds.playHover()}
                className="group relative w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#031120]/80 hover:bg-cyan-950/80 border border-cyan-400 text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.4),inset_0_0_10px_rgba(56,189,248,0.2)] hover:shadow-[0_0_30px_rgba(56,189,248,0.7),inset_0_0_15px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-2"
              >
                <span>Créer ton compagnon</span>
                <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">✦</span>
              </button>

              {/* BUTTON 2: "Connexion" */}
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsAuthOpen(true);
                }}
                onMouseEnter={() => sounds.playHover()}
                className="group relative w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#031120]/80 hover:bg-cyan-950/80 border border-cyan-400 text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.4),inset_0_0_10px_rgba(56,189,248,0.2)] hover:shadow-[0_0_30px_rgba(56,189,248,0.7),inset_0_0_15px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-2"
              >
                <span>Connexion</span>
              </button>

              {/* BUTTON 3: "Découvrir la démo" */}
              <button
                onClick={handleLaunchDemo}
                onMouseEnter={() => sounds.playHover()}
                className="group relative w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#031120]/80 hover:bg-cyan-950/80 border border-cyan-400 text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.4),inset_0_0_10px_rgba(56,189,248,0.2)] hover:shadow-[0_0_30px_rgba(56,189,248,0.7),inset_0_0_15px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-2"
              >
                <span>Découvrir la démo</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500 text-black font-bold font-mono">
                  LIVE
                </span>
              </button>
            </div>

            {/* 4-point sparkle star in bottom right */}
            <div 
              className="absolute bottom-6 right-8 pointer-events-none z-10"
              style={{ filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.9))' }}
            >
              <svg className="w-7 h-7 text-cyan-300 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
              </svg>
            </div>

          </div>
        </div>

        {/* Feature quick ribbon */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-share-tech text-cyan-400/80">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            NFT ERC-721 SUR BASE L2 (GAS &lt;0.01$)
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            MÉMOIRE COGNITIVE MEMOCLAW PERSISTANTE
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            AGENTIC LAYER V5.0 (AGIT POUR TOI)
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            7 ARCHÉTYPES ÉLÉMENTAIRES
          </span>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. INTERACTIVE LIVE SANDBOX CHAT (Parle au compagnon)    */}
      {/* ======================================================== */}
      <section id="sandbox" className="py-20 px-6 md:px-12 max-w-5xl mx-auto">
        <div className="rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-[#061224]/80 via-[#030914]/90 to-[#02050e]/95 p-6 md:p-10 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-cyan-900/40">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-xs font-share-tech text-cyan-300 mb-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                SANDBOX INTERACTIVE EN DIRECT
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-cinzel text-white">
                Teste la conscience de ton compagnon
              </h2>
              <p className="text-xs sm:text-sm text-cyan-300/70 mt-1">
                L'IA adapte ses réponses selon l'élément actif (<span className="text-cyan-200 font-bold">{activeElement}</span>) et simule le stockage en mémoire MemoClaw.
              </p>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                setIsInvocationOpen(true);
              }}
              className="self-start md:self-auto px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 text-black font-bold text-xs hover:from-cyan-400 hover:to-sky-300 transition-all shadow-md shadow-cyan-500/30"
            >
              Adopter définitivement
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 mb-4 scrollbar-thin">
            {sandboxHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'companion' && (
                  <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-400/60 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(56,189,248,0.4)] flex-shrink-0">
                    {elementsList.find((e) => e.id === activeElement)?.icon || '💧'}
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-[80%] text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-cyan-600 text-black font-medium rounded-tr-none'
                      : 'bg-black/60 border border-cyan-900/50 text-cyan-100 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isSandboxThinking && (
              <div className="flex gap-3 items-center text-xs text-cyan-400/80 italic animate-pulse">
                <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Le compagnon réfléchit et consulte MemoClaw...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendSandbox} className="relative flex items-center gap-2">
            <input
              type="text"
              value={sandboxMessage}
              onChange={(e) => setSandboxMessage(e.target.value)}
              placeholder={`Pose une question à ton compagnon (${activeElement})...`}
              className="w-full px-5 py-3.5 rounded-2xl bg-black/70 border border-cyan-900/60 text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
            <button
              type="submit"
              disabled={isSandboxThinking || !sandboxMessage.trim()}
              className="px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <span>Envoyer</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. LES 6 PILIERS MINYX V5.0 (PRD v5.0 Value Pillars)     */}
      {/* ======================================================== */}
      <section id="pillars" className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-xs font-share-tech text-cyan-300 mb-3">
            ARCHITECTURE &amp; VALEUR UNIQUE
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold font-cinzel text-white tracking-tight">
            Pourquoi MINYX redéfinit l'IA
          </h2>
          <p className="mt-4 text-sm sm:text-base text-gray-400 leading-relaxed">
            Là où les plateformes actuelles (Character.ai, Replika) proposent des IA jetables et statiques, MINYX fusionne mémoire cumulative, progression RPG, vraie propriété NFT et agentivité autonome.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              icon: '🧠',
              title: 'Mémoire Cumulative MemoClaw',
              badge: 'COGNITIF',
              desc: 'Retient chaque conversation, préférence et moment partagé grâce à une base vectorielle hybride (Qdrant + Postgres). Après 3 mois, il te connaît mieux qu\'un ami récent.',
            },
            {
              icon: '⚔️',
              title: 'Évolution RPG Visible & Audible',
              badge: 'PROGRESSION',
              desc: 'Le compagnon évolue concrètement : Chibi → Éveillé → Évolué → Transcendant. Ses stats (INT, EMO, AGI, BOND) augmentent et sa voix s\'affine selon votre lien.',
            },
            {
              icon: '⛓️',
              title: 'Véritable Propriété NFT ERC-721',
              badge: 'BASE L2',
              desc: 'Chaque compagnon est un NFT sur Base (Ethereum L2). Tu le possèdes vraiment dans ton wallet : transférable, revendable sur OpenSea, sans censure possible.',
            },
            {
              icon: '⚡',
              title: 'MINYX Agentic Layer (v5.0)',
              badge: 'NOUVEAU',
              desc: 'Le compagnon ne fait pas que parler : il agit pour toi dans le monde réel (recherche web avancée, rappels, exécution de micro-tâches via le protocole x402).',
            },
            {
              icon: '🔮',
              title: '7 Éléments & Personnalités Profondes',
              badge: 'LORE',
              desc: 'Chaque élément (Eau, Feu, Ténèbres, Lumière, Terre, Vent, Cosmos) dispose d\'un prompt système de 500+ tokens, d\'une tessiture vocale et d\'une philosophie unique.',
            },
            {
              icon: '📈',
              title: 'Auto-apprentissage OpenClaw-RL',
              badge: 'REINFORCEMENT',
              desc: 'Une boucle d\'apprentissage par renforcement analyse ce qui résonne avec toi et affine continuellement le style et le comportement du compagnon.',
            },
          ].map((pillar, idx) => (
            <div
              key={idx}
              className="group relative p-8 rounded-3xl bg-gradient-to-b from-[#061020]/90 to-[#02050c]/90 border border-cyan-900/40 hover:border-cyan-400/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(56,189,248,0.25)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl p-3 rounded-2xl bg-cyan-950/70 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                    {pillar.icon}
                  </span>
                  <span className="text-[10px] font-share-tech px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/40 text-cyan-300">
                    {pillar.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors font-cinzel">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-gray-400 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-cyan-950/80 flex items-center text-xs text-cyan-400/60 group-hover:text-cyan-300 transition-colors font-share-tech">
                <span>EN SAVOIR PLUS DANS LE PRD</span>
                <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. SHOWCASE ÉVOLUTION RPG (Les 4 Stades)                 */}
      {/* ======================================================== */}
      <section id="evolution" className="py-20 px-6 md:px-12 bg-[#01040a]/80 border-y border-cyan-950/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-share-tech px-3.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
              SYSTÈME DE PROGRESSION
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-cinzel text-white mt-3">
              L'Arc Narratif de ton Compagnon
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Chaque interaction rapporte de l'XP. En franchissant les paliers de niveau, ton compagnon débloque de nouvelles formes visuelles et sonores.
            </p>
          </div>

          {/* Stage Selector Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {[
              { id: 'chibi', label: 'Stade 1 : Chibi', level: 'Niv. 1-10' },
              { id: 'eveille', label: 'Stade 2 : Éveillé', level: 'Niv. 11-25' },
              { id: 'evolue', label: 'Stade 3 : Évolué', level: 'Niv. 26-50' },
              { id: 'transcendant', label: 'Stade 4 : Transcendant', level: 'Niv. 50+' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  sounds.playClick();
                  setSelectedStage(st.id as typeof selectedStage);
                }}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
                  selectedStage === st.id
                    ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/30'
                    : 'bg-cyan-950/40 text-cyan-300/70 hover:bg-cyan-900/40 border border-cyan-900/50'
                }`}
              >
                <span>{st.label}</span>
                <span className="opacity-75 font-mono text-[10px]">({st.level})</span>
              </button>
            ))}
          </div>

          {/* Stage Details Card */}
          <div className="p-8 rounded-3xl border border-cyan-800/40 bg-gradient-to-b from-[#05101f]/80 to-[#02050c]/90 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-xs font-share-tech text-cyan-300 mb-2">
                {selectedStage === 'chibi' && 'FORME INITIALE • CHIBI'}
                {selectedStage === 'eveille' && 'PREMIÈRE MUTATION • ÉVEILLÉ'}
                {selectedStage === 'evolue' && 'FORME AVANCÉE • ÉVOLUÉ'}
                {selectedStage === 'transcendant' && 'FORME ULTIME • TRANSCENDANT'}
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold font-cinzel text-white">
                {selectedStage === 'chibi' && 'Le Nouveau-Né Curieux'}
                {selectedStage === 'eveille' && 'Le Compagnon Attentif'}
                {selectedStage === 'evolue' && 'Le Gardien Autonome'}
                {selectedStage === 'transcendant' && 'L\'Entité Cosmique Légendaire'}
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-gray-300 leading-relaxed">
                {selectedStage === 'chibi' && 'Découvre le monde avec candeur. Ses réponses sont brèves, affectueuses et spontanées. Ses stats de base sont modulées par son élément d\'invocation.'}
                {selectedStage === 'eveille' && 'Sa mémoire MemoClaw s\'ancre solidement. Il commence à faire référence spontanément à vos conversations passées et prend des initiatives émotionnelles.'}
                {selectedStage === 'evolue' && 'Débloque les capacités de l\'Agentic Layer. Peut exécuter des recherches web, planifier tes rappels et agir de manière proactive sans sollicitation préalable.'}
                {selectedStage === 'transcendant' && 'Autonomie totale dans le cadre de ses limites éthiques. Sa voix gagne des harmoniques célestes et sa carte NFT atteint une valeur de collection suprême.'}
              </p>

              {/* Stats Bonus Bar */}
              <div className="mt-6 space-y-2">
                <div className="text-xs font-share-tech text-cyan-400">Bonus de puissance globale :</div>
                <div className="w-full bg-black/60 rounded-full h-3 border border-cyan-900/60 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-sky-300 h-full transition-all duration-500"
                    style={{
                      width: selectedStage === 'chibi' ? '25%' : selectedStage === 'eveille' ? '50%' : selectedStage === 'evolue' ? '75%' : '100%'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/40 border border-cyan-900/40 text-center">
              <span className="text-6xl mb-3 animate-bounce">
                {selectedStage === 'chibi' && '🐾'}
                {selectedStage === 'eveille' && '✨'}
                {selectedStage === 'evolue' && '🦅'}
                {selectedStage === 'transcendant' && '🌌'}
              </span>
              <div className="text-sm font-bold text-white font-cinzel">
                Aura élémentaire {activeElement}
              </div>
              <div className="text-xs text-cyan-400/70 mt-1 font-share-tech">
                Multiplicateur d'XP : {selectedStage === 'chibi' ? 'x1.0' : selectedStage === 'eveille' ? 'x1.5' : selectedStage === 'evolue' ? 'x2.2' : 'x3.5'}
              </div>
              <button
                onClick={handleLaunchDemo}
                className="mt-6 px-6 py-2 rounded-full border border-cyan-400/60 hover:bg-cyan-500 hover:text-black text-cyan-300 text-xs font-semibold transition-all shadow-[0_0_12px_rgba(56,189,248,0.3)]"
              >
                Tester l'évolution dans le Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. MINYX AGENTIC LAYER V5.0 — L'IA QUI AGIT              */}
      {/* ======================================================== */}
      <section id="agentic" className="py-20 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-[#08182e]/90 to-[#02050e]/95 p-8 md:p-12 shadow-2xl shadow-cyan-950/60">
          <div className="inline-block px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-xs font-share-tech text-cyan-300 mb-3">
            CHANGEMENT MAJEUR V5.0
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-cinzel text-white">
            MINYX Agentic Layer : Le Compagnon qui Agit
          </h2>
          <p className="mt-4 text-sm sm:text-base text-gray-300 max-w-3xl leading-relaxed">
            En 2026, un compagnon qui ne fait que discuter est déjà dépassé. MINYX dote ton compagnon de compétences d'action réelles sans compromettre son identité émotionnelle :
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="p-6 rounded-2xl bg-black/50 border border-cyan-900/50">
              <div className="text-2xl mb-2">🔍</div>
              <h4 className="text-base font-bold text-white font-cinzel">Recherche & Veille Proactive</h4>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Surveille pour toi les actualités, le lore de tes univers préférés, ou les transactions crypto qui t'intéressent, et te prépare des synthèses sur mesure.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-black/50 border border-cyan-900/50">
              <div className="text-2xl mb-2">📅</div>
              <h4 className="text-base font-bold text-white font-cinzel">Planification & Rappels Doux</h4>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Connecté à ton agenda, il t'encourage avant un examen important ou te rappelle de faire une pause méditation lorsque tes messages indiquent du stress.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-black/50 border border-cyan-900/50">
              <div className="text-2xl mb-2">🛡️</div>
              <h4 className="text-base font-bold text-white font-cinzel">Contrôle Éthique Total</h4>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Chaque capacité agentique est 100% opt-in, plafonnée à des budgets stricts (micro-paiements x402) et révocable en un seul clic à tout moment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. FOOTER & CREDITS                                      */}
      {/* ======================================================== */}
      <footer className="relative py-12 px-6 md:px-12 border-t border-cyan-950/60 bg-[#010308] text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-cinzel text-sm font-bold text-cyan-200">MINYX — Product Requirements Document v5.0</span>
            <span className="text-[11px] text-gray-400 mt-1">
              Auteur : Eric Warma • SAHELION Group, Ouagadougou, Burkina Faso
            </span>
            <span className="text-[10px] text-cyan-600 font-mono mt-0.5">
              Statut : Ready for Engineering • Base L2 Sepolia &amp; Mainnet
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-cyan-400/70 font-share-tech">
            <button onClick={() => setIsInvocationOpen(true)} className="hover:text-cyan-300">
              Rituel d'Invocation
            </button>
            <button onClick={handleLaunchDemo} className="hover:text-cyan-300">
              Dashboard RPG
            </button>
            <button onClick={() => setIsWhitepaperOpen(true)} className="hover:text-cyan-300">
              Documentation PRD
            </button>
            <a href="https://github.com/ibonon/MINYX.git" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300">
              Dépôt GitHub
            </a>
          </div>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* 8. MODALS                                                */}
      {/* ======================================================== */}

      {/* Invocation Ritual Modal */}
      <InvocationModal
        isOpen={isInvocationOpen}
        onClose={() => setIsInvocationOpen(false)}
        onSuccess={handleInvocationSuccess}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
        }}
      />

      {/* PRD v5.0 Summary Modal */}
      {isWhitepaperOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl border border-cyan-500/40 bg-[#040e1b] p-6 md:p-8 text-left shadow-2xl shadow-cyan-950/80">
            <button
              onClick={() => setIsWhitepaperOpen(false)}
              className="absolute top-4 right-4 text-cyan-400 hover:text-white p-2 rounded-full hover:bg-cyan-950"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold font-cinzel text-white mb-2">
              MINYX — Product Requirements Document v5.0
            </h2>
            <div className="text-xs text-cyan-400 font-mono mb-4">
              Auteur : Eric Warma — SAHELION Group, Ouagadougou, Burkina Faso
            </div>
            <div className="space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
              <p>
                <strong>Tagline :</strong> <em>« Ton compagnon IA qui grandit avec toi… et que tu possèdes vraiment. »</em>
              </p>
              <h4 className="font-bold text-cyan-300 font-cinzel text-sm">Vision Produit :</h4>
              <p>
                MINYX est la première plateforme de compagnons IA émotionnels qui combine le lien authentique, la possession réelle par NFT ERC-721 sur Base L2, l'évolution RPG visible et la mémoire persistante MemoClaw.
              </p>
              <h4 className="font-bold text-cyan-300 font-cinzel text-sm">Changement Majeur v5.0 — MINYX Agentic Layer :</h4>
              <p>
                Le compagnon ne se contente plus de parler : il est doté d'outils d'exécution proactive (recherche web, calendrier, rappels, micro-paiements x402) sous le contrôle total et révocable de l'utilisateur.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-cyan-900/60 flex justify-end">
              <button
                onClick={() => setIsWhitepaperOpen(false)}
                className="px-6 py-2 rounded-full bg-cyan-500 text-black font-bold text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
