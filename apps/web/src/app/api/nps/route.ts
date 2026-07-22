import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@pymebot/db';

export const runtime = 'nodejs';

function parseScore(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 10) return null;
  return n;
}

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId_required' }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 });
  }

  const responses = await prisma.npsResponse.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });

  const count = responses.length;
  const average =
    count === 0
      ? null
      : Math.round((responses.reduce((sum, r) => sum + r.score, 0) / count) * 100) / 100;

  return NextResponse.json({ average, count, responses });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const tenantId = String(body.tenantId || '');
  const score = parseScore(body.score);
  const comment =
    body.comment !== undefined && body.comment !== null && String(body.comment).trim()
      ? String(body.comment).trim()
      : null;

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId_required' }, { status: 400 });
  }
  if (score === null) {
    return NextResponse.json({ error: 'invalid_score' }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 });
  }

  const response = await prisma.npsResponse.create({
    data: { tenantId, score, comment },
  });

  return NextResponse.json({ response }, { status: 201 });
}
