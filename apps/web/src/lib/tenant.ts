import { prisma } from '@pymebot/db';

export const DEMO_TENANTS = {
  MX: 'tenant_demo_mx',
  BR: 'tenant_demo_br',
} as const;

export type DemoTenantId = (typeof DEMO_TENANTS)[keyof typeof DEMO_TENANTS];

const tenantInclude = {
  products: { orderBy: { name: 'asc' as const } },
  orders: {
    orderBy: { createdAt: 'desc' as const },
    take: 20,
    include: { items: { include: { product: true } }, payments: true, invoices: true },
  },
  payments: { orderBy: { createdAt: 'desc' as const }, take: 20 },
  invoices: { orderBy: { createdAt: 'desc' as const }, take: 20 },
  taxReminders: { orderBy: { dueDate: 'asc' as const }, take: 10 },
};

export async function getTenantById(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: tenantInclude,
  });
}

export async function getDemoTenant(tenantId: string = DEMO_TENANTS.MX) {
  return getTenantById(tenantId);
}

export async function listDemoTenants() {
  return prisma.tenant.findMany({
    where: { id: { in: [DEMO_TENANTS.MX, DEMO_TENANTS.BR] } },
    select: { id: true, name: true, country: true },
    orderBy: { country: 'asc' },
  });
}

export function assertTenantId(tenantId: string | null | undefined) {
  if (!tenantId) throw new Error('tenantId required');
  return tenantId;
}

export type PortalTenant = NonNullable<Awaited<ReturnType<typeof getTenantById>>>;
