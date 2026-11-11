import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db, metaLlama } from '@minyx/api';
import type { HistoryMessage, LlamaResponse, HackathonElement, Locale } from '@minyx/api/client';
import { requireUser, isUnauthorizedError } from '../../../../lib/auth';
import { rateLimit } from '../../../../lib/ratelimit';
import { isAllowedElement, awardConversationGains } from '../../../../lib/companion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  companionId: z.string().min(1),
  conversationId: z.string().min(1).optional(),
  message: z.string().trim().min(1).max(2000),
  stream: z.boolean().optional(),
});

const CHAT_RATE_MAX = 30; // messages / minute / utilisateur
const HISTORY_WINDOW = 12;

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch (error) {
    if (isUnauthorizedError(error)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw error;
  }

  const limiter = rateLimit(`chat:${user.id}`, CHAT_RATE_MAX, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(limiter.retryAfterSeconds) } }
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const { companionId, conversationId, message, stream } = parsed.data;

  // ── Multitenancy : le compagnon DOIT appartenir à l'utilisateur ──
  const companion = await db.companion.findFirst({ where: { id: companionId, userId: user.id } });
  if (!companion) {
    return NextResponse.json({ error: 'companion_not_found' }, { status: 404 });
  }
  const element = isAllowedElement(companion.element) ? companion.element : 'Eau';

  // ── Conversation : existante (vérifiée) ou créée ──
  let conversation;
  if (conversationId) {
    conversation = await db.conversation.findFirst({
      where: { id: conversationId, userId: user.id, companionId },
    });
    if (!conversation) {
      return NextResponse.json({ error: 'conversation_not_found' }, { status: 404 });
    }
  } else {
    conversation = await db.conversation.create({
      data: {
        userId: user.id,
        companionId,
        title: message.slice(0, 60),
      },
    });
  }

  // ── Historique multi-tours réellement envoyé au modèle ──
  const recent = await db.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
    take: HISTORY_WINDOW,
  });
  const history: HistoryMessage[] = recent
    .reverse()
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  await db.message.create({
    data: { conversationId: conversation.id, role: 'user', content: message },
  });

  const input = {
    userId: user.id,
    companionId,
    element: element as HackathonElement,
    companionName: companion.name,
    userMessage: message,
    locale: (user.locale === 'en' ? 'en' : 'fr') as Locale,
    history,
  };

  const persistAssistant = async (response: LlamaResponse) => {
    const row = await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: response.content,
        source: response.source,
        modelUsed: response.modelUsed,
        toolCallJson: response.toolCall ? JSON.stringify(response.toolCall) : null,
      },
    });
    await db.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
    const companionAfter = await awardConversationGains(companionId);
    return { messageId: row.id, companion: companionAfter };
  };

  // ── Chemin streamé (SSE) ──
  if (stream) {
    const encoder = new TextEncoder();
    const streamBody = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };
        try {
          send({ type: 'start', conversationId: conversation.id });

          for await (const event of metaLlama.chatStream(input)) {
            if (event.delta) send({ type: 'delta', text: event.delta });
          }

          // Récupère la réponse finale via le chemin non-streamé (le générateur
          // streamé a déjà consommé les deltas ; final est reconstruit ici pour
          // persister un contenu complet fiable).
          const final = await metaLlama.chat(input);
          const persisted = await persistAssistant(final);
          send({
            type: 'final',
            conversationId: conversation.id,
            response: final,
            messageId: persisted.messageId,
            companion: persisted.companion,
          });
          send({ type: 'done' });
        } catch (error) {
          console.error('[MINYX] Erreur de stream chat :', error);
          send({ type: 'error', error: 'chat_failed' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(streamBody, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  // ── Chemin classique (JSON) ──
  const response = await metaLlama.chat(input);
  const persisted = await persistAssistant(response);

  return NextResponse.json({
    conversationId: conversation.id,
    messageId: persisted.messageId,
    response,
    companion: persisted.companion,
  });
}
