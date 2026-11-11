import { NextResponse } from 'next/server';
import { db } from '@minyx/api';
import {
  createSession,
  hashPassword,
  validateEmail,
  validatePassword,
} from '../../../../lib/auth';
import { getClientIp, rateLimit } from '../../../../lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const limiter = rateLimit(`register:${getClientIp(request)}`, 5, 60 * 60 * 1000);
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

  const { email, password, name } = payload as Record<string, unknown>;

  if (typeof email !== 'string' || !validateEmail(email.trim().toLowerCase())) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }
  if (typeof password !== 'string') {
    return NextResponse.json({ error: 'missing_password' }, { status: 400 });
  }
  const passwordIssue = validatePassword(password);
  if (passwordIssue) {
    return NextResponse.json({ error: 'weak_password', detail: passwordIssue }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const displayName = typeof name === 'string' && name.trim() ? name.trim().slice(0, 60) : normalizedEmail.split('@')[0];

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: 'email_taken' }, { status: 409 });
  }

  const user = await db.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      name: displayName,
    },
    select: { id: true, email: true, name: true, locale: true },
  });

  const token = await createSession(user.id);
  return NextResponse.json({ user, token }, { status: 201 });
}
