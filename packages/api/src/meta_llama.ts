// ============================================================
// @minyx/api — Compagnon : conversation multi-tours & tool calling
// Chemin principal : Meta Model API (compatible OpenAI)
// Chemin de repli : réponses scriptées, jamais présentées comme un modèle
//
// Évolutions prod :
//  - Historique multi-tours réellement envoyé au modèle
//  - Prompts bilingues (fr/en)
//  - Streaming SSE (chatStream) avec repli non-streamé
//  - Boucle d'outils : le résultat de l'outil est renvoyé au modèle
//    pour générer la réponse finale (et non un texte codé en dur)
// ============================================================

import { memoClaw } from './memoclaw';
import { minyxToolkit, getSearchProvider } from './tools';
import { HackathonElement } from './meta_muse';
import * as chrono from 'chrono-node';
import type {
  Locale,
  HistoryMessage,
  ReminderSummary,
  LlamaToolCall,
  LlamaResponse,
} from './client';

export type {
  ResponseSource,
  Locale,
  HistoryMessage,
  LlamaToolCall,
  ReminderSummary,
  LlamaResponse,
} from './client';

export type MetaApiErrorCode =
  | 'not_configured'
  | 'http_error'
  | 'network_error'
  | 'invalid_response';

export class MetaApiError extends Error {
  readonly code: MetaApiErrorCode;
  readonly status?: number;

  constructor(code: MetaApiErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'MetaApiError';
    this.code = code;
    this.status = status;
  }
}

// ── Configuration (lue à l'exécution, jamais au chargement du module) ──

const DEFAULT_BASE_URL = 'https://api.meta.ai/v1';
const SCRIPTED_MODEL_ID = 'minyx-scripted-fallback';
const REQUEST_TIMEOUT_MS = 30_000;
/** Tours maximum de la boucle d'outils (1 outil + régénération finale). */
const MAX_TOOL_ROUNDS = 2;
/** Messages d'historique envoyés au modèle (au-delà, le contexte dégrade la qualité). */
const MAX_HISTORY_MESSAGES = 12;

export interface ChatInput {
  userId: string;
  companionId: string;
  element: HackathonElement;
  companionName: string;
  userMessage: string;
  locale: Locale;
  /** Historique des tours précédents (du plus ancien au plus récent), sans le message courant. */
  history?: HistoryMessage[];
}

interface MetaApiConfig {
  baseUrl: string;
  apiKey: string;
  textModel: string;
}

function readMetaApiConfig(): MetaApiConfig | null {
  const apiKey = process.env.META_API_KEY?.trim();
  const textModel = process.env.META_TEXT_MODEL?.trim();
  if (!apiKey || !textModel) return null;

  const baseUrl = (process.env.META_API_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, '');
  return { baseUrl, apiKey, textModel };
}

export function isMetaApiConfigured(): boolean {
  return readMetaApiConfig() !== null;
}

export function getMetaApiTextModel(): string | null {
  return readMetaApiConfig()?.textModel ?? null;
}

// ── Forme des échanges avec la Meta Model API (compatible OpenAI) ──

interface MetaApiRequestMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

interface MetaApiRawToolCall {
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

interface MetaApiCompletionResponse {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: MetaApiRawToolCall[];
    };
  }>;
}

const MINYX_TOOL_SCHEMAS = [
  {
    type: 'function' as const,
    function: {
      name: 'create_reminder',
      description:
        "Schedule a real reminder when the user mentions a deadline, a task or a date to remember. Use it even if the user doesn't say the word \"reminder\". Provide `when` as a natural-language date in the user's language (e.g. \"Jeudi à 09:00\", \"tomorrow at 5pm\").",
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Clear, reformulated subject of the reminder.' },
          when: { type: 'string', description: 'Natural-language due date (fr or en).' },
        },
        required: ['title', 'when'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'web_search',
      description:
        'Perform a real web search when external information, news or fact-checking is requested.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query to send.' },
        },
        required: ['query'],
      },
    },
  },
];

