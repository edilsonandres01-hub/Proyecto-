import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@pymebot/db';

export const runtime = 'nodejs';

const STATUSES = new Set(['pending', 'accepted', 'rewarded']);

function generateReferralCode(): string {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `REF-${suffix}`;
}

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'tenant_demo_mx';

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 });
  }

  const referrals = await prisma.referral.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ tenantId, referrals });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const tenantId = String(body.tenantId || '');
  const action = String(body.action || '');
  const invitedEmail =
    body.invitedEmail !== undefined && body.invitedEmail !== null && String(body.invitedEmail).trim()
      ? String(body.invitedEmail).trim()
      : undefined;
  const codeRaw = body.code !== undefined ? String(body.code).trim().toUpperCase() : '';

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId_required' }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 });
  }

  if (action === 'create') {
    let code = codeRaw || generateReferralCode();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await prisma.referral.findUnique({ where: { code } });
      if (!existing) break;
      code = generateReferralCode();
    }

    try {
      const referral = await prisma.referral.create({
        data: {
          tenantId,
          code,
          invitedEmail: invitedEmail ?? null,
          status: 'pending',
        },
      });
      return NextResponse.json({ referral }, { status: 201 });
    } catch {
      return NextResponse.json({ error: 'code_conflict' }, { status: 409 });
    }
  }

  if (action === 'accept') {
    if (!codeRaw) {
      return NextResponse.json({ error: 'code_required' }, { status: 400 });
    }

    const referral = await prisma.referral.findUnique({ where: { code: codeRaw } });
    if (!referral) {
      return NextResponse.json({ error: 'referral_not_found' }, { status: 404 });
    }
    if (referral.tenantId !== tenantId) {
      return NextResponse.json({ error: 'tenant_mismatch' }, { status: 403 });
    }
    if (!STATUSES.has(referral.status)) {
      return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
    }
    if (referral.status !== 'pending') {
      return NextResponse.json({ error: 'already_processed', referral }, { status: 409 });
    }

    const updated = await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'accepted',
        ...(invitedEmail !== undefined ? { invitedEmail } : {}),
      },
    });

    return NextResponse.json({ referral: updated });
  }

  return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
}
