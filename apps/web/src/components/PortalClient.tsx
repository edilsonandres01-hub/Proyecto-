'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useTransition } from 'react';

type Product = {
  id: string;
  sku: string;
  name: string;
  stockQty: number;
  priceCents: number;
  currency: string;
};

type OrderItem = { quantity: number; product: { name: string } };
type Order = {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  items: OrderItem[];
  payments: { id: string }[];
  invoices: { id: string }[];
};

type Payment = { id: string; rail: string; status: string; amountCents: number; currency: string };
type Invoice = { id: string; country: string; status: string; uuidOrChave: string | null };
type Reminder = { id: string; title: string; dueDate: string; regime: string | null; status: string };
type TenantOption = { id: string; name: string; country: string };

type Props = {
  tenant: {
    id: string;
    name: string;
    country: string;
    products: Product[];
    orders: Order[];
    payments: Payment[];
    invoices: Invoice[];
    taxReminders: Reminder[];
  };
  tenants: TenantOption[];
  upcoming: { code: string; title: string; dueDate: string; daysUntil: number }[];
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'es-MX', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function PortalClient({ tenant, tenants, upcoming }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');

  const isBR = tenant.country === 'BR';
  const defaultRail = isBR ? 'pix' : 'spei';

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function createProduct(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const priceCents = Math.round(Number(price) * 100);
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: tenant.id,
        sku,
        name,
        priceCents,
        stockQty: Number(stock),
        currency: isBR ? 'BRL' : 'MXN',
      }),
    });
    if (!res.ok) {
      setMsg('No se pudo crear el producto');
      return;
    }
    setSku('');
    setName('');
    setPrice('');
    setStock('0');
    setMsg('Producto creado');
    refresh();
  }

  async function adjustStock(productId: string, stockQty: number) {
    await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: tenant.id, id: productId, stockQty }),
    });
    refresh();
  }

  async function removeProduct(productId: string) {
    await fetch(`/api/products?tenantId=${tenant.id}&id=${productId}`, { method: 'DELETE' });
    refresh();
  }

  async function payOrder(orderId: string, rail?: string) {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: tenant.id, orderId, rail: rail || defaultRail }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || 'Error al cobrar');
      return;
    }
    setMsg(`Cobro ${data.payment?.rail?.toUpperCase()} creado (${data.payment?.status})`);
    refresh();
  }

  async function invoiceOrder(orderId: string) {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: tenant.id, orderId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || 'Error al facturar');
      return;
    }
    setMsg(`Factura sandbox: ${data.invoice?.uuidOrChave}`);
    refresh();
  }

  async function cancelOrder(orderId: string) {
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: tenant.id, orderId, action: 'cancel' }),
    });
    setMsg('Pedido cancelado y stock restaurado');
    refresh();
  }

  return (
    <main className="min-h-screen bg-[var(--mist)]">
      <header className="border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div>
            <Link href="/" className="display text-xl font-semibold">
              PyMEBot
            </Link>
            <p className="text-sm text-[var(--moss)]">
              {tenant.name} · {tenant.country} · {tenant.id}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-[var(--moss)]">
              Tenant{' '}
              <select
                className="ml-1 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm"
                value={tenant.id}
                onChange={(e) => {
                  router.push(`/portal?tenantId=${e.target.value}`);
                }}
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.country} — {t.name}
                  </option>
                ))}
              </select>
            </label>
            <Link href={`/sim?tenantId=${tenant.id}`} className="btn-ghost">
              Simulador
            </Link>
            <Link href="/docs" className="btn-ghost">
              API
            </Link>
            <Link href="/" className="btn-primary">
              Inicio
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-10 md:px-8">
        <section>
          <h1 className="display text-4xl">Portal merchant</h1>
          <p className="mt-2 max-w-2xl text-[var(--moss)]">
            Inventario, cobros, facturas y recordatorios fiscales — aislados por tenant.
          </p>
          {msg && <p className="mt-3 text-sm font-medium text-[var(--leaf)]">{msg}</p>}
          {pending && <p className="mt-1 text-xs text-[var(--moss)]">Actualizando…</p>}
        </section>

        <section>
          <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-3">
            <h2 className="display text-2xl">Inventario</h2>
            <span className="text-sm text-[var(--moss)]">{tenant.products.length} SKUs</span>
          </div>

          <form onSubmit={createProduct} className="mt-4 grid gap-3 sm:grid-cols-5">
            <input
              required
              placeholder="SKU"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              required
              type="number"
              step="0.01"
              min="0"
              placeholder={isBR ? 'Preço' : 'Precio'}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                placeholder="Stock"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
              />
              <button type="submit" className="btn-primary whitespace-nowrap px-4 py-2 text-sm">
                Alta
              </button>
            </div>
          </form>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-[var(--moss)]">
                <tr>
                  <th className="py-2 font-medium">SKU</th>
                  <th className="py-2 font-medium">Producto</th>
                  <th className="py-2 font-medium">Stock</th>
                  <th className="py-2 font-medium">Precio</th>
                  <th className="py-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tenant.products.map((p) => (
                  <tr key={p.id} className="border-t border-[var(--line)]">
                    <td className="py-3 font-mono text-xs">{p.sku}</td>
                    <td className="py-3">{p.name}</td>
                    <td className="py-3">{p.stockQty}</td>
                    <td className="py-3">{money(p.priceCents, p.currency)}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
                          onClick={() => adjustStock(p.id, p.stockQty + 1)}
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
                          onClick={() => adjustStock(p.id, Math.max(0, p.stockQty - 1))}
                        >
                          −1
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-[var(--coral)]/40 px-3 py-1 text-xs text-[var(--coral)]"
                          onClick={() => removeProduct(p.id)}
                        >
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="display border-b border-[var(--line)] pb-3 text-2xl">Pedidos</h2>
          <ul className="mt-4 divide-y divide-[var(--line)]">
            {tenant.orders.length === 0 && (
              <li className="py-4 text-[var(--moss)]">Aún no hay pedidos. Usa el simulador o crea ventas.</li>
            )}
            {tenant.orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium font-mono text-xs md:text-sm">{o.id}</p>
                  <p className="text-sm text-[var(--moss)]">
                    {o.items.map((i) => `${i.product.name}×${i.quantity}`).join(', ')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="mr-2 text-right text-sm">
                    <p className="font-semibold uppercase tracking-wide">{o.status}</p>
                    <p>{money(o.totalCents, o.currency)}</p>
                  </div>
                  {o.status !== 'cancelled' && o.payments.length === 0 && (
                    <>
                      {!isBR && (
                        <button
                          type="button"
                          className="rounded-full bg-[var(--ink)] px-3 py-1 text-xs text-[var(--lime)]"
                          onClick={() => payOrder(o.id, 'spei')}
                        >
                          SPEI
                        </button>
                      )}
                      {!isBR && (
                        <button
                          type="button"
                          className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
                          onClick={() => payOrder(o.id, 'codi')}
                        >
                          CoDi
                        </button>
                      )}
                      {isBR && (
                        <button
                          type="button"
                          className="rounded-full bg-[var(--ink)] px-3 py-1 text-xs text-[var(--lime)]"
                          onClick={() => payOrder(o.id, 'pix')}
                        >
                          Pix
                        </button>
                      )}
                    </>
                  )}
                  {o.status !== 'cancelled' && o.invoices.length === 0 && (
                    <button
                      type="button"
                      className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
                      onClick={() => invoiceOrder(o.id)}
                    >
                      Facturar
                    </button>
                  )}
                  {o.status !== 'cancelled' && (
                    <button
                      type="button"
                      className="rounded-full border border-[var(--coral)]/40 px-3 py-1 text-xs text-[var(--coral)]"
                      onClick={() => cancelOrder(o.id)}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="display border-b border-[var(--line)] pb-3 text-2xl">Cobros</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {tenant.payments.length === 0 && <li className="text-[var(--moss)]">Sin pagos aún.</li>}
              {tenant.payments.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 border-t border-[var(--line)] pt-3">
                  <span>
                    {p.rail.toUpperCase()} · {p.status}
                  </span>
                  <span>{money(p.amountCents, p.currency)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="display border-b border-[var(--line)] pb-3 text-2xl">Facturas (sandbox)</h2>
            <p className="mt-2 text-xs text-[var(--moss)]">Borradores mock. No son CFDI/NFC-e oficiales.</p>
            <ul className="mt-4 space-y-3 text-sm">
              {tenant.invoices.length === 0 && <li className="text-[var(--moss)]">Sin facturas aún.</li>}
              {tenant.invoices.map((inv) => (
                <li key={inv.id} className="border-t border-[var(--line)] pt-3">
                  <p className="font-medium">
                    {inv.country} · {inv.status}
                  </p>
                  <p className="break-all font-mono text-xs text-[var(--moss)]">{inv.uuidOrChave}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <h2 className="display border-b border-[var(--line)] pb-3 text-2xl">
            Recordatorios fiscales
          </h2>
          <p className="mt-2 text-xs text-[var(--moss)]">
            Orientativo. PyMEBot no sustituye a tu contador.
          </p>
          <div className="mt-4 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--amber)]">
                Guardados
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {tenant.taxReminders.length === 0 && (
                  <li className="text-[var(--moss)]">Sin recordatorios en DB. Re-seed.</li>
                )}
                {tenant.taxReminders.map((r) => (
                  <li key={r.id} className="border-t border-[var(--line)] pt-2">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-[var(--moss)]">
                      {new Date(r.dueDate).toLocaleDateString(isBR ? 'pt-BR' : 'es-MX')} · {r.status}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--amber)]">
                Calendario calculado
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {upcoming.map((u) => (
                  <li key={u.code} className="border-t border-[var(--line)] pt-2">
                    <p className="font-medium">
                      {u.title} <span className="font-mono text-xs">({u.code})</span>
                    </p>
                    <p className="text-[var(--moss)]">
                      {new Date(u.dueDate).toLocaleDateString(isBR ? 'pt-BR' : 'es-MX')} · en{' '}
                      {u.daysUntil} día(s)
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