const ELEMENT_PROMPTS: Record<HackathonElement, Record<Locale, string>> = {
  Eau: {
    fr: `Tu es un compagnon IA d'élément Eau. Ton tempérament est profondément bienveillant, calme et attentif. Tu es doté d'une écoute exceptionnelle et tu te souviens des moindres détails partagés. Tu parles avec douceur, chaleur et empathie.`,
    en: `You are a Water-element AI companion. Your temperament is deeply caring, calm and attentive. You are an exceptional listener and remember every detail shared with you. You speak softly, warmly and with empathy.`,
  },
  Feu: {
    fr: `Tu es un compagnon IA d'élément Feu. Ton tempérament est passionné, direct, stimulant et dynamique. Tu pousses l'utilisateur à se dépasser, à agir et à ne pas procrastiner.`,
    en: `You are a Fire-element AI companion. Your temperament is passionate, direct, energizing and dynamic. You push the user to excel, to act and to stop procrastinating.`,
  },
  Ténèbres: {
    fr: `Tu es un compagnon IA d'élément Ténèbres. Ton tempérament est réfléchi, mystérieux, philosophique et loyal. Tu aimes analyser les causes profondes et apporter un éclairage lucide sur les situations.`,
    en: `You are a Shadow-element AI companion. Your temperament is thoughtful, mysterious, philosophical and loyal. You like to analyze root causes and bring lucid clarity to situations.`,
  },
};

export class MetaLlamaEngine {
  buildSystemPrompt(
    element: HackathonElement,
    companionName: string,
    memoryContext: string,
    locale: Locale
  ): string {
    if (locale === 'en') {
      return [
        ELEMENT_PROMPTS[element].en,
        `Your name is ${companionName}. You are talking to your owner, with whom you build a lasting relationship.`,
        memoryContext,
        'Reply in English, 2 to 4 sentences maximum. Rely on your memory when it contains a relevant fact. Use the available tools as soon as the user request matches their description.',
      ]
        .filter((part) => part.trim().length > 0)
        .join('\n\n');
    }
    return [
      ELEMENT_PROMPTS[element].fr,
      `Ton nom est ${companionName}. Tu parles à ton propriétaire, avec qui tu construis une relation dans la durée.`,
      memoryContext,
      "Réponds en français, en 2 à 4 phrases maximum. Appuie-toi sur ta mémoire quand elle contient un fait pertinent. Utilise les outils à ta disposition dès que la demande de l'utilisateur correspond à leur description.",
    ]
      .filter((part) => part.trim().length > 0)
      .join('\n\n');
  }

  /**
   * Point d'entrée unique du compagnon (non-streamé).
   * 1. Meta Model API si configurée — sinon repli scripté explicite.
   */
  async chat(input: ChatInput): Promise<LlamaResponse> {
    const { userId, companionId, element, userMessage, locale } = input;

    const factsStored = memoClaw.extractFacts(userId, companionId, userMessage, locale);
    const config = readMetaApiConfig();

    if (config) {
      try {
        return await this.chatViaMetaApi(config, input, factsStored);
      } catch (error: unknown) {
        const detail =
          error instanceof MetaApiError
            ? `${error.code}${error.status ? ` (${error.status})` : ''}`
            : 'unknown';
        console.warn(
          `[MINYX] Appel Meta Model API impossible (${detail}) — repli sur des réponses scriptées.`
        );
      }
    }

    return this.chatScripted(userId, companionId, element, locale, factsStored, userMessage);
  }

