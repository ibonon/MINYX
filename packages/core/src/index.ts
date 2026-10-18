// ============================================================
// MINYX Core — Business Logic
// ============================================================

// Elements
export const ELEMENTS = ['Feu', 'Eau', 'Ténèbres', 'Lumière', 'Terre', 'Vent', 'Cosmos'] as const;
export type Element = (typeof ELEMENTS)[number];

// Companion forms / evolution stages
export const FORMS = ['Chibi', 'Éveillé', 'Évolué', 'Transcendant', 'Légendaire'] as const;
export type Form = (typeof FORMS)[number];

// Stats
export interface CompanionStats {
  INT: number; // Intelligence
  EMO: number; // Emotional depth
  AGI: number; // Agility
  BOND: number; // Bond level (0-100)
}

// Companion entity
export interface Companion {
  id: string;
  name: string;
  element: Element;
  form: Form;
  level: number;
  xp: number;
  xpToNextLevel: number;
  stats: CompanionStats;
  nftTokenId?: string;
  createdAt: Date;
  lastInteraction: Date;
}

// XP thresholds per level (level 1-100)
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Add XP and handle level-ups
export function addXP(
  companion: Companion,
  xpGained: number,
): { companion: Companion; leveledUp: boolean; newForm?: Form } {
  let { xp, level, form } = companion;
  let leveledUp = false;
  let newForm: Form | undefined;

  xp += xpGained;

  while (xp >= xpForLevel(level + 1)) {
    xp -= xpForLevel(level + 1);
    level++;
    leveledUp = true;

    // Evolution gates
    const evolvedForm = getFormForLevel(level);
    if (evolvedForm !== form) {
      newForm = evolvedForm;
      form = evolvedForm;
    }
  }

  return {
    companion: { ...companion, xp, level, form, xpToNextLevel: xpForLevel(level + 1) },
    leveledUp,
    newForm,
  };
}

// Determine form based on level
export function getFormForLevel(level: number): Form {
  if (level >= 80) return 'Légendaire';
  if (level >= 50) return 'Transcendant';
  if (level >= 25) return 'Évolué';
  if (level >= 10) return 'Éveillé';
  return 'Chibi';
}

// Stat gains per interaction type
export const STAT_GAINS: Record<string, Partial<CompanionStats>> = {
  conversation: { EMO: 1, BOND: 1 },
  gift: { EMO: 2, BOND: 2 },
  training: { AGI: 3, INT: 1 },
  study: { INT: 3 },
  milestone: { BOND: 5, EMO: 2 },
};
