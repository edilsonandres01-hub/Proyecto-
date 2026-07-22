/** Amount in the smallest currency unit (centavos / cents). */
export type Money = {
  amountCents: number;
  currency: CurrencyCode;
};

export type CurrencyCode = 'MXN' | 'BRL';

/** Opaque tenant identifier. */
export type TenantId = string & { readonly __brand: 'TenantId' };

export type CountryCode = 'MX' | 'BR';

export type Product = {
  id: string;
  tenantId: TenantId;
  name: string;
  sku: string | null;
  description: string | null;
  stock: number;
  price: Money;
  /** When true, stock may go below zero via adjustStock. */
  allowNegative: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'paid'
  | 'invoiced'
  | 'cancelled';

export type PaymentRail = 'spei' | 'codi' | 'pix' | 'cash';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'cancelled'
  | 'void';

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: Money;
};

export type Order = {
  id: string;
  tenantId: TenantId;
  status: OrderStatus;
  items: readonly OrderItem[];
  total: Money;
  createdAt: string;
  updatedAt: string;
};

export type Intent =
  | 'product'
  | 'payment'
  | 'fiscal'
  | 'support'
  | 'unknown';

export function asTenantId(value: string): TenantId {
  if (!value.trim()) {
    throw new Error('TenantId must be a non-empty string');
  }
  return value as TenantId;
}
