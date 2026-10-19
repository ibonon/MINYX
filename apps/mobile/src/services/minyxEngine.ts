import { CompanionState, ChatMessage, MemoryRecord, MemoryNamespace, EvolutionStage } from '../types';

export class MinyxMobileService {
  private companion: CompanionState = {
    id: 'minyx-spirit-water',
    name: 'Kael',
    element: 'Eau',
    level: 3,
    xp: 340,
    xpToNextLevel: 500,
    mood: 'Serein & attentif',
    formStage: 1,
    stats: {
      int: 42,
      emo: 58,
      agi: 36,
      bond: 75,
    },
  };

  private memories: MemoryRecord[] = [
    {
      id: 'mem-1',
      namespace: 'core',
      key: 'identite_utilisateur',
      value: 'Eric Warma — Créateur & Fondateur SAHELION Group',
      confidence: 1.0,
      timestamp: 'Aujourd\'hui',
    },
    {
      id: 'mem-2',
      namespace: 'core',
      key: 'projet_actuel',
      value: 'Préparation du Meta Global AI Developer Hackathon 2026',
      confidence: 0.98,
      timestamp: 'Aujourd\'hui',
    },
    {
      id: 'mem-3',
      namespace: 'preferences',
      key: 'style_travail',
      value: 'Préfère les actions concrètes (Tool Use) plutôt que les bavardages vides',
      confidence: 0.95,
      timestamp: 'Aujourd\'hui',
    },
    {
      id: 'mem-4',
      namespace: 'events',
      key: 'etape_3d',
      value: 'Intégration du modèle 3D .glb personnalisé dans l\'application',
      confidence: 0.92,
      timestamp: 'Il y a 30m',
    },
    {
      id: 'mem-5',
      namespace: 'moods',
      key: 'etat_emotionnel',
      value: 'Concentré et déterminé à livrer un compagnon IA mobile d\'exception',
      confidence: 0.94,
      timestamp: 'En cours',
    },
  ];

  public getCompanion(): CompanionState {
    return { ...this.companion };
  }

  public getMemories(namespace?: MemoryNamespace): MemoryRecord[] {
    if (!namespace) return [...this.memories];
    return this.memories.filter((m) => m.namespace === namespace);
  }

  public addMemory(namespace: MemoryNamespace, key: string, value: string): MemoryRecord {
    const newRecord: MemoryRecord = {
      id: `mem-${Date.now()}`,
      namespace,
      key,
      value,
      confidence: 0.96,
      timestamp: 'À l\'instant',
    };
    this.memories.unshift(newRecord);
    return newRecord;
  }

  public async processUserMessage(userText: string): Promise<ChatMessage> {
    const lower = userText.toLowerCase();

    // Check for Tool Use 1: Create Reminder
    if (lower.includes('rappel') || lower.includes('rappelle') || lower.includes('agenda')) {
      const summary = userText.replace(/rappelle(-moi)?|programme un rappel pour/gi, '').trim() || 'Répétition générale pitch';
      this.addMemory('events', 'rappel_programme', summary);
      this.companion.xp += 25;

      return {
        id: `msg-${Date.now()}`,
        sender: 'companion',
        text: `C'est noté ! J'ai programmé ce rappel dans votre appareil. Je veillerai à ce que vous ne l'oubliiez pas.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCall: {
          tool: 'create_reminder',
          status: 'success',
          summary: `Rappel créé : "${summary}"`,
          details: {
            title: summary,
            device: 'Mobile Push & Local Calendar',
            status: 'Active',
          },
        },
      };
    }

    // Check for Tool Use 2: Web Search
    if (lower.includes('cherche') || lower.includes('recherche') || lower.includes('trouve') || lower.includes('google')) {
      const query = userText.replace(/cherche|recherche|trouve(-moi)?/gi, '').trim() || 'Meta Hackathon 2026';
      this.addMemory('preferences', 'sujet_veille', query);
      this.companion.xp += 30;

      return {
        id: `msg-${Date.now()}`,
        sender: 'companion',
        text: `J'ai scanné le web pour vous sur "${query}". Voici les faits récents synthétisés pour notre démo :`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCall: {
          tool: 'web_search',
          status: 'success',
          summary: `Recherche web : "${query}"`,
          details: {
            sources: ['meta.ai/hackathon', 'ai.meta.com/llama3'],
            summary: `Le track Indie Developer valorise l'association de Llama 3.3 avec des outils concrets et une mémoire adaptative.`,
          },
        },
      };
    }

    // Check for Memory Query
    if (lower.includes('souviens') || lower.includes('sais de moi') || lower.includes('mémoire') || lower.includes('qui suis-je')) {
      const coreFacts = this.memories.filter((m) => m.namespace === 'core').map((m) => m.value).join(', ');
      return {
        id: `msg-${Date.now()}`,
        sender: 'companion',
        text: `Je me souviens de tout. Vous êtes ${coreFacts}. Et je garde en mémoire chacune de nos sessions pour toujours mieux vous épauler.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    // Default empathetic water spirit reply
    this.companion.xp += 15;
    return {
      id: `msg-${Date.now()}`,
      sender: 'companion',
      text: `Je suis avec vous. Que ce soit pour organiser votre journée, explorer une idée ou veiller sur vos projets, dites-moi simplement ce dont vous avez besoin.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  public getEvolutionStages(): EvolutionStage[] {
    return [
      {
        level: 1,
        title: 'Forme Naissante',
        subtitle: 'Bébé Esprit Aquatique (Forme actuelle)',
        description: 'Chibi bioluminescent bleu translucide avec crête en goutte d\'eau et emblème rayonnant.',
        musePrompt: 'A glowing cyan bioluminescent water chibi spirit, Disney/Pixar 3D style, smiling cute face, teardrop crest, glowing chest emblem, concentric blue neon rings on floor.',
        sam3Features: ['Aura bioluminescente', 'Goutte d\'eau pectorale', 'Anneaux holographiques'],
      },
      {
        level: 5,
        title: 'Forme Fluide',
        subtitle: 'Gardien des Marées',
        description: 'L\'esprit gagne en envergure, des rubans d\'eau liquide luminescente gravitent autour de ses bras.',
        musePrompt: 'Evolved water elemental companion, elegant translucent cyan ribbons flowing, glowing eyes, aquatic particle mist, high-tech neon pedestal.',
        sam3Features: ['Rubans hydrodynamiques', 'Particules de brume cyan', 'Regard condensé'],
      },
      {
        level: 10,
        title: 'Forme Céleste',
        subtitle: 'Léviathan Cosmique',
        description: 'Forme suprême alliant l\'élément Eau et l\'énergie stellaire. Présence protectrice majestueuse.',
        musePrompt: 'Majestic celestial leviathan water dragon spirit, deep indigo and radiant cyan luminescence, starlight crest, orbiting energy glyphs.',
        sam3Features: ['Ailes de courant marin', 'Constellations intérieures', 'Couronne stellaire'],
      },
    ];
  }
}

export const minyxMobile = new MinyxMobileService();
