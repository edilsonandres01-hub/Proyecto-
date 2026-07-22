import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PyMEBot — Documentación API',
  description: 'Cómo llamar la API pública de plataforma PyMEBot con curl.',
};

const DEMO_KEY = 'pymebot_demo_key';
const DEMO_TENANT = 'tenant_demo_mx';

export default function ApiDocsPage() {
  return (
    <main className="atmosphere min-h-screen">
      <div className="grid-noise absolute inset-0 pointer-events-none opacity-70" />

      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-5 py-6 md:px-8">
        <Link href="/" className="display text-2xl font-semibold tracking-tight text-[var(--ink)]">
          PyMEBot
        </Link>
        <Link href="/api/v1/openapi" className="btn-ghost text-sm">
          OpenAPI JSON
        </Link>
      </header>

      <article className="relative z-10 mx-auto max-w-3xl px-5 pb-20 md:px-8">
        <h1 className="display text-4xl text-[var(--ink)] md:text-5xl">API pública</h1>
        <p className="mt-4 text-lg leading-relaxed text-[var(--moss)]">
          Endpoints de plataforma (sandbox) para productos, pedidos, pagos y facturas. Autenticación
          con el header <code className="font-mono text-sm">X-Api-Key</code>.
        </p>

        <section className="mt-12">
          <h2 className="display text-2xl text-[var(--ink)]">Autenticación</h2>
          <p className="mt-3 text-[var(--moss)]">
            Envía la clave en cada request. Demo:{' '}
            <code className="font-mono text-sm text-[var(--ink)]">{DEMO_KEY}</code>. En producción
            usa la variable de entorno <code className="font-mono text-sm">PYMEBOT_API_KEY</code>.
          </p>
          <p className="mt-2 text-sm text-[var(--moss)]">
            Tenant por defecto: <code className="font-mono">{DEMO_TENANT}</code>.
          </p>
        </section>

        <section className="mt-12 space-y-10">
          <Endpoint
            title="Listar productos"
            method="GET"
            path="/api/v1/products"
            curl={`curl -s \\
  -H "X-Api-Key: ${DEMO_KEY}" \\
  "http://localhost:3000/api/v1/products?tenantId=${DEMO_TENANT}"`}
          />

          <Endpoint
            title="Crear producto"
            method="POST"
            path="/api/v1/products"
            curl={`curl -s -X POST \\
  -H "X-Api-Key: ${DEMO_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"tenantId":"${DEMO_TENANT}","sku":"ACE-001","name":"Aceite 1L","priceCents":4500,"stockQty":20,"currency":"MXN"}' \\
  "http://localhost:3000/api/v1/products"`}
          />

          <Endpoint
            title="Listar pedidos"
            method="GET"
            path="/api/v1/orders"
            curl={`curl -s \\
  -H "X-Api-Key: ${DEMO_KEY}" \\
  "http://localhost:3000/api/v1/orders?tenantId=${DEMO_TENANT}"`}
          />

          <Endpoint
            title="Crear pago"
            method="POST"
            path="/api/v1/payments"
            curl={`curl -s -X POST \\
  -H "X-Api-Key: ${DEMO_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"tenantId":"${DEMO_TENANT}","orderId":"ORD_ID","rail":"spei"}' \\
  "http://localhost:3000/api/v1/payments"`}
          />

          <Endpoint
            title="Emitir borrador de factura"
            method="POST"
            path="/api/v1/invoices"
            curl={`curl -s -X POST \\
  -H "X-Api-Key: ${DEMO_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"tenantId":"${DEMO_TENANT}","orderId":"ORD_ID"}' \\
  "http://localhost:3000/api/v1/invoices"`}
          />
        </section>

        <p className="mt-14 text-sm text-[var(--moss)]">
          Spec OpenAPI 3.0:{' '}
          <Link href="/api/v1/openapi" className="underline underline-offset-2">
            /api/v1/openapi
          </Link>
          . Los borradores fiscales son sandbox y no constituyen CFDI/NFC-e oficial.
        </p>
      </article>
    </main>
  );
}

function Endpoint({
  title,
  method,
  path,
  curl,
}: {
  title: string;
  method: string;
  path: string;
  curl: string;
}) {
  return (
    <div>
      <h2 className="display text-xl text-[var(--ink)]">{title}</h2>
      <p className="mt-1 font-mono text-sm text-[var(--moss)]">
        <span className="font-semibold text-[var(--ink)]">{method}</span> {path}
      </p>
      <pre className="mt-3 overflow-x-auto bg-[var(--ink)]/95 px-4 py-3 font-mono text-xs leading-relaxed text-[var(--lime)]">
        {curl}
      </pre>
    </div>
  );
}
