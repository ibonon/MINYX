export type MinyxElement = 'Eau' | 'Feu' | 'Ténèbres' | 'Lumière' | 'Terre' | 'Vent' | 'Cosmos';

export interface CompanionState {
  id: string;
  name: string;
  element: MinyxElement;
  level: number;
  xp: number;
  xpToNextLevel: number;
  mood: string;
  formStage: number; // 1: Naissant, 2: Fluide, 3: Céleste
  stats: {
    int: number;
    emo: number;
    agi: number;
    bond: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'companion' | 'system';
  text: string;
  timestamp: string;
  toolCall?: {
    tool: 'create_reminder' | 'web_search';
    status: 'pending' | 'success' | 'failed';
    summary: string;
    details?: Record<string, any>;
  };
}

export type MemoryNamespace = 'core' | 'events' | 'preferences' | 'moods';

export interface MemoryRecord {
  id: string;
  namespace: MemoryNamespace;
  key: string;
  value: string;
  confidence: number;
  timestamp: string;
}

export interface EvolutionStage {
  level: number;
  title: string;
  subtitle: string;
  description: string;
  musePrompt: string;
  sam3Features: string[];
}
