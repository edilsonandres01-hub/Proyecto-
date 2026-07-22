import type { ConfirmWebhookResult, CreateIntentInput, CreateIntentResult } from '../types.js';
export interface PaymentAdapter {
    createIntent(input: CreateIntentInput): Promise<CreateIntentResult>;
    confirmWebhook(payload: unknown): Promise<ConfirmWebhookResult>;
}
//# sourceMappingURL=PaymentAdapter.d.ts.map