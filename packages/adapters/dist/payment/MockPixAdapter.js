import { randomUUID } from 'node:crypto';
import { recordAudit } from '../audit.js';
import { resolveIntentId, resolveWebhookStatus } from './webhookHelpers.js';
export class MockPixAdapter {
    async createIntent(input) {
        const intentId = randomUUID();
        const pixCopyPaste = `00020126580014BR.GOV.BCB.PIX0136${intentId}520400005303986540${(input.amountCents / 100).toFixed(2)}5802BR5925PYMEBOT MOCK PIX6009SAO PAULO62070503***6304ABCD`;
        const result = {
            intentId,
            status: 'pending',
            instructions: {
                pixCopyPaste,
                qrContent: pixCopyPaste,
            },
        };
        recordAudit('MockPixAdapter', 'createIntent', { ...input }, { ...result });
        return result;
    }
    async confirmWebhook(payload) {
        const result = {
            intentId: resolveIntentId(payload, randomUUID()),
            status: resolveWebhookStatus(payload),
        };
        recordAudit('MockPixAdapter', 'confirmWebhook', { payload }, { ...result });
        return result;
    }
}
//# sourceMappingURL=MockPixAdapter.js.map