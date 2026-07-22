import { NextRequest, NextResponse } from 'next/server';
import { findLowStock } from '@pymebot/core';
import { prisma } from '@pymebot/db';

export const runtime = 'nodejs';

const LOW_STOCK_THRESHOLD = 5;
const TOP_PRODUCTS_LIMIT = 5;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function lastSevenDayKeys(now: Date): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    keys.push(dayKey(d));
  }
  return keys;
}

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'tenant_demo_mx';

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  const [orders, paymentsCount, invoicesCount, products, orderItems] = await Promise.all([
    prisma.order.findMany({
      where: { tenantId, status: { not: 'cancelled' } },
      select: { totalCents: true, createdAt: true },
    }),
    prisma.payment.count({ where: { tenantId } }),
    prisma.invoice.count({ where: { tenantId } }),
    prisma.product.findMany({
      where: { tenantId },
      select: { stockQty: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { tenantId, status: { not: 'cancelled' } } },
      select: {
        quantity: true,
        product: { select: { name: true } },
      },
    }),
  ]);

  const ordersCount = orders.length;
  const revenueCents = orders.reduce((sum, o) => sum + o.totalCents, 0);
  const lowStockCount = findLowStock(products, LOW_STOCK_THRESHOLD).length;

  const qtyByName = new Map<string, number>();
  for (const item of orderItems) {
    const name = item.product.name;
    qtyByName.set(name, (qtyByName.get(name) ?? 0) + item.quantity);
  }
  const topProducts = [...qtyByName.entries()]
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, TOP_PRODUCTS_LIMIT);

  const centsByDay = new Map<string, number>();
  for (const key of lastSevenDayKeys(now)) {
    centsByDay.set(key, 0);
  }
  for (const order of orders) {
    if (order.createdAt < sevenDaysAgo) continue;
    const key = dayKey(order.createdAt);
    if (!centsByDay.has(key)) continue;
    centsByDay.set(key, (centsByDay.get(key) ?? 0) + order.totalCents);
  }
  const revenueByDay = [...centsByDay.entries()].map(([day, cents]) => ({ day, cents }));

  return NextResponse.json({
    ordersCount,
    revenueCents,
    paymentsCount,
    invoicesCount,
    lowStockCount,
    topProducts,
    revenueByDay,
  });
}
