# PyMEBot

Agente IA en WhatsApp para micro-PyMEs en Latinoamérica: inventario, pedidos, cobros (Pix/SPEI/CoDi) y facturación electrónica sandbox (SAT/SEFAZ).

## Demo rápida

```bash
npm install
cp packages/db/.env.example packages/db/.env
# packages/db/.env → DATABASE_URL="file:./dev.db"

cp apps/web/.env.example apps/web/.env
# apps/web/.env → DATABASE_URL="file:$(pwd)/packages/db/prisma/dev.db"

npm run db:generate
npm run db:push
npm run db:seed
npm run build
npm run start
# o: npm run dev
```

Abre:

- Landing: http://localhost:3000
- Portal merchant: http://localhost:3000/portal
- Simulador WhatsApp: http://localhost:3000/sim

Tenant demo: `tenant_demo_mx` (Abarrotes Sol)
## Monorepo

| Path | Package |
|------|---------|
| `apps/web` | Next.js landing + portal + simulador + APIs |
| `packages/core` | Dominio puro (stock, pedidos, intent) |
| `packages/agents` | Orquestador conversacional |
| `packages/adapters` | Mocks SPEI/CoDi/Pix + CFDI/NFC-e |
| `packages/db` | Prisma + SQLite |

## Tests y auditoría

```bash
npm test
npm run audit:supervisor
```

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [Engineering Playbook](docs/PYMEBOT-ENGINEERING-PLAYBOOK.md) | Guía del ingeniero a cargo |
| [Sprint Plan](docs/SPRINT-PLAN.md) | 12 sprints |
| [Team & Parallel Agents](docs/TEAM-AND-PARALLEL-AGENTS.md) | Equipo + agentes |
| [AI Prompts Library](docs/AI-PROMPTS-LIBRARY.md) | Prompts por fase |
| [Architecture](docs/ARCHITECTURE.md) | Arquitectura |
| [Audit Baseline](docs/AUDIT-BASELINE.md) | Gaps pre-build |
| [Audit Report](docs/AUDIT-REPORT.md) | Supervisor post-build |

## Nota

Integraciones reales Meta/PAC/SEFAZ/PSP requieren credenciales. Este MVP usa adapters mock con las mismas interfaces.
