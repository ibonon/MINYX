'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ElementType } from './Mascot3D';

// Dynamically import Mascot3D with SSR disabled to prevent WebGL window/canvas hydration mismatch
const Mascot3DInner = dynamic(() => import('./Mascot3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="relative w-28 h-28 rounded-full border-2 border-cyan-400/40 border-t-cyan-300 animate-spin" />
      <span className="mt-4 text-xs font-share-tech text-cyan-400/60 uppercase tracking-widest animate-pulse">
        Initialisation du Sanctuaire 3D...
      </span>
    </div>
  ),
});

interface Companion3DViewProps {
  element?: ElementType;
  interactive?: boolean;
  className?: string;
  onMascotClick?: () => void;
}

export default function Companion3DView(props: Companion3DViewProps) {
  return <Mascot3DInner {...props} />;
}
