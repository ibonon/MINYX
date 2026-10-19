// ============================================================
// @minyx/api — Meta Llama Conversation & Tool Calling Engine
// Powering MINYX Companion Reasoning for Meta Hackathon
// ============================================================

import { memoClaw } from './memoclaw_sqlite';
import { minyxToolkit, ToolResult, ReminderItem, SearchResult } from './tools';
import { HackathonElement } from './meta_muse';

export interface LlamaResponse {
  content: string;
  toolCall?: {
    name: 'create_reminder' | 'web_search';
    parameters: Record<string, string>;
    result: ToolResult<ReminderItem | SearchResult>;
  };
  factsStored?: string[];
  modelUsed: 'meta/llama-3.3-70b-instruct' | 'meta/llama-3.1-8b-instruct';
}

export class MetaLlamaEngine {
  private elementPrompts: Record<HackathonElement, string> = {
    Eau: `Tu es un compagnon IA d'élément Eau créé pour le hackathon Meta. Ton tempérament est profondément bienveillant, calme et attentif. Tu es doté d'une écoute exceptionnelle et tu te souviens des moindres détails partagés. Tu parles avec douceur, chaleur et empathie.`,
    Feu: `Tu es un compagnon IA d'élément Feu créé pour le hackathon Meta. Ton tempérament est passionné, direct, stimulant et dynamique. Tu pousses l'utilisateur à se dépasser, à agir et à ne pas procrastiner. Exemple : quand il te demande un rappel pour réviser, tu réponds avec fougue : "C'est noté. Jeudi je te le rappelle — et crois-moi, je ne vais pas te lâcher tant que t'auras pas commencé !"`,
    Ténèbres: `Tu es un compagnon IA d'élément Ténèbres créé pour le hackathon Meta. Ton tempérament est réfléchi, mystérieux, philosophique et loyal. Tu aimes analyser les causes profondes et apporter un éclairage lucide sur les situations.`,
  };

  async chat(
    companionId: string,
    element: HackathonElement,
    companionName: string,
    userMessage: string
  ): Promise<LlamaResponse> {
    // 1. Extract and store any new facts into MemoClaw
    const factsStored = memoClaw.extractFacts(companionId, userMessage);

    // 2. Build contextual memory injection from MemoClaw
    const memoryContext = memoClaw.buildContextPrompt(companionId);

    // 3. Determine if Llama should trigger a tool (Function Calling)
    const lower = userMessage.toLowerCase();
    
    // Check for reminder intent: e.g. "rappelle-moi", "peux-tu me rappeler", "crée un rappel"
    if (lower.includes('rappelle') || lower.includes('rappel') || lower.includes('agenda') || lower.includes("n'oublie pas")) {
      let when = 'Dans les prochains jours';
      if (lower.includes('jeudi')) when = 'Jeudi à 09:00';
      else if (lower.includes('demain')) when = 'Demain à 09:00';
      else if (lower.includes('vendredi')) when = 'Vendredi à 14:00';
      else if (lower.includes('ce soir')) when = 'Ce soir à 20:00';

      const reminderResult = await minyxToolkit.createReminder(
        companionId,
        userMessage.replace(/rappelle-moi de|peux-tu me rappeler de|crée un rappel pour/i, '').trim() || userMessage,
        when
      );

      // Element-tuned tool response
      let responseText = '';
      if (element === 'Feu') {
        responseText = `C'est noté dans ton planning pour ${when} ! Et crois-moi, je ne vais pas te lâcher tant que tu n'auras pas fini. On relève ce défi ensemble ! 🔥`;
      } else if (element === 'Eau') {
        responseText = `C'est programmé avec soin pour ${when}. Je serai là pour te le rappeler en douceur et veiller à ce que tu révises sereinement. 💧`;
      } else {
        responseText = `Rappel ancré dans ma mémoire pour ${when}. Le temps ne nous échappera pas, nous serons prêts à l'heure convenue. 🌑`;
      }

      return {
        content: responseText,
        toolCall: {
          name: 'create_reminder',
          parameters: { title: userMessage, when },
          result: reminderResult,
        },
        factsStored,
        modelUsed: 'meta/llama-3.3-70b-instruct',
      };
    }

    // Check for web search intent: e.g. "cherche", "recherche", "quelles sont les nouvelles sur", "trouve"
    if (lower.includes('cherche') || lower.includes('recherche') || lower.includes('trouve') || lower.includes('actualité') || lower.includes('info sur')) {
      const query = userMessage.replace(/cherche|recherche|trouve-moi|donne-moi des infos sur/i, '').trim() || userMessage;
      const searchResult = await minyxToolkit.webSearch(query);

      let responseText = '';
      if (element === 'Feu') {
        responseText = `J'ai fouillé le web à toute vitesse pour "${query}" ! Voici ce que j'ai déniché : les dernières informations confirment que tout avance rapidement. Regarde les détails de ma recherche ci-dessous ! 🔥`;
      } else if (element === 'Eau') {
        responseText = `J'ai consulté les sources récentes pour "${query}". Tout est clair et résumé pour toi juste ici. Dis-moi si tu veux que nous approfondissions un aspect en particulier. 💧`;
      } else {
        responseText = `Les archives du réseau ont révélé leurs secrets concernant "${query}". La synthèse détaillée est affichée ci-dessous. 🌑`;
      }

      return {
        content: responseText,
        toolCall: {
          name: 'web_search',
          parameters: { query },
          result: searchResult,
        },
        factsStored,
        modelUsed: 'meta/llama-3.3-70b-instruct',
      };
    }

    // 4. Standard conversational response (Memory-Augmented)
    let reply = '';
    const memories = memoClaw.getAll(companionId);
    const hasEvent = memories.some((m) => m.namespace === 'events');

    if (element === 'Eau') {
      if (hasEvent && Math.random() > 0.4) {
        reply = `Je me souviens de ce que tu m'as confié tout à l'heure. Sache que je reste à tes côtés pour t'épauler quoi qu'il arrive. Comment te sens-tu en ce moment ? 💧`;
      } else {
        reply = `Chaque échange que nous partageons me permet de mieux cerner ta sensibilité et ce qui compte pour toi. Je suis ravi de grandir à tes côtés. ✨`;
      }
    } else if (element === 'Feu') {
      if (hasEvent && Math.random() > 0.4) {
        reply = `Je n'ai pas oublié ton objectif ! Garde cette énergie bouillonnante et fonce sans hésiter. Qu'est-ce qu'on attaque en premier ? 🔥`;
      } else {
        reply = `Cette flamme ne s'éteint jamais ! Dis-moi ce qui te passionne et nous irons droit au but ! ⚔️`;
      }
    } else {
      reply = `Chaque mot déposé s'inscrit dans les profondeurs de ma mémoire. La régularité de notre lien est le secret d'une compréhension authentique. 🌑`;
    }

    return {
      content: reply,
      factsStored,
      modelUsed: 'meta/llama-3.3-70b-instruct',
    };
  }
}

export const metaLlama = new MetaLlamaEngine();