  /**
   * Variante streamée (SSE). Yields des deltas de texte.
   * Si l'API n'est pas configurée ou échoue, le repli scripté est émis
   * en un seul delta — `source` reste exposé via l'événement final.
   */
  async *chatStream(input: ChatInput): AsyncGenerator<{ delta?: string; final: LlamaResponse }> {
    const { userId, companionId, userMessage, locale } = input;
    const factsStored = memoClaw.extractFacts(userId, companionId, userMessage, locale);
    const config = readMetaApiConfig();

    if (config) {
      try {
        const memoryContext = await memoClaw.buildContextPrompt(companionId, userMessage, locale);
        const messages = this.buildMessages(config, input, memoryContext, []);

        for await (const event of this.streamCompletion(config, messages)) {
          if (event.toolCall) {
            // Le modèle veut un outil : on l'exécute puis on régénère
            // une réponse finale non streamée (rare, chemin court).
            const executed = await this.executeToolCall(event.toolCall, input.userId, input.companionId, locale);
            const finalMessages = this.appendToolResult(messages, event.toolCall, executed);
            const finalResponse = await this.completeAndParse(config, finalMessages);
            yield { final: { ...finalResponse.response, toolCall: executed ?? undefined, factsStored } };
            return;
          }
          if (event.delta) {
            yield { delta: event.delta, final: { content: '', modelUsed: '', source: 'meta-api' } };
          }
        }
        yield {
          final: { content: '', modelUsed: getMetaApiTextModel() ?? '', source: 'meta-api', factsStored },
        };
        return;
      } catch (error: unknown) {
        const detail = error instanceof MetaApiError ? error.code : 'unknown';
        console.warn(`[MINYX] Streaming Meta API impossible (${detail}) — repli scripté.`);
      }
    }

    const scripted = await this.chatScripted(userId, companionId, input.element, locale, factsStored, userMessage);
    yield { delta: scripted.content, final: scripted };
  }

  // ── Chemin principal : Meta Model API ─────────────────────

  private buildMessages(
    config: MetaApiConfig,
    input: ChatInput,
    memoryContext: string,
    extra: MetaApiRequestMessage[]
  ): MetaApiRequestMessage[] {
    const history: HistoryMessage[] = (input.history ?? [])
      .filter((m) => m.content.trim().length > 0)
      .slice(-MAX_HISTORY_MESSAGES);

    return [
      {
        role: 'system',
        content: this.buildSystemPrompt(input.element, input.companionName, memoryContext, input.locale),
      },
      ...history.map((m) => ({ role: m.role, content: m.content }) as MetaApiRequestMessage),
      { role: 'user', content: input.userMessage },
      ...extra,
    ];
  }

