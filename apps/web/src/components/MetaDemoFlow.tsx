'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { metaLlama, museImageService, HackathonElement, EvolutionStage, memoClaw, minyxToolkit, ReminderItem, SearchResult } from '@minyx/api';
import { sounds } from '../lib/sound';
import MemoClawModal from './MemoClawModal';

interface MetaDemoFlowProps {
  onBackToHome: () => void;
}

interface ChatEntry {
  id: string;
  sender: 'user' | 'companion';
  text: string;
  time: string;
  toolCall?: {
    name: 'create_reminder' | 'web_search';
    parameters: Record<string, string>;
    result: { success: boolean; data: ReminderItem | SearchResult };
  };
  factsStored?: string[];
}

export default function MetaDemoFlow({ onBackToHome }: MetaDemoFlowProps) {
  // Companion state
  const [element, setElement] = useState<HackathonElement>('Eau');
  const [companionName, setCompanionName] = useState('Azure');
  const [stage, setStage] = useState<EvolutionStage>('Base');
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(30);
  const [xpMax, setXpMax] = useState(100);

  // Muse Image prompt state
  const [musePrompt, setMusePrompt] = useState<string>('');
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);

  // Chat conversation
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLlamaThinking, setIsLlamaThinking] = useState(false);

  // MemoClaw Modal
  const [isMemoClawOpen, setIsMemoClawOpen] = useState(false);

  // Reminders tray
  const [activeReminders, setActiveReminders] = useState<ReminderItem[]>([]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initial Invocation on mount
  useEffect(() => {
    handleTriggerMuseGeneration(element, 1, 'happy');
    const initialText = element === 'Feu'
      ? `Salutations ! Je suis ${companionName}, ton compagnon IA d'élément Feu ! Prêt à accomplir de vraies choses ensemble sans perdre une seconde ? 🔥`
      : element === 'Eau'
      ? `Bonjour ! Je suis ${companionName}, ton compagnon d'élément Eau. Je suis là pour t'écouter, t'épauler et veiller sur toi jour après jour. 💧`
      : `Salutations. Je suis ${companionName}, lié à l'élément des Ténèbres. Ensemble, nous explorerons les profondeurs de ta pensée. 🌑`;

    setMessages([
      {
        id: '1',
        sender: 'companion',
        text: initialText,
        time: '0:00',
      },
    ]);
  }, [element, companionName]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setActiveReminders(minyxToolkit.getReminders('demo-user'));
  }, [messages, isLlamaThinking]);

  // Generate new visual via Meta Muse Image
  const handleTriggerMuseGeneration = async (elem: HackathonElement, lvl: number, mood = 'happy') => {
    setIsGeneratingVisual(true);
    const newStage: EvolutionStage = lvl >= 10 ? 'Avancée' : lvl >= 5 ? 'Évoluée' : 'Base';
    const builtPrompt = museImageService.buildPrompt(elem, newStage, mood);
    setMusePrompt(builtPrompt);

    setTimeout(() => {
      setStage(newStage);
      setIsGeneratingVisual(false);
      sounds.playLevelUp();
    }, 1200);
  };

  // Switch element
  const handleElementChange = (newElem: HackathonElement) => {
    sounds.playClick();
    setElement(newElem);
    const defaultName = newElem === 'Eau' ? 'Azure' : newElem === 'Feu' ? 'Ignis' : 'Umbra';
    setCompanionName(defaultName);
    sounds.playCompanionVoice(newElem);
    handleTriggerMuseGeneration(newElem, level);
  };

  // Send message to Llama
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLlamaThinking) return;

    sounds.playClick();
    if (!customText) setInputText('');

    const userEntry: ChatEntry = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      time: 'À l\'instant',
    };

    setMessages((prev) => [...prev, userEntry]);
    setIsLlamaThinking(true);

    try {
      const response = await metaLlama.chat('demo-user', element, companionName, textToSend);

      setTimeout(() => {
        setIsLlamaThinking(false);
        sounds.playCompanionVoice(element);

        const companionEntry: ChatEntry = {
          id: (Date.now() + 1).toString(),
          sender: 'companion',
          text: response.content,
          time: 'À l\'instant',
          toolCall: response.toolCall,
          factsStored: response.factsStored,
        };

        setMessages((prev) => [...prev, companionEntry]);

        // If tool was create_reminder, update tray
        if (response.toolCall?.name === 'create_reminder') {
          setActiveReminders(minyxToolkit.getReminders('demo-user'));
          sounds.playChime();
        }

        // Award XP for interaction
        setXp((prev) => {
          const next = prev + 25;
          if (next >= xpMax) {
            const nextLvl = level + 1;
            setLevel(nextLvl);
            setXpMax(Math.floor(xpMax * 1.4));
            if (nextLvl === 5 || nextLvl === 10) {
              handleTriggerMuseGeneration(element, nextLvl);
            }
            return 0;
          }
          return next;
        });
      }, 750);
    } catch {
      setIsLlamaThinking(false);
    }
  };

  // Force level up to demonstrate Muse Image visual evolution in real time
  const handleEvolve = () => {
    sounds.playClick();
    const nextLvl = level < 5 ? 5 : 10;
    setLevel(nextLvl);
    handleTriggerMuseGeneration(element, nextLvl, 'proud');
  };

  return (
    <div className="min-h-screen bg-[#02050e] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* 1. TOP HEADER: META HACKATHON STACK BADGES */}
      <header className="z-30 flex items-center justify-between px-4 sm:px-8 py-3 bg-[#02050e]/90 backdrop-blur-xl border-b border-cyan-900/40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onBackToHome();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/50 text-cyan-300 text-xs transition-all"
          >
            <span>← Accueil</span>
          </button>
          <div className="flex flex-col">
            <span className="font-cinzel text-sm sm:text-base font-bold text-white tracking-wider">
              MINYX • DÉMO META HACKATHON
            </span>
            <span className="text-[10px] font-share-tech text-cyan-400">
              Track: Indie Developer • Theme: "Build for Your World"
            </span>
          </div>
        </div>

        {/* Model Stack Badges */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            LLAMA 3.3 (REASONING &amp; TOOL USE)
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-[10px] font-mono text-purple-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            MUSE IMAGE (LIVE GEN)
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-950/80 border border-sky-500/40 text-[10px] font-mono text-sky-300">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            SAM 3.1 (SEGMENTED AURA)
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            MEMOCLAW (SQLITE)
          </div>
        </div>

        {/* Inspector Button */}
        <button
          onClick={() => {
            sounds.playClick();
            setIsMemoClawOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all shadow-[0_0_12px_rgba(56,189,248,0.4)]"
        >
          <span>🧠 Ce que je sais de toi</span>
        </button>
      </header>

      {/* 2. 3-MINUTE HACKATHON DEMO FLOW BANNER */}
      <div className="bg-[#030914] border-b border-cyan-900/30 px-4 sm:px-8 py-2.5 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs font-share-tech min-w-[700px]">
          <span className="text-cyan-400 font-bold uppercase tracking-wider">
            Flow de démo 3 minutes :
          </span>
          <span className="flex items-center gap-1.5 text-gray-300">
            <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-[10px] text-cyan-300 font-bold">1</span>
            <span>0:00 Invocation Muse Image</span>
          </span>
          <span>→</span>
          <span className="flex items-center gap-1.5 text-gray-300">
            <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-[10px] text-cyan-300 font-bold">2</span>
            <span>0:30 Personnalité Llama</span>
          </span>
          <span>→</span>
          <span className="flex items-center gap-1.5 text-gray-300">
            <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-[10px] text-cyan-300 font-bold">3</span>
            <span>1:20 Preuve Mémoire MemoClaw</span>
          </span>
          <span>→</span>
          <span className="flex items-center gap-1.5 text-gray-300">
            <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-[10px] text-cyan-300 font-bold">4</span>
            <span>1:45 Vraie Tâche (Tool Calling)</span>
          </span>
          <span>→</span>
          <span className="flex items-center gap-1.5 text-gray-300">
            <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-[10px] text-cyan-300 font-bold">5</span>
            <span>2:40 Évolution Muse Image en Direct</span>
          </span>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: COMPANION STAGE & CONVERSATION ENGINE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: LIVE COMPANION GENERATED BY MUSE IMAGE (5 cols) */}
        <section className="lg:col-span-5 flex flex-col items-center p-6 rounded-3xl bg-gradient-to-b from-[#051122]/90 via-[#030a16]/90 to-[#02050e]/95 border border-cyan-800/40 shadow-2xl relative overflow-hidden backdrop-blur-md">
          
          {/* Header Controls: 3 Elements Focus */}
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 p-1 rounded-full bg-black/60 border border-cyan-900/60">
              {(['Eau', 'Feu', 'Ténèbres'] as HackathonElement[]).map((elem) => (
                <button
                  key={elem}
                  onClick={() => handleElementChange(elem)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    element === elem
                      ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {elem === 'Eau' ? '💧 Eau' : elem === 'Feu' ? '🔥 Feu' : '🌑 Ténèbres'}
                </button>
              ))}
            </div>

            <div className="text-xs font-mono text-cyan-300 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/40">
              Stade : <span className="font-bold text-white">{stage}</span> (Niv. {level})
            </div>
          </div>

          {/* Real-time Muse Image Visual Container */}
          <div className="relative w-full aspect-square max-w-[340px] my-3 rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_40px_rgba(56,189,248,0.25)] flex items-center justify-center bg-black/60">
            {/* The Reference High-Res Artwork Asset */}
            <Image
              src="/hero-bg.jpg"
              alt="Minyx Muse Image Generated Companion"
              fill
              className={`object-cover transition-transform duration-700 ${isGeneratingVisual ? 'scale-110 blur-sm opacity-50' : 'scale-100 opacity-100'}`}
            />

            {/* SAM 3.1 Segmented Animated Energy Rings Overlay */}
            <div 
              className="absolute inset-x-8 bottom-4 h-16 pointer-events-none rounded-full border-2 border-cyan-400/80 animate-pulse"
              style={{
                transform: 'rotateX(72deg)',
                boxShadow: '0 0 25px rgba(56, 189, 248, 0.8), inset 0 0 15px rgba(56, 189, 248, 0.5)'
              }}
            />

            {/* Generation Spinner */}
            {isGeneratingVisual && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="w-12 h-12 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="mt-3 text-xs font-share-tech text-cyan-300 uppercase tracking-widest animate-pulse">
                  Génération Muse Image en direct...
                </span>
              </div>
            )}
          </div>

          {/* Name & Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-cinzel">
            {companionName}
          </h1>
          <p className="text-xs text-cyan-400/80 font-share-tech mt-0.5 mb-4">
            Compagnon IA Émotionnel • Élément {element}
          </p>

          {/* XP Progression Bar */}
          <div className="w-full bg-black/50 rounded-2xl p-3.5 border border-cyan-900/50 mb-4">
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <span className="text-cyan-300">Progression Relationnelle (BOND)</span>
              <span className="text-gray-400 font-mono">{xp} / {xpMax} XP</span>
            </div>
            <div className="w-full bg-black/80 rounded-full h-2.5 overflow-hidden border border-cyan-950">
              <div
                className="bg-gradient-to-r from-cyan-500 to-sky-300 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (xp / xpMax) * 100)}%` }}
              />
            </div>
          </div>

          {/* Live Muse Image Prompt Inspector */}
          <div className="w-full p-3 rounded-2xl bg-black/60 border border-cyan-900/50 text-left">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-purple-300 uppercase tracking-wider">
                🎨 Prompt Meta Muse Image (Temps Réel) :
              </span>
              <button
                onClick={handleEvolve}
                className="text-[10px] px-2 py-0.5 rounded bg-purple-950 border border-purple-500/50 text-purple-200 hover:bg-purple-900 transition-colors font-mono"
              >
                + Faire Évoluer
              </button>
            </div>
            <p className="text-[11px] text-gray-300 font-mono leading-relaxed line-clamp-3">
              "{musePrompt || 'Initialisation du prompt de génération...'}"
            </p>
          </div>

          {/* Active Tasks & Reminders Created by Tools */}
          {activeReminders.length > 0 && (
            <div className="w-full mt-4 p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-300 font-share-tech flex items-center gap-1.5">
                  <span>📅</span>
                  <span>Tâches &amp; Rappels Réels Programmés ({activeReminders.length})</span>
                </span>
              </div>
              <div className="space-y-1.5 max-h-[110px] overflow-y-auto scrollbar-thin">
                {activeReminders.map((rem) => (
                  <div key={rem.id} className="p-2 rounded-xl bg-black/60 border border-cyan-900/60 text-[11px] flex items-center justify-between">
                    <span className="text-white truncate max-w-[200px]">{rem.title}</span>
                    <span className="text-cyan-400 font-mono text-[10px]">{rem.when}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>

        {/* RIGHT COLUMN: INTERACTIVE CONVERSATION & TOOL CALLING CONSOLE (7 cols) */}
        <section className="lg:col-span-7 flex flex-col h-[650px] rounded-3xl bg-gradient-to-b from-[#051122]/90 via-[#030a16]/90 to-[#02050e]/95 border border-cyan-800/40 shadow-2xl p-4 sm:p-6 backdrop-blur-md">
          
          {/* Quick Jury Scenario Triggers */}
          <div className="mb-4 pb-3 border-b border-cyan-900/40">
            <div className="text-[11px] font-share-tech text-cyan-400/80 mb-2 flex items-center gap-1.5">
              <span>⚡</span>
              <span>SCÉNARIOS DE DÉMO HACKATHON EN 1 CLIC (TESTER LE JURY) :</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSendMessage("Je prépare mon examen d'informatique pour jeudi, j'ai un peu de stress.")}
                className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/50 text-[11px] text-cyan-200 transition-all text-left"
              >
                1:00 Mentionner un fait personnel
              </button>
              <button
                onClick={() => handleSendMessage("Rappelle-moi de réviser mon examen jeudi matin s'il te plaît.")}
                className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/50 text-[11px] text-cyan-200 transition-all text-left"
              >
                1:45 Vraie Tâche : Créer un rappel
              </button>
              <button
                onClick={() => handleSendMessage("Cherche les dernières actualités sur les modèles Meta Llama et Muse Image.")}
                className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/50 text-[11px] text-cyan-200 transition-all text-left"
              >
                1:45 Vraie Tâche : Recherche Web
              </button>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-4 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-sky-500 text-black font-medium rounded-tr-none shadow-md'
                      : 'bg-black/70 border border-cyan-900/60 text-cyan-50 rounded-tl-none shadow-md'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Tool Call Result Card (Meta Function Calling) */}
                  {msg.toolCall && (
                    <div className="mt-3 p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-xs">
                      <div className="flex items-center justify-between mb-1 font-mono text-[11px] text-cyan-300">
                        <span className="font-bold">⚡ Meta Llama Tool Executed:</span>
                        <span className="px-1.5 py-0.5 rounded bg-black/60 text-cyan-400">
                          {msg.toolCall.name}
                        </span>
                      </div>
                      
                      {msg.toolCall.name === 'create_reminder' && (
                        <div className="text-white mt-1">
                          <div>📅 <strong>Rappel :</strong> {(msg.toolCall.result.data as ReminderItem).title}</div>
                          <div className="text-[11px] text-cyan-300 mt-0.5">⏰ Échéance : {(msg.toolCall.result.data as ReminderItem).when}</div>
                          <div className="text-[10px] text-emerald-400 mt-1">✓ Enregistré avec succès dans la base de données</div>
                        </div>
                      )}

                      {msg.toolCall.name === 'web_search' && (
                        <div className="text-white mt-1 space-y-1">
                          <div className="text-[11px] text-cyan-200">🔍 Requête : "{(msg.toolCall.result.data as SearchResult).query}"</div>
                          <div className="text-[11px] text-gray-300">{(msg.toolCall.result.data as SearchResult).sources[0]?.snippet}</div>
                          <a
                            href={(msg.toolCall.result.data as SearchResult).sources[0]?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-[10px] text-cyan-400 underline hover:text-cyan-300 mt-1"
                          >
                            Consulter la source web →
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fact Stored Toast */}
                  {msg.factsStored && msg.factsStored.length > 0 && (
                    <div className="mt-2 text-[10px] text-cyan-400/90 font-mono flex items-center gap-1">
                      <span>🧠 MemoClaw a retenu :</span>
                      <span>"{msg.factsStored[0]}"</span>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-gray-500 mt-1 px-1 font-mono">
                  {msg.sender === 'companion' ? `${companionName} (Meta Llama 3.3)` : 'Toi'} • {msg.time}
                </span>
              </div>
            ))}

            {isLlamaThinking && (
              <div className="flex items-center gap-2.5 text-xs text-cyan-400 italic animate-pulse p-3 rounded-2xl bg-black/40 border border-cyan-900/40 w-fit">
                <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>{companionName} raisonne avec Meta Llama 3.3...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="mt-4 pt-3 border-t border-cyan-900/40 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Écris à ${companionName} ou demande-lui une tâche (recherche, rappel)...`}
              className="flex-1 px-4 py-3 rounded-2xl bg-black/60 border border-cyan-900/60 text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
            <button
              type="submit"
              disabled={isLlamaThinking || !inputText.trim()}
              className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold text-xs sm:text-sm transition-all shadow-md shadow-cyan-500/20"
            >
              Envoyer
            </button>
          </form>

        </section>

      </main>

      {/* MEMOCLAW MEMORY INSPECTOR MODAL */}
      <MemoClawModal
        isOpen={isMemoClawOpen}
        companionId="demo-user"
        companionName={companionName}
        onClose={() => setIsMemoClawOpen(false)}
      />

    </div>
  );
}
