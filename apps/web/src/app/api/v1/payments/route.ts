import { NextRequest, NextResponse } from 'next/server';
import { createPaymentAdapter } from '@pymebot/adapters';
import { prisma } from '@pymebot/db';
import { requireApiKey } from '@/lib/apiAuth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  const body = (await req.json()) as {
    tenantId?: string;
    orderId?: string;
    rail?: string;
  };
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
      instructions: intent.instructions,
    },
  });

  return NextResponse.json({ payment, intent }, { status: 201 });
}
