import { NextResponse } from 'next/server';
import { getDb } from '../../../../db';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const db = await getDb();
    const summary = await db.listBills();
    return NextResponse.json(summary, { headers: corsHeaders });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to list bills';
    console.error('List bills error:', error);
    return NextResponse.json({ error: msg }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, data } = body;
    const billId = id || crypto.randomUUID();

    const db = await getDb();
    await db.saveBill(billId, data || {});

    return NextResponse.json({ id: billId, success: true }, { headers: corsHeaders });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to save bill';
    console.error('Save error:', error);
    return NextResponse.json({ error: msg }, { status: 500, headers: corsHeaders });
  }
}
