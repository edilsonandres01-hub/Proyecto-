'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState, useTransition } from 'react';
import type { FeatureFlags } from '@pymebot/core';
import { ImportCsvForm } from '@/components/ImportCsvForm';

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
type Subscription = {
  id: string;
  plan: string;
  status: string;
  amountCents: number;
  currency: string;
  currentPeriodEnd: string | null;
} | null;

type Analytics = {
  ordersCount: number;
  revenueCents: number;
  paymentsCount: number;
  invoicesCount: number;
  lowStockCount: number;
  topProducts: { name: string; qty: number }[];
  revenueByDay: { day: string; cents: number }[];
};

type ReferralRow = {
  id: string;
  code: string;
  invitedEmail: string | null;
  status: string;
  createdAt: string;
};

type NotificationItem = {
  type: string;
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'critical';
};

type WebhookEventRow = {
  id: string;
  provider: string;
  intentId: string | null;
  paymentId: string | null;
  status: string;
  createdAt: string;
};

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
    subscription: Subscription;
  };
  tenants: TenantOption[];
  upcoming: { code: string; title: string; dueDate: string; daysUntil: number }[];
  flags: FeatureFlags;
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'es-MX', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function PortalClient({ tenant, tenants, upcoming, flags }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEventRow[]>([]);
  const [acceptCode, setAcceptCode] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    'all' | 'confirmed' | 'paid' | 'invoiced' | 'cancelled'
  >('all');

  const isBR = tenant.country === 'BR';
  const defaultRail = isBR ? 'pix' : 'spei';
  const sub = tenant.subscription;
  const currency = isBR ? 'BRL' : 'MXN';

  const productFilter = productQuery.trim().toLowerCase();
  const filteredProducts = productFilter
    ? tenant.products.filter(
        (p) =>
          p.name.toLowerCase().includes(productFilter) ||
          p.sku.toLowerCase().includes(productFilter),
      )
    : tenant.products;

  const filteredOrders =
    orderStatusFilter === 'all'
      ? tenant.orders
      : tenant.orders.filter((o) => o.status === orderStatusFilter);

  function refresh() {
    startTransition(() => router.refresh());
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (flags.analytics) {
        const res = await fetch(`/api/analytics?tenantId=${tenant.id}`);
        if (!cancelled && res.ok) {
          setAnalytics((await res.json()) as Analytics);
        }
      } else {
        setAnalytics(null);
      }

      if (flags.referrals) {
        const res = await fetch(`/api/referrals?tenantId=${tenant.id}`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          setReferrals((data.referrals as ReferralRow[]) ?? []);
        }
      } else {
        setReferrals([]);
      }

      if (flags.notifications) {
        const res = await fetch(`/api/notifications?tenantId=${tenant.id}`);
        if (!cancelled && res.ok) {
          setNotifications((await res.json()) as NotificationItem[]);
        }
      } else {
        setNotifications([]);
      }

      if (flags.webhooks) {
        const res = await fetch(`/api/webhooks/events?tenantId=${tenant.id}`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          setWebhookEvents((data.events as WebhookEventRow[]) ?? []);
        }
      } else {
        setWebhookEvents([]);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tenant.id, flags.analytics, flags.referrals, flags.notifications, flags.webhooks]);

  async function billingAction(action: 'subscribe' | 'cancel', plan?: 'starter' | 'growth') {
    setMsg(null);
    const res = await fetch('/api/billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: tenant.id, action, plan }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || 'Error de billing');
      return;
    }
    setMsg(
      action === 'cancel'
        ? 'Suscripción cancelada'
        : `Plan ${data.subscription?.plan} activo`,
    );
    refresh();
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

  async function confirmPayment(paymentId: string) {
    const res = await fetch('/api/payments/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: tenant.id, paymentId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || 'No se pudo confirmar el pago');
      return;
    }
    setMsg(`Pago confirmado (${data.payment?.status})`);
    refresh();
    if (flags.analytics) {
      const aRes = await fetch(`/api/analytics?tenantId=${tenant.id}`);
      if (aRes.ok) setAnalytics((await aRes.json()) as Analytics);
    }
  }

  async function createReferral() {
    setMsg(null);
    const res = await fetch('/api/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: tenant.id, action: 'create' }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || 'No se pudo generar el código');
      return;
    }
    setMsg(`Código generado: ${data.referral?.code}`);
    const listRes = await fetch(`/api/referrals?tenantId=${tenant.id}`);
    if (listRes.ok) {
      const listData = await listRes.json();
      setReferrals((listData.referrals as ReferralRow[]) ?? []);
    }
  }

  async function acceptReferral(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: tenant.id,
        action: 'accept',
        code: acceptCode.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || 'Código inválido');
      return;
    }
    setAcceptCode('');
    setMsg(`Código ${data.referral?.code} aceptado`);
    const listRes = await fetch(`/api/referrals?tenantId=${tenant.id}`);
    if (listRes.ok) {
      const listData = await listRes.json();
      setReferrals((listData.referrals as ReferralRow[]) ?? []);
    }
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
            {flags.accountantPortal && (
              <Link href="/accountant" className="btn-ghost">
                Contador
              </Link>
            )}
            <Link href="/docs" className="btn-ghost">
              API
            </Link>
            <Link href="/ops" className="btn-ghost">
              Ops
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

        {flags.notifications && (
          <section>
            <h2 className="display border-b border-[var(--line)] pb-3 text-2xl">Alertas</h2>
            <p className="mt-2 text-xs text-[var(--moss)]">
              Stock bajo y obligaciones fiscales en los próximos 7 días.
            </p>
            <ul className="mt-4 space-y-2">
              {notifications.length === 0 && (
                <li className="text-sm text-[var(--moss)]">Sin alertas por ahora.</li>
              )}
              {notifications.slice(0, 5).map((n, i) => (
                <li
                  key={`${n.type}-${n.title}-${i}`}
                  className="border-t border-[var(--line)] pt-3 text-sm"
                >
                  <p className="font-medium">
                    <span
                      className={
                        n.severity === 'critical'
                          ? 'text-[var(--coral)]'
                          : n.severity === 'warning'
                            ? 'text-[var(--amber)]'
                            : 'text-[var(--moss)]'
                      }
                    >
                      {n.severity}
                    </span>
                    {' · '}
                    {n.title}
                  </p>
                  <p className="text-[var(--moss)]">{n.body}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {flags.analytics && (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] pb-3">
              <h2 className="display text-2xl">Analytics</h2>
              <a
                href={`/api/analytics/export?tenantId=${tenant.id}`}
                className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
              >
                Exportar CSV
              </a>
            </div>
            <p className="mt-2 text-xs text-[var(--moss)]">KPIs del tenant · últimos 7 días en ingresos.</p>
            {!analytics && <p className="mt-4 text-sm text-[var(--moss)]">Cargando…</p>}
            {analytics && (
              <>
                <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {[
                    { label: 'Pedidos', value: String(analytics.ordersCount) },
                    { label: 'Ingresos', value: money(analytics.revenueCents, currency) },
                    { label: 'Pagos', value: String(analytics.paymentsCount) },
                    { label: 'Facturas', value: String(analytics.invoicesCount) },
                    { label: 'Stock bajo', value: String(analytics.lowStockCount) },
                  ].map((kpi) => (
                    <div key={kpi.label} className="border-t border-[var(--line)] pt-3">
                      <dt className="text-xs uppercase tracking-wider text-[var(--moss)]">{kpi.label}</dt>
                      <dd className="mt-1 text-lg font-semibold">{kpi.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-8 grid gap-8 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--amber)]">
                      Top productos
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm">
                      {analytics.topProducts.length === 0 && (
                        <li className="text-[var(--moss)]">Sin ventas aún.</li>
                      )}
                      {analytics.topProducts.map((p) => (
                        <li key={p.name} className="flex justify-between border-t border-[var(--line)] pt-2">
                          <span>{p.name}</span>
                          <span className="font-mono text-xs">{p.qty}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--amber)]">
                      Ingresos por día
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm">
                      {analytics.revenueByDay.map((d) => (
                        <li key={d.day} className="flex justify-between border-t border-[var(--line)] pt-2">
                          <span className="font-mono text-xs">{d.day}</span>
                          <span>{money(d.cents, currency)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-3">
            <h2 className="display text-2xl">Inventario</h2>
            <span className="text-sm text-[var(--moss)]">
              {filteredProducts.length}
              {productFilter ? ` / ${tenant.products.length}` : ''} SKUs
            </span>
          </div>

          <div className="mt-4">
            <label className="block text-xs uppercase tracking-wider text-[var(--moss)]">
              Filtrar por nombre o SKU
              <input
                type="search"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Coca, SKU-001…"
                className="mt-1 w-full max-w-md rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)]"
              />
            </label>
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

          {flags.csvImport && (
            <ImportCsvForm
              tenantId={tenant.id}
              onDone={(message) => {
                setMsg(message);
                refresh();
              }}
            />
          )}

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
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-[var(--moss)]">
                      Ningún producto coincide con el filtro.
                    </td>
                  </tr>
                )}
                {filteredProducts.map((p) => (
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
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-3">
            <h2 className="display text-2xl">Pedidos</h2>
            <label className="text-sm text-[var(--moss)]">
              Status{' '}
              <select
                className="ml-1 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)]"
                value={orderStatusFilter}
                onChange={(e) =>
                  setOrderStatusFilter(
                    e.target.value as 'all' | 'confirmed' | 'paid' | 'invoiced' | 'cancelled',
                  )
                }
              >
                <option value="all">all</option>
                <option value="confirmed">confirmed</option>
                <option value="paid">paid</option>
                <option value="invoiced">invoiced</option>
                <option value="cancelled">cancelled</option>
              </select>
            </label>
          </div>
          <ul className="mt-4 divide-y divide-[var(--line)]">
            {tenant.orders.length === 0 && (
              <li className="py-4 text-[var(--moss)]">Aún no hay pedidos. Usa el simulador o crea ventas.</li>
            )}
            {tenant.orders.length > 0 && filteredOrders.length === 0 && (
              <li className="py-4 text-[var(--moss)]">Ningún pedido con status «{orderStatusFilter}».</li>
            )}
            {filteredOrders.map((o) => (
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
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                  <span>
                    {p.rail.toUpperCase()} · {p.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{money(p.amountCents, p.currency)}</span>
                    {p.status !== 'paid' && (
                      <button
                        type="button"
                        className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
                        onClick={() => confirmPayment(p.id)}
                      >
                        Confirmar
                      </button>
                    )}
                  </div>
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

        {flags.billing && (
          <section>
            <h2 className="display border-b border-[var(--line)] pb-3 text-2xl">Billing (sandbox)</h2>
            <p className="mt-2 text-xs text-[var(--moss)]">
              Simulación de suscripción. No se cobra nada real.
            </p>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div className="text-sm">
                <p>
                  Plan:{' '}
                  <span className="font-semibold uppercase tracking-wide">
                    {sub?.plan ?? 'ninguno'}
                  </span>
                </p>
                <p className="mt-1 text-[var(--moss)]">
                  Status: {sub?.status ?? '—'}
                  {sub?.amountCents != null && (
                    <>
                      {' '}
                      · {money(sub.amountCents, sub.currency)}
                    </>
                  )}
                </p>
                {sub?.currentPeriodEnd && (
                  <p className="mt-1 text-[var(--moss)]">
                    Periodo hasta{' '}
                    {new Date(sub.currentPeriodEnd).toLocaleDateString(isBR ? 'pt-BR' : 'es-MX')}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full bg-[var(--ink)] px-4 py-2 text-xs text-[var(--lime)]"
                  onClick={() => billingAction('subscribe', 'starter')}
                >
                  Subscribe Starter
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-xs"
                  onClick={() => billingAction('subscribe', 'growth')}
                >
                  Subscribe Growth
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[var(--coral)]/40 px-4 py-2 text-xs text-[var(--coral)]"
                  onClick={() => billingAction('cancel')}
                  disabled={!sub || sub.status === 'canceled'}
                >
                  Cancel
                </button>
              </div>
            </div>
          </section>
        )}

        {flags.referrals && (
          <section>
            <h2 className="display border-b border-[var(--line)] pb-3 text-2xl">Referidos (sandbox)</h2>
            <p className="mt-2 text-xs text-[var(--moss)]">
              Programa de referidos. Genera códigos o acepta uno pendiente.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-primary px-4 py-2 text-sm"
                onClick={() => void createReferral()}
              >
                Generar código
              </button>
              <form onSubmit={acceptReferral} className="flex flex-wrap gap-2">
                <input
                  value={acceptCode}
                  onChange={(e) => setAcceptCode(e.target.value)}
                  placeholder="Código a aceptar"
                  className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm uppercase"
                  required
                />
                <button type="submit" className="rounded-full border border-[var(--line)] px-4 py-2 text-xs">
                  Aceptar código
                </button>
              </form>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {referrals.length === 0 && <li className="text-[var(--moss)]">Sin códigos aún.</li>}
              {referrals.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap justify-between gap-2 border-t border-[var(--line)] pt-2"
                >
                  <span className="font-mono font-medium">{r.code}</span>
                  <span className="text-[var(--moss)]">
                    {r.status}
                    {r.invitedEmail ? ` · ${r.invitedEmail}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {flags.webhooks && (
          <section>
            <h2 className="display border-b border-[var(--line)] pb-3 text-2xl">Webhooks recientes</h2>
            <p className="mt-2 text-sm text-[var(--moss)]">
              Endpoint sandbox: <code className="text-xs">POST /api/webhooks/payments</code>
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {webhookEvents.length === 0 && (
                <li className="text-[var(--moss)]">Sin eventos aún.</li>
              )}
              {webhookEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="flex flex-wrap justify-between gap-2 border-t border-[var(--line)] pt-2"
                >
                  <span>
                    <span className="font-medium uppercase tracking-wide">{ev.provider}</span>
                    {' · '}
                    {ev.status}
                    {ev.intentId ? (
                      <span className="ml-1 font-mono text-xs text-[var(--moss)]">{ev.intentId}</span>
                    ) : null}
                  </span>
                  <span className="text-xs text-[var(--moss)]">
                    {new Date(ev.createdAt).toLocaleString(isBR ? 'pt-BR' : 'es-MX')}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

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
