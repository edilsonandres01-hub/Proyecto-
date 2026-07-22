import { prisma } from '@pymebot/db';

export const DEMO_TENANT_ID = 'tenant_demo_mx';

export async function getDemoTenant() {
  return prisma.tenant.findUnique({
    where: { id: DEMO_TENANT_ID },
    include: {
      products: { orderBy: { name: 'asc' } },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { items: { include: { product: true } }, payments: true, invoices: true },
      },
      payments: { orderBy: { createdAt: 'desc' }, take: 20 },
      invoices: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
}

export function assertTenantId(tenantId: string | null | undefined) {
  if (!tenantId) throw new Error('tenantId required');
  return tenantId;
}
