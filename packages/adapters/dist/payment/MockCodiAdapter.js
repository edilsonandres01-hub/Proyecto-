import { randomUUID } from 'node:crypto';
import { recordAudit } from '../audit.js';
import { resolveIntentId, resolveWebhookStatus } from './webhookHelpers.js';
export class MockCodiAdapter {
    async createIntent(input) {
        const intentId = randomUUID();
        const result = {
            intentId,
            status: 'pending',
            instructions: {
                qrContent: `codi://pay?intent=${intentId}&amount=${input.amountCents}&ref=${encodeURIComponent(input.reference)}`,
            },
        };
        recordAudit('MockCodiAdapter', 'createIntent', { ...input }, { ...result });
        return result;
    }
    async confirmWebhook(payload) {
        const result = {
            intentId: resolveIntentId(payload, randomUUID()),
            status: resolveWebhookStatus(payload),
        };
        recordAudit('MockCodiAdapter', 'confirmWebhook', { payload }, { ...result });
        return result;
    }
}
//# sourceMappingURL=MockCodiAdapter.js.map