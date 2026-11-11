import { NextResponse } from 'next/server';
import { db } from '@minyx/api';
import { requireUser, isUnauthorizedError } from '../../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Historique complet d'une conversation — vérifié propriétaire. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;

    const conversation = await db.conversation.findFirst({
      where: { id, userId: user.id },
      select: { id: true, companionId: true, title: true },
    });
    if (!conversation) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const messages = await db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      take: 500,
      select: {
        id: true,
        role: true,
        content: true,
        source: true,
        modelUsed: true,
        toolCallJson: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ conversation, messages });
  } catch (error) {
    if (isUnauthorizedError(error)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw error;
  }
}
