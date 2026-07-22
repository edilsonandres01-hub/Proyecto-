import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@pymebot/db';
import { DEMO_ACCOUNTANT_EMAILS } from '@/lib/accountant';
import { DEMO_TENANTS } from '@/lib/tenant';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get('email') || '').trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: 'email_required' }, { status: 400 });
  }

  if (!DEMO_ACCOUNTANT_EMAILS.has(email)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const tenants = await prisma.tenant.findMany({
    where: { id: { in: [DEMO_TENANTS.MX, DEMO_TENANTS.BR] } },
    select: {
      id: true,
      name: true,
      country: true,
      _count: { select: { orders: true, invoices: true } },
      orders: { select: { totalCents: true, status: true } },
    },
    orderBy: { country: 'asc' },
  });

  const summary = tenants.map((t) => {
    const revenueCents = t.orders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'draft')
      .reduce((sum, o) => sum + o.totalCents, 0);

    return {
      id: t.id,
      name: t.name,
      country: t.country,
      ordersCount: t._count.orders,
      revenueCents,
      invoiceCount: t._count.invoices,
    };
  });

  return NextResponse.json({ email, tenants: summary });
}
