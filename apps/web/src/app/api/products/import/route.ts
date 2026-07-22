import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@pymebot/db';

export const runtime = 'nodejs';

type CsvRow = {
  sku: string;
  name: string;
  priceCents: number;
  stockQty: number;
};

function parseCsv(csv: string): CsvRow[] {
  const lines = csv
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const headerCells = splitCsvLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const hasHeader =
    headerCells.includes('sku') &&
    headerCells.includes('name') &&
    headerCells.includes('price');

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const idx = hasHeader
    ? {
        sku: headerCells.indexOf('sku'),
        name: headerCells.indexOf('name'),
        price: headerCells.indexOf('price'),
        stock: headerCells.indexOf('stock'),
      }
    : { sku: 0, name: 1, price: 2, stock: 3 };

  const rows: CsvRow[] = [];
  for (const line of dataLines) {
    const cells = splitCsvLine(line);
    const sku = String(cells[idx.sku] ?? '').trim();
    const name = String(cells[idx.name] ?? '').trim();
    const priceRaw = String(cells[idx.price] ?? '').trim().replace(',', '.');
    const stockRaw = String(cells[idx.stock] ?? '0').trim();
    if (!sku || !name) continue;
    const priceMajor = Number(priceRaw);
    if (!Number.isFinite(priceMajor) || priceMajor < 0) continue;
    const stockQty = Number(stockRaw);
    rows.push({
      sku,
      name,
      priceCents: Math.round(priceMajor * 100),
      stockQty: Number.isFinite(stockQty) ? Math.max(0, Math.floor(stockQty)) : 0,
    });
  }
  return rows;
}

/** Minimal CSV splitter supporting quoted fields. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

async function readImportBody(
  req: NextRequest,
): Promise<{ tenantId: string; csv: string } | { error: string; status: number }> {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const tenantId = String(form.get('tenantId') || 'tenant_demo_mx');
    const file = form.get('file') ?? form.get('csv');
    if (typeof file === 'string') {
      return { tenantId, csv: file };
    }
    if (file && typeof file === 'object' && 'text' in file) {
      const csv = await (file as File).text();
      return { tenantId, csv };
    }
    return { error: 'csv_required', status: 400 };
  }

  const body = (await req.json()) as { tenantId?: string; csv?: string };
  const tenantId = String(body.tenantId || 'tenant_demo_mx');
  const csv = String(body.csv ?? '');
  if (!csv.trim()) return { error: 'csv_required', status: 400 };
  return { tenantId, csv };
}

export async function POST(req: NextRequest) {
  const parsed = await readImportBody(req);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const { tenantId, csv } = parsed;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 });
  }

  const currency = tenant.country === 'BR' ? 'BRL' : 'MXN';
  const rows = parseCsv(csv);
  if (rows.length === 0) {
    return NextResponse.json({ error: 'no_valid_rows' }, { status: 400 });
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: 'too_many_rows', max: 500 }, { status: 400 });
  }

  let created = 0;
  let updated = 0;
  const products = [];

  for (const row of rows) {
    const existing = await prisma.product.findUnique({
      where: { tenantId_sku: { tenantId, sku: row.sku } },
    });
    const product = existing
      ? await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: row.name,
            priceCents: row.priceCents,
            stockQty: row.stockQty,
          },
        })
      : await prisma.product.create({
          data: {
            tenantId,
            sku: row.sku,
            name: row.name,
            priceCents: row.priceCents,
            stockQty: row.stockQty,
            currency,
          },
        });
    if (existing) updated += 1;
    else created += 1;
    products.push(product);
  }

  return NextResponse.json(
    {
      tenantId,
      imported: products.length,
      created,
      updated,
      products,
    },
    { status: 201 },
  );
}
