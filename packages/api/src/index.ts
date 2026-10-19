// ============================================================
// @minyx/api — OpenClaw Gateway + MemoClaw client SDK
// ============================================================

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ── OpenClaw (Chat / LLM gateway) ──────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  companionId: string;
  messages: ChatMessage[];
  stream?: boolean;
}

export async function sendChat(req: ChatRequest): Promise<ReadableStream | ChatMessage> {
  const res = await fetch(`${API_BASE}/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) throw new Error(`OpenClaw error: ${res.status}`);
  if (req.stream) return res.body!;

  const data = await res.json();
  return data.message as ChatMessage;
}

// ── MemoClaw (Memory service) ───────────────────────────────

export interface Memory {
  id: string;
  companionId: string;
  content: string;
  embedding?: number[];
  timestamp: string;
  importance: number; // 0.0-1.0
  tags: string[];
}

export async function storeMemory(
  companionId: string,
  content: string,
  tags: string[] = [],
): Promise<Memory> {
  const res = await fetch(`${API_BASE}/v1/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companionId, content, tags }),
  });
  if (!res.ok) throw new Error(`MemoClaw store error: ${res.status}`);
  return res.json();
}

export async function searchMemory(companionId: string, query: string, k = 5): Promise<Memory[]> {
  const params = new URLSearchParams({ companionId, query, k: String(k) });
  const res = await fetch(`${API_BASE}/v1/memory/search?${params}`);
  if (!res.ok) throw new Error(`MemoClaw search error: ${res.status}`);
  return res.json();
}

export async function getMemories(companionId: string): Promise<Memory[]> {
  const res = await fetch(`${API_BASE}/v1/memory/${companionId}`);
  if (!res.ok) throw new Error(`MemoClaw get error: ${res.status}`);
  return res.json();
}

// ── Meta Hackathon Native Stack ─────────────────────────────
export * from './tools';
export * from './memoclaw_sqlite';
export * from './meta_muse';
export * from './meta_llama';

