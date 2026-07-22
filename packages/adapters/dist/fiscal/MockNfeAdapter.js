import { randomUUID } from 'node:crypto';
import { recordAudit } from '../audit.js';
function mockChaveAcesso() {
    // 44-digit NF-e access key stub
    const digits = randomUUID().replace(/\D/g, '').padEnd(44, '0').slice(0, 44);
    return digits;
}
export class MockNfeAdapter {
    async issueInvoice(input) {
        const invoiceId = randomUUID();
        const uuidOrChave = mockChaveAcesso();
        const result = {
            invoiceId,
            uuidOrChave,
            pdfStubUrl: `https://stubs.pymebot.local/nfe/${invoiceId}.pdf`,
            xmlStub: `<?xml version="1.0" encoding="UTF-8"?><nfeProc versao="4.00"><protNFe><infProt><chNFe>${uuidOrChave}</chNFe><cStat>100</cStat></infProt></protNFe><NFe><infNFe Id="NFe${uuidOrChave}"><ide><nNF>${input.orderId}</nNF></ide><total><ICMSTot><vNF>${(input.amountCents / 100).toFixed(2)}</vNF></ICMSTot></total><dest><CNPJ>${input.customerTaxId ?? '00000000000000'}</CNPJ></dest></infNFe></NFe></nfeProc>`,
            status: 'issued',
        };
        recordAudit('MockNfeAdapter', 'issueInvoice', { ...input }, { ...result });
        return result;
    }
    async cancelInvoice(invoiceId) {
        const result = { status: 'cancelled' };
        recordAudit('MockNfeAdapter', 'cancelInvoice', { invoiceId }, { ...result });
        return result;
    }
}
//# sourceMappingURL=MockNfeAdapter.js.map