import { describe, expect, it } from 'vitest';
import { getClientIp, rateLimit } from './ratelimit';

describe('rateLimit (fenêtre glissante)', () => {
  it('autorise jusqu’à `max` requêtes puis bloque', () => {
    const key = `t:${Math.random()}`;

    for (let i = 0; i < 3; i++) {
      const result = rateLimit(key, 3, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2 - i);
    }

    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('isole les quotas par clé', () => {
    const a = `a:${Math.random()}`;
    const b = `b:${Math.random()}`;

    expect(rateLimit(a, 1, 60_000).allowed).toBe(true);
    expect(rateLimit(b, 1, 60_000).allowed).toBe(true);
    expect(rateLimit(a, 1, 60_000).allowed).toBe(false);
  });

  it('libère le quota une fois la fenêtre écoulée', () => {
    const key = `w:${Math.random()}`;
    expect(rateLimit(key, 1, 1).allowed).toBe(true);

    const deadline = Date.now() + 10;
    while (Date.now() < deadline) {
      /* attendre la fin de la fenêtre */
    }

    expect(rateLimit(key, 1, 1).allowed).toBe(true);
  });
});

describe('getClientIp', () => {
  it('prend la première IP de x-forwarded-for', () => {
    const request = new Request('http://localhost/', {
      headers: { 'x-forwarded-for': '203.0.113.7, 198.51.100.2' },
    });
    expect(getClientIp(request)).toBe('203.0.113.7');
  });

  it('retombe sur x-real-ip', () => {
    const request = new Request('http://localhost/', {
      headers: { 'x-real-ip': '198.51.100.9' },
    });
    expect(getClientIp(request)).toBe('198.51.100.9');
  });

  it('retourne "unknown" sans en-tête', () => {
    expect(getClientIp(new Request('http://localhost/'))).toBe('unknown');
  });
});
