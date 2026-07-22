import { randomUUID } from 'node:crypto';
import { recordAudit } from '../audit.js';
import type {
  ConfirmWebhookResult,
  CreateIntentInput,
  CreateIntentResult,
} from '../types.js';
import type { PaymentAdapter } from './PaymentAdapter.js';
import { resolveIntentId, resolveWebhookStatus } from './webhookHelpers.js';

const MOCK_CLABE = '646180157000000004';

export class MockSpeiAdapter implements PaymentAdapter {
  async createIntent(input: CreateIntentInput): Promise<CreateIntentResult> {
    const intentId = randomUUID();
    const claveRastreo = randomUUID().replace(/-/g, '').slice(0, 30).toUpperCase();
    const result: CreateIntentResult = {
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

  async confirmWebhook(payload: unknown): Promise<ConfirmWebhookResult> {
    const result: ConfirmWebhookResult = {
      intentId: resolveIntentId(payload, randomUUID()),
      status: resolveWebhookStatus(payload),
    };
    recordAudit(
      'MockSpeiAdapter',
      'confirmWebhook',
      { payload },
      { ...result },
    );
    return result;
  }
}
