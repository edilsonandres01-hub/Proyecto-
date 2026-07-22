import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  adjustStock,
  asTenantId,
  classifyIntent,
  confirmOrder,
  createOrder,
  createProduct,
  DEFAULT_FEATURE_FLAGS,
  findLowStock,
  formatMoney,
  getFeatureFlags,
  getUpcomingObligations,
  money,
  resolveFeatureFlags,
} from '../src/index.js';

describe('adjustStock', () => {
  const tenantId = asTenantId('tenant-1');

  it('increases and decreases stock', () => {
    const product = createProduct({
      tenantId,
      name: 'Café',
      stock: 10,
      price: money(2500, 'MXN'),
    });

    const up = adjustStock(product, 5);
    assert.equal(up.stock, 15);

    const down = adjustStock(up, -3);
    assert.equal(down.stock, 12);
  });

  it('rejects negative stock without allowNegative', () => {
    const product = createProduct({
      tenantId,
      name: 'Pan',
      stock: 2,
      price: money(1000, 'MXN'),
    });

    assert.throws(
      () => adjustStock(product, -5),
      /Insufficient stock/,
    );
  });

  it('allows negative stock when flag is set', () => {
    const product = createProduct({
      tenantId,
      name: 'Pan',
      stock: 2,
      price: money(1000, 'MXN'),
      allowNegative: true,
    });

    const next = adjustStock(product, -5);
    assert.equal(next.stock, -3);
  });
});

describe('findLowStock', () => {
  it('filters by stockQty with default threshold 5', () => {
    const products = [
      { id: 'a', stockQty: 2 },
      { id: 'b', stockQty: 5 },
      { id: 'c', stockQty: 6 },
    ];
    const low = findLowStock(products);
    assert.deepEqual(
      low.map((p) => p.id),
      ['a', 'b'],
    );
  });

  it('supports core Product.stock and custom threshold', () => {
    const tenantId = asTenantId('tenant-1');
    const products = [
      createProduct({ tenantId, name: 'Low', stock: 1, price: money(100, 'MXN') }),
      createProduct({ tenantId, name: 'Ok', stock: 10, price: money(100, 'MXN') }),
    ];
    const low = findLowStock(products, 3);
    assert.equal(low.length, 1);
    assert.equal(low[0]!.name, 'Low');
  });
});

describe('confirmOrder', () => {
  it('moves draft orders to confirmed', () => {
    const order = createOrder({
      tenantId: asTenantId('tenant-1'),
      items: [
        {
          productId: 'p1',
          name: 'Café',
          quantity: 2,
          unitPrice: money(2500, 'MXN'),
        },
      ],
    });

    assert.equal(order.status, 'draft');
    assert.equal(order.total.amountCents, 5000);

    const confirmed = confirmOrder(order);
    assert.equal(confirmed.status, 'confirmed');
  });

  it('rejects confirming a non-draft order', () => {
    const order = createOrder([
      {
        productId: 'p1',
        name: 'Café',
        quantity: 1,
        unitPrice: money(100, 'BRL'),
      },
    ]);
    const confirmed = confirmOrder(order);

    assert.throws(() => confirmOrder(confirmed), /Cannot confirm order/);
  });
});

describe('classifyIntent', () => {
  it('classifies product intents (es/pt)', () => {
    assert.equal(classifyIntent('¿Cuánto stock tengo de café?'), 'product');
    assert.equal(classifyIntent('Qual o preço do produto?'), 'product');
    assert.equal(classifyIntent('Quiero vender un producto'), 'product');
    assert.equal(classifyIntent('facturar pedido'), 'fiscal');
  });

  it('classifies payment intents', () => {
    assert.equal(classifyIntent('Quiero cobrar con pix'), 'payment');
    assert.equal(classifyIntent('Genera un SPEI por favor'), 'payment');
  });

  it('classifies fiscal intents', () => {
    assert.equal(classifyIntent('Necesito la factura del ticket'), 'fiscal');
    assert.equal(classifyIntent('Emitir nota fiscal NFe'), 'fiscal');
  });

  it('classifies support intents', () => {
    assert.equal(classifyIntent('Necesito ayuda con un error'), 'support');
    assert.equal(classifyIntent('Preciso de ajuda no suporte'), 'support');
  });

  it('returns unknown for unrelated text', () => {
    assert.equal(classifyIntent('Buenos días'), 'unknown');
    assert.equal(classifyIntent(''), 'unknown');
  });
});

describe('formatMoney', () => {
  it('formats MXN and BRL', () => {
    const mxn = formatMoney(1999, 'MXN');
    const brl = formatMoney(1999, 'BRL');
    assert.match(mxn, /19/);
    assert.match(brl, /19/);
    assert.ok(mxn.includes('19.99') || mxn.includes('19,99'));
    assert.ok(brl.includes('19.99') || brl.includes('19,99'));
  });
});

describe('getUpcomingObligations', () => {
  it('returns MX IVA and ISR on day 17', () => {
    const asOf = new Date(2026, 6, 10); // Jul 10 2026
    const ops = getUpcomingObligations('MX', asOf);
    assert.equal(ops.length, 2);
    assert.equal(ops[0]!.code, 'MX_IVA_MENSUAL');
    assert.equal(ops[1]!.code, 'MX_ISR_PROVISIONAL');
    assert.equal(ops[0]!.dueDate.getDate(), 17);
    assert.equal(ops[0]!.daysUntil, 7);
  });

  it('returns BR DAS Simples on day 20', () => {
    const asOf = new Date(2026, 6, 15); // Jul 15 2026
    const ops = getUpcomingObligations('BR', asOf);
    assert.equal(ops.length, 1);
    assert.equal(ops[0]!.code, 'BR_DAS_SIMPLES');
    assert.equal(ops[0]!.dueDate.getDate(), 20);
    assert.equal(ops[0]!.daysUntil, 5);
  });

  it('rolls to next month when due day has passed', () => {
    const asOf = new Date(2026, 6, 18); // Jul 18 — past MX day 17
    const ops = getUpcomingObligations('MX', asOf);
    assert.equal(ops[0]!.dueDate.getMonth(), 7); // August
    assert.equal(ops[0]!.dueDate.getDate(), 17);
  });
});

describe('resolveFeatureFlags', () => {
  it('defaults all flags to true', () => {
    assert.deepEqual(resolveFeatureFlags(''), DEFAULT_FEATURE_FLAGS);
    assert.deepEqual(resolveFeatureFlags(null), DEFAULT_FEATURE_FLAGS);
  });

  it('parses JSON overrides', () => {
    const flags = resolveFeatureFlags('{"billing":false,"csvImport":false}');
    assert.equal(flags.billing, false);
    assert.equal(flags.csvImport, false);
    assert.equal(flags.webhooks, true);
  });

  it('parses comma disabled list', () => {
    const flags = resolveFeatureFlags('billing,webhooks,referrals');
    assert.equal(flags.billing, false);
    assert.equal(flags.webhooks, false);
    assert.equal(flags.referrals, false);
    assert.equal(flags.analytics, true);
  });
});

describe('getFeatureFlags', () => {
  it('aliases resolveFeatureFlags for ops health', () => {
    assert.deepEqual(getFeatureFlags(''), DEFAULT_FEATURE_FLAGS);
    assert.equal(getFeatureFlags('{"analytics":false}').analytics, false);
  });
});
