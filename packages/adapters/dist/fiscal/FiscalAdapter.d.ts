import type { CancelInvoiceResult, IssueInvoiceInput, IssueInvoiceResult } from '../types.js';
export interface FiscalAdapter {
    issueInvoice(input: IssueInvoiceInput): Promise<IssueInvoiceResult>;
    cancelInvoice(invoiceId: string): Promise<CancelInvoiceResult>;
}
//# sourceMappingURL=FiscalAdapter.d.ts.map