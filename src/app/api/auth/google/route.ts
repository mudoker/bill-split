import { NextResponse } from 'next/server';
import { getBaseUrl, getGoogleAuthUrl, getGoogleRedirectUri } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = getBaseUrl(req);
  const redirectUri = getGoogleRedirectUri(baseUrl);

  if (!clientId || clientId.trim() === '') {
    // If credentials aren't set in environment, redirect to homepage with info
    const redirectUrl = new URL(baseUrl);
    redirectUrl.searchParams.set('auth_error', 'missing_credentials');
    redirectUrl.searchParams.set('redirect_uri', redirectUri);
    return NextResponse.redirect(redirectUrl);
  }

  const state = crypto.randomUUID();
  const authUrl = getGoogleAuthUrl(state, redirectUri);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  return response;
}
