import { NextResponse } from 'next/server';
import { getDb } from '../../../../../db';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const bill = await db.getBill(id);

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json(bill, { headers: corsHeaders });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to get bill';
    console.error('Get bill error:', error);
    return NextResponse.json({ error: msg }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    if (db.deleteBill) {
      const deleted = await db.deleteBill(id);
      if (!deleted) {
        return NextResponse.json({ error: 'Bill not found' }, { status: 404, headers: corsHeaders });
      }
    }
    return NextResponse.json({ success: true, id }, { headers: corsHeaders });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete bill';
    console.error('Delete bill error:', error);
    return NextResponse.json({ error: msg }, { status: 500, headers: corsHeaders });
  }
}
