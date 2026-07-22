import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@pymebot/db';

export const runtime = 'nodejs';

function periodEnd(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const businessName = String(body.businessName || '').trim();
  const countryRaw = String(body.country || '').trim().toUpperCase();
  const phone = String(body.phone || '').trim();
  const email = String(body.email || '').trim().toLowerCase();

  if (!businessName) {
    return NextResponse.json({ error: 'businessName_required' }, { status: 400 });
  }
  if (countryRaw !== 'MX' && countryRaw !== 'BR') {
    return NextResponse.json({ error: 'invalid_country' }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: 'phone_required' }, { status: 400 });
  }
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const country = countryRaw as 'MX' | 'BR';
  const currency = country === 'BR' ? 'BRL' : 'MXN';
  const slug = slugify(businessName) || 'negocio';
  const suffix = Math.random().toString(36).slice(2, 8);
  const tenantId = `tenant_${slug}_${suffix}`;

  const tenant = await prisma.tenant.create({
    data: {
      id: tenantId,
      name: businessName,
      country,
      phone,
      users: {
        create: {
          email,
          name: businessName,
          role: 'owner',
        },
      },
      products: {
        create: {
          sku: 'DEMO-001',
          name: country === 'BR' ? 'Produto demonstração' : 'Producto demo',
          priceCents: country === 'BR' ? 1000 : 2000,
          stockQty: 10,
          currency,
        },
      },
      subscription: {
        create: {
          plan: 'starter',
          status: 'trialing',
          amountCents: 29900,
          currency,
          currentPeriodEnd: periodEnd(14),
        },
      },
    },
    include: {
      users: true,
      products: true,
      subscription: true,
    },
  });

  return NextResponse.json(
    {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        country: tenant.country,
        phone: tenant.phone,
      },
      user: tenant.users[0]
        ? { id: tenant.users[0].id, email: tenant.users[0].email, name: tenant.users[0].name }
        : null,
      subscription: tenant.subscription,
      product: tenant.products[0] ?? null,
    },
    { status: 201 },
  );
}
