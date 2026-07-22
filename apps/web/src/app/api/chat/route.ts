import { NextRequest, NextResponse } from 'next/server';
import { handleTurn, type ToolCall } from '@pymebot/agents';
import { createPaymentAdapter, createFiscalAdapter, type PaymentRail } from '@pymebot/adapters';
import { prisma } from '@pymebot/db';

export const runtime = 'nodejs';

function asPaymentRail(rail: string): PaymentRail {
  if (rail === 'codi' || rail === 'pix' || rail === 'spei') return rail;
  return 'spei';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tenantId = String(body.tenantId || 'tenant_demo_mx');
    const message = String(body.message || '');
    const lastOrderId = body.lastOrderId ? String(body.lastOrderId) : undefined;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { products: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found. Run db:seed.' }, { status: 404 });
    }

    const locale = tenant.country === 'BR' ? 'pt-BR' : 'es-MX';
    const result = handleTurn(
      message,
      {
        tenantId: tenant.id,
        businessName: tenant.name,
        country: tenant.country === 'BR' ? 'BR' : 'MX',
        locale,
        products: tenant.products.map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          priceCents: p.priceCents,
          currency: p.currency,
          stockQty: p.stockQty,
        })),
      },
      { lastOrderId },
    );

    let reply = result.reply;
    let orderId = lastOrderId;
    const tool: ToolCall = result.tool;

    if (tool.name === 'create_draft_order') {
      const product = tenant.products.find((p) => p.id === tool.productId);
      if (!product) {
        reply = 'Producto no encontrado.';
      } else if (product.stockQty < tool.quantity) {
        reply = `Stock insuficiente. Disponible: ${product.stockQty}.`;
      } else {
        const total = product.priceCents * tool.quantity;
        const order = await prisma.$transaction(async (tx) => {
          const o = await tx.order.create({
            data: {
              tenantId,
              status: 'confirmed',
              totalCents: total,
              currency: product.currency,
              customerName: 'Cliente WhatsApp',
              items: {
                create: {
                  productId: product.id,
                  quantity: tool.quantity,
                  unitPriceCents: product.priceCents,
                },
              },
            },
          });
          await tx.product.update({
            where: { id: product.id },
            data: { stockQty: { decrement: tool.quantity } },
          });
          return o;
        });
        orderId = order.id;
        reply =
          locale === 'pt-BR'
            ? `Pedido confirmado ${order.id}. Total ${(total / 100).toFixed(2)} ${product.currency}. Digite "cobrar" ou "faturar pedido".`
            : `Pedido confirmado ${order.id}. Total $${(total / 100).toFixed(2)} ${product.currency}. Di "cobrar" o "facturar pedido".`;
      }
    }

    if (tool.name === 'create_payment') {
      const order = await prisma.order.findFirst({
        where: { id: tool.orderId, tenantId },
      });
      if (!order) {
        reply = 'Pedido no encontrado para este tenant.';
      } else {
        const rail = asPaymentRail(tool.rail);
        const adapter = createPaymentAdapter(rail);
        const intent = await adapter.createIntent({
          amountCents: order.totalCents,
          currency: order.currency,
          rail,
          reference: order.id,
        });
        await prisma.payment.create({
          data: {
            tenantId,
            orderId: order.id,
            rail,
            status: 'pending',
            amountCents: order.totalCents,
            currency: order.currency,
            intentId: intent.intentId,
            instructions: intent.instructions as object,
          },
        });
        const paid = await adapter.confirmWebhook({ intentId: intent.intentId });
        await prisma.payment.updateMany({
          where: { intentId: intent.intentId },
          data: { status: paid.status },
        });
        await prisma.order.update({ where: { id: order.id }, data: { status: 'paid' } });
        const instr = intent.instructions;
        reply =
          `Cobro ${rail.toUpperCase()} listo (${paid.status}).\n` +
          (instr.clabe ? `CLABE: ${instr.clabe}\n` : '') +
          (instr.pixCopyPaste ? `PIX: ${instr.pixCopyPaste}\n` : '') +
          (instr.qrContent ? `QR: ${instr.qrContent}\n` : '') +
          (instr.claveRastreo ? `Clave rastreo: ${instr.claveRastreo}\n` : '') +
          `Intent: ${intent.intentId}`;
        orderId = order.id;
      }
    }

    if (tool.name === 'issue_invoice') {
      const order = await prisma.order.findFirst({
        where: { id: tool.orderId, tenantId },
      });
      if (!order) {
        reply = 'Pedido no encontrado.';
      } else {
        const country = tenant.country === 'BR' ? 'BR' : 'MX';
        const fiscal = createFiscalAdapter(country);
        const issued = await fiscal.issueInvoice({
          orderId: order.id,
          amountCents: order.totalCents,
          country,
          customerTaxId: tenant.taxId || undefined,
        });
        await prisma.invoice.create({
          data: {
            tenantId,
            orderId: order.id,
            country,
            status: issued.status,
            uuidOrChave: issued.uuidOrChave,
            pdfStubUrl: issued.pdfStubUrl,
            xmlStub: issued.xmlStub,
          },
        });
        await prisma.order.update({ where: { id: order.id }, data: { status: 'invoiced' } });
        reply =
          `${result.disclaimer || ''}\n` +
          `Borrador fiscal ${country}: ${issued.uuidOrChave}\n` +
          `PDF stub: ${issued.pdfStubUrl}`;
        orderId = order.id;
      }
    }

    return NextResponse.json({
      agent: result.agent,
      intent: result.intent,
      reply,
      tool: result.tool,
      orderId,
      disclaimer: result.disclaimer,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'chat_failed', detail: String(err) }, { status: 500 });
  }
}
