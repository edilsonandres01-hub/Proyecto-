import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@pymebot/db';
import { requireApiKey } from '@/lib/apiAuth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'tenant_demo_mx';
  const orders = await prisma.order.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } }, payments: true, invoices: true },
  });
  return NextResponse.json({ tenantId, orders });
}
