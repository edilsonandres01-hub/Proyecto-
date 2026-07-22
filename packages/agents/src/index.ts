import { classifyIntent, type Intent } from '@pymebot/core';

export type AgentName = 'product' | 'payment' | 'fiscal' | 'support';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ProductSnapshot = {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  currency: string;
  stockQty: number;
};

export type OrchestratorContext = {
  tenantId: string;
  businessName: string;
  country: 'MX' | 'BR';
  locale: 'es-MX' | 'pt-BR';
  products: ProductSnapshot[];
};

export type ToolCall =
  | { name: 'search_products'; query: string }
  | { name: 'get_stock'; productId: string }
  | { name: 'create_draft_order'; productId: string; quantity: number }
  | { name: 'create_payment'; orderId: string; rail: 'spei' | 'codi' | 'pix' | 'cash' }
  | { name: 'issue_invoice'; orderId: string }
  | { name: 'none' };

export type OrchestratorResult = {
  agent: AgentName;
  intent: Intent;
  reply: string;
  tool: ToolCall;
  disclaimer?: string;
};

const FISCAL_DISCLAIMER_ES =
  'PyMEBot organiza operaciones y borradores. No soy contador ni emitiré facturas fiscales oficiales por ti.';
const FISCAL_DISCLAIMER_BR =
  'O PyMEBot organiza operações e rascunhos. Não sou contador nem emitirei NF-e oficial por você.';

function localeOf(ctx: OrchestratorContext) {
  return ctx.locale === 'pt-BR' ? 'pt' : 'es';
}

function findProduct(products: ProductSnapshot[], text: string): ProductSnapshot | undefined {
  const q = text.toLowerCase();
  return products.find(
    (p) =>
      q.includes(p.sku.toLowerCase()) ||
      q.includes(p.name.toLowerCase()) ||
      p.name
        .toLowerCase()
        .split(/\s+/)
        .some((w) => w.length > 3 && q.includes(w)),
  );
}

function extractQuantity(text: string): number {
  const m = text.match(/(\d+)\s*(piezas?|unidades?|un\b|x)?/i);
  if (m) return Math.max(1, Number(m[1]));
  return 1;
}

export function routeAgent(intent: Intent): AgentName {
  switch (intent) {
    case 'payment':
      return 'payment';
    case 'fiscal':
      return 'fiscal';
    case 'support':
      return 'support';
    case 'product':
    default:
      return 'product';
  }
}

