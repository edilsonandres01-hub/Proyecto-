import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@pymebot/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'tenant_demo_mx';
  const products = await prisma.product.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ tenantId, products });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
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

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const tenantId = String(body.tenantId || 'tenant_demo_mx');
  const id = String(body.id);
  const existing = await prisma.product.findFirst({ where: { id, tenantId } });
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const product = await prisma.product.update({
    where: { id },
    data: {
      stockQty: body.stockQty !== undefined ? Number(body.stockQty) : undefined,
      priceCents: body.priceCents !== undefined ? Number(body.priceCents) : undefined,
      name: body.name !== undefined ? String(body.name) : undefined,
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'tenant_demo_mx';
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 });
  const existing = await prisma.product.findFirst({ where: { id, tenantId } });
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true, id });
}
