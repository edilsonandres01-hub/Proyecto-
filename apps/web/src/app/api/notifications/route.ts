import { NextRequest, NextResponse } from 'next/server';
import { findLowStock } from '@pymebot/core';
import { prisma } from '@pymebot/db';

export const runtime = 'nodejs';

const LOW_STOCK_THRESHOLD = 5;
const TAX_REMINDER_DAYS = 7;

export type NotificationItem = {
  type: string;
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'critical';
};

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'tenant_demo_mx';

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 });
  }

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const horizon = new Date(startOfToday);
  horizon.setDate(horizon.getDate() + TAX_REMINDER_DAYS);
  horizon.setHours(23, 59, 59, 999);

  const [products, reminders] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId },
      select: { id: true, name: true, sku: true, stockQty: true },
    }),
    prisma.taxReminder.findMany({
      where: {
        tenantId,
        status: 'pending',
        dueDate: { gte: startOfToday, lte: horizon },
      },
      orderBy: { dueDate: 'asc' },
    }),
  ]);

  const notifications: NotificationItem[] = [];

  for (const product of findLowStock(products, LOW_STOCK_THRESHOLD)) {
    notifications.push({
      type: 'low_stock',
      title: 'Stock bajo',
      body: `${product.name} (${product.sku}): ${product.stockQty} unidades (umbral ${LOW_STOCK_THRESHOLD})`,
      severity: product.stockQty <= 2 ? 'critical' : 'warning',
    });
  }

  const locale = tenant.country === 'BR' ? 'pt-BR' : 'es-MX';
  for (const reminder of reminders) {
    notifications.push({
      type: 'tax_reminder',
      title: reminder.title,
      body: `Vence el ${new Date(reminder.dueDate).toLocaleDateString(locale)}`,
      severity: 'warning',
    });
  }

  return NextResponse.json(notifications);
}
