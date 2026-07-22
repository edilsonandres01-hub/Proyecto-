import { randomUUID } from 'node:crypto';
import { recordAudit } from '../audit.js';
import { resolveIntentId, resolveWebhookStatus } from './webhookHelpers.js';
const MOCK_CLABE = '646180157000000004';
export class MockSpeiAdapter {
    async createIntent(input) {
        const intentId = randomUUID();
        const claveRastreo = randomUUID().replace(/-/g, '').slice(0, 30).toUpperCase();
        const result = {
            intentId,
            status: 'pending',
            instructions: {
                clabe: MOCK_CLABE,
                claveRastreo,
            },
        };
        recordAudit('MockSpeiAdapter', 'createIntent', { ...input }, { ...result });
        return result;
    }
    async confirmWebhook(payload) {
        const result = {
            intentId: resolveIntentId(payload, randomUUID()),
            status: resolveWebhookStatus(payload),
        };
        recordAudit('MockSpeiAdapter', 'confirmWebhook', { payload }, { ...result });
        return result;
    }
}
//# sourceMappingURL=MockSpeiAdapter.js.map