import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db, minyxToolkit } from '@minyx/api';
import { requireUser, isUnauthorizedError } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  companionId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  when: z.string().trim().min(1).max(200),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const companionId = new URL(request.url).searchParams.get('companionId') ?? undefined;

    if (companionId) {
      const companion = await db.companion.findFirst({ where: { id: companionId, userId: user.id } });
      if (!companion) return NextResponse.json({ error: 'companion_not_found' }, { status: 404 });
    }

    const reminders = await minyxToolkit.getReminders(user.id, companionId);
    return NextResponse.json({ reminders });
  } catch (error) {
    if (isUnauthorizedError(error)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const companion = await db.companion.findFirst({
      where: { id: parsed.data.companionId, userId: user.id },
    });
    if (!companion) return NextResponse.json({ error: 'companion_not_found' }, { status: 404 });

    const outcome = await minyxToolkit.createReminder(
      user.id,
      companion.id,
      parsed.data.title,
      parsed.data.when
    );
    if (!outcome.result.success) {
      return NextResponse.json({ error: outcome.result.error ?? 'reminder_failed' }, { status: 422 });
    }
    return NextResponse.json({ reminder: outcome.result.data }, { status: 201 });
  } catch (error) {
    if (isUnauthorizedError(error)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw error;
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

    const cancelled = await minyxToolkit.cancelReminder(user.id, id);
    if (!cancelled) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isUnauthorizedError(error)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw error;
  }
}
