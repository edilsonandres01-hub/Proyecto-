import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handleTurn, routeAgent } from '../src/index.ts';

const ctx = {
  tenantId: 't1',
  businessName: 'Abarrotes Sol',
  country: 'MX' as const,
  locale: 'es-MX' as const,
  products: [
    {
      id: 'p1',
      sku: 'COCA-600',
      name: 'Coca-Cola 600ml',
      priceCents: 2200,
      currency: 'MXN',
      stockQty: 10,
    },
    {
      id: 'p2',
      sku: 'SAB-045',
      name: 'Sabritas Original 45g',
      priceCents: 1800,
      currency: 'MXN',
      stockQty: 3,
    },
  ],
};

describe('agents orchestrator', () => {
  it('routes payment intent', () => {
    assert.equal(routeAgent('payment'), 'payment');
  });

  it('answers stock for known product', () => {
    const r = handleTurn('¿Cuánto tienes de Coca-Cola 600ml?', ctx);
    assert.equal(r.agent, 'product');
    assert.match(r.reply, /Stock:/);
  });

  it('includes fiscal disclaimer', () => {
    const r = handleTurn('necesito factura', ctx);
    assert.equal(r.agent, 'fiscal');
    assert.ok(r.disclaimer);
  });

  it('lists tax reminders for IVA/obligaciones', () => {
    const r = handleTurn('¿Cuáles son mis obligaciones de IVA?', ctx);
    assert.equal(r.agent, 'fiscal');
    assert.equal(r.tool.name, 'list_tax_reminders');
    assert.match(r.reply, /IVA declaración mensual/);
    assert.match(r.reply, /ISR provisional/);
  });

  it('lists DAS obligations for BR tenants', () => {
    const brCtx = { ...ctx, country: 'BR' as const, locale: 'pt-BR' as const };
    const r = handleTurn('Quais são as obrigações DAS?', brCtx);
    assert.equal(r.agent, 'fiscal');
    assert.equal(r.tool.name, 'list_tax_reminders');
    assert.match(r.reply, /DAS Simples/);
  });

  it('creates payment tool when order exists', () => {
    const r = handleTurn('cobrar con SPEI', ctx, { lastOrderId: 'ord_1' });
    assert.equal(r.tool.name, 'create_payment');
  });

  it('lists low stock with list_low_stock tool', () => {
    const r = handleTurn('stock bajo', ctx);
    assert.equal(r.agent, 'product');
    assert.equal(r.tool.name, 'list_low_stock');
    assert.match(r.reply, /Sabritas/);
    assert.doesNotMatch(r.reply, /Coca-Cola 600ml/);
  });

  it('matches low stock phrases in pt/en', () => {
    const brCtx = { ...ctx, country: 'BR' as const, locale: 'pt-BR' as const };
    assert.equal(handleTurn('estoque baixo', brCtx).tool.name, 'list_low_stock');
    assert.equal(handleTurn('low stock', ctx).tool.name, 'list_low_stock');
    assert.equal(handleTurn('bajo inventario', ctx).tool.name, 'list_low_stock');
  });
});
