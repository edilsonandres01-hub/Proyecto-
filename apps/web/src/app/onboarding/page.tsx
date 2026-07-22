'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function OnboardingPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [country, setCountry] = useState<'MX' | 'BR'>('MX');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, country, phone, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo crear la cuenta');
        return;
      }
      router.push(`/portal?tenantId=${data.tenant.id}`);
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--mist)]">
      <header className="border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto flex max-w-xl items-center justify-between px-5 py-5 md:px-8">
          <Link href="/" className="display text-xl font-semibold">
            PyMEBot
          </Link>
          <Link href="/portal" className="btn-ghost">
            Portal
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-5 py-12 md:px-8">
        <h1 className="display text-4xl">Crear cuenta demo</h1>
        <p className="mt-3 text-[var(--moss)]">
          Self-serve sandbox: tenant, usuario, trial Starter y un producto de ejemplo.
        </p>

        <form onSubmit={onSubmit} className="mt-8 grid gap-4">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Nombre del negocio</span>
            <input
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="rounded-lg border border-[var(--line)] bg-white px-3 py-2"
              placeholder="Abarrotes Sol"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">País</span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value === 'BR' ? 'BR' : 'MX')}
              className="rounded-lg border border-[var(--line)] bg-white px-3 py-2"
            >
              <option value="MX">México (MX)</option>
              <option value="BR">Brasil (BR)</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Teléfono</span>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-lg border border-[var(--line)] bg-white px-3 py-2"
              placeholder={country === 'BR' ? '+5511987654321' : '+525512345678'}
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-[var(--line)] bg-white px-3 py-2"
              placeholder="dueno@negocio.mx"
            />
          </label>

          {error && <p className="text-sm font-medium text-[var(--coral)]">{error}</p>}

          <button type="submit" className="btn-primary mt-2" disabled={submitting}>
            {submitting ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </main>
  );
}
