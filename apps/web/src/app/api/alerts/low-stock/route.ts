import { NextRequest, NextResponse } from 'next/server';
import { findLowStock } from '@pymebot/core';
import { prisma } from '@pymebot/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'tenant_demo_mx';
  const thresholdRaw = req.nextUrl.searchParams.get('threshold');
  const threshold = thresholdRaw !== null ? Number(thresholdRaw) : 5;

  if (!Number.isFinite(threshold)) {
    return NextResponse.json({ error: 'invalid_threshold' }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 });
  }

  const products = await prisma.product.findMany({
    where: { tenantId },
    orderBy: { stockQty: 'asc' },
  });

  const lowStock = findLowStock(products, threshold);

  return NextResponse.json({
    tenantId,
    threshold,
    count: lowStock.length,
    products: lowStock,
  });
}
