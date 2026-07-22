# PyMEBot — Engineering Playbook (Ingeniero a Cargo)

**Producto:** Agente IA en WhatsApp para micro-PyMEs LatAm  
**Mercados iniciales:** México + Brasil  
**Horizonte:** 6 meses · 12 sprints × 2 semanas  
**Versión:** 1.0 · 2026-07-22

---

## 1. Visión técnica

PyMEBot unifica en WhatsApp:

- **Inventario y pedidos** (lenguaje natural)
- **Cobros** (Pix, SPEI, CoDi)
- **Facturación electrónica** (CFDI 4.0 SAT, NFC-e SEFAZ)
- **Recordatorios fiscales** (no sustituye contador)

Arquitectura: **WhatsApp → Orquestador IA → Microservicios → Adaptadores regionales**.  
Ver [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## 2. Documentos del proyecto

| Documento | Contenido |
|-----------|-----------|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Stack, monorepo, CI/CD, integraciones |
| [`SPRINT-PLAN.md`](./SPRINT-PLAN.md) | 12 sprints detallados con historias y métricas |
| [`TEAM-AND-PARALLEL-AGENTS.md`](./TEAM-AND-PARALLEL-AGENTS.md) | Equipo, RACI, agentes en paralelo |
| [`AI-PROMPTS-LIBRARY.md`](./AI-PROMPTS-LIBRARY.md) | Prompts por fase y agente conversacional |

---

## 3. Fases y sprints (resumen ejecutivo)

| Fase | Sprints | Objetivo | Exit gate |
|------|---------|----------|-----------|
| **0 Validación** | 1–2 | 30 entrevistas, 20 pilotos, bot demo | 20 LOIs, bot demo OK |
| **1 MVP** | 3–6 | Inventario + pedidos en producción | 50 pilotos, WAU 70%, NPS ≥30 |
| **2 Escala** | 7–9 | Pagos reales + facturación | 20 merchants pagando, 50+ facturas/semana |
| **3 Plataforma** | 10–12 | Tax reminders, API, billing | 100 paying, MRR ≥$15k USD |

---

## 4. Arranque: semana 1 (ingeniero a cargo)

### Día 1–2: Fundación (Agent-0-Platform en paralelo)

```bash
# Crear monorepo skeleton
pyme-bot/
├── contracts/          # OpenAPI, agent tool schemas
├── packages/shared-kernel/
├── apps/webhook-ingress/
├── apps/orchestrator/
├── services/{identity,catalog,orders,invoicing,payments}/
└── adapters/{sat-cfdi,sefaz-nfe,spei,codi,pix}/
```

**Entregables:** CI verde, contratos v0.1, ADR-001 stack.

### Día 3–5: Paralelizar 5 agentes de código

| Agente | Prompt de arranque (resumen) | Output |
|--------|------------------------------|--------|
| Agent-1-WA | "Implementa webhook Meta con idempotencia Redis, firma HMAC, tests" | `apps/webhook-ingress` |
| Agent-2-Identity | "Multi-tenant con RLS, RFC/CNPJ validation, ResolveTenantByWaPhone gRPC" | `services/identity` |
| Agent-3-Orchestrator | "Router Fase 0-1 con tools: search_products, create_draft_order" | `apps/orchestrator` |
| Agent-4-Catalog | "CRUD productos + stock ledger, contrato OpenAPI" | `services/catalog` |
| Agent-5-QA | "Golden dataset 200 frases es-MX/pt-BR + harness NLU" | `tests/` |

### Día 6–10: Integración

- Agent Sync diario (15 min)
- Merge solo tras contract tests + review humano
- Demo interna: onboarding → "¿Cuánto tengo de X?" → pedido borrador

---

## 5. Orquestador conversacional (runtime)

### Agentes especializados

| Agente | Fase activa | Responsabilidad |
|--------|-------------|-----------------|
| **Product** | 0→3 | Catálogo, pedidos, NLU |
| **Fiscal** | 0→3 | OCR, borradores, integración PAC/NFe |
| **Payment** | 1→3 | Cobros, conciliación, crédito (F3) |
| **Support** | 0→3 | Onboarding, FAQ, escalamiento |
| **QA** | 0→3 | Evaluación calidad pre-ship |

### Router (decisión por turno)

```
media + "ticket/factura" → Fiscal
"pedido/precio/stock"    → Product
"pagar/cobrar/PIX/SPEI"  → Payment
"ayuda/error"            → Support
post-respuesta staging   → QA (async)
```

Prompts completos: [`AI-PROMPTS-LIBRARY.md`](./AI-PROMPTS-LIBRARY.md).

---

## 6. Quality gates por fase

| Fase | Gate | Criterio PASS |
|------|------|---------------|
| 0 | Entrevistas | ≥30 completas; 40% interés piloto |
| 0 | Fiscal scope | 0 asesoría tributaria directa |
| 1 | NLU catálogo | ≥85% accuracy es-MX y pt-BR |
| 1 | OCR recibos | F1 ≥0.80 monto/fecha/comercio |
| 1 | Pedidos | 100% confirmación explícita antes de commit |
| 2 | Tenant isolation | 100% rechazo cross-tenant |
| 2 | Facturación | ≥98% timbrado/autorización |
| 3 | Crédito | 100% disclaimer; 0 tasa garantizada |

---

## 7. Dependencias externas críticas

| Dependencia | Necesaria en | Lead time |
|-------------|--------------|-----------|
| Meta WA Business verification | Sprint 2 | 2–6 semanas |
| PAC México (CFDI) | Sprint 6 | 4–8 semanas |
| SEFAZ-SP homologação | Sprint 7 | 6–12 semanas |
| PSP Pix (BR) | Sprint 7 | 4–6 semanas |
| Partner CoDi/SPEI (MX) | Sprint 6 | 4–8 semanas |

---

## 8. Definition of Done (global)

- [ ] Criterios de aceptación cumplidos
- [ ] PR revisado; tests ≥80% en lógica nueva
- [ ] PII encriptada; sin secrets en repo
- [ ] Cambios fiscales/pagos revisados por owner
- [ ] Deploy staging + smoke test
- [ ] Demo grabada; PM sign-off

---

## 9. Capacidad y buffer

- **Velocidad objetivo:** 25–35 SP/sprint (equipo 6–8 FTE)
- **Buffer:** 15–20% para soporte pilotos, cambios SAT/SEFAZ, prompt tuning

---

## 10. Próximos pasos inmediatos

1. Aprobar ADR stack (Node orchestrator + Go adapters + Postgres)
2. Lanzar Agent-0-Platform en branch `feat/contracts-9ff6`
3. Solicitar verificación Meta WA + contratos PAC/PSP en paralelo
4. Reclutar 30 entrevistas (CDMX + Grande SP) — Sprint 1
5. Registrar prompts v1 en Langfuse/prompt registry con `{{prompt_version}}`
