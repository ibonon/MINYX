import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@minyx/api';
import { requireUser, isUnauthorizedError } from '../../../lib/auth';
import { getClientIp, rateLimit } from '../../../lib/ratelimit';
import { isAllowedElement, toCompanionView } from '../../../lib/companion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().trim().min(1).max(40),
  element: z.string(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const companions = await db.companion.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ companions: companions.map(toCompanionView) });
  } catch (error) {
    if (isUnauthorizedError(error)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);

    const limiter = rateLimit(`companions:${user.id}`, 10, 60 * 60 * 1000);
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfterSeconds) } }
      );
    }

    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }
    if (!isAllowedElement(parsed.data.element)) {
      return NextResponse.json({ error: 'invalid_element' }, { status: 400 });
    }

    const companion = await db.companion.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        element: parsed.data.element,
      },
    });
    return NextResponse.json({ companion: toCompanionView(companion) }, { status: 201 });
  } catch (error) {
    if (isUnauthorizedError(error)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw error;
  }
}

// Référence conservée pour la cohérence du rate limiting par IP si besoin futur.
void getClientIp;
