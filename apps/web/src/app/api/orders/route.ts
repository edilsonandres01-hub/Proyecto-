import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@pymebot/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'tenant_demo_mx';
  const orders = await prisma.order.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } }, payments: true, invoices: true },
  });
  return NextResponse.json({ tenantId, orders });
}

/** Cancel order and restore stock (within tenant). */
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const tenantId = String(body.tenantId || 'tenant_demo_mx');
  const orderId = String(body.orderId);
  const action = String(body.action || 'cancel');

  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: 'order_not_found' }, { status: 404 });

  if (action === 'cancel') {
    if (order.status === 'cancelled') {
      return NextResponse.json({ order });
    }
    const updated = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity } },
        });
      }
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'cancelled' },
      });
    });
    return NextResponse.json({ order: updated });
  }

  return NextResponse.json({ error: 'unsupported_action' }, { status: 400 });
}
