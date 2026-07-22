'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

type TenantSummary = {
  id: string;
  name: string;
  country: string;
  ordersCount: number;
  revenueCents: number;
  invoiceCount: number;
};

function money(cents: number, country: string) {
  const currency = country === 'BR' ? 'BRL' : 'MXN';
  return new Intl.NumberFormat(country === 'BR' ? 'pt-BR' : 'es-MX', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export default function AccountantPage() {
  const [email, setEmail] = useState('contador@demo.mx');
  const [tenants, setTenants] = useState<TenantSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setTenants(null);
    try {
      const res = await fetch(`/api/accountant/overview?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 403 ? 'Acceso denegado para este email.' : data.error || 'Error');
        return;
      }
      setTenants(data.tenants as TenantSummary[]);
    } catch {
      setError('No se pudo cargar el overview');
    } finally {
      setLoading(false);
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
            <p className="text-sm text-[var(--moss)]">Portal contador · multi-tenant</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/portal" className="btn-ghost">
              Portal merchant
            </Link>
            <Link href="/" className="btn-primary">
              Inicio
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <h1 className="display text-4xl">Vista contador</h1>
        <p className="mt-2 max-w-2xl text-[var(--moss)]">
          Resumen de tenants demo. Usa <code className="text-sm">contador@demo.mx</code> o{' '}
          <code className="text-sm">contador@demo.br</code>.
        </p>

        <form onSubmit={load} className="mt-8 flex flex-wrap items-end gap-3">
          <label className="text-sm text-[var(--moss)]">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-72 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)]"
            />
          </label>
          <button type="submit" className="btn-primary px-5 py-2 text-sm" disabled={loading}>
            {loading ? 'Cargando…' : 'Cargar overview'}
          </button>
        </form>

        {error && <p className="mt-4 text-sm font-medium text-[var(--coral)]">{error}</p>}

        {tenants && (
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[var(--moss)]">
                <tr>
                  <th className="py-2 font-medium">Tenant</th>
                  <th className="py-2 font-medium">País</th>
                  <th className="py-2 font-medium">Pedidos</th>
                  <th className="py-2 font-medium">Ingresos</th>
                  <th className="py-2 font-medium">Facturas</th>
                  <th className="py-2 font-medium">Portal</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-t border-[var(--line)]">
                    <td className="py-3">
                      <p className="font-medium">{t.name}</p>
                      <p className="font-mono text-xs text-[var(--moss)]">{t.id}</p>
                    </td>
                    <td className="py-3">{t.country}</td>
                    <td className="py-3">{t.ordersCount}</td>
                    <td className="py-3">{money(t.revenueCents, t.country)}</td>
                    <td className="py-3">{t.invoiceCount}</td>
                    <td className="py-3">
                      <Link
                        href={`/portal?tenantId=${t.id}`}
                        className="rounded-full border border-[var(--line)] px-3 py-1 text-xs hover:bg-white"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
