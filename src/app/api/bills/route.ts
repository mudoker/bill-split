import { NextResponse } from 'next/server';
import { getDb } from '../../../../db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const summary = await db.listBills();
    return NextResponse.json(summary);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to list bills';
    console.error('List bills error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, data } = body;
    const billId = id || crypto.randomUUID();

    const db = await getDb();
    await db.saveBill(billId, data || {});

    return NextResponse.json({ id: billId, success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to save bill';
    console.error('Save error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
