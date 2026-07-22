import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@pymebot/db';
import { requireApiKey } from '@/lib/apiAuth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'tenant_demo_mx';
  const products = await prisma.product.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ tenantId, products });
}

export async function POST(req: NextRequest) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  const body = (await req.json()) as {
    tenantId?: string;
    sku?: string;
    name?: string;
    priceCents?: number;
    stockQty?: number;
    currency?: string;
  };
  const tenantId = String(body.tenantId || 'tenant_demo_mx');
  const product = await prisma.product.create({
    data: {
      tenantId,
      sku: String(body.sku),
      name: String(body.name),
      priceCents: Number(body.priceCents),
      stockQty: Number(body.stockQty ?? 0),
      currency: String(body.currency || 'MXN'),
    },
  });
  return NextResponse.json(product, { status: 201 });
}
