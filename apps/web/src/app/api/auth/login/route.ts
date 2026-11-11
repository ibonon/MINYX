import { NextResponse } from 'next/server';
import { db } from '@minyx/api';
import { createSession, verifyPassword } from '../../../../lib/auth';
import { getClientIp, rateLimit } from '../../../../lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Réponse identique pour email introuvable et mot de passe erroné :
// pas d'énumération de comptes.
const INVALID_CREDENTIALS = { error: 'invalid_credentials' };

export async function POST(request: Request) {
  const limiter = rateLimit(`login:${getClientIp(request)}`, 10, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(limiter.retryAfterSeconds) } }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (typeof payload !== 'object' || payload === null) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const { email, password } = payload as Record<string, unknown>;
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user) {
    return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
  }

  const token = await createSession(user.id);
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, locale: user.locale },
    token,
  });
}
