'use client';

import { FormEvent, useState } from 'react';

type Props = {
  tenantId: string;
  onDone: (message: string) => void;
};

export function ImportCsvForm({ tenantId, onDone }: Props) {
  const [csvText, setCsvText] = useState('sku,name,price,stock\nACE-001,Aceite 1L,45.00,20');
  const [busy, setBusy] = useState(false);

  async function importJson(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, csv: csvText }),
      });
      const data = (await res.json()) as {
        error?: string;
        imported?: number;
        created?: number;
        updated?: number;
      };
      if (!res.ok) {
        onDone(data.error || 'Error al importar CSV');
        return;
      }
      onDone(
        `Importados ${data.imported} SKUs (${data.created} nuevos, ${data.updated} actualizados)`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function importFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.set('tenantId', tenantId);
      form.set('file', file);
      const res = await fetch('/api/products/import', { method: 'POST', body: form });
      const data = (await res.json()) as {
        error?: string;
        imported?: number;
        created?: number;
        updated?: number;
      };
      if (!res.ok) {
        onDone(data.error || 'Error al importar archivo');
        return;
      }
      onDone(
        `Importados ${data.imported} SKUs (${data.created} nuevos, ${data.updated} actualizados)`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={importJson} className="mt-4 space-y-3">
      <p className="text-xs text-[var(--moss)]">
        CSV: <code className="font-mono">sku,name,price,stock</code> — precio en unidades mayores
        (ej. 18.50).
      </p>
      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 font-mono text-xs"
        spellCheck={false}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="btn-primary px-4 py-2 text-sm">
          {busy ? 'Importando…' : 'Importar CSV'}
        </button>
        <label className="cursor-pointer rounded-full border border-[var(--line)] px-3 py-2 text-xs">
          Subir archivo
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => importFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
    </form>
  );
}
