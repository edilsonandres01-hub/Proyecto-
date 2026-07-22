import { getFeatureFlags, type FeatureFlags } from '@pymebot/core';
import { prisma } from '@pymebot/db';
import packageJson from '../../package.json';

export type OpsHealthPayload = {
  ok: true;
  /** Demo endpoint — no auth. Sandbox only. */
  sandbox: true;
  note: string;
  build: {
    service: string;
    version: string;
    nodeEnv: string;
    gitSha: string;
    timestamp: string;
  };
  counts: {
    tenants: number;
    orders: number;
    payments: number;
  };
  flags: FeatureFlags;
  auditDocs: {
    report: string;
    baseline: string;
    authorizationLog: string;
  };
};

export async function getOpsHealth(): Promise<OpsHealthPayload> {
  const [tenants, orders, payments] = await Promise.all([
    prisma.tenant.count(),
    prisma.order.count(),
    prisma.payment.count(),
  ]);

  return {
    ok: true,
    sandbox: true,
    note: 'GET /api/ops/health is unauthenticated for demo/sandbox only. Do not expose in production.',
    build: {
      service: 'pymebot-web',
      version: packageJson.version ?? '0.0.0',
      nodeEnv: process.env.NODE_ENV ?? 'development',
      gitSha:
        process.env.GIT_COMMIT ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.COMMIT_SHA ||
        'local',
      timestamp: new Date().toISOString(),
    },
    counts: { tenants, orders, payments },
    flags: getFeatureFlags(),
    auditDocs: {
      report: 'docs/AUDIT-REPORT.md',
      baseline: 'docs/AUDIT-BASELINE.md',
      authorizationLog: 'docs/LEAD-AUTHORIZATION-LOG.md',
    },
  };
}
