export type {
  Money,
  CurrencyCode,
  TenantId,
  CountryCode,
  Product,
  OrderStatus,
  PaymentRail,
  PaymentStatus,
  InvoiceStatus,
  OrderItem,
  Order,
  Intent,
} from './types.js';

export { asTenantId } from './types.js';

export type { CreateProductInput, AdjustStockOptions, StockAware } from './product.js';
export {
  createProduct,
  adjustStock,
  assertMoney,
  money,
  findLowStock,
} from './product.js';

export type { CreateOrderItemInput, CreateOrderInput } from './order.js';
export { createOrder, confirmOrder, cancelOrder } from './order.js';

export { formatMoney } from './money.js';

export { classifyIntent, IntentClassifier } from './intent.js';

export type { TaxObligation } from './taxCalendar.js';
export { getUpcomingObligations } from './taxCalendar.js';

export type { FeatureFlagKey, FeatureFlags } from './featureFlags.js';
export {
  FEATURE_FLAG_KEYS,
  DEFAULT_FEATURE_FLAGS,
  resolveFeatureFlags,
  getFeatureFlags,
} from './featureFlags.js';