export function handleTurn(
  userText: string,
  ctx: OrchestratorContext,
  extras?: { lastOrderId?: string },
): OrchestratorResult {
  let intent = classifyIntent(userText);
  const lang = localeOf(ctx);
  const lower = userText.toLowerCase();
  const matchedProduct = findProduct(ctx.products, userText);

  // Priority overrides for compound phrases
  if (/(factur|invoice|nf-?e|timbr|cfdi|nota fiscal)/i.test(lower)) {
    intent = 'fiscal';
  } else if (/(cobrar|cobro|pagar|pix|spei|codi)/i.test(lower)) {
    intent = 'payment';
  } else if (matchedProduct && (intent === 'unknown' || intent === 'support')) {
    intent = 'product';
  } else if (/(stock|inventario|estoque|cu[aá]nto|quanto|lista)/i.test(lower) && intent === 'unknown') {
    intent = 'product';
  }

  const agent = routeAgent(intent);

  if (agent === 'support' || intent === 'unknown') {
    const reply =
      lang === 'pt'
        ? `Olá! Sou o assistente de ${ctx.businessName}. Posso: 1) consultar estoque 2) criar pedidos 3) gerar cobrança 4) preparar rascunho fiscal. O que precisa?`
        : `Hola. Soy el asistente de ${ctx.businessName}. Puedo: 1) consultar inventario 2) crear pedidos 3) generar cobro 4) preparar borrador fiscal. ¿Qué necesitas?`;
    return { agent: 'support', intent, reply, tool: { name: 'none' } };
  }

  if (agent === 'fiscal') {
    const disclaimer = lang === 'pt' ? FISCAL_DISCLAIMER_BR : FISCAL_DISCLAIMER_ES;
    if (extras?.lastOrderId && /(factur|invoice|nf-?e|timbr)/i.test(lower)) {
      return {
        agent,
        intent,
        disclaimer,
        reply:
          lang === 'pt'
            ? `${disclaimer}\nVou preparar o rascunho fiscal do pedido ${extras.lastOrderId}.`
            : `${disclaimer}\nPrepararé el borrador fiscal del pedido ${extras.lastOrderId}.`,
        tool: { name: 'issue_invoice', orderId: extras.lastOrderId },
      };
    }
    return {
      agent,
      intent,
      disclaimer,
      reply:
        lang === 'pt'
          ? `${disclaimer}\nEnvie uma foto do cupom ou diga "faturar pedido" após confirmar um pedido.`
          : `${disclaimer}\nEnvía foto de un ticket o di "facturar pedido" después de confirmar una venta.`,
      tool: { name: 'none' },
    };
  }

  if (agent === 'payment') {
    const rail =
      ctx.country === 'BR'
        ? 'pix'
        : lower.includes('codi')
          ? 'codi'
          : 'spei';
    if (extras?.lastOrderId) {
      return {
        agent,
        intent,
        reply:
          lang === 'pt'
            ? `Gerando cobrança ${rail.toUpperCase()} para o pedido ${extras.lastOrderId}. Verifique sempre o beneficiário.`
            : `Generando cobro ${rail.toUpperCase()} para el pedido ${extras.lastOrderId}. Verifica siempre el beneficiario.`,
        tool: { name: 'create_payment', orderId: extras.lastOrderId, rail },
      };
    }
    return {
      agent,
      intent,
      reply:
        lang === 'pt'
          ? 'Para cobrar, primeiro confirme um pedido (ex.: "vende 2 Coca 2L").'
          : 'Para cobrar, primero confirma un pedido (ej.: "vende 2 Coca-Cola 600ml").',
      tool: { name: 'none' },
    };
  }

  // product agent
  const product = matchedProduct;
  const wantsOrder = /(vend|pedido|apart|compr|quero|quiero|lleva)/i.test(lower);

  if (product && wantsOrder) {
    const qty = extractQuantity(userText);
    return {
      agent: 'product',
      intent,
      reply:
        lang === 'pt'
          ? `Confirma? ${product.name} x${qty} = ${(product.priceCents * qty) / 100} ${product.currency}. Responda SIM para criar o pedido.`
          : `¿Confirmas? ${product.name} x${qty} = $${(product.priceCents * qty) / 100} ${product.currency}. Responde SÍ para crear el pedido.`,
      tool: { name: 'create_draft_order', productId: product.id, quantity: qty },
    };
  }

  if (product) {
    return {
      agent: 'product',
      intent,
      reply:
        lang === 'pt'
          ? `${product.name}\n• Estoque: ${product.stockQty}\n• Preço: ${(product.priceCents / 100).toFixed(2)} ${product.currency}\nQuantas você quer?`
          : `${product.name}\n• Stock: ${product.stockQty}\n• Precio: $${(product.priceCents / 100).toFixed(2)} ${product.currency}\n¿Cuántas te aparto?`,
      tool: { name: 'get_stock', productId: product.id },
    };
  }

  if (/(stock|inventario|estoque|cuánto|quanto|lista)/i.test(lower)) {
    const lines = ctx.products
      .slice(0, 8)
      .map((p) => `• ${p.name} (${p.sku}): ${p.stockQty}`)
      .join('\n');
    return {
      agent: 'product',
      intent,
      reply:
        lang === 'pt'
          ? `Estoque atual:\n${lines}`
          : `Inventario actual:\n${lines}`,
      tool: { name: 'search_products', query: userText },
    };
  }

  return {
    agent: 'product',
    intent,
    reply:
      lang === 'pt'
        ? 'Não encontrei esse produto. Diga o nome ou SKU, ou peça "lista de estoque".'
        : 'No encontré ese producto. Dime el nombre o SKU, o pide "lista de inventario".',
    tool: { name: 'search_products', query: userText },
  };
}

export const FISCAL_DISCLAIMERS = {
  'es-MX': FISCAL_DISCLAIMER_ES,
  'pt-BR': FISCAL_DISCLAIMER_BR,
};
