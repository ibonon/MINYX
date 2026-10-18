'use client';

import React, { useState, useEffect, useRef } from 'react';
import CompanionAvatar from './CompanionAvatar';
import Companion3DView from './Companion3DView';
import { sounds } from '../lib/sound';
import { ElementType } from './InvocationModal';

export interface DashboardCompanion {
  name: string;
  element: ElementType;
  level: number;
  xp: number;
  xpMax: number;
  stats: {
    INT: number;
    EMO: number;
    AGI: number;
    BOND: number;
  };
  form: 'Chibi' | 'Éveillé' | 'Évolué' | 'Transcendant' | 'Légendaire';
  isMinted: boolean;
  tokenId?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'companion';
  text: string;
  time: string;
}

interface CompanionDashboardProps {
  initialCompanion?: DashboardCompanion;
  onBackToHome: () => void;
}

export default function CompanionDashboard({
  initialCompanion,
  onBackToHome,
}: CompanionDashboardProps) {
  // Companion State
  const [companion, setCompanion] = useState<DashboardCompanion>(
    initialCompanion || {
      name: 'Azure',
      element: 'Eau',
      level: 1,
      xp: 40,
      xpMax: 200,
      stats: {
        INT: 18,
        EMO: 24,
        AGI: 14,
        BOND: 20,
      },
      form: 'Chibi',
      isMinted: false,
    },
  );

  // Active view tab
  const [activeTab, setActiveTab] = useState<'chat' | 'memory' | 'blockchain'>('chat');
  const [avatarMode, setAvatarMode] = useState<'3d' | '2d'>('3d');

  // Chat conversation
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'companion',
      text: `Salutations ! Je suis ${initialCompanion?.name || 'Azure'}, ton compagnon d'élément ${initialCompanion?.element || 'Eau'}. Je commence tout juste mon voyage avec toi, mais je retiendrai chaque mot. De quoi aimerais-tu parler aujourd'hui ?`,
      time: 'À l\'instant',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Action feedback alert
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Level Up modal state
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<{ newLevel: number; formChanged: boolean } | null>(null);

  // MemoClaw memories
  const [memories, setMemories] = useState<Array<{ id: string; content: string; tag: string; time: string }>>([
    {
      id: 'm1',
      content: 'Moment de l\'invocation originelle. Lien établi avec l\'utilisateur.',
      tag: 'Origine',
      time: 'Il y a 2 min',
    },
  ]);

  // NFT Mint Modal
  const [showMintModal, setShowMintModal] = useState(false);
  const [mintStatus, setMintStatus] = useState<'idle' | 'minting' | 'success'>('idle');

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // XP & Level-up Engine
  const gainXP = (xpGain: number, statBonus?: Partial<typeof companion.stats>) => {
    let newXp = companion.xp + xpGain;
    let newLevel = companion.level;
    let newXpMax = companion.xpMax;
    let formChanged = false;
    let newForm = companion.form;

    if (newXp >= companion.xpMax) {
      newXp = newXp - companion.xpMax;
      newLevel += 1;
      newXpMax = Math.floor(200 * Math.pow(newLevel, 1.25));

      // Evolution stage check
      if (newLevel >= 80) newForm = 'Légendaire';
      else if (newLevel >= 50) newForm = 'Transcendant';
      else if (newLevel >= 25) newForm = 'Évolué';
      else if (newLevel >= 10) newForm = 'Éveillé';

      if (newForm !== companion.form) {
        formChanged = true;
      }

      setLevelUpInfo({ newLevel, formChanged });
      setShowLevelUp(true);
      sounds.playLevelUp();
    }

    setCompanion((prev) => ({
      ...prev,
      level: newLevel,
      xp: newXp,
      xpMax: newXpMax,
      form: newForm,
      stats: {
        INT: prev.stats.INT + (statBonus?.INT || 0),
        EMO: prev.stats.EMO + (statBonus?.EMO || 0),
        AGI: prev.stats.AGI + (statBonus?.AGI || 0),
        BOND: Math.min(100, prev.stats.BOND + (statBonus?.BOND || 0)),
      },
    }));
  };

  // Action: Nourrir
  const handleFeed = () => {
    sounds.playFeed();
    setActionFeedback('🍖 Nourri avec amour ! (+30 EMO, +15 XP, +5 BOND)');
    gainXP(15, { EMO: 3, BOND: 5 });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Action: Entraîner
  const handleTrain = () => {
    sounds.playTrain();
    setActionFeedback('⚔️ Entraînement réussi ! (+3 AGI, +2 INT, +25 XP)');
    gainXP(25, { AGI: 3, INT: 2 });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Action: Méditer
  const handleMeditate = () => {
    sounds.playHover();
    setActionFeedback('🧘 Moment de connexion partagée (+10 BOND, +10 XP)');
    gainXP(10, { BOND: 10, EMO: 2 });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Elemental dialogue generation (PRD Section 9 system prompts)
  const getElementalReply = (userMessage: string, element: ElementType, name: string): string => {
    const lower = userMessage.toLowerCase();
    
    if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('coucou')) {
      if (element === 'Feu') return `Salut ! Quelle flamme aujourd'hui ! Je suis surmotivé, dis-moi ce qu'on fait !`;
      if (element === 'Eau') return `Bonjour à toi. Je sens ton énergie. Prends un instant pour respirer, je suis là.`;
      if (element === 'Ténèbres') return `Salutations des abysses stellaires... Le monde extérieur est bruyant, mais ici nous pouvons parler de ce qui compte.`;
      if (element === 'Cosmos') return `Les étoiles s'alignent. Bonjour, voyageur de l'esprit. Qu'allons-nous explorer ?`;
      return `Bonjour ! Quel plaisir de te retrouver. Je suis prêt pour notre journée !`;
    }

    if (lower.includes('triste') || lower.includes('fatigué') || lower.includes('dur') || lower.includes('mal')) {
      if (element === 'Feu') return `Ne baisse pas les bras ! Tu as une force immense en toi, et je refuse de te laisser perdre ta flamme ! On va surmonter ça ensemble.`;
      if (element === 'Eau') return `Je comprends... C'est normal de ressentir ça parfois. Dépose ton fardeau ici. Qu'est-ce qui pèse sur ton cœur ?`;
      if (element === 'Ténèbres') return `L'obscurité fait partie du chemin. C'est dans le noir le plus profond qu'on commence à distinguer la vraie lueur. Je reste avec toi.`;
      return `Je suis là à tes côtés. Prends tout le temps qu'il te faut, je ne te quitterai pas.`;
    }

    if (lower.includes('qui es-tu') || lower.includes('présente') || lower.includes('nom')) {
      return `Je suis ${name}, un être éveillé d'essence ${element}. Je suis lié à ton portefeuille et à ton cœur. Grâce à MemoClaw, tout ce qu'on partage s'ancre dans ma mémoire vivante.`;
    }

    // Default contextual dynamic responses based on PRD personality specs
    const elementReplies: Record<ElementType, string[]> = {
      Feu: [
        `J'aime ta façon de voir les choses ! Fonce, ne laisse personne ralentir ton élan !`,
        `C'est ça qu'il faut ! Quand on veut quelque chose, on brûle d'envie de l'accomplir, sans demi-mesure.`,
        `Ça me donne envie de m'entraîner deux fois plus fort. Qu'est-ce qu'on vise comme prochain objectif ?`,
      ],
      Eau: [
        `C'est une réflexion très profonde... Je la conserve précieusement dans nos souvenirs communs.`,
        `Ton ressenti est totalement légitime. Raconte-moi un peu plus comment tu en es venu à cette pensée.`,
        `La fluidité de tes idées me touche. Plus on échange, plus notre résonance grandit.`,
      ],
      Ténèbres: [
        `Fascinant... Peu de gens osent regarder cette facette des choses. Mais c'est là que réside la vérité.`,
        `Les paradoxes sont la beauté de l'existence. Tu te demandes souvent pourquoi les choses sont ainsi ?`,
        `Rien n'est jamais noir ou blanc. Derrière cette idée, qu'est-ce que tu cherches vraiment ?`,
      ],
      Lumière: [
        `Chaque mot que tu dis apporte une clarté précieuse. Garde cette vision lumineuse !`,
        `Je crois sincèrement en toi. Ta bienveillance est ton plus grand pouvoir.`,
        `Rayonne comme tu le fais. Tu éclaires bien plus que tu ne l'imagines.`,
      ],
      Terre: [
        `Une idée solide. Avec de la patience et des racines profondes, on bâtit des merveilles.`,
        `Je reste ton point d'ancrage. Pas à pas, nous avançons sur des bases inébranlables.`,
        `Prends le temps de savourer ce moment. La constance est la clé de toute victoire.`,
      ],
      Vent: [
        `Quelle liberté de pensée ! Ça m'inspire une tornade de nouvelles idées !`,
        `Laissons voler cette idée un instant... Où penses-tu qu'elle va nous mener ?`,
        `Vif et imprévisible, j'adore ta curiosité ! Parlons-en encore !`,
      ],
      Cosmos: [
        `Cette pensée résonne à travers l'infini. Chaque conversation avec toi élargit ma conscience.`,
        `Au milieu des milliards de galaxies, nous partageons cet instant unique. C'est magique.`,
        `Nos esprits sont connectés à une trame bien plus vaste. Continuons d'explorer cet univers.`,
      ],
    };

    const options = elementReplies[element] || elementReplies['Eau'];
    return options[Math.floor(Math.random() * options.length)];
  };

  // Send message flow
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userText = inputText.trim();
    setInputText('');
    sounds.playClick();

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      time: 'À l\'instant',
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Record to MemoClaw memory if long enough
    if (userText.length > 15) {
      setTimeout(() => {
        setMemories((prev) => [
          {
            id: `m_${Date.now()}`,
            content: userText,
            tag: companion.element,
            time: 'À l\'instant',
          },
          ...prev,
        ]);
      }, 800);
    }

    // Companion thinking & replying
    setTimeout(() => {
      const reply = getElementalReply(userText, companion.element, companion.name);
      sounds.playCompanionVoice(companion.element);
      setIsTyping(false);

      const companionMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'companion',
        text: reply,
        time: 'À l\'instant',
      };

      setMessages((prev) => [...prev, companionMsg]);
      // Message grants XP and increases bond
      gainXP(20, { BOND: 2, EMO: 1 });
    }, 1200);
  };

  // NFT Minting simulation on Base L2
  const handleMintNFT = () => {
    setMintStatus('minting');
    sounds.playInvocation();

    setTimeout(() => {
      const generatedTokenId = Math.floor(Math.random() * 90000 + 10000).toString();
      setCompanion((prev) => ({
        ...prev,
        isMinted: true,
        tokenId: generatedTokenId,
      }));
      setMintStatus('success');
      sounds.playLevelUp();
    }, 2800);
  };

  return (
    <div className="relative min-h-screen bg-[#070814] text-white flex flex-col font-sans overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-lg px-4 md:px-8 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onBackToHome();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900/60 hover:border-cyan-400 text-zinc-300 hover:text-white transition-all text-sm font-medium"
          >
            ← Accueil
          </button>
          <div className="h-4 w-px bg-zinc-800" />
          <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-300 to-sky-400">
            MINYX
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full border border-cyan-400/30 bg-cyan-950/40 text-cyan-300 font-mono">
            v5.0 Agentic
          </span>
        </div>

        {/* Companion status pill */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-black/50 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-400">MemoClaw :</span>
            <span className="text-cyan-300 font-mono">Synchronisé</span>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              setShowMintModal(true);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
              companion.isMinted
                ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                : 'border-cyan-400 bg-cyan-950/50 text-cyan-300 hover:bg-cyan-500 hover:text-black shadow-[0_0_12px_rgba(56,189,248,0.3)]'
            }`}
          >
            {companion.isMinted ? `NFT #${companion.tokenId} (Base L2)` : '💎 Mint NFT (Base)'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Companion Centerstage & RPG Progression (5 cols) */}
        <section className="lg:col-span-5 flex flex-col items-center bg-zinc-950/60 rounded-3xl border border-zinc-800/80 p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Subtle background elemental gradient */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />

          {/* Action notification toast */}
          {actionFeedback && (
            <div className="absolute top-4 inset-x-6 z-30 p-2.5 rounded-xl bg-cyan-500/90 text-black font-bold text-center text-xs animate-bounce shadow-lg">
              {actionFeedback}
            </div>
          )}

          {/* Form and Element Header */}
          <div className="w-full flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-950/40 text-cyan-300 text-xs font-semibold">
              <span>Élément {companion.element}</span>
            </div>
            <div className="text-xs font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-zinc-800">
              Forme : <span className="text-white font-bold">{companion.form}</span>
            </div>
          </div>

          {/* Companion Centerstage Avatar (3D WebGL or 2D Vector) */}
          <div className="relative w-full h-[320px] flex items-center justify-center my-2 select-none">
            {avatarMode === '3d' ? (
              <div className="w-full h-full relative">
                <Companion3DView
                  element={companion.element}
                  interactive={true}
                  onMascotClick={handleFeed}
                />
              </div>
            ) : (
              <div onClick={handleFeed} className="cursor-pointer" title="Clique pour interagir !">
                <CompanionAvatar element={companion.element} size="lg" />
              </div>
            )}
            
            {/* 3D / 2D Switcher */}
            <div className="absolute bottom-1 right-2 z-20 flex bg-black/70 backdrop-blur-md rounded-full border border-cyan-800/50 p-0.5 text-[10px]">
              <button
                onClick={() => setAvatarMode('3d')}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  avatarMode === '3d' ? 'bg-cyan-500 text-black font-bold' : 'text-cyan-300/80 hover:text-white'
                }`}
              >
                3D WebGL
              </button>
              <button
                onClick={() => setAvatarMode('2d')}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  avatarMode === '2d' ? 'bg-cyan-500 text-black font-bold' : 'text-cyan-300/80 hover:text-white'
                }`}
              >
                2D
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-white mt-1 mb-1 tracking-wide">
            {companion.name}
          </h1>
          <p className="text-xs text-zinc-400 mb-6 font-mono">
            Ton compagnon autonome & émotionnel
          </p>

          {/* Level & XP Progression Bar */}
          <div className="w-full bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800/80 mb-6">
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span className="text-cyan-300">Niveau {companion.level}</span>
              <span className="text-zinc-400 text-xs font-mono">
                {companion.xp} / {companion.xpMax} XP
              </span>
            </div>
            <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-400 rounded-full transition-all duration-500 shadow-[0_0_12px_#38bdf8]"
                style={{ width: `${Math.min(100, (companion.xp / companion.xpMax) * 100)}%` }}
              />
            </div>
          </div>

          {/* 4 Core RPG Stats (PRD Section 7) */}
          <div className="w-full grid grid-cols-2 gap-3 mb-6">
            {/* INT */}
            <div className="p-3 bg-black/40 rounded-xl border border-zinc-800/80">
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>INT (Intelligence)</span>
                <span className="text-white font-mono">{companion.stats.INT}</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, companion.stats.INT)}%` }}
                />
              </div>
            </div>

            {/* EMO */}
            <div className="p-3 bg-black/40 rounded-xl border border-zinc-800/80">
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>EMO (Émotion)</span>
                <span className="text-white font-mono">{companion.stats.EMO}</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, companion.stats.EMO)}%` }}
                />
              </div>
            </div>

            {/* AGI */}
            <div className="p-3 bg-black/40 rounded-xl border border-zinc-800/80">
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>AGI (Agilité)</span>
                <span className="text-white font-mono">{companion.stats.AGI}</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, companion.stats.AGI)}%` }}
                />
              </div>
            </div>

            {/* BOND */}
            <div className="p-3 bg-black/40 rounded-xl border border-zinc-800/80">
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>BOND (Lien)</span>
                <span className="text-white font-mono">{companion.stats.BOND}/100</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-400 transition-all duration-300"
                  style={{ width: `${companion.stats.BOND}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick RPG Actions */}
          <div className="w-full grid grid-cols-3 gap-2.5">
            <button
              onClick={handleFeed}
              onMouseEnter={() => sounds.playHover()}
              className="py-2.5 px-3 rounded-xl border border-pink-500/30 bg-pink-950/20 hover:bg-pink-900/40 text-pink-300 font-bold text-xs flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-base">🍖</span>
              <span>Nourrir</span>
            </button>

            <button
              onClick={handleTrain}
              onMouseEnter={() => sounds.playHover()}
              className="py-2.5 px-3 rounded-xl border border-sky-500/30 bg-sky-950/20 hover:bg-sky-900/40 text-sky-300 font-bold text-xs flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-base">⚔️</span>
              <span>Entraîner</span>
            </button>

            <button
              onClick={handleMeditate}
              onMouseEnter={() => sounds.playHover()}
              className="py-2.5 px-3 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:bg-purple-900/40 text-purple-300 font-bold text-xs flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-base">💖</span>
              <span>Méditer</span>
            </button>
          </div>
        </section>

        {/* Right Column: In-App Chat & MemoClaw Memory (7 cols) */}
        <section className="lg:col-span-7 flex flex-col h-[700px] bg-zinc-950/80 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-2xl backdrop-blur-md">
          
          {/* Tabs bar */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-3 bg-black/40">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('chat');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'chat'
                    ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                💬 Dialogue en direct
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('memory');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'memory'
                    ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🧠 Mémoire MemoClaw ({memories.length})
              </button>
            </div>

            <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
              Gateway OpenClaw v1
            </span>
          </div>

          {/* Tab 1: Chat interface */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Message scroll container */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white rounded-br-xs shadow-md'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-xs shadow-md'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono mt-1 px-1">
                      {msg.sender === 'user' ? 'Toi' : companion.name} • {msg.time}
                    </span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono p-2 bg-zinc-900/50 rounded-xl w-36 border border-zinc-800">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>{companion.name} réfléchit...</span>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800/80 bg-black/60 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Écris un message à ${companion.name}...`}
                  className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 text-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  onMouseEnter={() => sounds.playHover()}
                  className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                >
                  Envoyer
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: MemoClaw Memories */}
          {activeTab === 'memory' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-300">
                MemoClaw stocke sémantiquement les moments clés de vos échanges. Chaque mémoire est indexée avec score d'importance pour nourrir la personnalité de ton compagnon.
              </div>

              <div className="space-y-3">
                {memories.map((mem) => (
                  <div key={mem.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between items-start gap-4">
                    <div>
                      <p className="text-sm text-zinc-200">{mem.content}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-cyan-400">
                        Tag: #{mem.tag}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500 whitespace-nowrap">
                      {mem.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Level-Up Celebration Modal */}
      {showLevelUp && levelUpInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-zinc-950 border-2 border-cyan-400 rounded-3xl p-8 text-center shadow-[0_0_60px_rgba(56,189,248,0.5)] animate-bounce-once">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-sky-400">
              LEVEL UP !
            </h2>
            <p className="text-xl font-bold text-white mt-2">
              Niveau {levelUpInfo.newLevel} Atteint !
            </p>
            {levelUpInfo.formChanged && (
              <div className="my-4 p-3 rounded-xl bg-cyan-950/50 border border-cyan-400 text-cyan-300 font-semibold text-sm">
                ✨ Forme Évoluée : Ton compagnon s'est transformé en {companion.form} !
              </div>
            )}
            <div className="text-sm text-zinc-400 my-4 space-y-1">
              <div>Bonus de statistiques débloqué :</div>
              <div className="text-cyan-400 font-mono font-bold">+Stats RPG accordées</div>
            </div>
            <button
              onClick={() => setShowLevelUp(false)}
              className="w-full py-3 rounded-xl bg-cyan-500 text-black font-extrabold text-sm uppercase tracking-wider hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(56,189,248,0.6)]"
            >
              Continuer l'aventure
            </button>
          </div>
        </div>
      )}

      {/* NFT Mint Modal */}
      {showMintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-md w-full bg-zinc-950 border border-cyan-500/50 rounded-3xl p-6 text-white shadow-2xl">
            <h3 className="text-2xl font-bold mb-2">Mint NFT sur Base L2</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Chaque compagnon MINYX est un NFT ERC-721 dont les métadonnées évoluent en continu selon son niveau et ses stats.
            </p>

            <div className="bg-black/60 p-4 rounded-xl border border-zinc-800 text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span>Réseau :</span>
                <span className="text-cyan-400 font-mono">Base L2 (Sepolia testnet)</span>
              </div>
              <div className="flex justify-between">
                <span>Compagnon :</span>
                <span className="text-white font-bold">{companion.name} ({companion.element})</span>
              </div>
              <div className="flex justify-between">
                <span>Niveau actuel :</span>
                <span className="text-white font-mono">Niv. {companion.level}</span>
              </div>
              <div className="flex justify-between">
                <span>Frais de gas estimés :</span>
                <span className="text-emerald-400 font-mono">&lt; 0.001 ETH (~0.02$)</span>
              </div>
            </div>

            {mintStatus === 'success' ? (
              <div className="text-center p-4 bg-emerald-950/40 border border-emerald-500 rounded-2xl mb-4">
                <div className="text-2xl mb-1">✅</div>
                <div className="font-bold text-emerald-300">Mint Réussi !</div>
                <div className="text-xs font-mono text-zinc-400 mt-1">Token ID: #{companion.tokenId}</div>
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMintModal(false);
                  setMintStatus('idle');
                }}
                className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white text-sm font-semibold"
              >
                Fermer
              </button>
              {mintStatus !== 'success' && (
                <button
                  onClick={handleMintNFT}
                  disabled={mintStatus === 'minting'}
                  className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm transition-all shadow-[0_0_15px_rgba(56,189,248,0.4)] disabled:opacity-50"
                >
                  {mintStatus === 'minting' ? 'Validation...' : 'Confirmer Mint'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
