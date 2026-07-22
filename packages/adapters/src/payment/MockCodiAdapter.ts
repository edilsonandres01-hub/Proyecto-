import { randomUUID } from 'node:crypto';
import { recordAudit } from '../audit.js';
import type {
  ConfirmWebhookResult,
  CreateIntentInput,
  CreateIntentResult,
} from '../types.js';
import type { PaymentAdapter } from './PaymentAdapter.js';
import { resolveIntentId, resolveWebhookStatus } from './webhookHelpers.js';

export class MockCodiAdapter implements PaymentAdapter {
  async createIntent(input: CreateIntentInput): Promise<CreateIntentResult> {
    const intentId = randomUUID();
    const result: CreateIntentResult = {
      intentId,
      status: 'pending',
      instructions: {
        qrContent: `codi://pay?intent=${intentId}&amount=${input.amountCents}&ref=${encodeURIComponent(input.reference)}`,
      },
    };
    recordAudit('MockCodiAdapter', 'createIntent', { ...input }, { ...result });
    return result;
  }

  async confirmWebhook(payload: unknown): Promise<ConfirmWebhookResult> {
    const result: ConfirmWebhookResult = {
      intentId: resolveIntentId(payload, randomUUID()),
      status: resolveWebhookStatus(payload),
    };
    recordAudit(
      'MockCodiAdapter',
      'confirmWebhook',
      { payload },
      { ...result },
    );
    return result;
  }
}
