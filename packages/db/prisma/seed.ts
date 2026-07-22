import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Next calendar occurrence of `dayOfMonth` on or after today. */
function nextDueDate(dayOfMonth: number): Date {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let due = new Date(base.getFullYear(), base.getMonth(), dayOfMonth);
  if (due < base) {
    due = new Date(base.getFullYear(), base.getMonth() + 1, dayOfMonth);
  }
  return due;
}

function periodEnd(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

async function main() {
  await prisma.webhookEvent.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.taxReminder.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  const tenant = await prisma.tenant.create({
    data: {
      id: 'tenant_demo_mx',
      name: 'Abarrotes Sol',
      country: 'MX',
      taxId: 'ASO850101XXX',
      phone: '+525512345678',
      users: {
        create: [
          {
            email: 'dueno@abarrotes-sol.mx',
            name: 'María Sol',
            role: 'owner',
          },
          {
            email: 'contador@demo.mx',
            name: 'Contador Demo MX',
            role: 'accountant',
          },
        ],
      },
      products: {
        create: [
          { sku: 'SAB-045', name: 'Sabritas Original 45g', priceCents: 1800, stockQty: 4, currency: 'MXN' },
          { sku: 'COCA-600', name: 'Coca-Cola 600ml', priceCents: 2200, stockQty: 36, currency: 'MXN' },
          { sku: 'TOR-14', name: 'Tornillo 1/4', priceCents: 300, stockQty: 200, currency: 'MXN' },
        ],
      },
      subscription: {
        create: {
          plan: 'starter',
          status: 'trialing',
          amountCents: 29900,
          currency: 'MXN',
          currentPeriodEnd: periodEnd(14),
        },
      },
    },
  });

  const tenantBr = await prisma.tenant.create({
    data: {
      id: 'tenant_demo_br',
      name: 'Mercadinho Aurora',
      country: 'BR',
      taxId: '12345678000199',
      phone: '+5511987654321',
      users: {
        create: [
          {
            email: 'dona@aurora.br',
            name: 'Ana Aurora',
            role: 'owner',
          },
          {
            email: 'contador@demo.br',
            name: 'Contador Demo BR',
            role: 'accountant',
          },
        ],
      },
      products: {
        create: [
          { sku: 'COCA-2L', name: 'Coca-Cola 2L', priceCents: 950, stockQty: 3, currency: 'BRL' },
          { sku: 'ARROZ-1K', name: 'Arroz Tipo 1 1kg', priceCents: 780, stockQty: 40, currency: 'BRL' },
        ],
      },
      subscription: {
        create: {
          plan: 'growth',
          status: 'active',
          amountCents: 79900,
          currency: 'BRL',
          currentPeriodEnd: periodEnd(30),
        },
      },
    },
  });

  const ivaDue = nextDueDate(17);
  const dasDue = nextDueDate(20);

  await prisma.taxReminder.createMany({
    data: [
      {
        tenantId: tenant.id,
        title: 'IVA mensual — recordatorio T-7',
        dueDate: ivaDue,
        regime: 'general',
        status: 'pending',
      },
      {
        tenantId: tenant.id,
        title: 'ISR provisional — recordatorio T-7',
        dueDate: ivaDue,
        regime: 'general',
        status: 'pending',
      },
      {
        tenantId: tenantBr.id,
        title: 'DAS Simples Nacional',
        dueDate: dasDue,
        regime: 'simples',
        status: 'pending',
      },
    ],
  });

  await prisma.referral.create({
    data: {
      tenantId: tenant.id,
      code: 'SOL-AMIGO',
      status: 'pending',
    },
  });

  console.log('Seeded tenants:', tenant.id, tenantBr.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
