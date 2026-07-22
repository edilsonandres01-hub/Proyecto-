'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

type Msg = { id: string; role: 'user' | 'assistant'; content: string; agent?: string };

const TENANTS = [
  {
    id: 'tenant_demo_mx',
    label: 'MX — Abarrotes Sol',
    welcome:
      'Hola. Soy el asistente de Abarrotes Sol. Puedo consultar inventario, crear pedidos, generar cobro, recordatorios fiscales y borradores (sandbox). ¿Qué necesitas?',
  },
  {
    id: 'tenant_demo_br',
    label: 'BR — Mercadinho Aurora',
    welcome:
      'Olá! Sou o assistente do Mercadinho Aurora. Posso consultar estoque, criar pedidos, gerar Pix, lembretes fiscais e rascunhos (sandbox). O que precisa?',
  },
] as const;

const SUGGESTIONS_MX = [
  '¿Cuánto tengo de Coca-Cola 600ml?',
  'lista de inventario',
  'stock bajo',
  'vende 2 Coca-Cola 600ml',
  'cobrar con SPEI',
  'facturar pedido',
  '¿qué obligaciones fiscales tengo?',
];

const SUGGESTIONS_BR = [
  'tem Coca 2L?',
  'lista de estoque',
  'estoque baixo',
  'vende 2 Coca-Cola 2L',
  'cobrar com Pix',
  'faturar pedido',
  'quais obrigações fiscais tenho?',
];

export default function SimClient() {
  const search = useSearchParams();
  const initialTenant = search.get('tenantId') || 'tenant_demo_mx';
  const [tenantId, setTenantId] = useState(initialTenant);
  const tenantMeta = useMemo(
    () => TENANTS.find((t) => t.id === tenantId) || TENANTS[0],
    [tenantId],
  );
  const isBR = tenantId === 'tenant_demo_br';

  const [messages, setMessages] = useState<Msg[]>([
    { id: 'welcome', role: 'assistant', agent: 'support', content: tenantMeta.welcome },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  function switchTenant(id: string) {
    setTenantId(id);
    setLastOrderId(undefined);
    const meta = TENANTS.find((t) => t.id === id) || TENANTS[0];
    setMessages([
      { id: crypto.randomUUID(), role: 'assistant', agent: 'support', content: meta.welcome },
    ]);
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setInput('');
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'user', content: trimmed }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, tenantId, lastOrderId }),
      });
      const data = await res.json();
      if (data.orderId) setLastOrderId(data.orderId);
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          agent: data.agent,
          content: data.reply || data.error || 'Sin respuesta',
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: isBR ? 'Erro de rede. Tente de novo.' : 'Error de red. Intenta de nuevo.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  const suggestions = isBR ? SUGGESTIONS_BR : SUGGESTIONS_MX;

  return (
    <main className="flex min-h-screen flex-col bg-[#0b1410] text-[var(--sand)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 md:px-6">
        <div>
          <Link href="/" className="display text-xl text-[var(--lime)]">
            PyMEBot
          </Link>
          <p className="text-xs text-white/60">Simulador WhatsApp · {tenantId}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={tenantId}
            onChange={(e) => switchTenant(e.target.value)}
            className="rounded-full border border-white/20 bg-[#152019] px-3 py-2 text-sm"
          >
            {TENANTS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <Link
            href={`/portal?tenantId=${tenantId}`}
            className="rounded-full border border-white/20 px-4 py-2 text-sm"
          >
            Portal
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-3 py-4">
        <div className="flex-1 space-y-3 overflow-y-auto pb-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-br-md bg-[var(--leaf)] text-white'
                      : 'rounded-bl-md bg-[#1a2a22] text-[var(--sand)]'
                  }`}
                >
                  {msg.agent && msg.role === 'assistant' && (
                    <p className="mb-1 text-[10px] uppercase tracking-wider text-[var(--lime)]/80">
                      {msg.agent}
                    </p>
                  )}
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {busy && <p className="text-xs text-white/50">{isBR ? 'Digitando…' : 'Escribiendo…'}</p>}
          <div ref={bottomRef} />
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void send(s)}
              className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 hover:border-[var(--lime)]/50"
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex gap-2 pb-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isBR ? 'Digite uma mensagem…' : 'Escribe un mensaje…'}
            className="flex-1 rounded-full border border-white/15 bg-[#152019] px-4 py-3 text-sm outline-none ring-[var(--lime)] focus:ring-1"
          />
          <button
            type="submit"
            className="rounded-full bg-[var(--lime)] px-5 py-3 text-sm font-semibold text-[var(--ink)]"
          >
            Enviar
          </button>
        </form>
        <p className="pb-4 text-center text-[10px] text-white/40">
          Sandbox: no sustituye contador. Pagos y CFDI/NFC-e son mocks.
        </p>
      </div>
    </main>
  );
}
