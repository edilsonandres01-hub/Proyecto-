import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@pymebot/db';

export const runtime = 'nodejs';

const PLAN_AMOUNTS = {
  starter: 29900,
  growth: 79900,
} as const;

type Plan = keyof typeof PLAN_AMOUNTS;

function isPlan(value: string): value is Plan {
  return value === 'starter' || value === 'growth';
}

function currencyForCountry(country: string) {
  return country === 'BR' ? 'BRL' : 'MXN';
}

function periodEnd(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'tenant_demo_mx';

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { subscription: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 });
  }

  return NextResponse.json({
    tenantId,
    subscription: tenant.subscription,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const tenantId = String(body.tenantId || '');
  const action = String(body.action || '');
  const planRaw = body.plan !== undefined ? String(body.plan) : '';

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId_required' }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { subscription: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 });
  }

  if (action === 'subscribe') {
    if (!isPlan(planRaw)) {
      return NextResponse.json({ error: 'invalid_plan' }, { status: 400 });
    }
    const currency = currencyForCountry(tenant.country);
    const amountCents = PLAN_AMOUNTS[planRaw];
    const data = {
      plan: planRaw,
      status: 'active',
      amountCents,
      currency,
      currentPeriodEnd: periodEnd(30),
    };

    const subscription = tenant.subscription
      ? await prisma.subscription.update({
          where: { tenantId },
          data,
        })
      : await prisma.subscription.create({
          data: { tenantId, ...data },
        });

    return NextResponse.json({ subscription }, { status: tenant.subscription ? 200 : 201 });
  }

  if (action === 'cancel') {
    if (!tenant.subscription) {
      return NextResponse.json({ error: 'no_subscription' }, { status: 404 });
    }
    const subscription = await prisma.subscription.update({
      where: { tenantId },
      data: { status: 'canceled' },
    });
    return NextResponse.json({ subscription });
  }

  return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
}
