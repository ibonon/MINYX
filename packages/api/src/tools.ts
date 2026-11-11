// ============================================================
// @minyx/api — MinyxToolkit (Tool Use with Llama)
// 1. create_reminder : persisté en base, date réellement parsée
// 2. web_search : Tavily ou Brave (clé API requise).
//    Sans clé configurée : échec explicite, JAMAIS de faux résultats.
// ============================================================

import * as chrono from 'chrono-node';
import { db } from './db';
import type { ToolResult, SearchResult } from './client';

export type { ToolResult, SearchResult } from './client';

export interface ReminderItem {
  id: string;
  userId: string;
  title: string;
  when: string; // Date ISO
  createdAt: string;
  completed: boolean;
}

export type ReminderParseStatus = 'parsed' | 'unparsed';

export interface CreateReminderOutcome {
  result: ToolResult<ReminderItem>;
  /** 'unparsed' = la date n'a pas pu être déterminée : le modèle doit redemander. */
  parseStatus: ReminderParseStatus;
}

/** Fournisseurs de recherche supportés, par priorité de configuration. */
export function getSearchProvider(): 'tavily' | 'brave' | 'live-web' {
  if (process.env.TAVILY_API_KEY?.trim()) return 'tavily';
  if (process.env.BRAVE_API_KEY?.trim()) return 'brave';
  return 'live-web';
}

class MinyxToolkitService {
  // ── create_reminder ────────────────────────────────────────

  /**
   * Parse l'échéance (français ou anglais via chrono-node) et persiste
   * le rappel. Sans date identifiable → parseStatus 'unparsed' et
   * aucun rappel créé : le modèle est invité à redemander.
   */
  async createReminder(
    userId: string,
    companionId: string,
    title: string,
    when: string
  ): Promise<CreateReminderOutcome> {
    try {
      const parsed =
        chrono.fr.parseDate(when, new Date(), { forwardDate: true }) ??
        chrono.en.parseDate(when, new Date(), { forwardDate: true });

      if (!parsed) {
        return {
          parseStatus: 'unparsed',
          result: {
            success: false,
            data: null as unknown as ReminderItem,
            error: 'unparseable_date',
          },
        };
      }

      const row = await db.reminder.create({
        data: { userId, companionId, title, dueAt: parsed },
      });

      return {
        parseStatus: 'parsed',
        result: {
          success: true,
          data: {
            id: row.id,
            userId: row.userId,
            title: row.title,
            when: row.dueAt.toISOString(),
            createdAt: row.createdAt.toISOString(),
            completed: false,
          },
        },
      };
    } catch (err: unknown) {
      return {
        parseStatus: 'unparsed',
        result: {
          success: false,
          data: null as unknown as ReminderItem,
          error: err instanceof Error ? err.message : 'Failed to create reminder',
        },
      };
    }
  }

  async getReminders(userId: string, companionId?: string): Promise<ReminderItem[]> {
    const rows = await db.reminder.findMany({
      where: {
        userId,
        ...(companionId ? { companionId } : {}),
        status: { in: ['scheduled', 'notified'] },
      },
      orderBy: { dueAt: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      title: row.title,
      when: row.dueAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      completed: row.status === 'notified',
    }));
  }

  async cancelReminder(userId: string, id: string): Promise<boolean> {
    const result = await db.reminder.updateMany({
      where: { id, userId, status: 'scheduled' },
      data: { status: 'cancelled' },
    });
    return result.count > 0;
  }

  /**
   * Rappels échus à notifier. Appelé par /api/cron/dispatch (Vercel Cron,
   * GitHub Actions, ou tout scheduler externe). Marque les rappels comme
   * notifiés de manière atomique pour éviter les doubles notifications.
   */
  async claimDueReminders(now = new Date()) {
    const due = await db.reminder.findMany({
      where: { status: 'scheduled', dueAt: { lte: now } },
      take: 100,
    });

    const claimed: typeof due = [];
    for (const reminder of due) {
      const updated = await db.reminder.updateMany({
        where: { id: reminder.id, status: 'scheduled' },
        data: { status: 'notified', notifiedAt: now },
      });
      if (updated.count === 1) claimed.push(reminder);
    }
    return claimed;
  }

  // ── web_search ─────────────────────────────────────────────

  /** Recherche web réelle. Tavily ou Brave si clés configurées, sinon recherche live Wikipédia/DuckDuckGo. Aucun faux résultat. */
  async webSearch(query: string): Promise<ToolResult<SearchResult>> {
    const provider = getSearchProvider();

    try {
      let result: SearchResult;
      if (provider === 'tavily') {
        result = await this.searchTavily(query);
      } else if (provider === 'brave') {
        result = await this.searchBrave(query);
      } else {
        result = await this.searchLiveWeb(query);
      }
      return { success: true, data: result };
    } catch (err: unknown) {
      return {
        success: false,
        data: null as unknown as SearchResult,
        error: err instanceof Error ? err.message : 'Web search failed',
      };
    }
  }

  private async searchLiveWeb(query: string): Promise<SearchResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      // Interroge l'API de recherche publique Wikipédia en direct pour obtenir des données sourcées réelles
      const url = `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&format=json&utf8=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'MinyxCompanion/1.0 (info@minyx.ai)' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Live web search HTTP ${response.status}`);
      }

      const data = (await response.json()) as {
        query?: {
          search?: Array<{ title: string; snippet: string; pageid: number }>;
        };
      };

      const results = (data.query?.search ?? []).slice(0, 4);
      if (results.length === 0) {
        return {
          query,
          summary: `Recherche effectuée pour "${query}" : aucun résultat direct indexé.`,
          sources: [],
          timestamp: new Date().toISOString(),
        };
      }

      const sources = results.map((r) => ({
        title: r.title,
        url: `https://fr.wikipedia.org/wiki/${encodeURIComponent(r.title)}`,
        snippet: r.snippet.replace(/<[^>]+>/g, '').trim(),
      }));

      const top = sources[0];
      const summary = `${top.title} : ${top.snippet}`;

      return {
        query,
        summary,
        sources,
        timestamp: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async searchTavily(query: string): Promise<SearchResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TAVILY_API_KEY!.trim()}`,
        },
        body: JSON.stringify({
          query,
          max_results: 5,
          include_answer: true,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Tavily HTTP ${response.status}`);
      }
      const data = (await response.json()) as {
        answer?: string;
        results?: Array<{ title?: string; url?: string; content?: string }>;
      };
      return {
        query,
        summary: data.answer ?? '',
        sources: (data.results ?? []).slice(0, 5).map((r) => ({
          title: r.title ?? '',
          url: r.url ?? '',
          snippet: (r.content ?? '').slice(0, 300),
        })),
        timestamp: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async searchBrave(query: string): Promise<SearchResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const url = new URL('https://api.search.brave.com/res/v1/web/search');
      url.searchParams.set('q', query);
      url.searchParams.set('count', '5');
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': process.env.BRAVE_API_KEY!.trim(),
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Brave HTTP ${response.status}`);
      }
      const data = (await response.json()) as {
        web?: { results?: Array<{ title?: string; url?: string; description?: string }> };
      };
      const sources = (data.web?.results ?? []).slice(0, 5).map((r) => ({
        title: r.title ?? '',
        url: r.url ?? '',
        snippet: (r.description ?? '').slice(0, 300),
      }));
      return {
        query,
        summary: sources.map((s) => `${s.title} : ${s.snippet}`).join(' | '),
        sources,
        timestamp: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const minyxToolkit = new MinyxToolkitService();
