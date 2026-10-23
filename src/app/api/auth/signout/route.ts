import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('session_token');
  return res;
}

export async function GET(req: Request) {
  const host = req.headers.get('host') || 'bill-splits.mudoker.com';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const res = NextResponse.redirect(`${proto}://${host}/`);
  res.cookies.delete('session_token');
  return res;
}
