import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@minyx/api';
import { requireUser, isUnauthorizedError } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  companionId: z.string().min(1),
  title: z.string().trim().max(80).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const companionId = new URL(request.url).searchParams.get('companionId');

    const conversations = await db.conversation.findMany({
      where: {
        userId: user.id,
        ...(companionId ? { companionId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        companionId: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ conversations });
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

    // Le compagnon doit appartenir à l'utilisateur.
    const companion = await db.companion.findFirst({
      where: { id: parsed.data.companionId, userId: user.id },
    });
    if (!companion) return NextResponse.json({ error: 'companion_not_found' }, { status: 404 });

    const conversation = await db.conversation.create({
      data: {
        userId: user.id,
        companionId: companion.id,
        title: parsed.data.title ?? 'Nouvelle conversation',
      },
    });
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    if (isUnauthorizedError(error)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw error;
  }
}
