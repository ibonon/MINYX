import { NextResponse } from 'next/server';
import { db } from '@minyx/api';
import { requireUser, isUnauthorizedError } from '../../../../lib/auth';
import { toCompanionView } from '../../../../lib/companion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Next 15 : params est asynchrone dans les route handlers.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;

    const companion = await db.companion.findFirst({ where: { id, userId: user.id } });
    if (!companion) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    return NextResponse.json({ companion: toCompanionView(companion) });
  } catch (error) {
    if (isUnauthorizedError(error)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw error;
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;

    // La cascade Prisma emporte conversations, mémoires et rappels du compagnon.
    const deleted = await db.companion.deleteMany({ where: { id, userId: user.id } });
    if (deleted.count === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isUnauthorizedError(error)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw error;
  }
}
