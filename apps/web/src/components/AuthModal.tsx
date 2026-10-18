'use client';

import React, { useState } from 'react';
import { sounds } from '../lib/sound';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { name: string; address?: string; email?: string }) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'web3' | 'email'>('web3');
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen) return null;

  const handleWalletConnect = (walletName: string) => {
    sounds.playClick();
    setConnectingWallet(walletName);

    setTimeout(() => {
      sounds.playLevelUp();
      setConnectingWallet(null);
      const mockAddress = '0x71C83d' + Math.random().toString(16).substring(2, 8).toUpperCase() + '...49A2';
      onSuccess({
        name: `Guardian (${walletName})`,
        address: mockAddress,
      });
      onClose();
    }, 1200);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    sounds.playClick();
    setIsSubmittingEmail(true);

    setTimeout(() => {
      setIsSubmittingEmail(false);
      setEmailSent(true);
      sounds.playChime();
      setTimeout(() => {
        onSuccess({
          name: email.split('@')[0],
          email: email.trim(),
        });
        onClose();
      }, 1500);
    }, 1000);
  };

  const handleSocialConnect = (provider: string) => {
    sounds.playClick();
    setTimeout(() => {
      sounds.playChime();
      onSuccess({
        name: `${provider} Traveler`,
        email: `traveler@${provider.toLowerCase()}.com`,
      });
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-[#0a1220]/95 via-[#060c16]/95 to-[#02050a]/95 p-6 md:p-8 shadow-2xl shadow-cyan-950/60 overflow-hidden"
        style={{
          boxShadow: '0 0 45px rgba(56, 189, 248, 0.25), inset 0 0 30px rgba(56, 189, 248, 0.08)'
        }}
      >
        {/* Glow corners */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-cyan-400/60 hover:text-cyan-300 transition-colors p-2 rounded-full hover:bg-cyan-950/40"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-400/40 mb-3 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
            <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-cinzel">
            Accès au Sanctuaire
          </h2>
          <p className="text-xs text-cyan-300/70 mt-1">
            Connecte-toi pour retrouver ton compagnon ou revendiquer tes NFTs.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-black/40 p-1 border border-cyan-900/40 mb-6">
          <button
            onClick={() => {
              sounds.playClick();
              setTab('web3');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'web3'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25'
                : 'text-cyan-300/70 hover:text-cyan-200'
            }`}
          >
            Web3 Wallet (Base L2)
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setTab('email');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'email'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25'
                : 'text-cyan-300/70 hover:text-cyan-200'
            }`}
          >
            Email & Réseaux
          </button>
        </div>

        {/* Web3 Tab Content */}
        {tab === 'web3' && (
          <div className="space-y-3">
            {[
              { id: 'metamask', name: 'MetaMask', icon: '🦊', desc: 'Portefeuille Web3 le plus populaire' },
              { id: 'rainbow', name: 'RainbowKit', icon: '🌈', desc: 'Expérience Web3 mobile & desktop' },
              { id: 'coinbase', name: 'Coinbase Wallet', icon: '🔵', desc: 'Prêt pour Base L2 en 1 clic' },
              { id: 'walletconnect', name: 'WalletConnect', icon: '🔗', desc: 'Scan QR avec n\'importe quel wallet' },
            ].map((wallet) => (
              <button
                key={wallet.id}
                disabled={connectingWallet !== null}
                onClick={() => handleWalletConnect(wallet.name)}
                className="w-full group flex items-center justify-between p-3.5 rounded-2xl bg-[#0a1828]/60 hover:bg-cyan-950/40 border border-cyan-900/50 hover:border-cyan-400/60 transition-all text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {wallet.icon}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {wallet.name}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {wallet.desc}
                    </div>
                  </div>
                </div>
                {connectingWallet === wallet.name ? (
                  <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-cyan-400/50 group-hover:text-cyan-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ))}

            <div className="mt-4 pt-4 border-t border-cyan-950/60 text-center">
              <span className="text-[11px] text-cyan-400/60">
                🔒 Compatible réseau Base Mainnet & Sepolia Testnet
              </span>
            </div>
          </div>
        )}

        {/* Email & Social Tab Content */}
        {tab === 'email' && (
          <div className="space-y-4">
            {emailSent ? (
              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-center">
                <div className="text-2xl mb-1">✨</div>
                <div className="text-sm font-bold text-cyan-300">Lien magique envoyé !</div>
                <div className="text-xs text-gray-300 mt-1">
                  Vérifie ta boîte mail à <span className="text-white font-mono">{email}</span> pour te connecter instantanément.
                </div>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-cyan-300/80 mb-1">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@exemple.com"
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-cyan-900/60 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingEmail}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 text-black font-bold text-sm hover:from-cyan-400 hover:to-sky-300 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
                >
                  {isSubmittingEmail ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Recevoir un lien magique</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-cyan-950/80"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-cyan-500/60 font-mono">ou continuer avec</span>
              <div className="flex-grow border-t border-cyan-950/80"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialConnect('Google')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0a1828]/60 hover:bg-cyan-950/40 border border-cyan-900/50 text-xs font-medium text-gray-200 hover:text-white transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                </svg>
                Google
              </button>
              <button
                onClick={() => handleSocialConnect('Discord')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0a1828]/60 hover:bg-cyan-950/40 border border-cyan-900/50 text-xs font-medium text-gray-200 hover:text-white transition-all"
              >
                <svg className="w-4 h-4 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Discord
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
