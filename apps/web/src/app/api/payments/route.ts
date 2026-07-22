import { NextRequest, NextResponse } from 'next/server';
import { createPaymentAdapter } from '@pymebot/adapters';
import { prisma } from '@pymebot/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'tenant_demo_mx';
  const payments = await prisma.payment.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ tenantId, payments });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const tenantId = String(body.tenantId || 'tenant_demo_mx');
  const orderId = String(body.orderId);
  const rail = (body.rail || 'spei') as 'spei' | 'codi' | 'pix' | 'cash';

  const order = await prisma.order.findFirst({ where: { id: orderId, tenantId } });
  if (!order) return NextResponse.json({ error: 'order_not_found' }, { status: 404 });

  const adapter = createPaymentAdapter(rail === 'cash' ? 'spei' : rail);
  const intent = await adapter.createIntent({
    amountCents: order.totalCents,
    currency: order.currency as 'MXN' | 'BRL',
    rail: rail === 'cash' ? 'spei' : rail,
    reference: order.id,
  });

  const payment = await prisma.payment.create({
    data: {
      tenantId,
      orderId,
      rail,
      status: intent.status,
      amountCents: order.totalCents,
      currency: order.currency,
      intentId: intent.intentId,
      instructions: intent.instructions as object,
    },
  });

  const paid = await adapter.confirmWebhook({ intentId: intent.intentId });
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: paid.status },
  });
  if (paid.status === 'paid') {
    await prisma.order.update({ where: { id: orderId }, data: { status: 'paid' } });
  }

  return NextResponse.json({ payment: updated, intent }, { status: 201 });
}
