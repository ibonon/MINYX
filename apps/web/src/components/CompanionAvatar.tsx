'use client';

import React from 'react';

interface CompanionAvatarProps {
  element?: 'Feu' | 'Eau' | 'Ténèbres' | 'Lumière' | 'Terre' | 'Vent' | 'Cosmos';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showRipples?: boolean;
  className?: string;
}

export default function CompanionAvatar({
  element = 'Eau',
  size = 'lg',
  showRipples = true,
  className = '',
}: CompanionAvatarProps) {
  // Elemental theme configurations
  const elementStyles: Record<string, {
    primary: string;
    secondary: string;
    glow: string;
    belly: string;
    halo: string;
    innerEar: string;
  }> = {
    Eau: {
      primary: '#38bdf8', // Bright luminous cyan
      secondary: '#0284c7',
      glow: 'rgba(56, 189, 248, 0.65)',
      belly: '#bae6fd',
      halo: 'rgba(14, 165, 233, 0.4)',
      innerEar: '#0369a1',
    },
    Feu: {
      primary: '#f87171',
      secondary: '#dc2626',
      glow: 'rgba(239, 68, 68, 0.65)',
      belly: '#fef08a',
      halo: 'rgba(220, 38, 38, 0.4)',
      innerEar: '#991b1b',
    },
    Ténèbres: {
      primary: '#a78bfa',
      secondary: '#6366f1',
      glow: 'rgba(139, 92, 246, 0.65)',
      belly: '#e0e7ff',
      halo: 'rgba(99, 102, 241, 0.4)',
      innerEar: '#4338ca',
    },
    Lumière: {
      primary: '#fde047',
      secondary: '#eab308',
      glow: 'rgba(250, 204, 21, 0.65)',
      belly: '#ffffff',
      halo: 'rgba(234, 179, 8, 0.4)',
      innerEar: '#ca8a04',
    },
    Terre: {
      primary: '#4ade80',
      secondary: '#16a34a',
      glow: 'rgba(34, 197, 94, 0.65)',
      belly: '#bbf7d0',
      halo: 'rgba(22, 163, 74, 0.4)',
      innerEar: '#15803d',
    },
    Vent: {
      primary: '#2dd4bf',
      secondary: '#0d9488',
      glow: 'rgba(20, 184, 166, 0.65)',
      belly: '#ccfbf1',
      halo: 'rgba(13, 148, 136, 0.4)',
      innerEar: '#0f766e',
    },
    Cosmos: {
      primary: '#c084fc',
      secondary: '#7c3aed',
      glow: 'rgba(168, 85, 247, 0.7)',
      belly: '#f3e8ff',
      halo: 'rgba(124, 58, 237, 0.45)',
      innerEar: '#5b21b6',
    },
  };

  const currentTheme = elementStyles[element] || elementStyles['Eau'];

  const dimensionMap = {
    sm: { width: 140, height: 170 },
    md: { width: 220, height: 260 },
    lg: { width: 320, height: 380 },
    xl: { width: 420, height: 490 },
  };

  const { width, height } = dimensionMap[size];

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Background radial aura */}
      <div
        className="absolute rounded-full pointer-events-none animate-pulse-glow"
        style={{
          width: `${width * 0.9}px`,
          height: `${width * 0.9}px`,
          top: `${height * 0.1}px`,
          background: `radial-gradient(circle, ${currentTheme.halo} 0%, rgba(0,0,0,0) 70%)`,
          filter: 'blur(35px)',
        }}
      />

      {/* Floating Animated Chibi Creature */}
      <div className="relative z-10 animate-float-slow transition-transform duration-700 hover:scale-105">
        <svg
          width={width}
          height={height * 0.85}
          viewBox="0 0 320 340"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: `drop-shadow(0 0 24px ${currentTheme.glow})` }}
        >
          <defs>
            {/* Body gradient */}
            <radialGradient id="bodyGrad" cx="45%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="35%" stopColor={currentTheme.primary} />
              <stop offset="85%" stopColor={currentTheme.secondary} />
              <stop offset="100%" stopColor="#03305a" />
            </radialGradient>

            {/* Belly patch gradient */}
            <radialGradient id="bellyGrad" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor={currentTheme.belly} />
              <stop offset="100%" stopColor={currentTheme.primary} stopOpacity="0.8" />
            </radialGradient>

            {/* Eye iris gradient */}
            <radialGradient id="eyeIris" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#082f49" />
              <stop offset="65%" stopColor="#031628" />
              <stop offset="100%" stopColor="#010811" />
            </radialGradient>

            {/* Flame/Tuft gradient */}
            <linearGradient id="tuftGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor={currentTheme.primary} />
              <stop offset="100%" stopColor={currentTheme.secondary} />
            </linearGradient>

            {/* Ear inner gradient */}
            <linearGradient id="earGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={currentTheme.innerEar} />
              <stop offset="100%" stopColor={currentTheme.primary} stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Forehead Spirit Flame Wisp (Signature Minyx curled droplet from user screenshot) */}
          <g className="animate-pulse">
            <path
              d="M 160 22 C 168 18 174 24 172 32 C 170 38 163 42 165 52 C 167 62 173 70 166 84 C 160 92 153 82 153 72 C 153 58 148 48 155 35 C 158 28 156 24 160 22 Z"
              fill="url(#tuftGrad)"
              style={{ filter: `drop-shadow(0 0 14px ${currentTheme.primary})` }}
            />
            <circle cx="163" cy="34" r="3.5" fill="#ffffff" opacity="0.9" />
          </g>

          {/* Left Cat Ear (Perky triangular cat ear matching user screenshot) */}
          <path
            d="M 102 118 C 96 100 86 78 78 62 C 94 68 122 84 138 98 Z"
            fill="url(#bodyGrad)"
          />
          <path
            d="M 102 112 C 96 98 88 78 82 68 C 94 73 116 86 130 96 Z"
            fill="url(#earGrad)"
            opacity="0.95"
          />

          {/* Right Cat Ear (Perky triangular cat ear matching user screenshot) */}
          <path
            d="M 218 118 C 224 100 234 78 242 62 C 226 68 198 84 182 98 Z"
            fill="url(#bodyGrad)"
          />
          <path
            d="M 218 112 C 224 98 232 78 238 68 C 226 73 204 86 190 96 Z"
            fill="url(#earGrad)"
            opacity="0.95"
          />

          {/* Back Body / Tail Hint */}
          <path
            d="M 210 240 C 235 235 255 245 250 258 C 245 270 220 262 205 255 Z"
            fill="url(#bodyGrad)"
            opacity="0.85"
          />

          {/* Lower Torso / Body */}
          <ellipse cx="160" cy="225" rx="52" ry="58" fill="url(#bodyGrad)" />

          {/* Cute Chibi Feet */}
          <ellipse cx="140" cy="275" rx="16" ry="12" fill="url(#bodyGrad)" />
          <ellipse cx="180" cy="275" rx="16" ry="12" fill="url(#bodyGrad)" />
          <ellipse cx="140" cy="274" rx="11" ry="7" fill={currentTheme.belly} opacity="0.4" />
          <ellipse cx="180" cy="274" rx="11" ry="7" fill={currentTheme.belly} opacity="0.4" />

          {/* Belly Patch (Oval glow on chest) */}
          <path
            d="M 160 190 C 144 190 134 208 134 230 C 134 248 144 260 160 260 C 176 260 186 248 186 230 C 186 208 176 190 160 190 Z"
            fill="url(#bellyGrad)"
            opacity="0.95"
            style={{ filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.4))' }}
          />

          {/* Arms / Little Paws */}
          <ellipse cx="118" cy="220" rx="12" ry="24" transform="rotate(22 118 220)" fill="url(#bodyGrad)" />
          <ellipse cx="202" cy="220" rx="12" ry="24" transform="rotate(-22 202 220)" fill="url(#bodyGrad)" />

          {/* Large Chibi Head */}
          <ellipse cx="160" cy="145" rx="72" ry="62" fill="url(#bodyGrad)" />

          {/* Cheek Glows */}
          <ellipse cx="114" cy="165" rx="12" ry="7" fill={currentTheme.belly} opacity="0.35" />
          <ellipse cx="206" cy="165" rx="12" ry="7" fill={currentTheme.belly} opacity="0.35" />

          {/* Left Eye (Big anime eye with reflection) */}
          <g>
            <ellipse cx="132" cy="142" rx="19" ry="25" fill="url(#eyeIris)" />
            {/* Primary Catchlight */}
            <ellipse cx="128" cy="132" rx="7" ry="9" fill="#ffffff" />
            {/* Secondary lower reflection */}
            <ellipse cx="138" cy="154" rx="4" ry="5" fill={currentTheme.primary} opacity="0.75" />
            <circle cx="125" cy="148" r="2" fill="#ffffff" opacity="0.8" />
          </g>

          {/* Right Eye */}
          <g>
            <ellipse cx="188" cy="142" rx="19" ry="25" fill="url(#eyeIris)" />
            {/* Primary Catchlight */}
            <ellipse cx="184" cy="132" rx="7" ry="9" fill="#ffffff" />
            {/* Secondary lower reflection */}
            <ellipse cx="194" cy="154" rx="4" ry="5" fill={currentTheme.primary} opacity="0.75" />
            <circle cx="181" cy="148" r="2" fill="#ffffff" opacity="0.8" />
          </g>

          {/* Cute Button Nose */}
          <ellipse cx="160" cy="155" rx="2" ry="1.5" fill="#031628" />

          {/* Charming Mouth */}
          <path
            d="M 154 163 C 157 167 163 167 166 163"
            stroke="#031628"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Head edge highlight / rim light */}
          <path
            d="M 100 130 C 112 95 208 95 220 130"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.45"
            fill="none"
          />
        </svg>
      </div>

      {/* Concentric Energy Summoning Rings (Underneath feet, seen in user image) */}
      {showRipples && (
        <div
          className="absolute bottom-1 pointer-events-none flex items-center justify-center"
          style={{ width: `${width * 0.95}px`, height: '55px' }}
        >
          {/* Ring 1 - Outer Pulsing */}
          <div
            className="absolute rounded-full border border-cyan-400/50"
            style={{
              width: '100%',
              height: '100%',
              transform: 'rotateX(72deg)',
              boxShadow: `0 0 16px ${currentTheme.glow}`,
            }}
          />

          {/* Ring 2 - Mid Ring */}
          <div
            className="absolute rounded-full border-2 border-cyan-300/80"
            style={{
              width: '74%',
              height: '74%',
              transform: 'rotateX(72deg)',
              boxShadow: `0 0 20px ${currentTheme.primary}`,
            }}
          />

          {/* Ring 3 - Inner Core Disc */}
          <div
            className="absolute rounded-full border border-white/90"
            style={{
              width: '46%',
              height: '46%',
              transform: 'rotateX(72deg)',
              background: `radial-gradient(circle, rgba(255,255,255,0.7) 0%, ${currentTheme.primary} 60%, transparent 100%)`,
              boxShadow: `0 0 24px ${currentTheme.primary}`,
            }}
          />
        </div>
      )}
    </div>
  );
}
