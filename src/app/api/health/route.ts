import { NextResponse } from 'next/server';
import { getDb, getDbStatus } from '../../../../db';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    await getDb();
  } catch (e) {
    console.warn('Health check DB init error:', e);
  }

  return NextResponse.json(
    {
      status: 'ok',
      database: getDbStatus(),
    },
    { headers: corsHeaders }
  );
}
