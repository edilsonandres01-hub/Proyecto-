import { randomUUID } from 'node:crypto';
import { recordAudit } from '../audit.js';
import type {
  CancelInvoiceResult,
  IssueInvoiceInput,
  IssueInvoiceResult,
} from '../types.js';
import type { FiscalAdapter } from './FiscalAdapter.js';

export class MockCfdiAdapter implements FiscalAdapter {
  async issueInvoice(input: IssueInvoiceInput): Promise<IssueInvoiceResult> {
    const invoiceId = randomUUID();
    const uuidOrChave = randomUUID().toUpperCase();
    const result: IssueInvoiceResult = {
      invoiceId,
      uuidOrChave,
      pdfStubUrl: `https://stubs.pymebot.local/cfdi/${invoiceId}.pdf`,
      xmlStub: `<?xml version="1.0" encoding="UTF-8"?><cfdi:Comprobante Version="4.0" UUID="${uuidOrChave}" Total="${(input.amountCents / 100).toFixed(2)}" Folio="${input.orderId}" RFCReceptor="${input.customerTaxId ?? 'XAXX010101000'}"/>`,
      status: 'issued',
    };
    recordAudit('MockCfdiAdapter', 'issueInvoice', { ...input }, { ...result });
    return result;
  }

  async cancelInvoice(invoiceId: string): Promise<CancelInvoiceResult> {
    const result: CancelInvoiceResult = { status: 'cancelled' };
    recordAudit(
      'MockCfdiAdapter',
      'cancelInvoice',
      { invoiceId },
      { ...result },
    );
    return result;
  }
}
