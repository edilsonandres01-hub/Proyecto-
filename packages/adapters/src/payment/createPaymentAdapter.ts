import type { PaymentRail } from '../types.js';
import type { PaymentAdapter } from './PaymentAdapter.js';
import { MockCodiAdapter } from './MockCodiAdapter.js';
import { MockPixAdapter } from './MockPixAdapter.js';
import { MockSpeiAdapter } from './MockSpeiAdapter.js';

export function createPaymentAdapter(rail: PaymentRail): PaymentAdapter {
  switch (rail) {
    case 'spei':
      return new MockSpeiAdapter();
    case 'codi':
      return new MockCodiAdapter();
    case 'pix':
      return new MockPixAdapter();
    default: {
      const _exhaustive: never = rail;
      throw new Error(`Unsupported payment rail: ${String(_exhaustive)}`);
    }
  }
}
