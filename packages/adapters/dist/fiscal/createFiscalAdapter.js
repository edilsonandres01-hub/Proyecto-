import { MockCfdiAdapter } from './MockCfdiAdapter.js';
import { MockNfeAdapter } from './MockNfeAdapter.js';
export function createFiscalAdapter(country) {
    switch (country) {
        case 'MX':
            return new MockCfdiAdapter();
        case 'BR':
            return new MockNfeAdapter();
        default: {
            const _exhaustive = country;
            throw new Error(`Unsupported fiscal country: ${String(_exhaustive)}`);
        }
    }
}
//# sourceMappingURL=createFiscalAdapter.js.map