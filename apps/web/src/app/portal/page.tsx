import Link from 'next/link';
import { getDemoTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'es-MX', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export default async function PortalPage() {
  const tenant = await getDemoTenant();

  if (!tenant) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20">
        <h1 className="display text-3xl">Portal</h1>
        <p className="mt-4 text-[var(--moss)]">
          Base de datos vacía. Ejecuta <code>npm run db:push && npm run db:seed</code>.
        </p>
        <Link href="/" className="btn-primary mt-8 inline-flex">
          Volver
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--mist)]">
      <header className="border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <div>
            <Link href="/" className="display text-xl font-semibold">
              PyMEBot
            </Link>
            <p className="text-sm text-[var(--moss)]">
              {tenant.name} · {tenant.country} · tenant {tenant.id}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/sim" className="btn-ghost">
              Simulador
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
            Vista operativa multi-tenant. Los datos están aislados por <code>tenantId</code>.
          </p>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-3">
            <h2 className="display text-2xl">Inventario</h2>
            <span className="text-sm text-[var(--moss)]">{tenant.products.length} SKUs</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[var(--moss)]">
                <tr>
                  <th className="py-2 font-medium">SKU</th>
                  <th className="py-2 font-medium">Producto</th>
                  <th className="py-2 font-medium">Stock</th>
                  <th className="py-2 font-medium">Precio</th>
                </tr>
              </thead>
              <tbody>
                {tenant.products.map((p) => (
                  <tr key={p.id} className="border-t border-[var(--line)]">
                    <td className="py-3 font-mono text-xs">{p.sku}</td>
                    <td className="py-3">{p.name}</td>
                    <td className="py-3">{p.stockQty}</td>
                    <td className="py-3">{money(p.priceCents, p.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="display border-b border-[var(--line)] pb-3 text-2xl">Pedidos recientes</h2>
          <ul className="mt-4 divide-y divide-[var(--line)]">
            {tenant.orders.length === 0 && (
              <li className="py-4 text-[var(--moss)]">Aún no hay pedidos. Créalos desde el simulador.</li>
            )}
            {tenant.orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium">{o.id}</p>
                  <p className="text-sm text-[var(--moss)]">
                    {o.items.map((i) => `${i.product.name}×${i.quantity}`).join(', ')}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold uppercase tracking-wide">{o.status}</p>
                  <p>{money(o.totalCents, o.currency)}</p>
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
            <p className="mt-2 text-xs text-[var(--moss)]">
              Borradores mock. No constituyen CFDI/NFC-e oficiales.
            </p>
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
      </div>
    </main>
  );
}
