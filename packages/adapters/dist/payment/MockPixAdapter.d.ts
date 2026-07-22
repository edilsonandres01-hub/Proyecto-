import type { ConfirmWebhookResult, CreateIntentInput, CreateIntentResult } from '../types.js';
import type { PaymentAdapter } from './PaymentAdapter.js';
export declare class MockPixAdapter implements PaymentAdapter {
    createIntent(input: CreateIntentInput): Promise<CreateIntentResult>;
    confirmWebhook(payload: unknown): Promise<ConfirmWebhookResult>;
}
//# sourceMappingURL=MockPixAdapter.d.ts.map