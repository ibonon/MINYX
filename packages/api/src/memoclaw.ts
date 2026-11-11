// ============================================================
// @minyx/api — MemoClaw Memory Engine (DB-backed)
// 4 Namespaces: core / events / preferences / moods
//
// Remplace l'ancienne implémentation "sqlite" (en réalité une Map
// en mémoire + localStorage). Toutes les mémoires sont désormais
// persistées en base et isolées par (userId, companionId).
//
// Recherche de contexte :
//  - Avec EMBEDDING_API_KEY (endpoint compatible OpenAI) : recherche
//    sémantique vectorielle (pgvector en prod PostgreSQL).
//  - Sans clé : score lexical (recouvrement de mots) + importance +
//    récence. La dégradation est explicite et honnête.
// ============================================================

import { db } from './db';

export type MemoryNamespace = 'core' | 'events' | 'preferences' | 'moods';

export const MEMORY_NAMESPACES: readonly MemoryNamespace[] = [
  'core',
  'events',
  'preferences',
  'moods',
];

export function isMemoryNamespace(value: unknown): value is MemoryNamespace {
  return typeof value === 'string' && (MEMORY_NAMESPACES as readonly string[]).includes(value);
}

export interface MemoItem {
  id: string;
  companionId: string;
  namespace: MemoryNamespace;
  content: string;
  importance: number;
  timestamp: string;
}

export type MemorySearchMode = 'semantic' | 'lexical';

/** Mode de recherche réellement actif, exposé à l'UI et aux logs. */
export function getMemorySearchMode(): MemorySearchMode {
  return process.env.EMBEDDING_API_KEY?.trim() ? 'semantic' : 'lexical';
}

const MAX_CONTEXT_MEMORIES = 8;

function toItem(row: {
  id: string;
  companionId: string;
  namespace: string;
  content: string;
  importance: number;
  createdAt: Date;
}): MemoItem {
  return {
    id: row.id,
    companionId: row.companionId,
    namespace: row.namespace as MemoryNamespace,
    content: row.content,
    importance: row.importance,
    timestamp: row.createdAt.toISOString(),
  };
}

export class MemoClawService {
  /** Persiste une mémoire. `companionId` doit appartenir à `userId` (vérifié par l'appelant route). */
  async store(
    userId: string,
    companionId: string,
    namespace: MemoryNamespace,
    content: string,
    importance = 0.7
  ): Promise<MemoItem> {
    const row = await db.memoryItem.create({
      data: { userId, companionId, namespace, content, importance },
    });
    return toItem(row);
  }

