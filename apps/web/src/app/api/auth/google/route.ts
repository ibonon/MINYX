import { NextResponse } from 'next/server';
import { isGoogleOAuthConfigured, getGoogleOAuthUrl } from '../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/google/callback`;

  if (!isGoogleOAuthConfigured()) {
    // Scaffolded stub : not configured yet in Google Cloud Console
    // Redirects cleanly with explicit notification
    return NextResponse.redirect(new URL('/?authError=google_not_configured', url.origin));
  }

  const googleUrl = getGoogleOAuthUrl(redirectUri);
  return NextResponse.redirect(googleUrl);
}
