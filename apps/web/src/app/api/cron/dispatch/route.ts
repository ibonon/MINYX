import { NextResponse } from 'next/server';
import { db, minyxToolkit } from '@minyx/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Dispatch des rappels échus — à appeler par un scheduler externe
 * (Vercel Cron, GitHub Actions, cron système) toutes les minutes :
 *
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://app/api/cron/dispatch
 *
 * Réclame atomiquement les rappels échus (statut scheduled → notified)
 * et les retourne. Le canal de livraison (push FCM/APNs, email) se
 * branche ici : c'est le seul point d'extension nécessaire.
 */
async function dispatch(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();

  if (secret) {
    const provided = request.headers.get('authorization');
    if (provided !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    // En production, exiger CRON_SECRET — pas de dispatch anonyme.
    return NextResponse.json({ error: 'cron_secret_required' }, { status: 500 });
  }

  const claimed = await minyxToolkit.claimDueReminders();

  // Enrichit avec le destinataire (le canal de notification en a besoin).
  const userIds = [...new Set(claimed.map((r) => r.userId))];
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, locale: true },
  });
  const usersById = new Map(users.map((u) => [u.id, u]));

  const due = claimed.map((reminder) => ({
    id: reminder.id,
    companionId: reminder.companionId,
    title: reminder.title,
    dueAt: reminder.dueAt.toISOString(),
    user: usersById.get(reminder.userId)
      ? { email: usersById.get(reminder.userId)!.email, locale: usersById.get(reminder.userId)!.locale }
      : null,
  }));

  // Journalisation structurée : branchable dans un vrai système de push.
  if (due.length > 0) {
    console.info('[MINYX][CRON] Rappels dispatchés :', JSON.stringify(due));
  }

  return NextResponse.json({ dispatched: due.length, due });
}

export async function POST(request: Request) {
  return dispatch(request);
}

// GET autorisé pour les schedulers qui ne font que des GET (ex: Vercel Cron).
export async function GET(request: Request) {
  return dispatch(request);
}
