import { NextResponse } from 'next/server';
import { getDb, getDbStatus } from '../../../../db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await getDb();
  } catch (e) {
    console.warn('Health check DB init error:', e);
  }

  return NextResponse.json({
    status: 'ok',
    database: getDbStatus(),
  });
}
