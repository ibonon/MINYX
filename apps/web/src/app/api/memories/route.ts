import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db, memoClaw, isMemoryNamespace } from '@minyx/api';
import { requireUser, isUnauthorizedError } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  companionId: z.string().min(1),
  namespace: z.string(),
  content: z.string().trim().min(1).max(500),
  importance: z.number().min(0).max(1).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const companionId = new URL(request.url).searchParams.get('companionId');
    if (!companionId) {
      return NextResponse.json({ error: 'missing_companion_id' }, { status: 400 });
    }

    const companion = await db.companion.findFirst({ where: { id: companionId, userId: user.id } });
    if (!companion) return NextResponse.json({ error: 'companion_not_found' }, { status: 404 });

    const memories = await memoClaw.getAll(user.id, companionId);
    return NextResponse.json({ memories });
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
    if (!isMemoryNamespace(parsed.data.namespace)) {
      return NextResponse.json({ error: 'invalid_namespace' }, { status: 400 });
    }

    const companion = await db.companion.findFirst({
      where: { id: parsed.data.companionId, userId: user.id },
    });
    if (!companion) return NextResponse.json({ error: 'companion_not_found' }, { status: 404 });

    const memory = await memoClaw.store(
      user.id,
      companion.id,
      parsed.data.namespace,
      parsed.data.content,
      parsed.data.importance ?? 0.7
    );
    return NextResponse.json({ memory }, { status: 201 });
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

    // La suppression est bornée à l'utilisateur (memoClaw.delete filtre par userId).
    const deleted = await memoClaw.delete(user.id, id);
    if (!deleted) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isUnauthorizedError(error)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw error;
  }
}
