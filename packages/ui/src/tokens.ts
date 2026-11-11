// packages/ui/src/tokens.ts
export const tokens = {
  colors: {
    bg: {
      primary: 'bg-slate-950',
      panel: 'bg-white/5',
      panelHover: 'bg-white/8',
    },
    border: {
      default: 'border-cyan-500/20',
      hover: 'border-cyan-400/50',
      focus: 'border-cyan-400/70',
    },
    text: {
      primary: 'text-white',
      secondary: 'text-zinc-400',
      accent: 'text-cyan-400',
    },
    accent: {
      glow: 'shadow-cyan-500/30',
      cyan: 'cyan-400',
    }
  },
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  },
  transition: 'transition-all duration-300',
} as const;
