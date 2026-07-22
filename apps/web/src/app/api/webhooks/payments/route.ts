import { NextRequest, NextResponse } from 'next/server';
import { createPaymentAdapter, type PaymentRail } from '@pymebot/adapters';
import { prisma } from '@pymebot/db';

export const runtime = 'nodejs';

const DEMO_WEBHOOK_SECRET = 'pymebot_webhook_secret';

function isValidSecret(secret: unknown): boolean {
  if (typeof secret !== 'string' || !secret) return false;
  const envSecret = process.env.PYMEBOT_WEBHOOK_SECRET;
  return secret === DEMO_WEBHOOK_SECRET || (Boolean(envSecret) && secret === envSecret);
}

function asAdapterRail(rail: string): PaymentRail {
  if (rail === 'codi' || rail === 'pix' || rail === 'spei') return rail;
  return 'spei';
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    intentId?: string;
    status?: 'paid' | 'failed';
    secret?: string;
  };

  if (!isValidSecret(body.secret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const intentId = String(body.intentId || '');
  if (!intentId) {
    return NextResponse.json({ error: 'intentId_required' }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({ where: { intentId } });
  if (!payment) {
    return NextResponse.json({ error: 'payment_not_found' }, { status: 404 });
  }

  const adapter = createPaymentAdapter(asAdapterRail(payment.rail));
  const confirmed = await adapter.confirmWebhook({
    intentId,
    status: body.status === 'failed' ? 'failed' : 'paid',
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

  const event = await prisma.webhookEvent.create({
    data: {
      provider: 'payments',
      intentId,
      paymentId: payment.id,
      status: confirmed.status,
      payload: body,
    },
  });

  return NextResponse.json({ payment: updated, confirmed, event });
}
