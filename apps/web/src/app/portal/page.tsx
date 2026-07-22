import { getUpcomingObligations, resolveFeatureFlags } from '@pymebot/core';
import { PortalClient } from '@/components/PortalClient';
import { DEMO_TENANTS, getTenantById, listDemoTenants } from '@/lib/tenant';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Props = { searchParams?: Promise<{ tenantId?: string }> };

export default async function PortalPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const tenantId = params.tenantId || DEMO_TENANTS.MX;
  const [tenant, tenants] = await Promise.all([getTenantById(tenantId), listDemoTenants()]);

  if (!tenant) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20">
        <h1 className="display text-3xl">Portal</h1>
        <p className="mt-4 text-[var(--moss)]">
          Tenant no encontrado. Ejecuta <code>npm run db:push && npm run db:seed</code>.
        </p>
        <Link href="/" className="btn-primary mt-8 inline-flex">
          Volver
        </Link>
      </main>
    );
  }

  const country = tenant.country === 'BR' ? 'BR' : 'MX';
  const upcoming = getUpcomingObligations(country, new Date()).map((o) => ({
    code: o.code,
    title: o.title,
    dueDate: o.dueDate.toISOString(),
    daysUntil: o.daysUntil,
  }));

  const flags = resolveFeatureFlags();

  return (
    <PortalClient
      tenant={{
        id: tenant.id,
        name: tenant.name,
        country: tenant.country,
        products: tenant.products,
        orders: tenant.orders,
        payments: tenant.payments,
        invoices: tenant.invoices,
        taxReminders: tenant.taxReminders.map((r) => ({
          ...r,
          dueDate: r.dueDate.toISOString(),
        })),
        subscription: tenant.subscription
          ? {
              id: tenant.subscription.id,
              plan: tenant.subscription.plan,
              status: tenant.subscription.status,
              amountCents: tenant.subscription.amountCents,
              currency: tenant.subscription.currency,
              currentPeriodEnd: tenant.subscription.currentPeriodEnd
                ? tenant.subscription.currentPeriodEnd.toISOString()
                : null,
            }
          : null,
      }}
      tenants={tenants}
      upcoming={upcoming}
      flags={flags}
    />
  );
}
