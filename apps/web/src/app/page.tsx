'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function HomePage() {
  return (
    <main className="atmosphere min-h-screen overflow-x-hidden">
      <div className="grid-noise absolute inset-0 pointer-events-none opacity-70" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6 md:px-8">
        <Link href="/" className="display text-2xl font-semibold tracking-tight text-[var(--ink)]">
          PyMEBot
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium">
          <Link href="/portal" className="btn-ghost hidden sm:inline-flex">
            Portal
          </Link>
          <Link href="/sim" className="btn-primary">
            Probar demo
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-5 pb-16 pt-10 md:px-8 md:pb-24">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          className="max-w-3xl"
        >
          <motion.p
            variants={fadeUp}
            className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--moss)]"
          >
            Latinoamérica · WhatsApp-first
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="display text-5xl leading-[0.95] text-[var(--ink)] sm:text-6xl md:text-7xl lg:text-8xl"
          >
            PyMEBot
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--moss)] md:text-xl"
          >
            El sistema operativo de tu negocio en el chat que ya usas: inventario, pedidos, cobros y
            borradores fiscales — sin hojas de cálculo.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-3">
            <Link href="/sim" className="btn-primary">
              Abrir simulador WhatsApp
            </Link>
            <Link href="/portal" className="btn-ghost">
              Ver portal merchant
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.9 }}
          className="pointer-events-none absolute inset-x-0 top-16 -z-10 mx-auto h-[55vh] max-w-6xl overflow-hidden rounded-none md:top-10"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(31,77,58,0.35),transparent_45%),linear-gradient(120deg,rgba(15,28,23,0.08),transparent)]" />
          <div className="absolute bottom-0 right-0 h-[70%] w-[70%] translate-x-[10%] translate-y-[15%] rounded-[40%_60%_55%_45%] bg-[var(--moss)]/25 blur-2xl" />
          <div className="absolute left-[8%] top-[20%] h-40 w-40 rounded-full bg-[var(--lime)]/50 blur-xl" />
        </motion.div>
      </section>

      <section className="section-pad relative z-10 border-t border-[var(--line)] bg-[var(--mist)]/70">
        <div className="mx-auto max-w-6xl">
          <h2 className="display text-3xl md:text-5xl">Una conversación. Todo el negocio.</h2>
          <p className="mt-4 max-w-2xl text-[var(--moss)]">
            Empieza por el dolor más agudo — cobrar y saber qué hay en stock — y expande a facturación
            y crédito con interfaces listas para PAC/PSP reales.
          </p>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {[
              {
                n: '01',
                t: 'Inventario en lenguaje natural',
                d: '“¿Cuánto tengo de Coca?” responde con stock real y confirma antes de mutar.',
              },
              {
                n: '02',
                t: 'Cobros SPEI, CoDi y Pix',
                d: 'Adapters mock hoy; mismos contratos para cablear STP y PSPs mañana.',
              },
              {
                n: '03',
                t: 'Borradores fiscales',
                d: 'CFDI/NFC-e simulados con disclaimer claro: no sustituimos a tu contador.',
              },
            ].map((item) => (
              <li key={item.n} className="border-t border-[var(--line)] pt-6">
                <p className="text-sm font-semibold tracking-widest text-[var(--amber)]">{item.n}</p>
                <h3 className="display mt-3 text-2xl">{item.t}</h3>
                <p className="mt-3 text-[var(--moss)]">{item.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-pad relative z-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="display text-3xl md:text-5xl">Precios pensados para micro-PyMEs</h2>
          <p className="mt-4 max-w-xl text-[var(--moss)]">
            Hipótesis de pricing del playbook. Empieza gratis en demo; escala cuando el flujo de caja
            lo pague.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="border-t-2 border-[var(--ink)] pt-6">
              <p className="text-sm font-semibold uppercase tracking-wider">Starter</p>
              <p className="display mt-2 text-4xl">$299 MXN<span className="text-lg">/mes</span></p>
              <p className="mt-3 text-[var(--moss)]">Inventario + pedidos + simulador de cobros.</p>
            </div>
            <div className="border-t-2 border-[var(--leaf)] pt-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-[var(--leaf)]">Crecimiento</p>
              <p className="display mt-2 text-4xl">$599 MXN<span className="text-lg">/mes</span></p>
              <p className="mt-3 text-[var(--moss)]">Pagos + borradores fiscales + portal contador.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-[var(--line)] px-5 py-10 text-sm text-[var(--moss)] md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="display text-lg text-[var(--ink)]">PyMEBot</p>
          <p>
            No sustituye asesoría fiscal. Integraciones reales Meta/PAC/SEFAZ requieren credenciales.
          </p>
        </div>
      </footer>
    </main>
  );
}
