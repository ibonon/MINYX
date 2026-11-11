// ============================================================
// MINYX — Client API typé (navigateur)
// Toutes les erreurs serveur remontent sous forme d'Error avec
// un code exploitable par l'UI (error.code).
// ============================================================

import type {
  CompanionView,
  LlamaResponse,
  MemoItem,
  ReminderView,
} from '@minyx/api/client';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  locale: 'fr' | 'en';
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    let code = `http_${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) code = body.error;
    } catch {
      // Réponse non-JSON : on garde le code HTTP.
    }
    throw Object.assign(new Error(code), { code, status: res.status });
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ── Auth ─────────────────────────────────────────────────────

export const auth = {
  me: () => request<{ user: SessionUser | null }>('/api/auth/me'),
  register: (email: string, password: string, name?: string) =>
    request<{ user: SessionUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email: string, password: string) =>
    request<{ user: SessionUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
};

// ── Compagnons ───────────────────────────────────────────────

export const companions = {
  list: () => request<{ companions: CompanionView[] }>('/api/companions'),
  create: (name: string, element: string) =>
    request<{ companion: CompanionView }>('/api/companions', {
      method: 'POST',
      body: JSON.stringify({ name, element }),
    }),
  action: (id: string, action: 'feed' | 'train' | 'meditate') =>
    request<{ companion: CompanionView; leveledUp: boolean }>(`/api/companions/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
};

// ── Chat ─────────────────────────────────────────────────────

export interface ChatReply {
  conversationId: string;
  messageId: string;
  response: LlamaResponse;
  companion: CompanionView | null;
}

export const chat = {
  send: (companionId: string, message: string, conversationId?: string) =>
    request<ChatReply>('/api/companion/chat', {
      method: 'POST',
      body: JSON.stringify({ companionId, message, conversationId }),
    }),
};

// ── Mémoire ──────────────────────────────────────────────────

export const memories = {
  list: (companionId: string) =>
    request<{ memories: MemoItem[] }>(`/api/memories?companionId=${encodeURIComponent(companionId)}`),
  remove: (id: string) =>
    request<{ ok: boolean }>(`/api/memories?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// ── Rappels ──────────────────────────────────────────────────

export const reminders = {
  list: (companionId?: string) =>
    request<{ reminders: ReminderView[] }>(
      companionId ? `/api/reminders?companionId=${encodeURIComponent(companionId)}` : '/api/reminders'
    ),
  cancel: (id: string) =>
    request<{ ok: boolean }>(`/api/reminders?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// ── Santé / intégrations ─────────────────────────────────────

export interface HealthStatus {
  status: 'ok' | 'degraded';
  database: string;
  metaApi: { configured: boolean; model: string | null };
  search: { provider: string | null };
  memory: { mode: 'semantic' | 'lexical' };
}

export const health = {
  get: () => request<HealthStatus>('/api/health'),
};
