import { randomUUID } from 'node:crypto';

import type { CurrencyCode, Money, Product, TenantId } from './types.js';
import { asTenantId } from './types.js';

export type CreateProductInput = {
  tenantId: TenantId | string;
  name: string;
  sku?: string | null;
  description?: string | null;
  stock?: number;
  price: Money;
  allowNegative?: boolean;
  id?: string;
  now?: Date;
};

export function createProduct(input: CreateProductInput): Product {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Product name is required');
  }

  const stock = input.stock ?? 0;
  if (!Number.isFinite(stock) || !Number.isInteger(stock)) {
    throw new Error('Product stock must be an integer');
  }
  if (stock < 0 && !input.allowNegative) {
    throw new Error('Product stock cannot be negative without allowNegative');
  }

  assertMoney(input.price);

  const now = (input.now ?? new Date()).toISOString();

  return {
    id: input.id ?? randomUUID(),
    tenantId: asTenantId(String(input.tenantId)),
    name,
    sku: input.sku?.trim() ? input.sku.trim() : null,
    description: input.description?.trim() ? input.description.trim() : null,
    stock,
    price: { ...input.price },
    allowNegative: input.allowNegative ?? false,
    createdAt: now,
    updatedAt: now,
  };
}

export type AdjustStockOptions = {
  /** Override product.allowNegative for this adjustment. */
  allowNegative?: boolean;
  now?: Date;
};

/**
 * Adjust product stock by `delta` (positive = inbound, negative = outbound).
 * Rejects resulting negative stock unless allowNegative is set on the product
 * or passed in options.
 */
export function adjustStock(
  product: Product,
  delta: number,
  options: AdjustStockOptions = {},
): Product {
  if (!Number.isFinite(delta) || !Number.isInteger(delta)) {
    throw new Error('Stock delta must be an integer');
  }

  const nextStock = product.stock + delta;
  const allowNegative = options.allowNegative ?? product.allowNegative;

  if (nextStock < 0 && !allowNegative) {
    throw new Error(
      `Insufficient stock: current=${product.stock}, delta=${delta}`,
    );
  }

  const now = (options.now ?? new Date()).toISOString();

  return {
    ...product,
    stock: nextStock,
    updatedAt: now,
  };
}

export function assertMoney(money: Money): void {
  if (!Number.isFinite(money.amountCents) || !Number.isInteger(money.amountCents)) {
    throw new Error('Money.amountCents must be an integer');
  }
  if (money.amountCents < 0) {
    throw new Error('Money.amountCents cannot be negative');
  }
  if (money.currency !== 'MXN' && money.currency !== 'BRL') {
    throw new Error(`Unsupported currency: ${String((money as Money).currency)}`);
  }
}

export function money(amountCents: number, currency: CurrencyCode): Money {
  const value: Money = { amountCents, currency };
  assertMoney(value);
  return value;
}

/** Minimal stock shape — supports core `stock` and DB/agent `stockQty`. */
export type StockAware = {
  stock?: number;
  stockQty?: number;
};

/**
 * Returns products whose available quantity is at or below `threshold` (default 5).
 * Prefers `stockQty` when present, otherwise uses `stock`.
 */
export function findLowStock<T extends StockAware>(
  products: readonly T[],
  threshold = 5,
): T[] {
  if (!Number.isFinite(threshold)) {
    throw new Error('threshold must be a finite number');
  }
  return products.filter((p) => {
    const qty =
      typeof p.stockQty === 'number'
        ? p.stockQty
        : typeof p.stock === 'number'
          ? p.stock
          : 0;
    return qty <= threshold;
  });
}