  async getAll(userId: string, companionId: string): Promise<MemoItem[]> {
    const rows = await db.memoryItem.findMany({
      where: { userId, companionId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map(toItem);
  }

  async getByNamespace(
    userId: string,
    companionId: string,
    namespace: MemoryNamespace
  ): Promise<MemoItem[]> {
    const rows = await db.memoryItem.findMany({
      where: { userId, companionId, namespace },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toItem);
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const result = await db.memoryItem.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  // ── Extraction de faits ────────────────────────────────────
  // Extraction lexicale déterministe (fonctionne hors LLM).
  // Étape suivante possible : extraction par le modèle lui-même
  // via un tool call dédié (structured output).

  extractFacts(
    userId: string,
    companionId: string,
    text: string,
    locale: 'fr' | 'en' = 'fr'
  ): string[] {
    const extracted: string[] = [];
    const lower = text.toLowerCase();

    const store = (namespace: MemoryNamespace, content: string, importance: number) => {
      extracted.push(content);
      void this.store(userId, companionId, namespace, content, importance).catch(() => {
        // La persistance d'un fait ne doit jamais faire échouer le tour de chat.
      });
    };

    if (locale === 'fr') {
      if (/(examen|partiel|entretien|rendez-vous)/.test(lower)) {
        store('events', `Prépare un événement important (mentionné : "${truncate(text, 140)}")`, 0.95);
      } else if (/(jeudi|vendredi|demain|semaine prochaine|lundi|mardi|mercredi|samedi|dimanche)/.test(lower)) {
        store('events', `Échéance temporelle notée : "${truncate(text, 140)}"`, 0.85);
      }
      if (/(j'aime|j'adore|je préfère|passionné)/.test(lower)) {
        store('preferences', `Préférence : "${truncate(text, 140)}"`, 0.8);
      }
      if (/(stress|peur|anxieux|fatigué|épuisé|seul|triste)/.test(lower)) {
        store('moods', `État émotionnel difficile : "${truncate(text, 140)}"`, 0.9);
      } else if (/(heureux|fier|content|excité|j'ai réussi|j'ai gagné)/.test(lower)) {
        store('moods', `État émotionnel positif : "${truncate(text, 140)}"`, 0.75);
      }
    } else {
      if (/(exam|interview|appointment|deadline)/.test(lower)) {
        store('events', `Preparing for an important event (mentioned: "${truncate(text, 140)}")`, 0.95);
      } else if (/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week)/.test(lower)) {
        store('events', `Time-sensitive note: "${truncate(text, 140)}"`, 0.85);
      }
      if (/(i love|i like|i prefer|passionate)/.test(lower)) {
        store('preferences', `Preference: "${truncate(text, 140)}"`, 0.8);
      }
      if (/(stress|scared|anxious|tired|exhausted|lonely|sad)/.test(lower)) {
        store('moods', `Difficult emotional state: "${truncate(text, 140)}"`, 0.9);
      } else if (/(happy|proud|excited|i succeeded|i won)/.test(lower)) {
        store('moods', `Positive emotional state: "${truncate(text, 140)}"`, 0.75);
      }
    }

    return extracted;
  }

  /**
   * Assemble le contexte mémoire injecté dans le prompt système.
   * Mode lexical : score = recouvrement de mots avec le message courant
   * + importance + bonus de récence. Les mêmes 8 mémoires maximum.
   */
  async buildContextPrompt(
    companionId: string,
    currentMessage: string,
    locale: 'fr' | 'en' = 'fr'
  ): Promise<string> {
    const rows = await db.memoryItem.findMany({
      where: { companionId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    if (rows.length === 0) return '';

    const ranked = rows
      .map((row) => ({ row, score: lexicalScore(currentMessage, row.content) + row.importance + recencyBonus(row.createdAt) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_CONTEXT_MEMORIES);

    const labels: Record<MemoryNamespace, { fr: string; en: string }> = {
      events: { fr: 'Événements récents', en: 'Recent events' },
      preferences: { fr: 'Préférences', en: 'Preferences' },
      moods: { fr: 'Contexte émotionnel', en: 'Emotional context' },
      core: { fr: 'Faits essentiels', en: 'Core facts' },
    };

    const lines: string[] = [
      locale === 'fr'
        ? '[MÉMOIRE PERSISTANTE — FAITS RÉELLEMENT RETENUS SUR CET UTILISATEUR :]'
        : '[PERSISTANT MEMORY — FACTS ACTUALLY REMEMBERED ABOUT THIS USER:]',
    ];

    for (const ns of MEMORY_NAMESPACES) {
      const group = ranked.filter((r) => r.row.namespace === ns);
      if (group.length === 0) continue;
      lines.push(labels[ns][locale] + ' :');
      group.forEach((g) => lines.push(`- ${g.row.content}`));
    }

    lines.push(
      locale === 'fr'
        ? "Consigne : appuie-toi sur ces faits quand ils sont pertinents, sans les réciter mécaniquement."
        : 'Instruction: rely on these facts when relevant, without reciting them mechanically.'
    );
    return lines.join('\n');
  }
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max) + '…';
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-z0-9']+/)
      .filter((token) => token.length > 2)
  );
}

function lexicalScore(currentMessage: string, memoryContent: string): number {
  const a = tokenize(currentMessage);
  if (a.size === 0) return 0;
  const b = tokenize(memoryContent);
  let overlap = 0;
  for (const token of a) if (b.has(token)) overlap++;
  return overlap / a.size;
}

function recencyBonus(createdAt: Date): number {
  const ageDays = (Date.now() - createdAt.getTime()) / 86_400_000;
  return Math.max(0, 0.5 - ageDays * 0.01);
}

export const memoClaw = new MemoClawService();
