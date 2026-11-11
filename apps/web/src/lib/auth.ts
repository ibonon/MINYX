// ============================================================
// MINYX — Authentification (apps/web)
// Email + mot de passe (bcrypt), session JWT signée dans un
// cookie HttpOnly + SameSite=Lax. Aucune donnée d'identité
// n'est stockée côté client.
//
// OAuth (Google/Discord) : le schéma Prisma est prêt (User.email
// unique, passwordHash nullable-able) — brancher Auth.js v5 plus
// tard sans migration destructive.
// ============================================================

import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db } from '@minyx/api';

const SESSION_COOKIE = 'minyx_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 jours

function getSessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret && secret.length >= 32) {
    return new TextEncoder().encode(secret);
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'AUTH_SECRET manquant ou trop court (>= 32 caractères). Générer avec : openssl rand -base64 48'
    );
  }
  // Développement uniquement : clé dérivée déterministe, jamais en prod.
  return new TextEncoder().encode('minyx-dev-secret-do-not-use-in-production-000000000');
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  locale: 'fr' | 'en';
}

// ── Mots de passe ────────────────────────────────────────────

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── Validation ───────────────────────────────────────────────

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (password.length > 128) return 'Le mot de passe ne peut pas dépasser 128 caractères.';
  return null;
}

// ── Session ──────────────────────────────────────────────────

/** Signe un JWT de session (cookie web) — aussi utilisable comme Bearer mobile. */
export async function signSessionToken(userId: string, sessionId: string): Promise<string> {
  return new SignJWT({ sub: userId, sid: sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSessionSecret());
}

/** Token de session : header Bearer (mobile/API) prioritaire, sinon cookie HttpOnly. */
async function extractSessionToken(request?: Request): Promise<string | undefined> {
  const authHeader = request?.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

/**
 * Crée une session révocable en base, signe le JWT (claim `sid` = id de session),
 * pose le cookie et renvoie le token brut (clients natifs).
 * La ligne Session fait foi : la révoquer invalide immédiatement le token,
 * même s'il est encore valide cryptographiquement.
 */
export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const session = await db.session.create({
    data: { userId, expiresAt },
    select: { id: true },
  });

  const token = await signSessionToken(userId, session.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return token;
}

/** Révoque la session courante en base (effet immédiat) puis efface le cookie. */
export async function destroySession(request?: Request): Promise<void> {
  const token = await extractSessionToken(request);
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSessionSecret());
      const sessionId = typeof payload.sid === 'string' ? payload.sid : null;
      if (sessionId) {
        await db.session.updateMany({
          where: { id: sessionId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    } catch {
      // Token absent, expiré ou invalide : rien à révoquer.
    }
  }
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Retourne l'utilisateur authentifié, ou null.
 * Web : cookie HttpOnly. Mobile/API : header `Authorization: Bearer <token>`.
 * La session doit exister en base et ne pas être révoquée/expirée.
 */
export async function getSessionUser(request?: Request): Promise<SessionUser | null> {
  const token = await extractSessionToken(request);
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const userId = typeof payload.sub === 'string' ? payload.sub : null;
    const sessionId = typeof payload.sid === 'string' ? payload.sid : null;
    if (!userId || !sessionId) return null;

    const session = await db.session.findUnique({
      where: { id: sessionId },
      select: { userId: true, expiresAt: true, revokedAt: true },
    });
    if (
      !session ||
      session.revokedAt !== null ||
      session.userId !== userId ||
      session.expiresAt <= new Date()
    ) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, locale: true },
    });
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      locale: user.locale === 'en' ? 'en' : 'fr',
    };
  } catch {
    return null;
  }
}

/** Variante stricte : lève 401 si non authentifié. */
export async function requireUser(request?: Request): Promise<SessionUser> {
  const user = await getSessionUser(request);
  if (!user) {
    const error = new Error('unauthorized') as Error & { status?: number };
    error.status = 401;
    throw error;
  }
  return user;
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message === 'unauthorized';
}

// ── Google OAuth Scaffolding ─────────────────────────────────

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

export function getGoogleOAuthUrl(redirectUri: string, state?: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || '';
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: redirectUri,
    client_id: clientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
    state: state || 'minyx-oauth-state',
  };
  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
}
