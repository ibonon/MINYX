import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@minyx/api';
import { STAT_GAINS, addXP, xpForLevel, type CompanionStats } from '@minyx/core';
import { requireUser, isUnauthorizedError } from '../../../../../lib/auth';
import { parseStats, toCompanionView } from '../../../../../lib/companion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const actionSchema = z.object({
  action: z.enum(['feed', 'train', 'meditate']),
});

/** Gains RPG par action — mapping sur STAT_GAINS de @minyx/core. */
const ACTION_GAINS = {
  feed: { xp: 15, stats: STAT_GAINS.gift },
  train: { xp: 25, stats: STAT_GAINS.training },
  meditate: { xp: 10, stats: { ...STAT_GAINS.milestone, BOND: 5, EMO: 2 } },
} as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;

    const parsed = actionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const row = await db.companion.findFirst({ where: { id, userId: user.id } });
    if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const gains = ACTION_GAINS[parsed.data.action];
    const stats = parseStats(row.statsJson);
    const nextStats: CompanionStats = {
      INT: stats.INT + (gains.stats.INT ?? 0),
      EMO: stats.EMO + (gains.stats.EMO ?? 0),
      AGI: stats.AGI + (gains.stats.AGI ?? 0),
      BOND: Math.min(100, stats.BOND + (gains.stats.BOND ?? 0)),
    };

    const { companion: updated, leveledUp } = addXP(
      {
        id: row.id,
        name: row.name,
        element: row.element as never,
        form: row.form as never,
        level: row.level,
        xp: row.xp,
        xpToNextLevel: xpForLevel(row.level + 1),
        stats,
        createdAt: row.createdAt,
        lastInteraction: new Date(),
      },
      gains.xp
    );

    await db.companion.update({
      where: { id: row.id },
      data: {
        xp: updated.xp,
        level: updated.level,
        form: updated.form,
        statsJson: JSON.stringify(nextStats),
      },
    });

    return NextResponse.json({
      companion: toCompanionView({
        ...row,
        level: updated.level,
        xp: updated.xp,
        form: updated.form,
        statsJson: JSON.stringify(nextStats),
      }),
      leveledUp,
    });
  } catch (error) {
    if (isUnauthorizedError(error)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw error;
  }
}
