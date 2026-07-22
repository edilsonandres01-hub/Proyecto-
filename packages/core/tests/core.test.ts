import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  adjustStock,
  asTenantId,
  classifyIntent,
  confirmOrder,
  createOrder,
  createProduct,
  formatMoney,
  money,
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
    assert.equal(classifyIntent('Quiero hacer un pedido'), 'product');
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
