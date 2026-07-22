import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingObligations } from '@pymebot/core';
import { prisma } from '@pymebot/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'tenant_demo_mx';

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 });
  }

  const reminders = await prisma.taxReminder.findMany({
    where: { tenantId },
    orderBy: { dueDate: 'asc' },
  });

  const country = tenant.country === 'BR' ? 'BR' : 'MX';
  const asOf = new Date();
  const upcoming = getUpcomingObligations(country, asOf).map((o) => ({
    code: o.code,
    title: o.title,
    dueDate: o.dueDate.toISOString(),
    daysUntil: o.daysUntil,
  }));

  return NextResponse.json({
    tenantId,
    country,
    reminders,
    upcoming,
  });
}
