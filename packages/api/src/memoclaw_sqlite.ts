// ============================================================
// @minyx/api — MemoClaw Memory Engine (Meta Hackathon Edition)
// 4 Namespaces: core / events / preferences / moods
// ============================================================

export type MemoryNamespace = 'core' | 'events' | 'preferences' | 'moods';

export interface MemoItem {
  id: string;
  companionId: string;
  namespace: MemoryNamespace;
  content: string;
  importance: number; // 0.0 to 1.0
  timestamp: string;
}

class MemoClawService {
  private memories: Map<string, MemoItem[]> = new Map();

  // Store a single memory into specific namespace
  async store(companionId: string, namespace: MemoryNamespace, content: string, importance = 0.7): Promise<MemoItem> {
    const item: MemoItem = {
      id: 'mem_' + Math.random().toString(36).substring(2, 9),
      companionId,
      namespace,
      content,
      importance,
      timestamp: new Date().toISOString(),
    };

    const existing = this.getAll(companionId);
    existing.push(item);
    this.memories.set(companionId, existing);

    // Persist to localStorage if available
    if (typeof window !== 'undefined') {
      localStorage.setItem(`memoclaw_${companionId}`, JSON.stringify(existing));
    }

    return item;
  }

  // Retrieve all memories for a companion
  getAll(companionId: string): MemoItem[] {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`memoclaw_${companionId}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // fallback
        }
      }
    }
    return this.memories.get(companionId) || [];
  }

  // Retrieve memories by namespace
  getByNamespace(companionId: string, namespace: MemoryNamespace): MemoItem[] {
    return this.getAll(companionId).filter((m) => m.namespace === namespace);
  }

  // Automatic semantic fact extraction from user message
  extractFacts(companionId: string, text: string): string[] {
    const extracted: string[] = [];
    const lower = text.toLowerCase();

    // Check for events (e.g. examen, rendez-vous, révision)
    if (lower.includes('examen') || lower.includes('partiel') || lower.includes('test')) {
      const fact = `Prépare un examen important (mentionné : "${text}")`;
      this.store(companionId, 'events', fact, 0.95);
      extracted.push(fact);
    } else if (lower.includes('jeudi') || lower.includes('demain') || lower.includes('vendredi') || lower.includes('semaine prochaine')) {
      const fact = `Échéance temporelle notée : "${text}"`;
      this.store(companionId, 'events', fact, 0.85);
      extracted.push(fact);
    }

    // Check for preferences / habits
    if (lower.includes("j'aime") || lower.includes("j'adore") || lower.includes('passion')) {
      const fact = `Préférence : "${text}"`;
      this.store(companionId, 'preferences', fact, 0.8);
      extracted.push(fact);
    }

    // Check for emotional state / mood
    if (lower.includes('stress') || lower.includes('peur') || lower.includes('fatigué') || lower.includes('seul')) {
      const fact = `État émotionnel : éprouve du stress ou de la fatigue ("${text}")`;
      this.store(companionId, 'moods', fact, 0.9);
      extracted.push(fact);
    } else if (lower.includes('heureux') || lower.includes('fier') || lower.includes('content') || lower.includes('gagné')) {
      const fact = `État émotionnel : enthousiaste et positif ("${text}")`;
      this.store(companionId, 'moods', fact, 0.75);
      extracted.push(fact);
    }

    return extracted;
  }

  // Format memories for injection into Meta Llama system prompt
  buildContextPrompt(companionId: string): string {
    const all = this.getAll(companionId);
    if (all.length === 0) return '';

    const lines: string[] = ['[MÉMOIRE PERSISTANTE MEMOCLAW RETENUE SUR CET UTILISATEUR :]'];
    
    const events = all.filter((m) => m.namespace === 'events');
    if (events.length > 0) {
      lines.push('Événements récents :');
      events.slice(-3).forEach((e) => lines.push(`- ${e.content}`));
    }

    const prefs = all.filter((m) => m.namespace === 'preferences');
    if (prefs.length > 0) {
      lines.push('Préférences :');
      prefs.slice(-3).forEach((p) => lines.push(`- ${p.content}`));
    }

    const moods = all.filter((m) => m.namespace === 'moods');
    if (moods.length > 0) {
      lines.push('Contexte émotionnel :');
      moods.slice(-2).forEach((m) => lines.push(`- ${m.content}`));
    }

    lines.push('Consigne : Utilise ces faits naturellement dans tes réponses pour prouver ton attachement et ta mémoire continue.');
    return lines.join('\n');
  }
}

export const memoClaw = new MemoClawService();
