// ============================================================
// @minyx/api/client — Entrée SÛRE pour le navigateur / React Native
// AUCUN import de Prisma, db, ou clé d'API ici. Uniquement des
// types partagés et des helpers purs. Le bundle client ne doit
// jamais importer '@minyx/api' (racine) : cette entrée existe
// pour ça.
// ============================================================

export type { HackathonElement, EvolutionStage } from './meta_muse';
export { museImageService } from './meta_muse';

// ── Types de réponse du compagnon ────────────────────────────

/** Origine réelle de la réponse — l'UI s'appuie dessus pour ne jamais mentir. */
export type ResponseSource = 'meta-api' | 'scripted-fallback';

export type Locale = 'fr' | 'en';

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
}

export interface SearchResult {
  query: string;
  summary: string;
  sources: Array<{ title: string; url: string; snippet: string }>;
  timestamp: string;
}

export interface ReminderSummary {
  id: string;
  title: string;
  when: string;
}

export interface LlamaToolCall {
  name: 'create_reminder' | 'web_search';
  parameters: Record<string, string>;
  result: ToolResult<ReminderSummary | SearchResult>;
}

export interface LlamaResponse {
  content: string;
  toolCall?: LlamaToolCall;
  factsStored?: string[];
  modelUsed: string;
  source: ResponseSource;
}

// ── Types mémoire & rappels (aperçu client) ──────────────────

export type MemoryNamespace = 'core' | 'events' | 'preferences' | 'moods';

export interface MemoItem {
  id: string;
  companionId: string;
  namespace: MemoryNamespace;
  content: string;
  importance: number;
  timestamp: string;
}

export interface ReminderView {
  id: string;
  title: string;
  when: string;
  createdAt: string;
  completed: boolean;
}

// ── Types compagnon (aperçu client) ──────────────────────────

export interface CompanionStatsView {
  INT: number;
  EMO: number;
  AGI: number;
  BOND: number;
}

export interface CompanionView {
  id: string;
  name: string;
  element: string;
  form: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  stats: CompanionStatsView;
}
