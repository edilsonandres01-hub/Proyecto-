import { NextRequest, NextResponse } from 'next/server';
import { createFiscalAdapter } from '@pymebot/adapters';
import { prisma } from '@pymebot/db';
import { requireApiKey } from '@/lib/apiAuth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  const body = (await req.json()) as {
    tenantId?: string;
    orderId?: string;
  };
  const tenantId = String(body.tenantId || 'tenant_demo_mx');
  const orderId = String(body.orderId);

  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: { tenant: true },
  });
  if (!order) return NextResponse.json({ error: 'order_not_found' }, { status: 404 });

  const country = order.tenant.country === 'BR' ? 'BR' : 'MX';
  const fiscal = createFiscalAdapter(country);
  const issued = await fiscal.issueInvoice({
    orderId: order.id,
    amountCents: order.totalCents,
    country,
    customerTaxId: order.tenant.taxId || undefined,
  });

  const invoice = await prisma.invoice.create({
    data: {
      tenantId,
      orderId,
      country,
      status: issued.status,
      uuidOrChave: issued.uuidOrChave,
      pdfStubUrl: issued.pdfStubUrl,
      xmlStub: issued.xmlStub,
    },
  });

  return NextResponse.json(
    {
      invoice,
      disclaimer:
        'Borrador sandbox. No constituye CFDI/NFC-e oficial ni asesoría fiscal.',
    },
    { status: 201 },
  );
}
