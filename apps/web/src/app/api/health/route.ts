import { NextResponse } from 'next/server';
import { prisma } from '@pymebot/db';
import { getAuditLog } from '@pymebot/adapters';

export const runtime = 'nodejs';

export async function GET() {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, country: true, _count: { select: { products: true, orders: true } } },
  });
  return NextResponse.json({
    ok: true,
    service: 'pymebot',
    tenants,
    adapterAuditEntries: getAuditLog().length,
  });
}
