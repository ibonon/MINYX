// ============================================================
// MINYX — Helpers compagnon côté serveur
// XP/stats via @minyx/core (logique métier canonique), sérialisation
// depuis les lignes Prisma (statsJson portable SQLite/Postgres).
// ============================================================

import { db } from '@minyx/api';
import { addXP, xpForLevel, type Companion, type Element, type CompanionStats } from '@minyx/core';
import type { CompanionStatsView, CompanionView } from '@minyx/api/client';

export const ALLOWED_ELEMENTS = ['Eau', 'Feu', 'Ténèbres'] as const;
export type MinyxElement = (typeof ALLOWED_ELEMENTS)[number];

export function isAllowedElement(value: unknown): value is MinyxElement {
  return typeof value === 'string' && (ALLOWED_ELEMENTS as readonly string[]).includes(value);
}

const DEFAULT_STATS: CompanionStatsView = { INT: 28, EMO: 35, AGI: 22, BOND: 40 };

export function parseStats(statsJson: string): CompanionStatsView {
  try {
    const parsed = JSON.parse(statsJson) as Partial<CompanionStats>;
    return {
      INT: numberOr(parsed.INT, DEFAULT_STATS.INT),
      EMO: numberOr(parsed.EMO, DEFAULT_STATS.EMO),
      AGI: numberOr(parsed.AGI, DEFAULT_STATS.AGI),
      BOND: numberOr(parsed.BOND, DEFAULT_STATS.BOND),
    };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function toCompanionView(row: {
  id: string;
  name: string;
  element: string;
  form: string;
  level: number;
  xp: number;
  statsJson: string;
}): CompanionView {
  return {
    id: row.id,
    name: row.name,
    element: row.element,
    form: row.form,
    level: row.level,
    xp: row.xp,
    xpToNextLevel: xpForLevel(row.level + 1),
    stats: parseStats(row.statsJson),
  };
}

/** XP gagné par tour de conversation + gains de stats associés. */
const CONVERSATION_XP_GAIN = 12;
const CONVERSATION_STAT_GAIN: Partial<CompanionStats> = { EMO: 1, BOND: 1 };

/**
 * Applique les gains d'un tour de conversation et persiste.
 * Ne doit JAMAIS faire échouer le tour de chat : échec silencieux.
 */
export async function awardConversationGains(companionId: string): Promise<CompanionView | null> {
  try {
    const row = await db.companion.findUnique({ where: { id: companionId } });
    if (!row) return null;

    const stats = parseStats(row.statsJson);
    const nextStats: CompanionStats = {
      INT: stats.INT + (CONVERSATION_STAT_GAIN.INT ?? 0),
      EMO: stats.EMO + (CONVERSATION_STAT_GAIN.EMO ?? 0),
      AGI: stats.AGI + (CONVERSATION_STAT_GAIN.AGI ?? 0),
      BOND: Math.min(100, stats.BOND + (CONVERSATION_STAT_GAIN.BOND ?? 0)),
    };

    const asCore: Companion = {
      id: row.id,
      name: row.name,
      element: row.element as Element,
      form: row.form as Companion['form'],
      level: row.level,
      xp: row.xp,
      xpToNextLevel: xpForLevel(row.level + 1),
      stats,
      createdAt: row.createdAt,
      lastInteraction: new Date(),
    };

    const { companion: updated, leveledUp } = addXP(asCore, CONVERSATION_XP_GAIN);

    await db.companion.update({
      where: { id: companionId },
      data: {
        xp: updated.xp,
        level: updated.level,
        form: updated.form,
        statsJson: JSON.stringify(nextStats),
      },
    });

    const view = toCompanionView({
      ...row,
      level: updated.level,
      xp: updated.xp,
      form: updated.form,
      statsJson: JSON.stringify(nextStats),
    });
    return leveledUp ? { ...view, form: updated.form } : view;
  } catch (error) {
    console.warn('[MINYX] Échec des gains de conversation :', error);
    return null;
  }
}
