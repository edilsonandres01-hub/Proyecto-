#!/usr/bin/env node
/**
 * Agent-Supervisor auditor — unicorn MVP exit gates
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const checks = [];

function check(name, ok, detail = '') {
  checks.push({ name, ok: Boolean(ok), detail });
}

function fileHas(path, re) {
  if (!existsSync(path)) return false;
  return re.test(readFileSync(path, 'utf8'));
}

check('Landing page exists', existsSync(join(root, 'apps/web/src/app/page.tsx')));
check(
  'Brand PyMEBot in landing',
  fileHas(join(root, 'apps/web/src/app/page.tsx'), /PyMEBot/),
);
check(
  'Expressive fonts (Fraunces)',
  fileHas(join(root, 'apps/web/src/app/layout.tsx'), /Fraunces/),
);
check(
  'Atmosphere / gradient CSS',
  fileHas(join(root, 'apps/web/src/app/globals.css'), /atmosphere|radial-gradient/),
);
check('Portal page', existsSync(join(root, 'apps/web/src/app/portal/page.tsx')));
check('WhatsApp simulator', existsSync(join(root, 'apps/web/src/app/sim/page.tsx')));
check('Chat API', existsSync(join(root, 'apps/web/src/app/api/chat/route.ts')));
check('Products API', existsSync(join(root, 'apps/web/src/app/api/products/route.ts')));
check('Payments API', existsSync(join(root, 'apps/web/src/app/api/payments/route.ts')));
check('Invoices API', existsSync(join(root, 'apps/web/src/app/api/invoices/route.ts')));
check('Core package', existsSync(join(root, 'packages/core/src/index.ts')));
check('Adapters package', existsSync(join(root, 'packages/adapters/src/index.ts')));
check('Agents package', existsSync(join(root, 'packages/agents/src/index.ts')));
check('Prisma schema', existsSync(join(root, 'packages/db/prisma/schema.prisma')));
check(
  'Fiscal disclaimer in agents',
  fileHas(join(root, 'packages/agents/src/index.ts'), /No soy contador|Não sou contador/),
);
check(
  'Payment adapter factory',
  fileHas(join(root, 'packages/adapters/src/payment/createPaymentAdapter.ts'), /createPaymentAdapter/),
);
check('Reminders API', existsSync(join(root, 'apps/web/src/app/api/reminders/route.ts')));
check('Public API v1 OpenAPI', existsSync(join(root, 'apps/web/src/app/api/v1/openapi/route.ts')));
check('API docs page', existsSync(join(root, 'apps/web/src/app/docs/page.tsx')));
check('Portal client CRUD', existsSync(join(root, 'apps/web/src/components/PortalClient.tsx')));
check('Tax calendar core', existsSync(join(root, 'packages/core/src/taxCalendar.ts')));
check('Payment webhooks', existsSync(join(root, 'apps/web/src/app/api/webhooks/payments/route.ts')));
check('CSV import API', existsSync(join(root, 'apps/web/src/app/api/products/import/route.ts')));
check('Billing API', existsSync(join(root, 'apps/web/src/app/api/billing/route.ts')));
check('Low-stock alerts API', existsSync(join(root, 'apps/web/src/app/api/alerts/low-stock/route.ts')));
check('Analytics API', existsSync(join(root, 'apps/web/src/app/api/analytics/route.ts')));
check('Referrals API', existsSync(join(root, 'apps/web/src/app/api/referrals/route.ts')));
check('Onboarding page', existsSync(join(root, 'apps/web/src/app/onboarding/page.tsx')));
check('Accountant portal', existsSync(join(root, 'apps/web/src/app/accountant/page.tsx')));
check('Feature flags API', existsSync(join(root, 'apps/web/src/app/api/flags/route.ts')));
check('Lead authorization log', existsSync(join(root, 'docs/LEAD-AUTHORIZATION-LOG.md')));
check('Ops health page', existsSync(join(root, 'apps/web/src/app/ops/page.tsx')));
check('Notifications API', existsSync(join(root, 'apps/web/src/app/api/notifications/route.ts')));
check('Analytics export', existsSync(join(root, 'apps/web/src/app/api/analytics/export/route.ts')));
check('Webhook events API', existsSync(join(root, 'apps/web/src/app/api/webhooks/events/route.ts')));
check('NPS API', existsSync(join(root, 'apps/web/src/app/api/nps/route.ts')));
check('Dataroom page', existsSync(join(root, 'apps/web/src/app/dataroom/page.tsx')));


const test = spawnSync('npm', ['run', 'test'], { cwd: root, encoding: 'utf8', shell: true });
check('Unit tests green', test.status === 0, (test.stdout || '').slice(-400));

const build = spawnSync('npm', ['run', 'build'], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
  env: { ...process.env, DATABASE_URL: 'file:../../packages/db/prisma/dev.db' },
});
check('Production build green', build.status === 0, (build.stderr || build.stdout || '').slice(-600));

const failed = checks.filter((c) => !c.ok);
const pass = failed.length === 0;

const report = `# PyMEBot — AUDIT REPORT (Agent-Supervisor)

**Date:** ${new Date().toISOString()}
**Verdict:** ${pass ? 'PASS' : 'FAIL'}

## Gates

| Gate | Result | Detail |
|------|--------|--------|
${checks.map((c) => `| ${c.name} | ${c.ok ? 'PASS' : 'FAIL'} | ${String(c.detail).replace(/\\|/g, '/').slice(0, 120)} |`).join('\n')}

## Summary

- Total checks: ${checks.length}
- Passed: ${checks.length - failed.length}
- Failed: ${failed.length}

${pass ? 'MVP unicorn structural gates satisfied for shippable demo.' : 'Fix failing gates before claiming done.'}

## Honest scope note

Real Meta WhatsApp Cloud API, PAC SAT, SEFAZ, and STP/Pix PSP integrations remain mocked behind production-shaped interfaces.
`;

mkdirSync(join(root, 'docs'), { recursive: true });
writeFileSync(join(root, 'docs/AUDIT-REPORT.md'), report);
console.log(report);
process.exit(pass ? 0 : 1);
