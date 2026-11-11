'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { CompanionView, LlamaResponse, MemoItem, ReminderView, ReminderSummary, SearchResult } from '@minyx/api/client';
import { sounds } from '../lib/sound';
import MemoClawModal from './MemoClawModal';
import { chat, companions, memories as memoriesApi, reminders as remindersApi } from '../lib/client-api';

const CompanionModelViewer = dynamic(() => import('./CompanionModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      <span className="mt-3 text-[10px] font-mono text-cyan-400/60 uppercase tracking-widest animate-pulse">
        Initialisation du Sanctuaire 3D...
      </span>
    </div>
  ),
});

interface Message {
  id: string;
  sender: 'user' | 'companion';
  text: string;
  time: string;
  toolCall?: LlamaResponse['toolCall'];
  factsStored?: string[];
  source?: LlamaResponse['source'];
  modelUsed?: string;
  failed?: boolean;
}

interface CompanionDashboardProps {
  companion: CompanionView;
  onBackToHome: () => void;
}

export default function CompanionDashboard({ companion: initial, onBackToHome }: CompanionDashboardProps) {
  // État compagnon piloté par le serveur (XP, niveaux, stats réels)
  const [companion, setCompanion] = useState<CompanionView>(initial);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  const [activeTab, setActiveTab] = useState<'chat' | 'memory' | 'tasks'>('chat');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'companion',
      text: `Salutations ! Je suis ${initial.name}, ton compagnon IA d'élément ${initial.element}. Je conserve nos échanges dans MemoClaw et je peux accomplir de vraies tâches pour toi (rappels, recherche web). De quoi aimerais-tu parler ?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const [activeReminders, setActiveReminders] = useState<ReminderView[]>([]);
  const [liveMemories, setLiveMemories] = useState<MemoItem[] | undefined>(undefined);
  const [memoryCount, setMemoryCount] = useState(0);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<{ newLevel: number; formChanged: boolean } | null>(null);
  const [isMemoClawOpen, setIsMemoClawOpen] = useState(false);

  const refreshSideData = useCallback(async () => {
    try {
      const [mem, rem] = await Promise.all([
        memoriesApi.list(initial.id),
        remindersApi.list(initial.id),
      ]);
      setLiveMemories(mem.memories);
      setMemoryCount(mem.memories.length);
      setActiveReminders(rem.reminders);
    } catch {
      // Les panneaux latéraux se rechargeront au prochain tour : silencieux.
    }
  }, [initial.id]);

  useEffect(() => {
    void refreshSideData();
  }, [refreshSideData]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const applyCompanionUpdate = (next: CompanionView | null, expectLevelUp = false) => {
    if (!next) return;
    if (expectLevelUp && next.level > companion.level) {
      setLevelUpInfo({ newLevel: next.level, formChanged: next.form !== companion.form });
      setShowLevelUp(true);
      sounds.playLevelUp();
    }
    setCompanion(next);
  };

  // Actions RPG : gains réels côté serveur
  const runAction = async (action: 'feed' | 'train' | 'meditate', label: string, sound: () => void) => {
    sound();
    setActionFeedback(label);
    try {
      const result = await companions.action(initial.id, action);
      applyCompanionUpdate(result.companion, true);
    } catch {
      setActionFeedback('Action impossible pour le moment.');
    }
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isTyping) return;

    sounds.playClick();
    if (!customText) setInputText('');
    setSendError(null);

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const reply = await chat.send(initial.id, textToSend, conversationId);
      setConversationId(reply.conversationId);
      setIsTyping(false);
      sounds.playCompanionVoice(companion.element as 'Eau' | 'Feu' | 'Ténèbres');

      setMessages((prev) => [
        ...prev,
        {
          id: reply.messageId,
          sender: 'companion',
          text: reply.response.content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolCall: reply.response.toolCall,
          factsStored: reply.response.factsStored,
          source: reply.response.source,
          modelUsed: reply.response.modelUsed,
        },
      ]);

      applyCompanionUpdate(reply.companion, true);

      if (reply.response.toolCall?.name === 'create_reminder') {
        sounds.playChime();
      }
      if (reply.response.factsStored?.length || reply.response.toolCall) {
        void refreshSideData();
      }
    } catch (error) {
      setIsTyping(false);
      const code = (error as { code?: string }).code ?? '';
      setSendError(
        code === 'rate_limited'
          ? 'Trop de messages — laisse ton compagnon respirer une minute.'
          : code === 'unauthorized'
          ? 'Session expirée — retourne à l\'accueil pour te reconnecter.'
          : 'Le sanctuaire est momentanément injoignable. Réessaie.'
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'companion',
          text: '…',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          failed: true,
        },
      ]);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#02050e] text-white flex flex-col font-sans overflow-x-hidden selection:bg-cyan-500 selection:text-black">

      <header className="sticky top-0 z-40 w-full border-b border-cyan-900/40 bg-[#02050e]/90 backdrop-blur-xl px-4 md:px-8 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onBackToHome();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-700/50 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 hover:text-white transition-all text-xs font-medium"
          >
            ← Accueil
          </button>
          <div className="h-4 w-px bg-cyan-900/50" />
          <span className="font-extrabold text-lg tracking-wider text-white">
            MINYX
          </span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-cyan-500/40 bg-cyan-950/50 text-cyan-300 font-mono">
            SANCTUAIRE 3D
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-900/60 bg-black/60 text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-gray-400">MemoClaw :</span>
            <span className="text-cyan-300 font-mono font-semibold">Actif ({memoryCount} souvenirs)</span>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              setIsMemoClawOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border border-cyan-400 bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(56,189,248,0.3)]"
          >
            🧠 Vault MemoClaw
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <section className="lg:col-span-5 flex flex-col items-center bg-gradient-to-b from-[#051122]/90 via-[#030a16]/90 to-[#02050e]/95 rounded-3xl border border-cyan-800/40 p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">

          {actionFeedback && (
            <div className="absolute top-4 inset-x-6 z-30 p-2.5 rounded-2xl bg-cyan-500 text-black font-bold text-center text-xs animate-bounce shadow-lg">
              {actionFeedback}
            </div>
          )}

          <div className="w-full flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 text-xs font-semibold">
              <span>Élément {companion.element}</span>
            </div>
            <div className="text-xs font-mono text-cyan-300/80 bg-black/60 px-3 py-1 rounded-full border border-cyan-900/60">
              Forme : <span className="text-white font-bold">{companion.form}</span>
            </div>
          </div>

          <div className="relative w-full h-[340px] flex items-center justify-center my-1 select-none">
            <CompanionModelViewer
              modelUrl="/models/mascot.glb"
              element={companion.element}
              interactive={true}
            />
          </div>

          <h1 className="text-3xl font-extrabold text-white mt-1 mb-0.5 tracking-tight">
            {companion.name}
          </h1>
          <p className="text-xs text-cyan-400/80 font-share-tech mb-5">
            Compagnon Autonome &amp; Émotionnel
          </p>

          <div className="w-full bg-black/60 rounded-2xl p-4 border border-cyan-900/50 mb-5">
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-cyan-300 font-share-tech">Niveau {companion.level}</span>
              <span className="text-gray-400 font-mono">
                {companion.xp} / {companion.xpToNextLevel} XP
              </span>
            </div>
            <div className="w-full h-2.5 bg-black rounded-full overflow-hidden border border-cyan-950">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-sky-300 rounded-full transition-all duration-500 shadow-[0_0_12px_#38bdf8]"
                style={{ width: `${Math.min(100, (companion.xp / companion.xpToNextLevel) * 100)}%` }}
              />
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-3 mb-5">
            {([
              ['INT (Intelligence)', companion.stats.INT, 'bg-sky-400'],
              ['EMO (Émotion)', companion.stats.EMO, 'bg-cyan-400'],
              ['AGI (Agilité)', companion.stats.AGI, 'bg-sky-300'],
            ] as const).map(([label, value, barClass]) => (
              <div key={label} className="p-3 bg-black/60 rounded-2xl border border-cyan-900/40">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span className="font-share-tech">{label}</span>
                  <span className="text-cyan-300 font-mono font-bold">{value}</span>
                </div>
                <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barClass} transition-all duration-300`}
                    style={{ width: `${Math.min(100, value)}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="p-3 bg-black/60 rounded-2xl border border-cyan-900/40">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span className="font-share-tech">BOND (Lien)</span>
                <span className="text-cyan-300 font-mono font-bold">{companion.stats.BOND}%</span>
              </div>
              <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${companion.stats.BOND}%` }}
                />
              </div>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-2.5">
            <button
              onClick={() => runAction('feed', '🍖 Nourri avec attention !', sounds.playFeed)}
              onMouseEnter={() => sounds.playHover()}
              className="py-2.5 px-3 rounded-2xl border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 font-bold text-xs flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-base">🍖</span>
              <span>Nourrir</span>
            </button>
            <button
              onClick={() => runAction('train', '⚔️ Entraînement réussi !', sounds.playTrain)}
              onMouseEnter={() => sounds.playHover()}
              className="py-2.5 px-3 rounded-2xl border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 font-bold text-xs flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-base">⚔️</span>
              <span>Entraîner</span>
            </button>
            <button
              onClick={() => runAction('meditate', '🧘 Moment de méditation partagée', sounds.playHover)}
              onMouseEnter={() => sounds.playHover()}
              className="py-2.5 px-3 rounded-2xl border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 font-bold text-xs flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-base">🧘</span>
              <span>Méditer</span>
            </button>
          </div>
        </section>

        <section className="lg:col-span-7 flex flex-col h-[720px] bg-gradient-to-b from-[#051122]/90 via-[#030a16]/90 to-[#02050e]/95 rounded-3xl border border-cyan-800/40 overflow-hidden shadow-2xl backdrop-blur-md">

          <div className="flex items-center justify-between border-b border-cyan-900/40 px-6 py-3 bg-black/60">
            <div className="flex gap-2">
              {([
                ['chat', '💬 Dialogue Llama'],
                ['memory', `🧠 Souvenirs (${memoryCount})`],
                ['tasks', `📅 Rappels (${activeReminders.length})`],
              ] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab(tab);
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === tab
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <span className="text-[10px] text-cyan-400/80 font-mono hidden sm:inline">
              Moteur {companion.element} • Tool Use
            </span>
          </div>

          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden p-4">

              <div className="mb-3 pb-2 border-b border-cyan-900/40 flex flex-wrap gap-2">
                <button
                  onClick={() => handleSendMessage("Rappelle-moi de répéter la présentation de MINYX jeudi à 16h.")}
                  className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/50 text-[11px] text-cyan-200 transition-all text-left"
                >
                  ⏰ Programmer un rappel
                </button>
                <button
                  onClick={() => handleSendMessage("Cherche les dernières nouvelles sur Meta Llama.")}
                  className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/50 text-[11px] text-cyan-200 transition-all text-left"
                >
                  🔍 Recherche web
                </button>
                <button
                  onClick={() => handleSendMessage('Que sais-tu sur ma personnalité et mes projets ?')}
                  className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/50 text-[11px] text-cyan-200 transition-all text-left"
                >
                  🧠 Consulter MemoClaw
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                        msg.failed
                          ? 'bg-red-950/60 border border-red-500/40 text-red-300 rounded-tl-none'
                          : msg.sender === 'user'
                          ? 'bg-gradient-to-r from-cyan-600 to-sky-500 text-black font-medium rounded-tr-none shadow-md'
                          : 'bg-black/70 border border-cyan-900/60 text-cyan-50 rounded-tl-none shadow-md'
                      }`}
                    >
                      {msg.failed ? msg.text : msg.text}

                      {msg.toolCall && (
                        <div className="mt-3 p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-xs text-white">
                          <div className="flex items-center justify-between mb-1 font-mono text-[11px] text-cyan-300">
                            <span className="font-bold">⚡ ACTION EXÉCUTÉE :</span>
                            <span className="px-1.5 py-0.5 rounded bg-black/60 text-cyan-400">
                              {msg.toolCall.name}
                            </span>
                          </div>

                          {msg.toolCall.name === 'create_reminder' && msg.toolCall.result.success && 'title' in msg.toolCall.result.data && (
                            <div className="mt-1">
                              <div>📅 <strong>Rappel :</strong> {(msg.toolCall.result.data as ReminderSummary).title}</div>
                              <div className="text-[11px] text-cyan-300 mt-0.5">
                                ⏰ Échéance : {new Date((msg.toolCall.result.data as ReminderSummary).when).toLocaleString()}
                              </div>
                              <div className="text-[10px] text-emerald-400 mt-1">✓ Programmé côté serveur</div>
                            </div>
                          )}
                          {msg.toolCall.name === 'create_reminder' && !msg.toolCall.result.success && (
                            <div className="mt-1 text-[11px] text-amber-300">
                              ⚠️ Date non reconnue — {companion.name} peut te redemander une échéance précise.
                            </div>
                          )}

                          {msg.toolCall.name === 'web_search' && msg.toolCall.result.success && 'query' in msg.toolCall.result.data && (
                            <div className="mt-1 space-y-1">
                              <div className="text-[11px] text-cyan-200">🔍 Requête : &quot;{(msg.toolCall.result.data as SearchResult).query}&quot;</div>
                              {(msg.toolCall.result.data as SearchResult).sources.slice(0, 2).map((source, index) => (
                                <div key={index} className="text-[11px] text-gray-300">
                                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                                    {source.title}
                                  </a>{' '}
                                  — {source.snippet.slice(0, 120)}…
                                </div>
                              ))}
                            </div>
                          )}
                          {msg.toolCall.name === 'web_search' && !msg.toolCall.result.success && (
                            <div className="mt-1 text-[11px] text-amber-300">
                              ⚠️ Recherche web indisponible (aucun moteur configuré côté serveur).
                            </div>
                          )}
                        </div>
                      )}

                      {msg.factsStored && msg.factsStored.length > 0 && (
                        <div className="mt-2 text-[10px] text-cyan-400/90 font-mono flex items-center gap-1">
                          <span>🧠 MemoClaw a retenu :</span>
                          <span>&quot;{msg.factsStored[0]}&quot;</span>
                        </div>
                      )}

                      {/* Honnêteté : origine réelle de la réponse */}
                      {msg.sender === 'companion' && !msg.failed && msg.source === 'scripted-fallback' && (
                        <div className="mt-2 text-[10px] text-amber-400/90 font-mono border-t border-amber-900/40 pt-1.5">
                          ⚠ Mode hors-ligne : réponse scriptée, pas un modèle.
                        </div>
                      )}
                      {msg.sender === 'companion' && msg.modelUsed && msg.source === 'meta-api' && (
                        <div className="mt-2 text-[10px] text-cyan-500/80 font-mono border-t border-cyan-950/60 pt-1.5">
                          ✓ {msg.modelUsed}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono mt-1 px-1">
                      {msg.sender === 'user' ? 'Toi' : companion.name} • {msg.time}
                    </span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono p-3 bg-black/40 rounded-2xl border border-cyan-900/40 w-fit animate-pulse">
                    <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <span>{companion.name} consulte MemoClaw &amp; réfléchit...</span>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {sendError && (
                <div role="alert" className="mt-2 p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
                  {sendError}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="mt-3 pt-3 border-t border-cyan-900/40 flex gap-2">
                <label htmlFor="chat-input" className="sr-only">Message à {companion.name}</label>
                <input
                  id="chat-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  maxLength={2000}
                  placeholder={`Écris à ${companion.name} ou demande une tâche...`}
                  className="flex-1 px-4 py-3 rounded-2xl bg-black/60 border border-cyan-900/60 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 text-xs sm:text-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs sm:text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                >
                  Envoyer
                </button>
              </form>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
                MemoClaw stocke les faits, préférences et événements de vos échanges, rattachés à ton
                compte. Chaque donnée pertinente est injectée dynamiquement dans le prompt système du compagnon.
              </div>

              <div className="space-y-3">
                {(liveMemories ?? []).slice(0, 20).map((mem) => (
                  <div key={mem.id} className="p-4 rounded-2xl bg-black/60 border border-cyan-900/50 flex justify-between items-start gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-200 font-medium">{mem.content}</p>
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                        #{mem.namespace}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
                      {new Date(mem.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}

                {(liveMemories ?? []).length === 0 && (
                  <div className="text-center py-12 text-gray-500 text-xs">
                    Aucun souvenir encore. Parle à {companion.name} de ce qui compte pour toi.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-center justify-between">
                <span>Rappels programmés par {companion.name} via Tool Calling — dates réellement parsées et persistées.</span>
                <span className="font-mono text-cyan-400 font-bold">{activeReminders.length} actifs</span>
              </div>

              <div className="space-y-3">
                {activeReminders.map((rem) => (
                  <div key={rem.id} className="p-4 rounded-2xl bg-black/60 border border-cyan-900/50 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">{rem.title}</h4>
                      <p className="text-xs text-cyan-300 font-mono mt-0.5">
                        ⏰ Échéance : {new Date(rem.when).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        ✓ Actif
                      </span>
                      <button
                        onClick={async () => {
                          sounds.playClick();
                          try {
                            await remindersApi.cancel(rem.id);
                            setActiveReminders((prev) => prev.filter((r) => r.id !== rem.id));
                          } catch {
                            // Silencieux : le bouton disparaîtra au rafraîchissement suivant.
                          }
                        }}
                        aria-label={`Annuler le rappel ${rem.title}`}
                        className="text-[10px] text-red-400/70 hover:text-red-300 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                {activeReminders.length === 0 && (
                  <div className="text-center py-12 text-gray-500 text-xs">
                    Aucun rappel programmé. Demande à {companion.name} : &quot;Rappelle-moi de...&quot;
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {showLevelUp && levelUpInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="max-w-md w-full bg-[#030a16] border-2 border-cyan-400 rounded-3xl p-8 text-center shadow-[0_0_60px_rgba(56,189,248,0.5)]">
            <div className="text-5xl mb-3">✨</div>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-sky-400 tracking-tight">
              LEVEL UP !
            </h2>
            <p className="text-xl font-bold text-white mt-2">
              Niveau {levelUpInfo.newLevel} Atteint !
            </p>
            {levelUpInfo.formChanged && (
              <div className="my-4 p-3 rounded-2xl bg-cyan-950/60 border border-cyan-400 text-cyan-300 font-semibold text-xs">
                ✨ Forme Évoluée : Ton compagnon s&apos;est métamorphosé en {companion.form} !
              </div>
            )}
            <button
              onClick={() => setShowLevelUp(false)}
              className="w-full mt-4 py-3 rounded-2xl bg-cyan-500 text-black font-extrabold text-xs uppercase tracking-wider hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(56,189,248,0.6)]"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      <MemoClawModal
        isOpen={isMemoClawOpen}
        companionId={initial.id}
        companionName={companion.name}
        liveMemories={liveMemories}
        onClose={() => setIsMemoClawOpen(false)}
      />

    </div>
  );
}