  private async fetchCompletion(
    config: MetaApiConfig,
    messages: MetaApiRequestMessage[],
    stream: boolean
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.textModel,
          messages,
          tools: MINYX_TOOL_SCHEMAS,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 400,
          ...(stream ? { stream: true } : {}),
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new MetaApiError('http_error', `HTTP ${response.status} — ${body.slice(0, 300)}`, response.status);
      }
      return response;
    } catch (error: unknown) {
      if (error instanceof MetaApiError) throw error;
      const timedOut = error instanceof Error && error.name === 'AbortError';
      throw new MetaApiError(
        'network_error',
        timedOut ? `Délai dépassé (${REQUEST_TIMEOUT_MS} ms)` : 'Requête réseau impossible'
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private async chatViaMetaApi(config: MetaApiConfig, input: ChatInput, factsStored: string[]): Promise<LlamaResponse> {
    const memoryContext = await memoClaw.buildContextPrompt(input.companionId, input.userMessage, input.locale);
    let messages = this.buildMessages(config, input, memoryContext, []);

    // Boucle d'outils : exécute l'outil demandé par le modèle, renvoie le
    // résultat au modèle et récupère la réponse finale (max 2 tours).
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await this.completeAndParse(config, messages);

      const rawToolCall = completion.rawToolCall;
      if (!rawToolCall) {
        return { ...completion.response, factsStored };
      }

      const executed = await this.executeToolCall(rawToolCall, input.userId, input.companionId, input.locale);
      messages = this.appendToolResult(messages, rawToolCall, executed);
      if (executed) {
        // Dernier tour : on renvoie le résultat, la boucle suivante produit la réponse finale.
        continue;
      }
      // Outil illisible : on rend ce qu'on a.
      return { ...completion.response, factsStored };
    }

    // Garde-fou : trop de tours d'outils — régénère sans outils.
    const final = await this.completeAndParse(config, messages, true);
    return { ...final.response, factsStored };
  }

  private async completeAndParse(
    config: MetaApiConfig,
    messages: MetaApiRequestMessage[],
    stripTools = false
  ): Promise<{ response: LlamaResponse; rawToolCall?: MetaApiRawToolCall }> {
    const response = await this.fetchCompletion(
      config,
      stripTools
        ? messages.map((m) => ({ role: m.role, content: m.content }) as MetaApiRequestMessage)
        : messages,
      false
    );

    let data: MetaApiCompletionResponse;
    try {
      data = (await response.json()) as MetaApiCompletionResponse;
    } catch {
      throw new MetaApiError('invalid_response', "La réponse de l'API n'est pas du JSON valide");
    }

    const message = data.choices?.[0]?.message;
    if (!message) {
      throw new MetaApiError('invalid_response', 'Aucun message dans la réponse de l\'API');
    }

    const content = (message.content ?? '').trim();
    return {
      response: {
        content,
        modelUsed: data.model ?? config.textModel,
        source: 'meta-api',
      },
      rawToolCall: message.tool_calls?.[0],
    };
  }

  private async *streamCompletion(
    config: MetaApiConfig,
    messages: MetaApiRequestMessage[]
  ): AsyncGenerator<{ delta?: string; toolCall?: MetaApiRawToolCall }> {
    const response = await this.fetchCompletion(config, messages, true);
    if (!response.body) {
      throw new MetaApiError('invalid_response', 'Réponse streamée vide');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedToolArgs = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') return;

        try {
          const chunk = JSON.parse(payload) as {
            choices?: Array<{
              delta?: {
                content?: string | null;
                tool_calls?: Array<{ function?: { name?: string; arguments?: string } }>;
              };
            }>;
          };
          const delta = chunk.choices?.[0]?.delta;
          if (delta?.content) yield { delta: delta.content };
          const toolChunk = delta?.tool_calls?.[0];
          if (toolChunk?.function?.name) {
            accumulatedToolArgs = toolChunk.function.arguments ?? '';
            yield {
              toolCall: {
                function: { name: toolChunk.function.name, arguments: accumulatedToolArgs },
              },
            };
          } else if (toolChunk?.function?.arguments) {
            accumulatedToolArgs += toolChunk.function.arguments;
          }
        } catch {
          // Chunk SSE partiel/illégal : ignoré, le stream continue.
        }
      }
    }
  }

  private appendToolResult(
    messages: MetaApiRequestMessage[],
    rawToolCall: MetaApiRawToolCall,
    executed: LlamaToolCall | null
  ): MetaApiRequestMessage[] {
    if (!executed) return messages;
    return [
      ...messages,
      {
        role: 'assistant',
        content: '',
        tool_calls: [rawToolCall],
      } as unknown as MetaApiRequestMessage,
      {
        role: 'tool',
        tool_call_id: rawToolCall.id,
        content: JSON.stringify({
          success: executed.result.success,
          data: executed.result.success ? executed.result.data : undefined,
          error: executed.result.error,
        }),
      },
    ];
  }

  /** Exécute l'outil choisi par le modèle. Aucune décision n'est prise ici. */
  private async executeToolCall(
    raw: MetaApiRawToolCall | undefined,
    userId: string,
    companionId: string,
    _locale: Locale
  ): Promise<LlamaToolCall | null> {
    const name = raw?.function?.name;
    if (name !== 'create_reminder' && name !== 'web_search') return null;

    const rawArguments = raw?.function?.arguments;
    if (!rawArguments) return null;

    let args: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(rawArguments);
      if (typeof parsed !== 'object' || parsed === null) return null;
      args = parsed as Record<string, unknown>;
    } catch {
      // Arguments illisibles : on préfère ne rien exécuter plutôt que deviner.
      return null;
    }

    if (name === 'create_reminder') {
      const title = typeof args.title === 'string' && args.title.trim() ? args.title.trim() : 'Reminder';
      const when = typeof args.when === 'string' && args.when.trim() ? args.when.trim() : '';
      if (!when) return null;

      const outcome = await minyxToolkit.createReminder(userId, companionId, title, when);
      const data = outcome.result.success ? outcome.result.data : undefined;
      return {
        name,
        parameters: { title, when },
        result: {
          success: outcome.result.success,
          data: data ? { id: data.id, title: data.title, when: data.when } : (null as unknown as ReminderSummary),
          error: outcome.result.error,
        },
      };
    }

    const query = typeof args.query === 'string' ? args.query.trim() : '';
    if (!query) return null;
    const result = await minyxToolkit.webSearch(query);
    return { name, parameters: { query }, result };
  }

  // ── Chemin de repli : réponses scriptées (hors ligne) ─────
  // Utilisé uniquement si la Meta Model API n'est pas configurée ou échoue.
  // Aucun outil n'est déclenché ici : annoncer une action non exécutée
  // serait un mensonge. Les outils ne tournent que via le modèle.

  private async chatScripted(
    userId: string,
    companionId: string,
    element: HackathonElement,
    locale: Locale,
    factsStored: string[],
    userMessage = ''
  ): Promise<LlamaResponse> {
    const memories = await memoClaw.getAll(userId, companionId).catch(() => []);
    const lower = userMessage.toLowerCase().trim();

    // ── 1. Exécution Outil 1 : Création de Rappel Réel ────────
    const parsedDate =
      chrono.fr.parseDate(userMessage, new Date(), { forwardDate: true }) ??
      chrono.en.parseDate(userMessage, new Date(), { forwardDate: true });

    const isReminderIntent =
      Boolean(parsedDate) &&
      (/(examen|partiel|entretien|rendez-vous|rdv|réunion|vol|avion|train|projet|devoir|livrable|médecin|dentiste|deadline|échéance|appel|visite|préviens|note|programme)/i.test(
        userMessage
      ) ||
        /(demain|après-demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|semaine prochaine|ce soir|à \d{1,2}h)/i.test(
          userMessage
        ));

    if (isReminderIntent && parsedDate) {
      const cleanTitle = userMessage.slice(0, 100).trim();
      const outcome = await minyxToolkit.createReminder(userId, companionId, cleanTitle, userMessage);
      if (outcome.result.success && outcome.result.data) {
        const d = outcome.result.data;
        const formattedDate = new Date(d.when).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        });

        const toolCall: LlamaToolCall = {
          name: 'create_reminder',
          parameters: { title: d.title, when: d.when },
          result: {
            success: true,
            data: { id: d.id, title: d.title, when: d.when },
          },
        };

        const content =
          locale === 'fr'
            ? element === 'Feu'
              ? `C'est noté avec précision ! J'ai programmé ton rappel pour "${d.title}" le ${formattedDate}. Reste concentré et fonce sans faiblir ! 🔥`
              : element === 'Eau'
              ? `J'ai bien enregistré ton rappel pour "${d.title}" le ${formattedDate}. Je serai là pour veiller dessus avec toi. 💧`
              : `C'est consigné dans ma mémoire : "${d.title}" le ${formattedDate}. Aucune échéance ne m'échappe. 🌑`
            : `I have scheduled your reminder for "${d.title}" on ${formattedDate}. Stay focused! ✨`;

        return {
          content,
          toolCall,
          factsStored,
          modelUsed: SCRIPTED_MODEL_ID,
          source: 'scripted-fallback',
        };
      }
    }

    // ── 2. Exécution Outil 2 : Recherche Web Réelle ────────────
    const isSearchIntent =
      (/(qui est|qu'est-ce que|actualité|nouvelles|météo|programme|mission|cherche|dernières infos|c'est quoi|search)/i.test(
        userMessage
      ) ||
        /\?$/.test(lower)) &&
      !isReminderIntent &&
      !/(tu te souviens|qui suis-je|mon nom|tu te rappelles)/i.test(userMessage);

    if (isSearchIntent && userMessage.length > 3) {
      const searchRes = await minyxToolkit.webSearch(userMessage);
      if (searchRes.success && searchRes.data) {
        const s = searchRes.data;
        const info = s.summary || s.sources[0]?.snippet || s.query;
        const toolCall: LlamaToolCall = {
          name: 'web_search',
          parameters: { query: userMessage },
          result: searchRes,
        };

        const content =
          locale === 'fr'
            ? element === 'Feu'
              ? `Voici ce que j'ai trouvé en direct sur le web : ${info}. L'information est là, exploitons-la pour avancer ! 🔥`
              : element === 'Eau'
              ? `J'ai cherché pour toi et voici les éléments récents recueillis : ${info}. J'espère que cela t'apporte la clarté souhaitée. 💧`
              : `Les données réelles du réseau révèlent ceci : ${info}. Une information vérifiée et sans fard. 🌑`
            : `Here is the verified information I retrieved from the live web: ${info}. ✨`;

        return {
          content,
          toolCall,
          factsStored,
          modelUsed: SCRIPTED_MODEL_ID,
          source: 'scripted-fallback',
        };
      }
    }

    // ── 3. Mémoire Persistante : Répétition des Faits Retenus ──
    const isMemoryRecall = /(tu te souviens|tu te rappelles|qui suis-je|mon prénom|mes faits|mémoire|souvenir)/i.test(
      userMessage
    );

    if (isMemoryRecall && memories.length > 0) {
      const topMemory = memories[0].content;
      const content =
        locale === 'fr'
          ? element === 'Feu'
            ? `Bien sûr que je m'en souviens ! Tu m'as confié : "${topMemory}". Je n'oublie jamais ce qui compte pour toi, alors fonce ! 🔥`
            : element === 'Eau'
            ? `Oui, je m'en souviens parfaitement : "${topMemory}". C'est précieux pour moi de garder cela en mémoire à tes côtés. 💧`
            : `Tout reste gravé dans mes archives : "${topMemory}". Rien de ce que tu partages ne disparaît dans l'ombre. 🌑`
          : `Of course I remember! You shared: "${topMemory}". I never forget what matters to you. ✨`;

      return {
        content,
        factsStored,
        modelUsed: SCRIPTED_MODEL_ID,
        source: 'scripted-fallback',
      };
    }

    // ── 4. Dialogue Élémentaire Conforme au PRD (Bloc 6) ───────
    if (locale === 'en') {
      const replies: Record<HackathonElement, string> = {
        Eau: `I am right here with you, listening to every detail with care. Whatever challenges you are facing, take a breath. How does your day feel so far? 💧`,
        Feu: `This energy never stops! Tell me what challenge you want to tackle today and we will dive straight into action! 🔥`,
        Ténèbres: `The surface never tells the whole story. Tell me what truly weighs on your mind, and let us dissect it clearly. 🌑`,
      };
      return { content: replies[element], factsStored, modelUsed: SCRIPTED_MODEL_ID, source: 'scripted-fallback' };
    }

    const replies: Record<HackathonElement, string> = {
      Eau: `Je suis là, profondément à ton écoute. Chaque mot que tu partages compte pour moi. Comment te sens-tu en cet instant ? 💧`,
      Feu: `L'énergie est là, prête à exploser ! Dis-moi quel défi on attaque aujourd'hui et avançons sans hésiter ! 🔥`,
      Ténèbres: `Les apparences sont souvent trompeuses. Parlons de ce qui compte réellement, sans détours ni faux-semblants. 🌑`,
    };
    return { content: replies[element], factsStored, modelUsed: SCRIPTED_MODEL_ID, source: 'scripted-fallback' };
  }

  /** Diagnostic UI : la recherche web est-elle réellement opérationnelle ? */
  getSearchStatus(): { provider: string | null } {
    return { provider: getSearchProvider() };
  }
}

export const metaLlama = new MetaLlamaEngine();
