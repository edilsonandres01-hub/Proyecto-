# PyMEBot — Sprint Plan (12 × 2 semanas)

**Mercados:** México + Brasil · **Equipo:** 6–8 FTE · **Velocidad:** 25–35 SP/sprint

---

## Resumen por fase

| Fase | Sprints | Exit gate |
|------|---------|-----------|
| 0 Validación | 1–2 | 20 pilotos firmados, bot demo, WA verification enviada |
| 1 MVP | 3–6 | 50 pilotos activos, WAU 70%, NPS ≥30 |
| 2 Escala | 7–9 | Pagos reales + ≥50 facturas/semana, rechazo fiscal <2% |
| 3 Plataforma | 10–12 | API live, 100 paying, MRR ≥$15k USD |

---

## Sprint 1 — Discovery (Sem 1–2)

**Goal:** 30 entrevistas + mapa regulatorio MX/BR  
**Líder:** Head Product + Director Fiscal  
**SP:** 26–34

| Entregable | Criterio |
|------------|----------|
| 30 entrevistas (15 MX, 15 BR) | Top 5 dolores rankeados con citas |
| Brief SAT/SEFAZ/Pix/CoDi | Go/no-go memo |
| Meta WA verification | Solicitud enviada |
| Arquitectura v0.1 | ADR aprobado por CTO |

**Agentes paralelos:**
- Agent-Research: sintetizar entrevistas (prompt Fase 0 Product)
- Agent-Platform: spike WA Cloud API + LLM tool-calling

---

## Sprint 2 — Prototipo + Pilotos (Sem 3–4)

**Goal:** Bot demo + 20 pilotos firmados  
**Líder:** WA Lead + AI Director  
**SP:** 29–34

| Entregable | Criterio |
|------------|----------|
| Bot sandbox 3 flujos/mercado | p95 respuesta <3s |
| 20 pilotos (10 MX, 10 BR) | RFC/CNPJ capturados |
| LLM intent router v0.1 | ≥85% en golden set 100 frases |
| Privacy policy MX + BR | Publicada |

**Agentes paralelos:**
- Agent-WA: webhook + echo + templates
- Agent-ML: intent router + eval harness
- Agent-UX: Figma flows 20+ pantallas

---

## Sprint 3 — Infra WhatsApp Producción (Sem 5–6)

**Goal:** Multi-tenant producción  
**Líder:** WA Lead + CTO  
**SP:** 31–34

| Entregable | Criterio |
|------------|----------|
| WA producción | Quality rating Green |
| Onboarding <10 min | RFC/CNPJ validados |
| Admin dashboard v0.1 | Logs + merchants |
| CI/CD staging + prod | Smoke tests verdes |

---

## Sprint 4 — Inventario (Sem 7–8)

**Goal:** Catálogo 100% conversacional  
**Líder:** NLP Engineer + Product  
**SP:** 31–34

| Entregable | Criterio |
|------------|----------|
| NL CRUD productos/stock | ≥90% NL success (200 frases) |
| Alertas stock bajo | Template WA en <5 min |
| CSV import ≤500 SKUs | Admin dashboard |
| Confirmación pre-mutación | 100% writes confirmados |

---

## Sprint 5 — Pedidos y Ventas (Sem 9–10)

**Goal:** Pedidos + deducción inventario  
**Líder:** NLP + Product  
**SP:** 29–34

| Entregable | Criterio |
|------------|----------|
| Flujo pedido ≤5 msgs mediana | Status machine completa |
| Resumen diario 8pm local | ±0.1% accuracy revenue |
| Mini-CRM clientes | Teléfono + nombre |
| Cancelación 15 min | Restaura stock |

---

## Sprint 6 — Hardening MVP (Sem 11–12)

**Goal:** 50 pilotos, retención, NPS  
**Líder:** CTO + CS  
**SP:** 28–33

| Entregable | Criterio |
|------------|----------|
| 50 pilotos activos | ≥1 acción/7 días |
| Retención semana 4 | ≥70% |
| NPS | ≥30 (n≥30) |
| Load test | 500 msgs/min OK |

**Gate Fase 1:** 50 pilotos · WAU 70% · NPS ≥30

---

## Sprint 7 — Pagos México (Sem 13–14)

**Goal:** CoDi + SPEI en producción  
**Líder:** Lead Payments  
**SP:** 32–34

| Entregable | Criterio |
|------------|----------|
| CoDi QR + SPEI fallback | Webhook p95 <60s |
| Conciliación automática | Mismatch <0.1% |
| ≥10 MX pilots con pago real | Audit trail 100% |

---

## Sprint 8 — Pagos Brasil (Sem 15–16)

**Goal:** Pix dinámico  
**Líder:** Lead Payments  
**SP:** 27–32

| Entregable | Criterio |
|------------|----------|
| Pix QR + copia-cola | Confirmación p95 <30s |
| Estorno sandbox | Notificación WA |
| ≥10 BR pilots con Pix real | BACEN checklist OK |

---

## Sprint 9 — Facturación Electrónica (Sem 17–18)

**Goal:** CFDI 4.0 + NFC-e SP  
**Líder:** Director Fiscal  
**SP:** 37–42 (pull 5 SP a S10 si necesario)

| Entregable | Criterio |
|------------|----------|
| CFDI timbrado auto | ≥98% éxito; UUID almacenado |
| NFC-e SEFAZ-SP | Chave válida |
| PDF/XML vía WhatsApp | Cancelación sandbox OK |

**Gate Fase 2:** ≥20 merchants pagando · ≥50 facturas/semana

---

## Sprint 10 — Recordatorios Fiscales (Sem 19–20)

**Goal:** Calendario SAT + Simples Nacional  
**Líder:** Director Fiscal + Product  
**SP:** 28–33

| Entregable | Criterio |
|------------|----------|
| Reminders T-7, T-3, T-1 | 9am local; opt-out respetado |
| Query "obligaciones del mes" | Disclaimer contador siempre |
| Open rate reminders | ≥50% |

---

## Sprint 11 — Platform API (Sem 21–22)

**Goal:** REST v1 + webhooks para contadores  
**Líder:** CTO + Data  
**SP:** 34–39

| Entregable | Criterio |
|------------|----------|
| OpenAPI spec | Partner integra <1 día |
| Webhooks ≥99.5% delivery | 3 retries backoff |
| Portal contador multi-merchant | 2 partners piloto |

---

## Sprint 12 — Scale & GTM (Sem 23–24)

**Goal:** Billing, referrals, data room  
**Líder:** Head Product + Ops  
**SP:** 32–37

| Entregable | Criterio |
|------------|----------|
| ≥100 paying merchants | MRR ≥$15k USD |
| Self-serve onboarding | ≥80% sin humano |
| Referral k-factor | ≥0.15 |
| Churn mensual | <8% |

**Gate Fase 3:** API live · 100 paying · tax reminders activos

---

## KPI Dashboard

| KPI | S6 | S9 | S12 |
|-----|----|----|-----|
| Merchants activos | 50 | 80 | 150+ |
| Payment GMV/mes | — | $50k | $200k |
| Facturas/mes | — | 200 | 500+ |
| NPS | 30 | 35 | 40 |
| p95 respuesta bot | 4s | 3s | 3s |

---

## Ceremonias fijas

| Ceremonia | Cadencia |
|-----------|----------|
| Sprint planning | Quincenal D1 · 2h |
| Daily standup | Diario · 15m |
| Agent Sync | Diario · 15m |
| Demo + retro | Quincenal D10 · 1.5h |
| Pilot office hours | Semanal · 1h |
| Compliance checkpoint | Mensual · 1h |
