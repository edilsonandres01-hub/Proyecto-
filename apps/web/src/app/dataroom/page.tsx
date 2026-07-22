import Link from 'next/link';
import { getDataroomMetrics } from '@/lib/dataroomMetrics';

export const dynamic = 'force-dynamic';

function moneyMxn(cents: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(cents / 100);
}

export default async function DataroomPage() {
  const metrics = await getDataroomMetrics();

  const kpis: { label: string; value: string; hint: string }[] = [
    {
      label: 'Active tenants',
      value: String(metrics.activeTenants),
      hint: 'Tenants seeded / onboarded',
    },
    {
      label: 'Orders total',
      value: String(metrics.ordersTotal),
      hint: 'All statuses',
    },
    {
      label: 'Payment GMV',
      value: moneyMxn(metrics.paymentGmvCents),
      hint: 'Paid payments (cents → MXN display)',
    },
    {
      label: 'Invoices total',
      value: String(metrics.invoicesTotal),
      hint: 'Issued drafts / stubs',
    },
    {
      label: 'NPS average',
      value: metrics.npsAverage === null ? '—' : metrics.npsAverage.toFixed(2),
      hint: '0–10 score mean',
    },
    {
      label: 'Paying subscriptions',
      value: String(metrics.payingSubscriptions),
      hint: "status = 'active'",
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--mist)]">
      <header className="border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div>
            <Link href="/" className="display text-xl font-semibold">
              PyMEBot
            </Link>
            <p className="text-sm text-[var(--moss)]">Data room · Lead / investor sandbox</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/api/dataroom/metrics" className="btn-ghost">
              JSON
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

      <div className="mx-auto max-w-6xl space-y-12 px-5 py-10 md:px-8">
        <section>
          <h1 className="display text-4xl">Fundraising metrics</h1>
          <p className="mt-2 max-w-2xl text-[var(--moss)]">
            Read-only KPIs for narrative diligence. Sandbox data — not production revenue.
          </p>
          <p className="mt-2 text-xs uppercase tracking-wider text-[var(--amber)]">
            Sandbox · no auth
          </p>
        </section>

        <section>
          <h2 className="display border-b border-[var(--line)] pb-3 text-2xl">KPIs</h2>
          <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="border-t border-[var(--line)] pt-4">
                <dt className="text-xs uppercase tracking-wider text-[var(--moss)]">{kpi.label}</dt>
                <dd className="mt-2 text-3xl font-semibold tracking-tight">{kpi.value}</dd>
                <p className="mt-1 text-xs text-[var(--moss)]">{kpi.hint}</p>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
