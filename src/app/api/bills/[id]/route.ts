import { NextResponse } from 'next/server';
import { getDb } from '../../../../../db';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const bill = await db.getBill(id);

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json(bill);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to get bill';
    console.error('Get bill error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
