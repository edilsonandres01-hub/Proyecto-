import Link from 'next/link';
import { getOpsHealth } from '@/lib/opsHealth';

export const dynamic = 'force-dynamic';

export default async function OpsHealthPage() {
  const health = await getOpsHealth();

  return (
    <main className="min-h-screen bg-[var(--mist)]">
      <header className="border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div>
            <Link href="/" className="display text-xl font-semibold">
              PyMEBot
            </Link>
            <p className="text-sm text-[var(--moss)]">Lead Ops · health (sandbox)</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/portal" className="btn-ghost">
              Portal
            </Link>
            <Link href="/api/ops/health" className="btn-ghost">
              JSON
            </Link>
            <Link href="/" className="btn-primary">
              Inicio
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-12 px-5 py-10 md:px-8">
        <section>
          <h1 className="display text-4xl">Ops health</h1>
          <p className="mt-2 max-w-2xl text-[var(--moss)]">
            {health.note}
          </p>
          <p className="mt-2 text-xs uppercase tracking-wider text-[var(--amber)]">
            Sandbox · no auth
          </p>
        </section>

        <section>
          <h2 className="display border-b border-[var(--line)] pb-3 text-2xl">Build</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ['Service', health.build.service],
                ['Version', health.build.version],
                ['Node env', health.build.nodeEnv],
                ['Git SHA', health.build.gitSha],
                ['Timestamp', health.build.timestamp],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="border-t border-[var(--line)] pt-3">
                <dt className="text-xs uppercase tracking-wider text-[var(--moss)]">{label}</dt>
                <dd className="mt-1 break-all font-mono text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="display border-b border-[var(--line)] pb-3 text-2xl">Counts</h2>
          <dl className="mt-4 grid grid-cols-3 gap-4">
            {(
              [
                ['Tenants', health.counts.tenants],
                ['Orders', health.counts.orders],
                ['Payments', health.counts.payments],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="border-t border-[var(--line)] pt-3">
                <dt className="text-xs uppercase tracking-wider text-[var(--moss)]">{label}</dt>
                <dd className="mt-1 text-2xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="display border-b border-[var(--line)] pb-3 text-2xl">Feature flags</h2>
          <p className="mt-2 text-xs text-[var(--moss)]">Dump from getFeatureFlags()</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(health.flags).map(([key, on]) => (
              <li
                key={key}
                className="flex items-center justify-between border-t border-[var(--line)] pt-2 text-sm"
              >
                <span className="font-mono text-xs">{key}</span>
                <span className={on ? 'text-[var(--leaf)]' : 'text-[var(--coral)]'}>
                  {on ? 'on' : 'off'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="display border-b border-[var(--line)] pb-3 text-2xl">Audit docs</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                className="text-[var(--leaf)] underline-offset-2 hover:underline"
                href="https://github.com/edilsonandres01-hub/proyecto-/blob/cursor/pyme-bot-engineering-playbook-9ff6/docs/AUDIT-REPORT.md"
                target="_blank"
                rel="noreferrer"
              >
                {health.auditDocs.report}
              </a>
            </li>
            <li>
              <a
                className="text-[var(--leaf)] underline-offset-2 hover:underline"
                href="https://github.com/edilsonandres01-hub/proyecto-/blob/cursor/pyme-bot-engineering-playbook-9ff6/docs/AUDIT-BASELINE.md"
                target="_blank"
                rel="noreferrer"
              >
                {health.auditDocs.baseline}
              </a>
            </li>
            <li>
              <a
                className="text-[var(--leaf)] underline-offset-2 hover:underline"
                href="https://github.com/edilsonandres01-hub/proyecto-/blob/cursor/pyme-bot-engineering-playbook-9ff6/docs/LEAD-AUTHORIZATION-LOG.md"
                target="_blank"
                rel="noreferrer"
              >
                {health.auditDocs.authorizationLog}
              </a>
            </li>
            <li className="pt-2 text-[var(--moss)]">
              Also: <Link href="/docs" className="underline-offset-2 hover:underline">API docs</Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
