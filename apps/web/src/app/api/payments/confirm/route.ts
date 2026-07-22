import { NextRequest, NextResponse } from 'next/server';
import { createPaymentAdapter, type PaymentRail } from '@pymebot/adapters';
import { prisma } from '@pymebot/db';

export const runtime = 'nodejs';

function asAdapterRail(rail: string): PaymentRail {
  if (rail === 'codi' || rail === 'pix' || rail === 'spei') return rail;
  return 'spei';
}

/**
 * Manual payment confirmation from the merchant portal.
 * Body: { tenantId, paymentId }
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    tenantId?: string;
    paymentId?: string;
  };

  const tenantId = String(body.tenantId || 'tenant_demo_mx');
  const paymentId = String(body.paymentId || '');
  if (!paymentId) {
    return NextResponse.json({ error: 'paymentId_required' }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, tenantId },
  });
  if (!payment) {
    return NextResponse.json({ error: 'payment_not_found' }, { status: 404 });
  }

  const adapter = createPaymentAdapter(asAdapterRail(payment.rail));
  const confirmed = await adapter.confirmWebhook({
    intentId: payment.intentId || payment.id,
    status: 'paid',
  });

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: confirmed.status },
  });

  if (confirmed.status === 'paid') {
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'paid' },
    });
  }

  return NextResponse.json({ payment: updated, confirmed });
}
