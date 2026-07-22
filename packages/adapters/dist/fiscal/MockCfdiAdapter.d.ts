import type { CancelInvoiceResult, IssueInvoiceInput, IssueInvoiceResult } from '../types.js';
import type { FiscalAdapter } from './FiscalAdapter.js';
export declare class MockCfdiAdapter implements FiscalAdapter {
    issueInvoice(input: IssueInvoiceInput): Promise<IssueInvoiceResult>;
    cancelInvoice(invoiceId: string): Promise<CancelInvoiceResult>;
}
//# sourceMappingURL=MockCfdiAdapter.d.ts.map