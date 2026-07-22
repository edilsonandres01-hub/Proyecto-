export type {
  CancelInvoiceResult,
  CreateIntentInput,
  CreateIntentResult,
  ConfirmWebhookResult,
  FiscalCountry,
  IssueInvoiceInput,
  IssueInvoiceResult,
  PaymentInstructions,
  PaymentIntentStatus,
  PaymentRail,
} from './types.js';

export type { PaymentAdapter } from './payment/PaymentAdapter.js';
export type { FiscalAdapter } from './fiscal/FiscalAdapter.js';

export { MockSpeiAdapter } from './payment/MockSpeiAdapter.js';
export { MockCodiAdapter } from './payment/MockCodiAdapter.js';
export { MockPixAdapter } from './payment/MockPixAdapter.js';
export { createPaymentAdapter } from './payment/createPaymentAdapter.js';

export { MockCfdiAdapter } from './fiscal/MockCfdiAdapter.js';
export { MockNfeAdapter } from './fiscal/MockNfeAdapter.js';
export { createFiscalAdapter } from './fiscal/createFiscalAdapter.js';

export {
  getAuditLog,
  clearAuditLog,
  recordAudit,
  type AuditEntry,
} from './audit.js';
