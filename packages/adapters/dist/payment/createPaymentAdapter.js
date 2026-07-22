import { MockCodiAdapter } from './MockCodiAdapter.js';
import { MockPixAdapter } from './MockPixAdapter.js';
import { MockSpeiAdapter } from './MockSpeiAdapter.js';
export function createPaymentAdapter(rail) {
    switch (rail) {
        case 'spei':
            return new MockSpeiAdapter();
        case 'codi':
            return new MockCodiAdapter();
        case 'pix':
            return new MockPixAdapter();
        default: {
            const _exhaustive = rail;
            throw new Error(`Unsupported payment rail: ${String(_exhaustive)}`);
        }
    }
}
//# sourceMappingURL=createPaymentAdapter.js.map