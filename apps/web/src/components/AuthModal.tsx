'use client';

import React, { useState } from 'react';
import { sounds } from '../lib/sound';
import { auth } from '../lib/client-api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { name: string; email?: string }) => void;
}

type Mode = 'menu' | 'login' | 'register';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email ou mot de passe incorrect.',
  email_taken: 'Un compte existe déjà avec cet email.',
  invalid_email: 'Adresse email invalide.',
  weak_password: 'Le mot de passe doit contenir au moins 8 caractères.',
  rate_limited: 'Trop de tentatives. Réessaie dans quelques minutes.',
  missing_password: 'Le mot de passe est requis.',
  invalid_body: 'Formulaire invalide.',
  google_not_configured: 'Google OAuth en cours de configuration dans Google Cloud Console. Utilise la connexion Email/MDP pour le moment.',
  google_cancelled: 'Connexion Google annulée.',
  google_error: 'Erreur lors de la connexion Google.',
};

function describeError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  return ERROR_MESSAGES[code] ?? 'Une erreur est survenue. Réessaie.';
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('menu');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || isSubmitting) return;

    sounds.playClick();
    setIsSubmitting(true);
    setError(null);

    try {
      const result =
        mode === 'login'
          ? await auth.login(email.trim(), password)
          : await auth.register(email.trim(), password, name.trim() || undefined);

      sounds.playChime();
      onSuccess({ name: result.user.name, email: result.user.email });
      onClose();
    } catch (err) {
      setError(describeError(err));
      sounds.playHover();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in select-none">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-cyan-500/20 bg-slate-900/95 p-6 sm:p-8 shadow-2xl overflow-hidden transition-all duration-300"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-24 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          aria-label="Fermer"
          className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors duration-300 p-2 z-10 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Title & Branding */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Minyx
          </h1>
          <h2 className="text-xs font-semibold tracking-[0.25em] text-zinc-400 uppercase font-sans mt-2">
            REJOINS L&apos;AVENTURE
          </h2>
        </div>

        {/* Menu View */}
        {mode === 'menu' && (
          <div className="space-y-3.5 my-2">
            {/* 1. Google Button (Option OAuth PRD Bloc 1 — Scaffolded stub) */}
            <button
              onClick={() => {
                sounds.playClick();
                window.location.href = '/api/auth/google';
              }}
              className="w-full py-3 px-5 rounded-xl border border-cyan-500/20 bg-white/5 hover:bg-white/8 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] focus:border-cyan-400/70 focus:outline-none transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="font-semibold text-xs sm:text-sm tracking-wide text-white">
                CONTINUER AVEC GOOGLE
              </span>
            </button>

            {/* 2. Email / Password Button */}
            <button
              onClick={() => {
                sounds.playClick();
                setMode('login');
              }}
              className="w-full py-3 px-5 rounded-xl border border-cyan-500/20 bg-white/5 hover:bg-white/8 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] focus:border-cyan-400/70 focus:outline-none transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-semibold text-xs sm:text-sm tracking-wide text-white">
                CONNEXION EMAIL / MDP
              </span>
            </button>
          </div>
        )}

        {/* Email Form (Login / Register) */}
        {mode !== 'menu' && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setMode('menu');
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors duration-300"
              >
                ← Retour
              </button>
              <span className="text-xs font-mono text-zinc-400">
                {mode === 'login' ? 'Connexion' : 'Nouveau compte'}
              </span>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-cyan-400 mb-1">
                  Nom ou Pseudo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Eric"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/20 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/70 text-sm transition-all duration-300"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-cyan-400 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@exemple.com"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/20 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/70 text-sm transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-cyan-400 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 caractères minimum"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/20 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/70 text-sm transition-all duration-300"
              />
            </div>

            {error && (
              <div role="alert" className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-5 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-sm tracking-wide hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.35)] disabled:opacity-50"
            >
              {isSubmitting ? 'Traitement en cours…' : mode === 'login' ? 'SE CONNECTER' : 'CRÉER MON COMPTE'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-xs text-zinc-400 hover:text-cyan-300 transition-colors duration-300"
              >
                {mode === 'login'
                  ? 'Pas encore de compte ? Créer un compte'
                  : 'Déjà un compte ? Se connecter'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
