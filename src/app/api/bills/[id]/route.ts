import { NextResponse } from 'next/server';
import { getDb } from '../../../../../db';
import { getSessionUser } from '@/lib/auth';

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
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const isShare = url.searchParams.get('share') === '1' || url.searchParams.get('share') === 'true';

    const user = await getSessionUser();
    const db = await getDb();
    const bill = await db.getBill(id, user?.id || null, isShare);

    if (!bill) {
      if (!isShare && !user) {
        return NextResponse.json(
          { error: 'Login required to view this private bill. Or view using a share link.' },
          { status: 401, headers: corsHeaders }
        );
      }
      if (!isShare && user) {
        return NextResponse.json(
          { error: 'Access denied: You are not an owner or participant in this bill.' },
          { status: 403, headers: corsHeaders }
        );
      }
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
    const user = await getSessionUser();
    const db = await getDb();
    if (db.deleteBill) {
      const deleted = await db.deleteBill(id, user?.id || null);
      if (!deleted) {
        return NextResponse.json({ error: 'Bill not found' }, { status: 404, headers: corsHeaders });
      }
    }
    return NextResponse.json({ success: true, id }, { headers: corsHeaders });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete bill';
    console.error('Delete bill error:', error);
    const isForbidden = msg.toLowerCase().includes('forbidden');
    return NextResponse.json({ error: msg }, { status: isForbidden ? 403 : 500, headers: corsHeaders });
  }
}
