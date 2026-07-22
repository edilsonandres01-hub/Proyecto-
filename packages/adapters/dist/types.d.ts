export type PaymentRail = 'spei' | 'codi' | 'pix';
export type FiscalCountry = 'MX' | 'BR';
export type PaymentIntentStatus = 'pending' | 'paid' | 'failed';
export type PaymentInstructions = {
    qrContent?: string;
    clabe?: string;
    pixCopyPaste?: string;
    claveRastreo?: string;
};
export type CreateIntentInput = {
    amountCents: number;
    currency: string;
    rail: PaymentRail;
    reference: string;
};
export type CreateIntentResult = {
    intentId: string;
    instructions: PaymentInstructions;
    status: PaymentIntentStatus;
};
export type ConfirmWebhookResult = {
    intentId: string;
    status: 'paid' | 'failed';
};
export type IssueInvoiceInput = {
    orderId: string;
    amountCents: number;
    country: FiscalCountry;
    customerTaxId?: string;
};
export type IssueInvoiceResult = {
    invoiceId: string;
    uuidOrChave: string;
    pdfStubUrl: string;
    xmlStub: string;
    status: 'issued';
};
export type CancelInvoiceResult = {
    status: 'cancelled';
};
//# sourceMappingURL=types.d.ts.map