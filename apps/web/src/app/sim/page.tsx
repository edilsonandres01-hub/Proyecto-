'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Msg = { id: string; role: 'user' | 'assistant'; content: string; agent?: string };

const SUGGESTIONS = [
  '¿Cuánto tengo de Coca-Cola 600ml?',
  'lista de inventario',
  'vende 2 Coca-Cola 600ml',
  'cobrar con SPEI',
  'facturar pedido',
];

export default function SimPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'welcome',
      role: 'assistant',
      agent: 'support',
      content:
        'Hola. Soy el asistente de Abarrotes Sol. Puedo consultar inventario, crear pedidos, generar cobro y preparar borradores fiscales (sandbox). ¿Qué necesitas?',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setInput('');
    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: trimmed };
    setMessages((m) => [...m, userMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          tenantId: 'tenant_demo_mx',
          lastOrderId,
        }),
      });
      const data = await res.json();
      if (data.orderId) setLastOrderId(data.orderId);
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          agent: data.agent,
          content: data.reply,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Error de red. Intenta de nuevo.',
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

  return (
    <main className="flex min-h-screen flex-col bg-[#0b1410] text-[var(--sand)]">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-4 md:px-6">
        <div>
          <Link href="/" className="display text-xl text-[var(--lime)]">
            PyMEBot
          </Link>
          <p className="text-xs text-white/60">Simulador WhatsApp · tenant_demo_mx</p>
        </div>
        <Link href="/portal" className="rounded-full border border-white/20 px-4 py-2 text-sm">
          Portal
        </Link>
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
          {busy && <p className="text-xs text-white/50">Escribiendo…</p>}
          <div ref={bottomRef} />
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
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
            placeholder="Escribe un mensaje…"
            className="flex-1 rounded-full border border-white/15 bg-[#152019] px-4 py-3 text-sm outline-none ring-[var(--lime)] focus:ring-1"
          />
          <button type="submit" className="rounded-full bg-[var(--lime)] px-5 py-3 text-sm font-semibold text-[var(--ink)]">
            Enviar
          </button>
        </form>
        <p className="pb-4 text-center text-[10px] text-white/40">
          Sandbox: no sustituye contador. Pagos y CFDI son mocks con interfaces productivas.
        </p>
      </div>
    </main>
  );
}
