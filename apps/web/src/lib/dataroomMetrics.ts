import { prisma } from '@pymebot/db';

export type DataroomMetrics = {
  activeTenants: number;
  ordersTotal: number;
  paymentGmvCents: number;
  invoicesTotal: number;
  npsAverage: number | null;
  payingSubscriptions: number;
};

export async function getDataroomMetrics(): Promise<DataroomMetrics> {
  const [activeTenants, ordersTotal, paymentAgg, invoicesTotal, npsAgg, payingSubscriptions] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.order.count(),
      prisma.payment.aggregate({
        _sum: { amountCents: true },
        where: { status: 'paid' },
      }),
      prisma.invoice.count(),
      prisma.npsResponse.aggregate({ _avg: { score: true } }),
      prisma.subscription.count({ where: { status: 'active' } }),
    ]);

  const avg = npsAgg._avg.score;
  return {
    activeTenants,
    ordersTotal,
    paymentGmvCents: paymentAgg._sum.amountCents ?? 0,
    invoicesTotal,
    npsAverage: avg === null ? null : Math.round(avg * 100) / 100,
    payingSubscriptions,
  };
}
