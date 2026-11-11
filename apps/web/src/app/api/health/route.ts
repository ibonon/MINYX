import { NextResponse } from 'next/server';
import { db, isMetaApiConfigured, getMetaApiTextModel, getMemorySearchMode } from '@minyx/api';
import { getSearchProvider } from '@minyx/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** État de l'intégration — consommé par l'UI pour rester honnête. Aucun secret. */
export async function GET() {
  let database = 'ok';
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = 'unreachable';
  }

  return NextResponse.json({
    status: database === 'ok' ? 'ok' : 'degraded',
    service: 'minyx-web',
    database,
    metaApi: {
      configured: isMetaApiConfigured(),
      model: getMetaApiTextModel(),
    },
    search: { provider: getSearchProvider() },
    memory: { mode: getMemorySearchMode() },
    time: new Date().toISOString(),
  });
}
