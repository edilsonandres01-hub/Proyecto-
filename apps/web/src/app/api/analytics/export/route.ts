import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@pymebot/db';

export const runtime = 'nodejs';

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'tenant_demo_mx';

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 });
  }

  const orders = await prisma.order.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      totalCents: true,
      createdAt: true,
    },
  });

  const lines = ['id,status,totalCents,createdAt'];
  for (const order of orders) {
    lines.push(
      [
        csvEscape(order.id),
        csvEscape(order.status),
        String(order.totalCents),
        csvEscape(order.createdAt.toISOString()),
      ].join(','),
    );
  }

  const body = `${lines.join('\n')}\n`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders-${tenantId}.csv"`,
    },
  });
}
