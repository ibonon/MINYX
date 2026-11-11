// ============================================================
// MINYX — Rate limiting en mémoire (sliding window)
//
// Suffisant pour une instance (Vercel/Fly single-region).
// Pour du scale-out horizontal : brancher Upstash Redis avec la
// même interface (la fonction est le seul point à changer).
// ============================================================

interface WindowState {
  timestamps: number[];
}

const windows = new Map<string, WindowState>();

// Nettoyage périodique pour éviter la croissance indéfinie de la Map.
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Fenêtre glissante par clé (ex: `${route}:${ip}:${userId}`).
 * @param key  identifiant unique du quota
 * @param max  nombre max de requêtes dans la fenêtre
 * @param windowMs taille de la fenêtre en ms
 */
export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [k, state] of windows) {
      if (state.timestamps.length === 0 || now - state.timestamps[state.timestamps.length - 1] > windowMs * 10) {
        windows.delete(k);
      }
    }
    lastCleanup = now;
  }

  const state = windows.get(key) ?? { timestamps: [] };
  state.timestamps = state.timestamps.filter((t) => now - t < windowMs);

  if (state.timestamps.length >= max) {
    const oldest = state.timestamps[0];
    windows.set(key, state);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  state.timestamps.push(now);
  windows.set(key, state);
  return { allowed: true, remaining: max - state.timestamps.length, retryAfterSeconds: 0 };
}

/** IP client derrière un proxy (Vercel fournit x-forwarded-for). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
