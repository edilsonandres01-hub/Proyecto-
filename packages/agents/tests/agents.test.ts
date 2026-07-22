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
});
