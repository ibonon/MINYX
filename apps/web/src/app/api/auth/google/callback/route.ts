import { NextResponse } from 'next/server';
import { isGoogleOAuthConfigured, createSession } from '../../../../../lib/auth';
import { db } from '@minyx/api';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/?authError=google_cancelled', url.origin));
  }

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL('/?authError=google_not_configured', url.origin));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!.trim();
    const redirectUri = `${url.origin}/api/auth/google/callback`;

    // Échange du code d'autorisation contre un token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/?authError=google_token_failed', url.origin));
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string; id_token?: string };
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL('/?authError=google_token_failed', url.origin));
    }

    // Récupération des informations de profil
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(new URL('/?authError=google_profile_failed', url.origin));
    }

    const profile = (await userRes.json()) as { email?: string; name?: string };
    if (!profile.email) {
      return NextResponse.redirect(new URL('/?authError=google_no_email', url.origin));
    }

    // Upsert du compte utilisateur
    let user = await db.user.findUnique({ where: { email: profile.email.toLowerCase() } });
    if (!user) {
      const dummyPasswordHash = await bcrypt.hash(`google-oauth-${Date.now()}-${Math.random()}`, 10);
      user = await db.user.create({
        data: {
          email: profile.email.toLowerCase(),
          name: profile.name || profile.email.split('@')[0],
          passwordHash: dummyPasswordHash,
          locale: 'fr',
        },
      });
    }

    // Création de la session
    await createSession(user.id);
    return NextResponse.redirect(new URL('/', url.origin));
  } catch (err) {
    console.error('[MINYX] Erreur Google OAuth callback :', err);
    return NextResponse.redirect(new URL('/?authError=google_error', url.origin));
  }
}
