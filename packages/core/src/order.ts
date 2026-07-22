import { randomUUID } from 'node:crypto';

import type { Money, Order, OrderItem, OrderStatus, TenantId } from './types.js';
import { asTenantId } from './types.js';
import { assertMoney } from './product.js';

export type CreateOrderItemInput = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: Money;
};

export type CreateOrderInput = {
  tenantId: TenantId | string;
  items: readonly CreateOrderItemInput[];
  id?: string;
  now?: Date;
};

function isCreateOrderItemList(
  value: readonly CreateOrderItemInput[] | CreateOrderInput,
): value is readonly CreateOrderItemInput[] {
  return Array.isArray(value);
}

export function createOrder(items: readonly CreateOrderItemInput[]): Order;
export function createOrder(input: CreateOrderInput): Order;
export function createOrder(
  itemsOrInput: readonly CreateOrderItemInput[] | CreateOrderInput,
): Order {
  const input: CreateOrderInput = isCreateOrderItemList(itemsOrInput)
    ? { tenantId: asTenantId('default'), items: itemsOrInput }
    : itemsOrInput;

  if (!input.items.length) {
    throw new Error('Order must contain at least one item');
  }

  const items: OrderItem[] = input.items.map((item) => {
    if (!item.productId.trim()) {
      throw new Error('Order item productId is required');
    }
    const name = item.name.trim();
    if (!name) {
      throw new Error('Order item name is required');
    }
    if (!Number.isFinite(item.quantity) || !Number.isInteger(item.quantity)) {
      throw new Error('Order item quantity must be an integer');
    }
    if (item.quantity <= 0) {
      throw new Error('Order item quantity must be positive');
    }
    assertMoney(item.unitPrice);
    return {
      productId: item.productId,
      name,
      quantity: item.quantity,
      unitPrice: { ...item.unitPrice },
    };
  });

  const currency = items[0]!.unitPrice.currency;
  for (const item of items) {
    if (item.unitPrice.currency !== currency) {
      throw new Error('All order items must share the same currency');
    }
  }

  const totalCents = items.reduce(
    (sum, item) => sum + item.unitPrice.amountCents * item.quantity,
    0,
  );

  const now = (input.now ?? new Date()).toISOString();

  return {
    id: input.id ?? randomUUID(),
    tenantId: asTenantId(String(input.tenantId)),
    status: 'draft',
    items,
    total: { amountCents: totalCents, currency },
    createdAt: now,
    updatedAt: now,
  };
}

const CONFIRMABLE: ReadonlySet<OrderStatus> = new Set(['draft']);
const CANCELLABLE: ReadonlySet<OrderStatus> = new Set([
  'draft',
  'confirmed',
  'paid',
]);

export function confirmOrder(order: Order, now: Date = new Date()): Order {
  if (!CONFIRMABLE.has(order.status)) {
    throw new Error(`Cannot confirm order in status "${order.status}"`);
  }
  return {
    ...order,
    status: 'confirmed',
    updatedAt: now.toISOString(),
  };
}

export function cancelOrder(order: Order, now: Date = new Date()): Order {
  if (order.status === 'cancelled') {
    throw new Error('Order is already cancelled');
  }
  if (!CANCELLABLE.has(order.status)) {
    throw new Error(`Cannot cancel order in status "${order.status}"`);
  }
  return {
    ...order,
    status: 'cancelled',
    updatedAt: now.toISOString(),
  };
}
